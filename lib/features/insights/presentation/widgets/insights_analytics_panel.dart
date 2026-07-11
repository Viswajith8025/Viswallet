import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:rupee_track/core/design_system/app_scroll_behavior.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_card.dart';
import 'package:rupee_track/core/design_system/premium_chip.dart';
import 'package:rupee_track/core/design_system/premium_list_tile.dart';
import 'package:rupee_track/core/design_system/skeleton_loader.dart';
import 'package:rupee_track/core/providers/salary_cycle_provider.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/core/utils/date_utils.dart';
import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:rupee_track/core/widgets/empty_state.dart';
import 'package:rupee_track/core/widgets/money_text.dart';
import 'package:rupee_track/core/widgets/month_selector.dart';
import 'package:rupee_track/core/widgets/summary_card.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/features/health_score/data/financial_health_repository.dart';
import 'package:rupee_track/features/health_score/presentation/widgets/financial_health_card.dart';
import 'package:rupee_track/features/trends/domain/spending_trends_report.dart';
import 'package:rupee_track/features/trends/domain/trends_comparison_mode.dart';
import 'package:rupee_track/features/trends/data/spending_trends_repository.dart';
import 'package:rupee_track/features/trends/presentation/widgets/trends_charts.dart';

/// Trends, health score, and category breakdown — lean analytics block.
class InsightsAnalyticsPanel extends ConsumerWidget {
  const InsightsAnalyticsPanel({
    required this.report,
    super.key,
  });

  final SpendingTrendsReport report;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final semantics = context.semanticColors;
    final cycleKey = ref.watch(selectedCycleKeyProvider);
    final salaryDay = ref.watch(salaryDayProvider);
    final mode = ref.watch(trendsComparisonModeProvider);
    final cycleLabel = formatCycleLabel(cycleKey, salaryDay: salaryDay);
    final hasSpending = report.current.totalSpentPaise > 0;
    final hasCategories = report.categoryComparisons.isNotEmpty;
    final hasTimeSeries = report.timeSeries.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        PremiumSectionHeader(
          title: 'This pay period',
          subtitle: cycleLabel,
        ),
        const CycleSelector(),
        const SizedBox(height: AppSpacing.sm),
        AppHorizontalScrollRow(
          padding: EdgeInsets.zero,
          children: TrendsComparisonMode.values.map((m) {
            return Padding(
              padding: const EdgeInsets.only(right: AppSpacing.xs),
              child: PremiumFilterChip(
                label: m.label,
                selected: m == mode,
                onSelected: (_) => ref
                    .read(trendsComparisonModeProvider.notifier)
                    .setMode(m),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: AppSpacing.lg),
        const _FinancialHealthSection(),
        if (!hasSpending) ...[
          Padding(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.lg),
            child: EmptyState(
              icon: Icons.bar_chart_rounded,
              title: 'No spending data yet',
              message:
                  'Add expenses this cycle to unlock trends and category breakdown.',
              accentColor: theme.colorScheme.primary,
              action: FilledButton.icon(
                onPressed: () => context.push(AppRoutes.expenseAdd),
                icon: const Icon(Icons.add_rounded, size: AppIconSize.md),
                label: const Text('Add expense'),
              ),
            ),
          ),
        ] else ...[
          PremiumSectionHeader(
            title: 'Spending trends',
            subtitle: 'Grey = previous period · colour = this period',
          ),
          if (hasTimeSeries)
            PremiumCard(
              child: TrendsLineChart(points: report.timeSeries),
            )
          else
            const SkeletonCard(height: 160),
          const SizedBox(height: AppSpacing.md),
          _MetricsGrid(report: report),
          const SizedBox(height: AppSpacing.lg),
          if (hasCategories) ...[
            PremiumSectionHeader(
              title: 'Category breakdown',
              subtitle: 'Where your money went this period',
            ),
            PremiumCard(
              child: TrendsPieChart(categories: report.categoryComparisons),
            ),
            const SizedBox(height: AppSpacing.sm),
            PremiumCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: report.categoryComparisons.take(6).map((c) {
                  final total = report.current.totalSpentPaise;
                  final share = total > 0
                      ? (c.currentPaise / total * 100).round()
                      : 0;
                  return PremiumRowTile(
                    title: c.categoryName,
                    subtitle: '$share% of spending',
                    leading: CircleAvatar(
                      radius: 6,
                      backgroundColor: Color(c.colorValue),
                    ),
                    trailing: MoneyText(
                      c.currentPaise,
                      compact: true,
                      color: semantics.expense,
                      style: AppTypography.moneyCompact(
                        context,
                        color: semantics.expense,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ],
        const SizedBox(height: AppSpacing.lg),
      ],
    );
  }
}

class _FinancialHealthSection extends ConsumerWidget {
  const _FinancialHealthSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cycleKey = ref.watch(selectedCycleKeyProvider);
    final healthAsync = ref.watch(financialHealthProvider(cycleKey));

    return healthAsync.when(
      loading: () => const Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          PremiumSectionHeader(
            title: 'Financial health',
            subtitle: 'Score from your habits this cycle',
          ),
          SkeletonCard(height: 120),
          SizedBox(height: AppSpacing.lg),
        ],
      ),
      error: (_, __) => const SizedBox.shrink(),
      data: (_) => const Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          PremiumSectionHeader(
            title: 'Financial health',
            subtitle: 'Score from your habits this cycle',
          ),
          FinancialHealthCard(),
          SizedBox(height: AppSpacing.lg),
        ],
      ),
    );
  }
}

class _MetricsGrid extends StatelessWidget {
  const _MetricsGrid({required this.report});

  final SpendingTrendsReport report;

  @override
  Widget build(BuildContext context) {
    final semantics = context.semanticColors;
    return ResponsiveSummaryGrid(
      hugContent: true,
      children: [
        SummaryCard(
          label: 'Daily average',
          icon: Icons.today_outlined,
          value: MoneyText(
            report.current.avgDailyPaise,
            compact: true,
            color: semantics.expense,
            style: AppTypography.moneyCompact(
              context,
              color: semantics.expense,
            ),
          ),
          subtitle: 'Per day this cycle',
        ),
        SummaryCard(
          label: 'Weekly average',
          icon: Icons.date_range_outlined,
          value: MoneyText(
            report.current.avgWeeklyPaise,
            compact: true,
            color: semantics.expense,
            style: AppTypography.moneyCompact(
              context,
              color: semantics.expense,
            ),
          ),
          subtitle: 'Per week this cycle',
        ),
        SummaryCard(
          label: 'Top category',
          icon: Icons.category_outlined,
          value: Text(report.highestCategory?.categoryName ?? '—'),
          subtitle: report.highestCategory != null
              ? formatPaise(report.highestCategory!.currentPaise)
              : null,
        ),
        SummaryCard(
          label: 'Fastest growing',
          icon: Icons.trending_up_rounded,
          value: Text(report.fastestGrowingCategory?.categoryName ?? '—'),
          subtitle: report.fastestGrowingCategory?.changePercent != null
              ? '+${report.fastestGrowingCategory!.changePercent!.round()}%'
              : null,
          accentColor: semantics.warning,
        ),
      ],
    );
  }
}
