import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rupee_track/core/database/app_database.dart';
import 'package:rupee_track/core/database/daos/expenses_dao.dart';
import 'package:rupee_track/core/database/reactive_db_stream.dart';
import 'package:rupee_track/core/providers/database_provider.dart';
import 'package:rupee_track/core/salary_cycle/salary_cycle_engine.dart';
import 'package:rupee_track/core/utils/date_utils.dart';
import 'package:rupee_track/features/dashboard/domain/monthly_summary.dart';

final dashboardRepositoryProvider = Provider<DashboardRepository>((ref) {
  return DashboardRepository(ref);
});

class DashboardRepository {
  DashboardRepository(this._ref);

  final Ref _ref;

  Stream<CycleSummary> watchCycleSummary(String cycleKey) async* {
    final db = await _ref.read(databaseProvider.future);
    yield* mergeReactiveStreams(
      () => _loadCycleSummary(db, cycleKey),
      [
        db.salaryDao.watchBreakdownForMonth(cycleKey),
        db.expensesDao.watchExpensesForMonth(cycleKey),
        db.subscriptionsDao.watchActiveSubscriptions(),
        db.loansDao.watchActiveLoans(),
      ],
    );
  }

  Future<CycleSummary> _loadCycleSummary(AppDatabase db, String cycleKey) async {
    final settings = await db.settingsDao.getSettings();
    final salaryDay = settings.salaryDay;
    final breakdown = await db.salaryDao.getBreakdownForMonth(cycleKey);
    final spent = await db.expensesDao.sumSpentForMonth(cycleKey);
    final breakdownRows = await db.expensesDao.categoryBreakdown(cycleKey);
    final pendingBorrowed = await db.loansDao.pendingBorrowedTotal();
    final subscriptionMonthly = await db.subscriptionsDao.monthlyTotalPaise();
    final upcoming = await db.subscriptionsDao.upcomingRenewals();
    final overdue = await db.loansDao.overdueLoans();

    final previousKey = previousCycleKey(cycleKey, salaryDay: salaryDay);
    final prevBreakdown = await db.salaryDao.getBreakdownForMonth(previousKey);
    final prevSpent = await db.expensesDao.sumSpentForMonth(previousKey);
    final carryOver = SalaryCycleEngine.carryOverBalance(
      previousSalaryPaise: prevBreakdown.totalInflowPaise,
      previousSpentPaise: prevSpent,
    );

    return _buildSummary(
      cycleKey: cycleKey,
      salaryPaise: breakdown.netPaise,
      grossSalaryPaise: breakdown.grossPaise,
      salaryDeductionsPaise: breakdown.deductionsPaise,
      extraIncomePaise: breakdown.extraIncomePaise,
      spentPaise: spent,
      breakdown: breakdownRows,
      salaryDay: salaryDay,
      carryOverPaise: carryOver,
      pendingBorrowedPaise: pendingBorrowed,
      subscriptionMonthlyPaise: subscriptionMonthly,
      upcomingSubscriptionsCount: upcoming.length,
      overdueLoansCount: overdue.length,
    );
  }

  CycleSummary _buildSummary({
    required String cycleKey,
    required int salaryPaise,
    required int grossSalaryPaise,
    required int salaryDeductionsPaise,
    required int extraIncomePaise,
    required int spentPaise,
    required List<CategorySpendRow> breakdown,
    required int salaryDay,
    required int carryOverPaise,
    required int pendingBorrowedPaise,
    required int subscriptionMonthlyPaise,
    required int upcomingSubscriptionsCount,
    required int overdueLoansCount,
  }) {
    final salaryEntered = salaryPaise > 0 || extraIncomePaise > 0;
    final moneyLeftPaise = SalaryCycleEngine.effectiveMoneyLeft(
      salaryPaise: salaryPaise,
      spentPaise: spentPaise,
      carryOverPaise: carryOverPaise,
      extraIncomePaise: extraIncomePaise,
    );
    final savingsPaise = moneyLeftPaise;
    final inflowPaise = salaryPaise + extraIncomePaise;
    final savingsPercent =
        inflowPaise > 0 ? (savingsPaise / inflowPaise) * 100 : 0.0;

    final currentKey = currentCycleKey(salaryDay: salaryDay);
    final bounds = SalaryCycleEngine.cycleBounds(cycleKey, salaryDay: salaryDay);
    final today = SalaryCycleEngine.istDateOnly(DateTime.now());

    final int daysToSalary;
    final int daysLeft;

    if (cycleKey == currentKey) {
      daysToSalary = daysUntilNextSalary(salaryDay: salaryDay);
      daysLeft = daysRemainingInCycle(salaryDay: salaryDay);
    } else if (today.isAfter(bounds.endIst)) {
      daysToSalary = daysUntilNextSalary(salaryDay: salaryDay);
      daysLeft = 0;
    } else if (today.isBefore(bounds.startIst)) {
      daysToSalary = daysUntilNextSalary(salaryDay: salaryDay);
      daysLeft = bounds.endIst.difference(bounds.startIst).inDays + 1;
    } else {
      daysToSalary = daysUntilNextSalary(salaryDay: salaryDay);
      daysLeft = bounds.endIst.difference(today).inDays + 1;
    }

    final safeDailyLimitPaise = SalaryCycleEngine.dailySpendingAllowance(
      moneyLeftPaise: moneyLeftPaise,
      daysRemaining: daysLeft,
    );

    return CycleSummary(
      cycleKey: cycleKey,
      salaryPaise: salaryPaise,
      grossSalaryPaise: grossSalaryPaise,
      salaryDeductionsPaise: salaryDeductionsPaise,
      extraIncomePaise: extraIncomePaise,
      spentPaise: spentPaise,
      savingsPaise: savingsPaise,
      savingsPercent: savingsPercent,
      moneyLeftPaise: moneyLeftPaise,
      carryOverPaise: carryOverPaise,
      daysToSalary: daysToSalary,
      daysLeftInCycle: daysLeft,
      safeDailyLimitPaise: safeDailyLimitPaise,
      salaryEntered: salaryEntered,
      categoryBreakdown: breakdown,
      pendingBorrowedPaise: pendingBorrowedPaise,
      subscriptionMonthlyPaise: subscriptionMonthlyPaise,
      upcomingSubscriptionsCount: upcomingSubscriptionsCount,
      overdueLoansCount: overdueLoansCount,
    );
  }
}

final monthlySummaryProvider =
    StreamProvider.family<CycleSummary, String>((ref, cycleKey) {
  final repo = ref.watch(dashboardRepositoryProvider);
  return repo.watchCycleSummary(cycleKey);
});

final cycleSummaryProvider = monthlySummaryProvider;
