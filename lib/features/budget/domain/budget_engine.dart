import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:rupee_track/features/budget/domain/allocation_mode.dart';
import 'package:rupee_track/features/budget/domain/budget_templates.dart';
import 'package:rupee_track/features/budget/domain/bucket_status.dart';

/// Pure budgeting logic — no Flutter, no database.
abstract final class BudgetEngine {
  static const alertThresholds = [50, 75, 90, 100];

  static List<BucketAllocationInput> fromPercentageTemplate({
    required int salaryPaise,
    List<BudgetTemplate> templates = defaultBudgetTemplates,
    required Map<String, int> categorySlugToId,
  }) {
    final rows = templates.asMap().entries.map((entry) {
      final template = entry.value;
      final exact = salaryPaise * template.defaultPercent / 100;
      return (
        template: template,
        sortOrder: entry.key,
        floored: exact.floor(),
        fraction: exact - exact.floor(),
      );
    }).toList();

    var allocated = rows.fold<int>(0, (sum, row) => sum + row.floored);
    var remainder = salaryPaise - allocated;
    final indices = List.generate(rows.length, (index) => index)
      ..sort((a, b) => rows[b].fraction.compareTo(rows[a].fraction));

    final amounts = [for (final row in rows) row.floored];
    for (var i = 0; i < remainder; i++) {
      amounts[indices[i % indices.length]]++;
    }

    return rows.asMap().entries.map((entry) {
      final row = entry.value;
      final template = row.template;
      return BucketAllocationInput(
        bucketKey: template.bucketKey,
        displayName: template.displayName,
        categoryId: template.categorySlug != null
            ? categorySlugToId[template.categorySlug!]
            : null,
        bucketType: template.bucketType,
        allocatedPaise: amounts[entry.key],
        allocatedPercent: template.defaultPercent,
        sortOrder: row.sortOrder,
      );
    }).toList();
  }

  /// One budget bucket per expense category.
  static List<BucketAllocationInput> fromCategories({
    required List<CategoryBudgetSeed> categories,
    required int salaryPaise,
    Map<int, int> amountByCategoryId = const {},
    Map<String, int> avgSpendBySlug = const {},
  }) {
    final rows = categories.toList()
      ..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));

    return rows.asMap().entries.map((entry) {
      final index = entry.key;
      final category = entry.value;
      final saved = amountByCategoryId[category.id];
      final average = avgSpendBySlug[category.slug] ?? 0;
      final allocated = saved ?? (average > 0 ? average : 0);
      final bucketType = category.slug == 'investment' ||
              category.slug == 'jupiter_savings'
          ? BucketType.investment
          : category.countsTowardSpending
              ? BucketType.spending
              : BucketType.reserve;

      return BucketAllocationInput(
        bucketKey: category.slug,
        displayName: category.name,
        categoryId: category.id,
        bucketType: bucketType,
        allocatedPaise: allocated,
        allocatedPercent:
            salaryPaise > 0 ? allocated / salaryPaise * 100 : null,
        sortOrder: category.sortOrder != 0 ? category.sortOrder : index,
      );
    }).toList();
  }

  static List<BucketAllocationInput> fromManualAmounts({
    required List<BucketAllocationInput> inputs,
    required int salaryPaise,
  }) {
    final total = inputs.fold<int>(0, (s, b) => s + b.allocatedPaise);
    if (total > salaryPaise) {
      throw ArgumentError('Manual allocation exceeds salary');
    }
    return inputs;
  }

  /// Heuristic "AI" allocation from historical spending patterns.
  static List<BucketAllocationInput> suggestAiAllocation({
    required int salaryPaise,
    required Map<String, int> avgSpendBySlug,
    required Map<String, int> categorySlugToId,
    List<BudgetTemplate> templates = defaultBudgetTemplates,
  }) {
    final spendingTemplates = templates
        .where((t) => t.bucketType == BucketType.spending)
        .toList();
    final reserveTemplates = templates
        .where((t) => t.bucketType != BucketType.spending)
        .toList();

    var spendingBudget = (salaryPaise * 0.75).round();
    final reserveBudget = salaryPaise - spendingBudget;

    final spendingAllocations = <BucketAllocationInput>[];
    var rawSpendingTotal = 0;

    for (final template in spendingTemplates) {
      final slug = template.categorySlug;
      final historical = slug != null ? (avgSpendBySlug[slug] ?? 0) : 0;
      final floor = (salaryPaise * template.defaultPercent / 100 * 0.5).round();
      final amount = historical > 0 ? historical : floor;
      rawSpendingTotal += amount;
      spendingAllocations.add(
        BucketAllocationInput(
          bucketKey: template.bucketKey,
          displayName: template.displayName,
          categoryId: slug != null ? categorySlugToId[slug] : null,
          bucketType: template.bucketType,
          allocatedPaise: amount,
          sortOrder: templates.indexOf(template),
        ),
      );
    }

    if (rawSpendingTotal > spendingBudget && rawSpendingTotal > 0) {
      final scale = spendingBudget / rawSpendingTotal;
      spendingAllocations
        ..clear()
        ..addAll(
          spendingTemplates.map((template) {
            final slug = template.categorySlug;
            final historical = slug != null ? (avgSpendBySlug[slug] ?? 0) : 0;
            final floor =
                (salaryPaise * template.defaultPercent / 100 * 0.5).round();
            final amount = ((historical > 0 ? historical : floor) * scale)
                .round();
            return BucketAllocationInput(
              bucketKey: template.bucketKey,
              displayName: template.displayName,
              categoryId: slug != null ? categorySlugToId[slug] : null,
              bucketType: template.bucketType,
              allocatedPaise: amount,
              sortOrder: templates.indexOf(template),
            );
          }),
        );
    }

    final reserveTotalPercent = reserveTemplates.fold<double>(
      0,
      (s, t) => s + t.defaultPercent,
    );
    final reserveAllocations = reserveTemplates.map((template) {
      final share = reserveTotalPercent > 0
          ? template.defaultPercent / reserveTotalPercent
          : 1 / reserveTemplates.length;
      return BucketAllocationInput(
        bucketKey: template.bucketKey,
        displayName: template.displayName,
        categoryId: template.categorySlug != null
            ? categorySlugToId[template.categorySlug!]
            : null,
        bucketType: template.bucketType,
        allocatedPaise: (reserveBudget * share).round(),
        allocatedPercent: template.defaultPercent,
        sortOrder: templates.indexOf(template),
      );
    });

    final merged = [...spendingAllocations, ...reserveAllocations]
      ..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));

    return _normalizeToSalary(merged, salaryPaise);
  }

  static List<BucketAllocationInput> applyRollover({
    required List<BucketAllocationInput> allocations,
    required Map<String, int> previousRemainingByBucketKey,
  }) {
    return allocations
        .map(
          (a) => BucketAllocationInput(
            bucketKey: a.bucketKey,
            displayName: a.displayName,
            categoryId: a.categoryId,
            bucketType: a.bucketType,
            allocatedPaise: a.allocatedPaise,
            allocatedPercent: a.allocatedPercent,
            rolloverPaise: previousRemainingByBucketKey[a.bucketKey] ?? 0,
            sortOrder: a.sortOrder,
          ),
        )
        .toList();
  }

  static List<BucketStatus> computeBucketStatuses({
    required List<BucketAllocationInput> allocations,
    required Map<int, int> spentByCategoryId,
    required int daysRemaining,
    Map<String, int> colorByBucketKey = const {},
  }) {
    return allocations.map((bucket) {
      final spent = bucket.categoryId != null
          ? (spentByCategoryId[bucket.categoryId] ?? 0)
          : 0;
      final total = bucket.allocatedPaise + bucket.rolloverPaise;
      final percent =
          total <= 0 ? 0.0 : (spent / total) * 100;

      return BucketStatus(
        bucketKey: bucket.bucketKey,
        displayName: bucket.displayName,
        categoryId: bucket.categoryId,
        bucketType: bucket.bucketType,
        allocatedPaise: bucket.allocatedPaise,
        rolloverPaise: bucket.rolloverPaise,
        spentPaise: spent,
        daysRemaining: daysRemaining,
        alertLevel: alertLevelForPercent(percent),
        colorValue: colorByBucketKey[bucket.bucketKey],
      );
    }).toList();
  }

  static BudgetAlertLevel alertLevelForPercent(double percent) {
    if (percent >= 100) return BudgetAlertLevel.exceeded;
    if (percent >= 90) return BudgetAlertLevel.critical90;
    if (percent >= 75) return BudgetAlertLevel.watch75;
    if (percent >= 50) return BudgetAlertLevel.watch50;
    return BudgetAlertLevel.none;
  }

  static List<BudgetInsight> generateInsights(BudgetPlanStatus plan) {
    final insights = <BudgetInsight>[];

    for (final bucket in plan.buckets) {
      if (bucket.alertLevel == BudgetAlertLevel.exceeded) {
        insights.add(
          BudgetInsight(
            title: '${bucket.displayName} over budget',
            message:
                'You\'ve exceeded ${bucket.displayName} by ${formatPaise(bucket.spentPaise - bucket.totalBudgetPaise)}. Slow down or reallocate.',
            severity: BudgetAlertLevel.exceeded,
          ),
        );
      } else if (bucket.alertLevel == BudgetAlertLevel.critical90) {
        insights.add(
          BudgetInsight(
            title: '${bucket.displayName} at ${bucket.percentUsed.toStringAsFixed(0)}%',
            message:
                'Only ${formatPaise(bucket.remainingPaise)} left · ${formatPaise(bucket.dailyAllowancePaise)}/day allowance.',
            severity: BudgetAlertLevel.critical90,
          ),
        );
      }
    }

    if (plan.unallocatedPaise < 0) {
      insights.add(
        const BudgetInsight(
          title: 'Over-allocated budget',
          message:
              'Your bucket allocations exceed salary. Reduce a category or savings target.',
          severity: BudgetAlertLevel.exceeded,
        ),
      );
    }

    for (final bucket in plan.buckets) {
      if (bucket.bucketType != BucketType.reserve &&
          bucket.bucketType != BucketType.investment) {
        continue;
      }
      if (!bucket.isOverBudget) continue;
      insights.add(
        BudgetInsight(
          title: '${bucket.displayName} reserve exceeded',
          message:
              'You spent ${formatPaise(bucket.spentPaise - bucket.totalBudgetPaise)} beyond your ${bucket.displayName.toLowerCase()} allocation. Review if this was an unplanned withdrawal.',
          severity: BudgetAlertLevel.watch75,
        ),
      );
    }

    final highFood = plan.buckets
        .where((b) => b.bucketKey == 'food' && b.percentUsed > 80)
        .firstOrNull;
    if (highFood != null) {
      insights.add(
        BudgetInsight(
          title: 'Food spending is high',
          message:
              'Food is at ${highFood.percentUsed.toStringAsFixed(0)}%. Consider meal planning to stay on track.',
          severity: BudgetAlertLevel.watch75,
        ),
      );
    }

    if (insights.isEmpty && plan.totalSpentPaise > 0) {
      final onTrack = plan.spendingBuckets
          .where((b) => b.percentUsed < 75)
          .length;
      if (onTrack == plan.spendingBuckets.length) {
        insights.add(
          const BudgetInsight(
            title: 'On track',
            message: 'Your spending is within healthy limits this cycle.',
            severity: BudgetAlertLevel.none,
          ),
        );
      }
    }

    return insights;
  }

  static List<BucketAllocationInput> _normalizeToSalary(
    List<BucketAllocationInput> inputs,
    int salaryPaise,
  ) {
    if (inputs.isEmpty) return inputs;

    final total = inputs.fold<int>(0, (s, b) => s + b.allocatedPaise);
    var diff = salaryPaise - total;
    if (diff == 0) return inputs;

    final updated = [...inputs];
    final adjustable = List.generate(updated.length, (index) => index)
      ..sort((a, b) {
        final left = updated[a].allocatedPaise;
        final right = updated[b].allocatedPaise;
        if (diff > 0) return right.compareTo(left);
        return left.compareTo(right);
      });

    var remaining = diff.abs();
    var cursor = 0;
    while (remaining > 0 && adjustable.isNotEmpty) {
      final index = adjustable[cursor % adjustable.length];
      final bucket = updated[index];
      if (diff > 0) {
        updated[index] = BucketAllocationInput(
          bucketKey: bucket.bucketKey,
          displayName: bucket.displayName,
          categoryId: bucket.categoryId,
          bucketType: bucket.bucketType,
          allocatedPaise: bucket.allocatedPaise + 1,
          allocatedPercent: bucket.allocatedPercent,
          rolloverPaise: bucket.rolloverPaise,
          sortOrder: bucket.sortOrder,
        );
      } else if (bucket.allocatedPaise > 0) {
        updated[index] = BucketAllocationInput(
          bucketKey: bucket.bucketKey,
          displayName: bucket.displayName,
          categoryId: bucket.categoryId,
          bucketType: bucket.bucketType,
          allocatedPaise: bucket.allocatedPaise - 1,
          allocatedPercent: bucket.allocatedPercent,
          rolloverPaise: bucket.rolloverPaise,
          sortOrder: bucket.sortOrder,
        );
      }
      remaining--;
      cursor++;
    }

    return updated;
  }
}

extension _FirstOrNull<E> on Iterable<E> {
  E? get firstOrNull {
    final iterator = this.iterator;
    if (iterator.moveNext()) return iterator.current;
    return null;
  }
}
