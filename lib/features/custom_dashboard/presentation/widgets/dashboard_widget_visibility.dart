import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rupee_track/core/database/app_database.dart';
import 'package:rupee_track/core/providers/database_provider.dart';
import 'package:rupee_track/core/providers/salary_cycle_provider.dart';
import 'package:rupee_track/features/budget/data/budget_repository.dart';
import 'package:rupee_track/features/budget_alerts/data/budget_alerts_repository.dart';
import 'package:rupee_track/features/custom_dashboard/domain/dashboard_layout_models.dart';
import 'package:rupee_track/features/dashboard/data/dashboard_repository.dart';
import 'package:rupee_track/features/expenses/data/expense_repository.dart';
import 'package:rupee_track/features/health_score/data/financial_health_repository.dart';
import 'package:rupee_track/features/monthly_report/data/monthly_report_repository.dart';
import 'package:rupee_track/features/safe_spend/data/safe_spend_repository.dart';

/// True when a dashboard slot has no visible content — skip shell margin entirely.
bool isDashboardWidgetEmpty(WidgetRef ref, DashboardWidgetInstance instance) {
  final cycleKey = ref.watch(selectedCycleKeyProvider);

  switch (instance.type) {
    case DashboardWidgetType.safeDailySpend:
      return ref.watch(safeSpendProvider(cycleKey)).maybeWhen(
            error: (_, __) => true,
            orElse: () => false,
          );
    case DashboardWidgetType.financialHealth:
      return ref.watch(financialHealthProvider(cycleKey)).maybeWhen(
            error: (_, __) => true,
            orElse: () => false,
          );
    case DashboardWidgetType.budgetSetup:
      return ref.watch(monthlySummaryProvider(cycleKey)).maybeWhen(
            data: (s) => !s.salaryEntered,
            orElse: () => false,
          );
    case DashboardWidgetType.budgetProgress:
      return ref.watch(budgetPlanStatusProvider(cycleKey)).maybeWhen(
            data: (plan) => plan == null,
            orElse: () => false,
          );
    case DashboardWidgetType.budgetAlerts:
      return ref.watch(budgetAlertsProvider(cycleKey)).maybeWhen(
            data: (snapshot) => !snapshot.hasAlerts,
            orElse: () => false,
          );
    case DashboardWidgetType.expenseCategories:
      return ref.watch(monthlySummaryProvider(cycleKey)).maybeWhen(
            data: (s) => s.categoryBreakdown.isEmpty,
            orElse: () => false,
          );
    case DashboardWidgetType.loanSummary:
      return ref.watch(monthlySummaryProvider(cycleKey)).maybeWhen(
            data: (s) =>
                s.pendingBorrowedPaise <= 0 && s.overdueLoansCount <= 0,
            orElse: () => false,
          );
    case DashboardWidgetType.subscriptions:
      return ref.watch(monthlySummaryProvider(cycleKey)).maybeWhen(
            data: (s) => s.upcomingSubscriptionsCount <= 0,
            orElse: () => false,
          );
    case DashboardWidgetType.monthlyReport:
      return ref.watch(previousCycleClosingReportProvider).maybeWhen(
            data: (report) => report == null,
            orElse: () => false,
          );
    case DashboardWidgetType.achievements:
      return ref.watch(previousCycleClosingReportProvider).maybeWhen(
            data: (report) =>
                report == null || report.goalsAchieved.isEmpty,
            orElse: () => false,
          );
    case DashboardWidgetType.wishlist:
      return ref.watch(_wishlistGoalsVisibilityProvider).maybeWhen(
            data: (items) => items.isEmpty,
            orElse: () => false,
          );
    case DashboardWidgetType.recentTransactions:
      return ref.watch(expensesForMonthProvider(cycleKey)).maybeWhen(
            data: (items) => items.isEmpty,
            orElse: () => false,
          );
    default:
      return false;
  }
}

final _wishlistGoalsVisibilityProvider =
    FutureProvider<List<SavingsGoalsTableData>>((ref) async {
  final db = await ref.watch(databaseProvider.future);
  final goals = await db.savingsGoalsDao.listActiveGoals();
  return goals.where((g) => g.isWishlist).toList();
});
