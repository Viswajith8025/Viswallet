import 'package:flutter_test/flutter_test.dart';
import 'package:rupee_track/features/budget/domain/allocation_mode.dart';
import 'package:rupee_track/features/budget/domain/budget_engine.dart';
import 'package:rupee_track/features/budget/domain/budget_templates.dart';
import 'package:rupee_track/features/budget/domain/bucket_status.dart';

void main() {
  group('BudgetEngine', () {
    const salary = 2500000; // ₹25,000

    test('percentage template sums to salary', () {
      final allocations = BudgetEngine.fromPercentageTemplate(
        salaryPaise: salary,
        categorySlugToId: {'food': 1, 'transport': 2},
      );
      final total =
          allocations.fold<int>(0, (s, b) => s + b.allocatedPaise);
      expect(total, salary);
      expect(allocations.length, defaultBudgetTemplates.length);
    });

    test('manual setup seeds editable buckets from percentage template', () {
      final allocations = BudgetEngine.fromPercentageTemplate(
        salaryPaise: salary,
        categorySlugToId: {'food': 1},
      );
      expect(allocations, isNotEmpty);
      expect(allocations.first.displayName, isNotEmpty);
    });

    test('fromCategories creates one line per category', () {
      final allocations = BudgetEngine.fromCategories(
        categories: const [
          CategoryBudgetSeed(
            id: 1,
            slug: 'food',
            name: 'Food',
            sortOrder: 1,
            countsTowardSpending: true,
          ),
          CategoryBudgetSeed(
            id: 2,
            slug: 'transport',
            name: 'Transport',
            sortOrder: 2,
            countsTowardSpending: true,
          ),
        ],
        salaryPaise: salary,
        amountByCategoryId: {1: 500000, 2: 300000},
      );

      expect(allocations.length, 2);
      expect(allocations.first.categoryId, 1);
      expect(allocations.first.allocatedPaise, 500000);
      expect(allocations.last.categoryId, 2);
      expect(allocations.last.allocatedPaise, 300000);
    });

    test('alert levels at thresholds', () {
      expect(
        BudgetEngine.alertLevelForPercent(49),
        BudgetAlertLevel.none,
      );
      expect(
        BudgetEngine.alertLevelForPercent(50),
        BudgetAlertLevel.watch50,
      );
      expect(
        BudgetEngine.alertLevelForPercent(76),
        BudgetAlertLevel.watch75,
      );
      expect(
        BudgetEngine.alertLevelForPercent(95),
        BudgetAlertLevel.critical90,
      );
      expect(
        BudgetEngine.alertLevelForPercent(100),
        BudgetAlertLevel.exceeded,
      );
    });

    test('computeBucketStatuses calculates remaining and daily allowance', () {
      final statuses = BudgetEngine.computeBucketStatuses(
        allocations: [
          const BucketAllocationInput(
            bucketKey: 'food',
            displayName: 'Food',
            categoryId: 1,
            bucketType: BucketType.spending,
            allocatedPaise: 100000,
            rolloverPaise: 0,
          ),
        ],
        spentByCategoryId: {1: 40000},
        daysRemaining: 10,
      );

      expect(statuses.single.remainingPaise, 60000);
      expect(statuses.single.dailyAllowancePaise, 6000);
      expect(statuses.single.percentUsed, 40);
    });

    test('rollover adds to bucket budget', () {
      final rolled = BudgetEngine.applyRollover(
        allocations: [
          const BucketAllocationInput(
            bucketKey: 'food',
            displayName: 'Food',
            categoryId: 1,
            bucketType: BucketType.spending,
            allocatedPaise: 100000,
          ),
        ],
        previousRemainingByBucketKey: {'food': 5000},
      );
      expect(rolled.single.rolloverPaise, 5000);
    });

    test('percentage split sums exactly for awkward salary totals', () {
      const awkwardSalary = 1000003;
      final allocations = BudgetEngine.fromPercentageTemplate(
        salaryPaise: awkwardSalary,
        categorySlugToId: {'food': 1, 'transport': 2},
      );
      final total =
          allocations.fold<int>(0, (sum, bucket) => sum + bucket.allocatedPaise);
      expect(total, awkwardSalary);
    });

    test('ai suggested allocation sums exactly to salary', () {
      final allocations = BudgetEngine.suggestAiAllocation(
        salaryPaise: salary,
        avgSpendBySlug: const {'food': 400000, 'transport': 200000},
        categorySlugToId: const {'food': 1, 'transport': 2, 'investment': 3},
      );
      final total =
          allocations.fold<int>(0, (sum, bucket) => sum + bucket.allocatedPaise);
      expect(total, salary);
    });

    test('generateInsights ignores intentional reserve transfers within budget', () {
      final plan = BudgetPlanStatus(
        monthKey: '2026-06-17',
        salaryPaise: salary,
        allocationMode: AllocationMode.percentage,
        rolloverEnabled: false,
        buckets: [
          const BucketStatus(
            bucketKey: 'investments',
            displayName: 'Investments',
            categoryId: 3,
            bucketType: BucketType.investment,
            allocatedPaise: 250000,
            rolloverPaise: 0,
            spentPaise: 150000,
            daysRemaining: 10,
            alertLevel: BudgetAlertLevel.watch50,
          ),
        ],
        insights: const [],
      );

      final insights = BudgetEngine.generateInsights(plan);
      expect(
        insights.any((i) => i.title.toLowerCase().contains('reserve exceeded')),
        isFalse,
      );
    });

    test('generateInsights warns when reserve bucket is overspent', () {
      final plan = BudgetPlanStatus(
        monthKey: '2026-06-17',
        salaryPaise: salary,
        allocationMode: AllocationMode.percentage,
        rolloverEnabled: false,
        buckets: [
          const BucketStatus(
            bucketKey: 'investments',
            displayName: 'Investments',
            categoryId: 3,
            bucketType: BucketType.investment,
            allocatedPaise: 250000,
            rolloverPaise: 0,
            spentPaise: 300000,
            daysRemaining: 10,
            alertLevel: BudgetAlertLevel.exceeded,
          ),
        ],
        insights: const [],
      );

      final insights = BudgetEngine.generateInsights(plan);
      expect(
        insights.any((i) => i.title.contains('reserve exceeded')),
        isTrue,
      );
    });
  });
}
