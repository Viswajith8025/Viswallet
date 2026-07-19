import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:rupee_track/core/design_system/compact_widget_error.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_card.dart';
import 'package:rupee_track/core/design_system/premium_list_tile.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/core/design_system/skeleton_loader.dart';
import 'package:rupee_track/core/database/app_database.dart';
import 'package:rupee_track/core/providers/database_provider.dart';
import 'package:rupee_track/core/providers/salary_cycle_provider.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:rupee_track/core/widgets/money_text.dart';
import 'package:rupee_track/core/widgets/summary_card.dart';
import 'package:rupee_track/features/budget/data/budget_repository.dart';
import 'package:rupee_track/features/budget/presentation/widgets/budget_overview_section.dart';
import 'package:rupee_track/features/budget_alerts/presentation/widgets/budget_alerts_panel.dart';
import 'package:rupee_track/features/custom_dashboard/domain/dashboard_layout_models.dart';
import 'package:rupee_track/features/custom_dashboard/presentation/widgets/dashboard_cycle_header.dart';
import 'package:rupee_track/features/custom_dashboard/presentation/widgets/dashboard_empty.dart';
import 'package:rupee_track/features/dashboard/data/dashboard_repository.dart';
import 'package:rupee_track/features/dashboard/presentation/widgets/dashboard_hero.dart';
import 'package:rupee_track/features/dashboard/presentation/widgets/expense_breakdown_chart.dart';
import 'package:rupee_track/features/expenses/data/expense_repository.dart';
import 'package:rupee_track/features/health_score/presentation/widgets/financial_health_card.dart';
import 'package:rupee_track/features/monthly_report/data/monthly_report_repository.dart';
import 'package:rupee_track/features/monthly_report/presentation/widgets/monthly_report_widgets.dart';
import 'package:rupee_track/features/safe_spend/data/safe_spend_repository.dart';
import 'package:rupee_track/features/safe_spend/presentation/widgets/safe_spend_card.dart';
import 'package:rupee_track/features/savings_forecast/data/savings_forecast_repository.dart';
import 'package:rupee_track/features/savings_forecast/domain/savings_forecast_engine.dart';
import 'package:rupee_track/core/utils/category_icon_utils.dart';
import 'package:rupee_track/features/insights/presentation/widgets/insights_feed_section.dart';

/// Renders a single dashboard widget type — each watches its own providers.
abstract final class DashboardWidgetRegistry {
  static Widget build(
    BuildContext context,
    WidgetRef ref,
    DashboardWidgetInstance instance,
  ) {
    return switch (instance.type) {
      DashboardWidgetType.cycleHeader => const DashboardCycleHeader(),
      DashboardWidgetType.currentBalance => _BalanceWidget(),
      DashboardWidgetType.todaySpending => _TodaySpendingWidget(),
      DashboardWidgetType.safeDailySpend =>
        _SafeSpendWidget(size: instance.size),
      DashboardWidgetType.budgetProgress => _BudgetProgressWidget(),
      DashboardWidgetType.budgetSetup => _BudgetSetupWidget(),
      DashboardWidgetType.budgetAlerts => const BudgetAlertsPanel(),
      DashboardWidgetType.summaryGrid => _SummaryGridWidget(),
      DashboardWidgetType.expenseCategories => _CategoryChartWidget(),
      DashboardWidgetType.financialHealth =>
        const FinancialHealthCard(compact: true),
      DashboardWidgetType.monthlyReport => const MonthlyReportSummaryCard(),
      DashboardWidgetType.calendar => _CalendarPromoWidget(),
      DashboardWidgetType.subscriptions => _SubscriptionsWidget(),
      DashboardWidgetType.loanSummary => _LoanWidget(),
      DashboardWidgetType.savingsForecast => _SavingsForecastWidget(),
      DashboardWidgetType.insightsFeed => _InsightsFeedWidget(),
      DashboardWidgetType.quickActions => _QuickActionsInlineWidget(),
      DashboardWidgetType.achievements => _AchievementsWidget(),
      DashboardWidgetType.wishlist => _WishlistWidget(),
      DashboardWidgetType.recentTransactions => _RecentTransactionsWidget(),
    };
  }
}

String _cycleKey(WidgetRef ref) => ref.watch(selectedCycleKeyProvider);

class _BalanceWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cycleKey = _cycleKey(ref);
    final summaryAsync = ref.watch(monthlySummaryProvider(cycleKey));
    final safeSpendAsync = ref.watch(safeSpendProvider(cycleKey));
    return summaryAsync.when(
      loading: () => const SkeletonCard(height: 200),
      error: (_, __) => CompactWidgetError(
        message: "Couldn't load balance",
        onRetry: () => ref.invalidate(monthlySummaryProvider(cycleKey)),
      ),
      data: (summary) => safeSpendAsync.when(
        loading: () => DashboardHero(summary: summary),
        error: (_, __) => DashboardHero(summary: summary),
        data: (safeSpend) =>
            DashboardHero(summary: summary, safeSpend: safeSpend),
      ),
    );
  }
}

class _TodaySpendingWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cycleKey = _cycleKey(ref);
    final async = ref.watch(safeSpendProvider(cycleKey));
    final theme = Theme.of(context);
    return async.when(
      loading: () => const SkeletonCard(height: 88),
      error: (_, __) => CompactWidgetError(
        message: "Couldn't load today's spending",
        onRetry: () => ref.invalidate(safeSpendProvider(cycleKey)),
      ),
      data: (snap) => PremiumCard(
        child: Row(
          children: [
            Icon(Icons.today_outlined, color: theme.colorScheme.error),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Today's spending", style: theme.textTheme.labelMedium),
                  Text(
                    formatPaise(snap.todaySpentPaise),
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: theme.colorScheme.error,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SafeSpendWidget extends ConsumerWidget {
  const _SafeSpendWidget({required this.size});

  final DashboardWidgetSize size;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(safeSpendProvider(_cycleKey(ref)));
    final compact = size == DashboardWidgetSize.compact;
    final expanded = size == DashboardWidgetSize.large;
    return async.when(
      loading: () => SkeletonCard(height: compact ? 100 : 140),
      error: (_, __) => CompactWidgetError(
        message: "Couldn't load spending guide",
        onRetry: () => ref.invalidate(safeSpendProvider(_cycleKey(ref))),
      ),
      data: (s) => SafeSpendCard(
        snapshot: s,
        compact: compact,
        expanded: expanded,
      ),
    );
  }
}

class _BudgetProgressWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cycleKey = _cycleKey(ref);
    final planAsync = ref.watch(budgetPlanStatusProvider(cycleKey));
    return planAsync.when(
      loading: () => const SkeletonCard(height: 140),
      error: (_, __) => CompactWidgetError(
        message: "Couldn't load budget",
        onRetry: () => ref.invalidate(budgetPlanStatusProvider(cycleKey)),
      ),
      data: (plan) {
        if (plan == null) {
          return DashboardSlotEmpty(
            icon: Icons.pie_chart_outline_rounded,
            title: 'No budget plan yet',
            message: 'Split your salary into groups to track pace and alerts.',
            actionLabel: 'Set up budget',
            onAction: () => context.push(AppRoutes.budgetSetup),
          );
        }
        return BudgetOverviewSection(monthKey: cycleKey);
      },
    );
  }
}

class _BudgetSetupWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cycleKey = _cycleKey(ref);
    final async = ref.watch(monthlySummaryProvider(cycleKey));
    return async.when(
      loading: () => const SkeletonCard(height: 88),
      error: (_, __) => CompactWidgetError(
        message: "Couldn't load budget setup",
        onRetry: () => ref.invalidate(monthlySummaryProvider(cycleKey)),
      ),
      data: (summary) {
        if (!summary.salaryEntered) {
          return DashboardSlotEmpty(
            icon: Icons.payments_outlined,
            title: 'Add salary first',
            message: 'Budget groups are based on your in-hand income each cycle.',
            actionLabel: 'Add salary',
            onAction: () => context.push(AppRoutes.salary),
          );
        }
        final theme = Theme.of(context);
        return PremiumCard(
          accentColor: theme.colorScheme.tertiary,
          onTap: () => context.push(AppRoutes.budgetSetup),
          child: Row(
            children: [
              Icon(Icons.tune_rounded, color: theme.colorScheme.tertiary),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Set up spending groups',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      'Split your salary into Food, Bills, and more.',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right_rounded,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ],
          ),
        );
      },
    );
  }
}

class _SummaryGridWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(monthlySummaryProvider(_cycleKey(ref)));
    final theme = Theme.of(context);
    return async.when(
      loading: () => const SkeletonCard(height: 120),
      error: (_, __) => CompactWidgetError(
        message: "Couldn't load summary",
        onRetry: () => ref.invalidate(monthlySummaryProvider(_cycleKey(ref))),
      ),
      data: (summary) {
        final foodPaise = summary.categoryBreakdown
            .where(
              (c) => c.categoryName.toLowerCase().contains('food'),
            )
            .fold<int>(0, (sum, c) => sum + c.totalPaise);

        final inflowPaise = summary.salaryPaise + summary.extraIncomePaise;
        final spentShare = inflowPaise > 0
            ? (summary.spentPaise / inflowPaise) * 100
            : 0.0;
        final foodShare = summary.spentPaise > 0
            ? (foodPaise / summary.spentPaise) * 100
            : 0.0;

        String salarySubtitle() {
          if (!summary.salaryEntered) return 'Tap to add this cycle';
          if (summary.extraIncomePaise > 0) {
            return '+${formatPaise(summary.extraIncomePaise)} extra income';
          }
          if (summary.carryOverPaise > 0) {
            return '+${formatPaise(summary.carryOverPaise)} carried over';
          }
          return 'Net in-hand this cycle';
        }

        return ResponsiveSummaryGrid(
        hugContent: true,
        children: [
          SummaryCard(
            label: 'Salary',
            icon: Icons.payments_outlined,
            value: MoneyText(inflowPaise > 0 ? inflowPaise : summary.salaryPaise),
            subtitle: salarySubtitle(),
            onTap: () => context.push(AppRoutes.salary),
          ),
          SummaryCard(
            label: 'Spent',
            icon: Icons.trending_down,
            value: MoneyText(summary.spentPaise),
            subtitle: inflowPaise > 0
                ? '${spentShare.toStringAsFixed(0)}% of inflow · ${summary.daysLeftInCycle}d left'
                : '${summary.daysLeftInCycle} days left in cycle',
            accentColor: theme.colorScheme.error,
          ),
          SummaryCard(
            label: 'Savings',
            icon: Icons.savings_outlined,
            value: MoneyText(summary.savingsPaise),
            subtitle:
                '${formatPercent(summary.savingsPercent)} saved · ${formatPaise(summary.moneyLeftPaise)} left',
          ),
          SummaryCard(
            label: 'Food',
            icon: Icons.restaurant_rounded,
            value: MoneyText(foodPaise),
            subtitle: summary.spentPaise > 0
                ? '${foodShare.toStringAsFixed(0)}% of spending this cycle'
                : 'No food spend logged yet',
            accentColor: const Color(0xFFEF4444),
            onTap: () => context.push(AppRoutes.expenses),
          ),
        ],
      );
      },
    );
  }
}

class _CategoryChartWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(monthlySummaryProvider(_cycleKey(ref)));
    final theme = Theme.of(context);
    return async.when(
      loading: () => const SkeletonCard(height: 200),
      error: (_, __) => CompactWidgetError(
        message: "Couldn't load categories",
        onRetry: () => ref.invalidate(monthlySummaryProvider(_cycleKey(ref))),
      ),
      data: (summary) {
        if (summary.categoryBreakdown.isEmpty) {
          return DashboardSlotEmpty(
            icon: Icons.donut_large_outlined,
            title: 'No expenses yet',
            message: 'Log spending to see where your money goes this cycle.',
            actionLabel: 'Add expense',
            onAction: () => context.push(AppRoutes.expenseAdd),
          );
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Expense breakdown',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            PremiumCard(
              child: ExpenseBreakdownChart(
                categories: summary.categoryBreakdown,
              ),
            ),
          ],
        );
      },
    );
  }
}

class _CalendarPromoWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return PremiumCard(
      accentColor: theme.colorScheme.tertiary,
      onTap: () => context.go(AppRoutes.insights),
      child: Row(
        children: [
          Icon(Icons.insights_outlined, color: theme.colorScheme.tertiary),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Spending analytics',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  'Trends, health, and categories',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          Icon(
            Icons.chevron_right_rounded,
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ],
      ),
    );
  }
}

class _LoanWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(monthlySummaryProvider(_cycleKey(ref)));
    final theme = Theme.of(context);
    return async.when(
      loading: () => const SkeletonCard(height: 72),
      error: (_, __) => CompactWidgetError(
        message: "Couldn't load borrow & lend",
        onRetry: () => ref.invalidate(monthlySummaryProvider(_cycleKey(ref))),
      ),
      data: (summary) {
        if (summary.pendingBorrowedPaise <= 0 &&
            summary.overdueLoansCount <= 0) {
          return DashboardSlotEmpty(
            icon: Icons.handshake_outlined,
            title: 'No active loans',
            message: 'Track money you borrowed or lent from More.',
            actionLabel: 'Open borrow & lend',
            onAction: () => context.push(AppRoutes.borrowed),
          );
        }
        final isOverdueLent = summary.overdueLoansCount > 0;
        return PremiumCard(
          accentColor: isOverdueLent ? theme.colorScheme.error : null,
          onTap: () => context.push(
            isOverdueLent ? AppRoutes.loans : AppRoutes.borrowed,
          ),
          child: PremiumRowTile(
            title: isOverdueLent
                ? '${summary.overdueLoansCount} overdue lent'
                : 'Pending borrowed money',
            subtitle: isOverdueLent
                ? 'Check who still owes you'
                : formatPaise(summary.pendingBorrowedPaise),
            leading: Icon(
              Icons.handshake_outlined,
              color: summary.overdueLoansCount > 0
                  ? theme.colorScheme.error
                  : theme.colorScheme.primary,
            ),
            trailing: Icon(
              Icons.chevron_right_rounded,
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        );
      },
    );
  }
}

class _SubscriptionsWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(monthlySummaryProvider(_cycleKey(ref)));
    return async.when(
      loading: () => const SkeletonCard(height: 72),
      error: (_, __) => CompactWidgetError(
        message: "Couldn't load subscriptions",
        onRetry: () => ref.invalidate(monthlySummaryProvider(_cycleKey(ref))),
      ),
      data: (summary) {
        if (summary.upcomingSubscriptionsCount <= 0) {
          return DashboardSlotEmpty(
            icon: Icons.event_outlined,
            title: 'No subscriptions due soon',
            message: 'Add recurring bills to get reminded before they hit.',
            actionLabel: 'Manage subscriptions',
            onAction: () => context.push(AppRoutes.subscriptions),
          );
        }
        final theme = Theme.of(context);
        return PremiumCard(
          onTap: () => context.push(AppRoutes.subscriptions),
          child: PremiumRowTile(
            title:
                '${summary.upcomingSubscriptionsCount} subscription(s) due soon',
            leading: Icon(
              Icons.event_outlined,
              color: theme.colorScheme.tertiary,
            ),
            trailing: Icon(
              Icons.chevron_right_rounded,
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        );
      },
    );
  }
}

class _SavingsForecastWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(savingsForecastReportProvider);
    final theme = Theme.of(context);
    return async.when(
      loading: () => const SkeletonCard(height: 100),
      error: (_, __) => CompactWidgetError(
        message: "Couldn't load savings forecast",
        onRetry: () => ref.invalidate(savingsForecastReportProvider),
      ),
      data: (report) => PremiumCard(
        onTap: () => context.go(AppRoutes.insights),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Savings outlook',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const Icon(Icons.chevron_right_rounded),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              SavingsForecastEngine.formatPaiseCompact(
                report.periodSummary.projectedSavingsPaise,
              ),
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            if (report.insights.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.xs),
              Text(
                report.insights.first.message,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _InsightsFeedWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const InsightsFeedCompactSection();
  }
}

class _QuickActionsInlineWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: AppSpacing.sm,
      runSpacing: AppSpacing.sm,
      children: [
        ActionChip(
          avatar: const Icon(Icons.add, size: 18),
          label: const Text('Expense'),
          onPressed: () => context.push(AppRoutes.expenseAdd),
        ),
        ActionChip(
          avatar: const Icon(Icons.payments_outlined, size: 18),
          label: const Text('Income'),
          onPressed: () => context.push(AppRoutes.salary),
        ),
        ActionChip(
          avatar: const Icon(Icons.insights_outlined, size: 18),
          label: const Text('Insights'),
          onPressed: () => context.go(AppRoutes.insights),
        ),
        ActionChip(
          avatar: const Icon(Icons.subscriptions_outlined, size: 18),
          label: const Text('Subs'),
          onPressed: () => context.push(AppRoutes.subscriptions),
        ),
        ActionChip(
          avatar: const Icon(Icons.replay_circle_filled_outlined, size: 18),
          label: const Text('Borrowed'),
          onPressed: () => context.push(AppRoutes.borrowed),
        ),
        ActionChip(
          avatar: const Icon(Icons.handshake_outlined, size: 18),
          label: const Text('Lent'),
          onPressed: () => context.push(AppRoutes.loans),
        ),
      ],
    );
  }
}

class _AchievementsWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(previousCycleClosingReportProvider);
    final theme = Theme.of(context);
    return async.when(
      loading: () => const SkeletonCard(height: 72),
      error: (_, __) => CompactWidgetError(
        message: "Couldn't load achievements",
        onRetry: () => ref.invalidate(previousCycleClosingReportProvider),
      ),
      data: (report) {
        if (report == null || report.goalsAchieved.isEmpty) {
          return const DashboardSlotEmpty(
            icon: Icons.emoji_events_outlined,
            title: 'No recent wins yet',
            message: 'Finish a cycle on track to see achievements here.',
          );
        }
        return PremiumCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Recent wins',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              ...report.goalsAchieved.take(3).map(
                    (g) => ListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.check_circle_outline, size: 20),
                      title: Text(g.title),
                      subtitle: Text(g.detail),
                    ),
                  ),
            ],
          ),
        );
      },
    );
  }
}

class _WishlistWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final goalsAsync = ref.watch(_wishlistGoalsProvider);

    return goalsAsync.when(
      loading: () => const SkeletonCard(height: 72),
      error: (_, __) => CompactWidgetError(
        message: "Couldn't load wishlist",
        onRetry: () => ref.invalidate(_wishlistGoalsProvider),
      ),
      data: (items) {
        if (items.isEmpty) {
          return DashboardSlotEmpty(
            icon: Icons.favorite_rounded,
            title: 'Wishlist is empty',
            message: 'Save toward something you want from Insights.',
            actionLabel: 'Open insights',
            onAction: () => context.go(AppRoutes.insights),
          );
        }
        final top = items.first;
        return PremiumCard(
          onTap: () => context.go(AppRoutes.insights),
          child: Row(
            children: [
              Icon(Icons.favorite_rounded, color: theme.colorScheme.primary),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Wishlist · ${items.length} item${items.length == 1 ? '' : 's'}',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      '${top.name} · ${formatPaise(top.savedPaise)} saved',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right_rounded,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ],
          ),
        );
      },
    );
  }
}

final _wishlistGoalsProvider =
    FutureProvider<List<SavingsGoalsTableData>>((ref) async {
  final db = await ref.watch(databaseProvider.future);
  final goals = await db.savingsGoalsDao.listActiveGoals();
  return goals.where((g) => g.isWishlist).toList();
});

class _RecentTransactionsWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cycleKey = _cycleKey(ref);
    final async = ref.watch(expensesForMonthProvider(cycleKey));
    final theme = Theme.of(context);
    return async.when(
      loading: () => const SkeletonCard(height: 120),
      error: (_, __) => CompactWidgetError(
        message: "Couldn't load transactions",
        onRetry: () => ref.invalidate(expensesForMonthProvider(cycleKey)),
      ),
      data: (items) {
        if (items.isEmpty) {
          return DashboardSlotEmpty(
            icon: Icons.receipt_long_outlined,
            title: 'No transactions yet',
            message: 'Quick Add or log an expense to see recent activity.',
            actionLabel: 'Add expense',
            onAction: () => context.push(AppRoutes.expenseAdd),
          );
        }
        final semantics = context.semanticColors;
        return PremiumCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Recent transactions',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              ...items.take(4).map(
                    (row) => ListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      leading: Icon(
                        categoryIconFromName(row.category.iconName),
                        color: Color(row.category.colorValue),
                        size: 20,
                      ),
                      title: Text(row.expense.title),
                      subtitle: Text(row.category.name),
                      trailing: MoneyText(
                        row.expense.amountPaise,
                        compact: true,
                        color: semantics.expense,
                        style: AppTypography.moneyCompact(
                          context,
                          color: semantics.expense,
                        ),
                      ),
                    ),
                  ),
            ],
          ),
        );
      },
    );
  }
}
