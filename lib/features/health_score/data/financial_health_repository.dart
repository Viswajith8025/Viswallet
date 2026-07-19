import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rupee_track/core/database/app_database.dart';
import 'package:rupee_track/core/database/reactive_db_stream.dart';
import 'package:rupee_track/core/providers/database_provider.dart';
import 'package:rupee_track/core/salary_cycle/salary_cycle_engine.dart';
import 'package:rupee_track/core/utils/date_utils.dart';
import 'package:rupee_track/features/budget/domain/allocation_mode.dart';
import 'package:rupee_track/features/budget/data/budget_repository.dart';
import 'package:rupee_track/features/health_score/data/health_score_history_store.dart';
import 'package:rupee_track/features/health_score/domain/financial_health_engine.dart';
import 'package:rupee_track/features/health_score/domain/financial_health_models.dart';
import 'package:rupee_track/features/trends/domain/spending_trends_engine.dart';

final financialHealthRepositoryProvider =
    Provider<FinancialHealthRepository>((ref) {
  return FinancialHealthRepository(ref);
});

class FinancialHealthRepository {
  FinancialHealthRepository(this._ref);

  final Ref _ref;
  final _historyStore = HealthScoreHistoryStore();

  Future<FinancialHealthReport> buildHealthReport(String cycleKey) async {
    final db = await _ref.read(databaseProvider.future);
    final salaryDay = (await db.settingsDao.getSettings()).salaryDay;
    return _build(cycleKey, salaryDay);
  }

  Stream<FinancialHealthReport> watchHealth(String cycleKey) async* {
    final db = await _ref.read(databaseProvider.future);
    final salaryDay =
        (await db.settingsDao.getSettings()).salaryDay;

    yield* mergeReactiveStreams(
      () async {
        final report = await _build(cycleKey, salaryDay);
        if (report.hasEnoughData) {
          await _historyStore.record(cycleKey, report.overallScore);
        }
        return report;
      },
      [
        db.expensesDao.watchSpendingChanges(),
        db.salaryDao.watchBreakdownForMonth(cycleKey),
        db.subscriptionsDao.watchActiveSubscriptions(),
        db.loansDao.watchActiveLoans(),
      ],
    );
  }

  Future<FinancialHealthReport> _build(String cycleKey, int salaryDay) async {
    final db = await _ref.read(databaseProvider.future);
    final settings = await db.settingsDao.getSettings();

    final salaryPaise = await db.salaryDao.getEffectiveSalaryPaise(cycleKey);
    final spent = await db.expensesDao.sumSpentForMonth(cycleKey);

    final previousKey = previousCycleKey(cycleKey, salaryDay: salaryDay);
    final prevSalaryPaise =
        await db.salaryDao.getEffectiveSalaryPaise(previousKey);
    final prevSpent = await db.expensesDao.sumSpentForMonth(previousKey);
    final prevCarry = await _carryOver(db, previousKey, salaryDay);

    final carryOver = await _carryOver(db, cycleKey, salaryDay);
    final subMonthly = await db.subscriptionsDao.monthlyTotalPaise();
    final borrowed = await db.loansDao.pendingBorrowedTotal();
    final overdue = await db.loansDao.overdueLoans();

    final plan = await _ref.read(budgetRepositoryProvider).getPlanStatus(cycleKey);

    final bounds =
        SpendingTrendsEngine.cycleBoundsUtc(cycleKey, salaryDay: salaryDay);
    final expenses = await db.expensesDao.listSpendingBetween(
      startUtc: bounds.startUtc,
      endUtc: bounds.endUtc,
    );

    final dailyMap = <String, int>{};
    var impulsePaise = 0;
    var impulseCount = 0;
    const impulseSlugs = {'entertainment', 'shopping', 'food', 'miscellaneous'};

    for (final row in expenses) {
      final ist = SalaryCycleEngine.istDateOnly(row.expense.occurredAt);
      final dayKey = '${ist.year}-${ist.month}-${ist.day}';
      dailyMap[dayKey] =
          (dailyMap[dayKey] ?? 0) + row.expense.amountPaise;

      final isLarge =
          row.expense.amountPaise >= settings.majorExpenseThresholdPaise;
      if (isLarge &&
          impulseSlugs.contains(row.category.slug) &&
          row.expense.subscriptionId == null) {
        impulsePaise += row.expense.amountPaise;
        impulseCount++;
      }
    }

    var bucketsOver = 0;
    var bucketsOnTrack = 0;
    var totalSpending = 0;
    var emergencyRemaining = 100.0;
    var savingsTouched = false;

    if (plan != null) {
      for (final b in plan.buckets) {
        if (b.bucketType == BucketType.spending) {
          totalSpending++;
          if (b.isOverBudget) {
            bucketsOver++;
          } else if (b.percentUsed < 75) {
            bucketsOnTrack++;
          }
        }
        if (b.bucketKey == 'emergency_fund' && b.totalBudgetPaise > 0) {
          emergencyRemaining = 100 - b.percentUsed;
        }
        if (b.bucketKey == 'savings' && b.spentPaise > 0) {
          savingsTouched = true;
        }
      }
    }

    final prevSavings = prevSalaryPaise + prevCarry - prevSpent;
    final history = _historyStore.load();
    final prevScore = _historyStore.scoreForCycle(previousKey);

    final input = FinancialHealthInput(
      cycleKey: cycleKey,
      salaryPaise: salaryPaise,
      spentPaise: spent,
      carryOverPaise: carryOver,
      subscriptionMonthlyPaise: subMonthly,
      pendingBorrowedPaise: borrowed,
      overdueLoansCount: overdue.length,
      impulsePurchasePaise: impulsePaise,
      impulsePurchaseCount: impulseCount,
      dailySpendsPaise: dailyMap.values.toList(),
      bucketsOverBudget: bucketsOver,
      bucketsOnTrack: bucketsOnTrack,
      totalSpendingBuckets: totalSpending,
      emergencyFundRemainingPercent: emergencyRemaining,
      savingsBucketTouched: savingsTouched,
      previousCycleScore: prevScore,
      previousCycleSavingsPaise: prevSavings.clamp(0, 1 << 30),
    );

    return FinancialHealthEngine.compute(
      input: input,
      history: history,
    );
  }

  Future<FinancialHealthReport> buildForCycle(String cycleKey) async {
    final db = await _ref.read(databaseProvider.future);
    final salaryDay = (await db.settingsDao.getSettings()).salaryDay;
    return _build(cycleKey, salaryDay);
  }

  Future<int> _carryOver(
    AppDatabase db,
    String cycleKey,
    int salaryDay,
  ) async {
    final prevKey = previousCycleKey(cycleKey, salaryDay: salaryDay);
    final prevSalaryPaise = await db.salaryDao.getEffectiveSalaryPaise(prevKey);
    final prevSpent = await db.expensesDao.sumSpentForMonth(prevKey);
    return SalaryCycleEngine.carryOverBalance(
      previousSalaryPaise: prevSalaryPaise,
      previousSpentPaise: prevSpent,
    );
  }
}

final financialHealthProvider =
    StreamProvider.family<FinancialHealthReport, String>((ref, cycleKey) {
  return ref.watch(financialHealthRepositoryProvider).watchHealth(cycleKey);
});
