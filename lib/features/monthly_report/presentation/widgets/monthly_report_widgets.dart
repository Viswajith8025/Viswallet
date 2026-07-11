import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:rupee_track/core/branding/brand_colors.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:rupee_track/features/monthly_report/data/monthly_report_repository.dart';
import 'package:rupee_track/features/monthly_report/presentation/widgets/ai_monthly_review_view.dart';
import 'package:rupee_track/features/monthly_report/domain/monthly_closing_report.dart';

class MonthlyReportSummaryCard extends ConsumerWidget {
  const MonthlyReportSummaryCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(previousCycleClosingReportProvider);
    final theme = Theme.of(context);

    return async.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (report) {
        if (report == null) return const SizedBox.shrink();
        return Card(
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: () => context.go(AppRoutes.insights),
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    BrandColors.primary,
                    BrandColors.primaryLight,
                  ],
                ),
              ),
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.description_outlined,
                        color: theme.colorScheme.onPrimary.withValues(alpha: 0.9),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'AI Monthly Review',
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      Icon(
                        Icons.chevron_right,
                        color: theme.colorScheme.onPrimary.withValues(alpha: 0.8),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    report.cycleLabel,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: BrandColors.accent,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      _MiniMetric(
                        label: 'Saved',
                        value: formatPaise(report.savingsPaise),
                      ),
                      _MiniMetric(
                        label: 'Spent',
                        value: formatPaise(report.expensesPaise),
                      ),
                      if (report.healthScore != null)
                        _MiniMetric(
                          label: 'Health',
                          value: '${report.healthScore}',
                        ),
                    ],
                  ),
                  if (report.aiReview?.insights.isNotEmpty == true) ...[
                    const SizedBox(height: 8),
                    Text(
                      report.aiReview!.insights.first,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.9),
                      ),
                    ),
                  ] else if (report.goalsAchieved.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Text(
                      '${report.goalsAchieved.length} goal${report.goalsAchieved.length == 1 ? '' : 's'} achieved',
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.9),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _MiniMetric extends StatelessWidget {
  const _MiniMetric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 11,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }
}

class MonthlyReportDetailView extends StatelessWidget {
  const MonthlyReportDetailView({
    required this.report,
    this.reviewCaptureKey,
    super.key,
  });

  final MonthlyClosingReport report;
  final GlobalKey? reviewCaptureKey;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
      children: [
        RepaintBoundary(
          key: reviewCaptureKey,
          child: AiMonthlyReviewView(report: report),
        ),
        const SizedBox(height: 24),
        Text(
          'Full statement',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        _StatementHeader(report: report),
        const SizedBox(height: 20),
        _MetricGrid(report: report),
        const SizedBox(height: 20),
        _SectionCard(
          title: 'Cycle comparison',
          subtitle: 'vs ${report.comparison.previousCycleLabel}',
          child: Column(
            children: [
              _CompareRow(
                label: 'Income',
                current: report.incomePaise,
                previous: report.comparison.previousIncomePaise,
                change: report.comparison.incomeChangePercent,
              ),
              _CompareRow(
                label: 'Expenses',
                current: report.expensesPaise,
                previous: report.comparison.previousExpensesPaise,
                change: report.comparison.expenseChangePercent,
              ),
              _CompareRow(
                label: 'Savings',
                current: report.savingsPaise,
                previous: report.comparison.previousSavingsPaise,
                change: report.comparison.savingsChangePercent,
                positiveIsGood: true,
              ),
            ],
          ),
        ),
        if (report.topCategories.isNotEmpty) ...[
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Top categories',
            child: Column(
              children: report.topCategories.map((c) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 6,
                        backgroundColor: Color(c.colorValue),
                      ),
                      const SizedBox(width: 10),
                      Expanded(child: Text(c.name)),
                      Text(
                        formatPaise(c.totalPaise),
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
        if (report.largestPurchase != null) ...[
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Largest purchase',
            child: _PurchaseTile(report.largestPurchase!),
          ),
        ],
        const SizedBox(height: 16),
        _SectionCard(
          title: 'Daily spending',
          child: Text(
            '${formatPaise(report.averageDailySpendPaise)} per day '
            'across ${report.cycleDayCount} days',
            style: theme.textTheme.bodyLarge,
          ),
        ),
        if (report.budgetBuckets.isNotEmpty) ...[
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Budget performance',
            subtitle:
                '${report.budgetOnTrackPercent.toStringAsFixed(0)}% of spending groups on track',
            child: Column(
              children: report.budgetBuckets.map((b) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(child: Text(b.name)),
                          Text(
                            '${b.percentUsed.toStringAsFixed(0)}%',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              color: b.onTrack
                                  ? BrandColors.success
                                  : BrandColors.error,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: (b.percentUsed / 100).clamp(0, 1),
                          minHeight: 6,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
        const SizedBox(height: 16),
        _SectionCard(
          title: 'Subscriptions',
          child: Text(
            '${formatPaise(report.subscriptions.cycleSpendPaise)} this month · '
            '${report.subscriptions.activeCount} active · '
            '${report.subscriptions.salarySharePercent.toStringAsFixed(1)}% of income',
          ),
        ),
        const SizedBox(height: 16),
        _SectionCard(
          title: 'Loans',
          child: Text(
            '${formatPaise(report.loans.pendingBorrowedPaise)} outstanding · '
            '${report.loans.activeLoanCount} active · '
            '${report.loans.overdueCount} overdue',
          ),
        ),
        if (report.majorPurchases.isNotEmpty) ...[
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Major purchases',
            child: Column(
              children:
                  report.majorPurchases.map(_PurchaseTile.new).toList(),
            ),
          ),
        ],
        if (report.healthScore != null) ...[
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Financial health',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${report.healthScore}/100',
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: theme.colorScheme.primary,
                  ),
                ),
                if (report.healthTrendDelta != 0)
                  Text(
                    '${report.healthTrendDelta >= 0 ? '+' : ''}${report.healthTrendDelta} vs last month',
                  ),
                if (report.healthMotivation.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(report.healthMotivation),
                ],
              ],
            ),
          ),
        ],
        if (report.trendSummaries.isNotEmpty) ...[
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Spending trends',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: report.trendSummaries
                  .map(
                    (s) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('• '),
                          Expanded(child: Text(s)),
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
        ],
        if (report.goalsAchieved.isNotEmpty) ...[
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Goals achieved',
            icon: Icons.check_circle_outline,
            iconColor: BrandColors.success,
            child: Column(
              children: report.goalsAchieved.map(_goalTile).toList(),
            ),
          ),
        ],
        if (report.goalsMissed.isNotEmpty) ...[
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Goals missed',
            icon: Icons.flag_outlined,
            iconColor: BrandColors.warning,
            child: Column(
              children: report.goalsMissed.map(_goalTile).toList(),
            ),
          ),
        ],
      ],
    );
  }

  Widget _goalTile(GoalLine g) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(g.title),
      subtitle: Text(g.detail),
    );
  }
}

class _StatementHeader extends StatelessWidget {
  const _StatementHeader({required this.report});

  final MonthlyClosingReport report;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [BrandColors.primary, BrandColors.secondary],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Account Statement',
            style: theme.textTheme.labelLarge?.copyWith(
              color: BrandColors.accent,
              letterSpacing: 1.1,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            report.cycleLabel,
            style: theme.textTheme.headlineSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Savings rate ${report.savingsRatePercent.toStringAsFixed(1)}%',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.white.withValues(alpha: 0.85),
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricGrid extends StatelessWidget {
  const _MetricGrid({required this.report});

  final MonthlyClosingReport report;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _MetricTile(
            label: 'Income',
            value: formatPaise(report.incomePaise),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _MetricTile(
            label: 'Expenses',
            value: formatPaise(report.expensesPaise),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _MetricTile(
            label: 'Savings',
            value: formatPaise(report.savingsPaise),
            highlight: true,
          ),
        ),
      ],
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.label,
    required this.value,
    this.highlight = false,
  });

  final String label;
  final String value;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      color: highlight
          ? theme.colorScheme.primaryContainer.withValues(alpha: 0.5)
          : null,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: theme.textTheme.labelMedium),
            const SizedBox(height: 4),
            Text(
              value,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.child,
    this.subtitle,
    this.icon,
    this.iconColor,
  });

  final String title;
  final String? subtitle;
  final Widget child;
  final IconData? icon;
  final Color? iconColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (icon != null) ...[
                  Icon(icon, size: 20, color: iconColor),
                  const SizedBox(width: 8),
                ],
                Expanded(
                  child: Text(
                    title,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 4),
              Text(
                subtitle!,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }
}

class _CompareRow extends StatelessWidget {
  const _CompareRow({
    required this.label,
    required this.current,
    required this.previous,
    required this.change,
    this.positiveIsGood = false,
  });

  final String label;
  final int current;
  final int previous;
  final double? change;
  final bool positiveIsGood;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    Color? deltaColor;
    if (change != null) {
      final up = change! > 0;
      final good = positiveIsGood ? up : !up;
      deltaColor = good ? BrandColors.success : BrandColors.error;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Expanded(child: Text(label)),
          Text(formatPaise(current)),
          if (change != null) ...[
            const SizedBox(width: 8),
            Text(
              '${change! >= 0 ? '+' : ''}${change!.toStringAsFixed(1)}%',
              style: theme.textTheme.labelMedium?.copyWith(color: deltaColor),
            ),
          ],
        ],
      ),
    );
  }
}

class _PurchaseTile extends StatelessWidget {
  const _PurchaseTile(this.purchase);

  final PurchaseHighlight purchase;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(purchase.title),
      subtitle: Text('${purchase.categoryName} · ${purchase.dateLabel}'),
      trailing: Text(
        formatPaise(purchase.amountPaise),
        style: const TextStyle(fontWeight: FontWeight.w700),
      ),
    );
  }
}
