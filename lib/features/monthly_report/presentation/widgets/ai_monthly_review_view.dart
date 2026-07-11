import 'dart:math' as math;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:rupee_track/core/branding/brand_colors.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:rupee_track/features/monthly_report/domain/ai_monthly_review.dart';
import 'package:rupee_track/features/monthly_report/domain/ai_monthly_review_engine.dart';
import 'package:rupee_track/features/monthly_report/domain/monthly_closing_report.dart';

class AiMonthlyReviewView extends StatelessWidget {
  const AiMonthlyReviewView({
    required this.report,
    super.key,
  });

  final MonthlyClosingReport report;

  AiMonthlyReview get review =>
      report.aiReview ?? AiMonthlyReviewEngine.buildFromReportOnly(report);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final r = review;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _WrappedHero(report: report, review: r),
        const SizedBox(height: AppSpacing.lg),
        _ProgressRingsRow(report: report),
        const SizedBox(height: AppSpacing.lg),
        if (r.insights.isNotEmpty) ...[
          _SectionLabel('AI insights', Icons.auto_awesome_rounded),
          const SizedBox(height: AppSpacing.sm),
          ...r.insights.map((line) => _InsightCard(text: line)),
          const SizedBox(height: AppSpacing.lg),
        ],
        if (r.achievements.isNotEmpty) ...[
          _SectionLabel('Achievements', Icons.emoji_events_outlined),
          const SizedBox(height: AppSpacing.sm),
          SizedBox(
            height: 118,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: r.achievements.length,
              separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
              itemBuilder: (context, i) =>
                  _AchievementBadge(achievement: r.achievements[i]),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
        ],
        _SectionLabel('Spending behaviour', Icons.psychology_outlined),
        const SizedBox(height: AppSpacing.sm),
        _BehaviourCard(behaviour: r.behaviour, report: report),
        const SizedBox(height: AppSpacing.lg),
        if (report.topCategories.isNotEmpty) ...[
          _SectionLabel('Spending comparison', Icons.bar_chart_rounded),
          const SizedBox(height: AppSpacing.sm),
          _CategoryChart(categories: report.topCategories),
          const SizedBox(height: AppSpacing.lg),
        ],
        if (r.recommendations.isNotEmpty) ...[
          _SectionLabel('Recommendations', Icons.lightbulb_outline_rounded),
          const SizedBox(height: AppSpacing.sm),
          ...r.recommendations.map(_RecommendationTile.new),
          const SizedBox(height: AppSpacing.lg),
        ],
        if (r.wishlistProgressNote != null)
          Card(
            child: ListTile(
              leading: Icon(
                Icons.favorite_border,
                color: theme.colorScheme.primary,
              ),
              title: const Text('Wishlist progress'),
              subtitle: Text(r.wishlistProgressNote!),
            ),
          ),
      ],
    );
  }
}

class _WrappedHero extends StatelessWidget {
  const _WrappedHero({required this.report, required this.review});

  final MonthlyClosingReport report;
  final AiMonthlyReview review;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppRadius.xl),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            BrandColors.primaryDark,
            BrandColors.accentContainerDark,
            BrandColors.primaryDarkMuted,
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: BrandColors.primary.withValues(alpha: 0.25),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'AI MONTHLY REVIEW',
            style: theme.textTheme.labelSmall?.copyWith(
              color: BrandColors.accent,
              letterSpacing: 1.4,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            review.headline,
            style: theme.textTheme.headlineSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            review.subheadline,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.white.withValues(alpha: 0.88),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            report.cycleLabel,
            style: theme.textTheme.labelLarge?.copyWith(
              color: Colors.white70,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              _HeroStat(
                label: 'Income',
                value: formatPaise(report.incomePaise),
              ),
              _HeroStat(
                label: 'Expenses',
                value: formatPaise(report.expensesPaise),
              ),
              _HeroStat(
                label: 'Net flow',
                value: formatPaise(review.netCashFlowPaise),
                highlight: true,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeroStat extends StatelessWidget {
  const _HeroStat({
    required this.label,
    required this.value,
    this.highlight = false,
  });

  final String label;
  final String value;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Colors.white60, fontSize: 11)),
          Text(
            value,
            style: TextStyle(
              color: highlight ? BrandColors.accent : Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}

class _ProgressRingsRow extends StatelessWidget {
  const _ProgressRingsRow({required this.report});

  final MonthlyClosingReport report;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _ProgressRing(
            label: 'Savings',
            percent: report.savingsRatePercent.clamp(0, 100),
            value: formatPaise(report.savingsPaise),
            color: BrandColors.success,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _ProgressRing(
            label: 'Budget',
            percent: report.budgetOnTrackPercent.clamp(0, 100),
            value: '${report.budgetOnTrackPercent.toStringAsFixed(0)}%',
            color: BrandColors.primary,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _ProgressRing(
            label: 'Health',
            percent: (report.healthScore ?? 0).toDouble(),
            value: report.healthScore != null ? '${report.healthScore}' : '—',
            color: BrandColors.secondary,
          ),
        ),
      ],
    );
  }
}

class _ProgressRing extends StatelessWidget {
  const _ProgressRing({
    required this.label,
    required this.percent,
    required this.value,
    required this.color,
  });

  final String label;
  final double percent;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.sm),
        child: Column(
          children: [
            SizedBox(
              height: 64,
              width: 64,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  CircularProgressIndicator(
                    value: (percent / 100).clamp(0, 1),
                    strokeWidth: 6,
                    backgroundColor: color.withValues(alpha: 0.15),
                    color: color,
                  ),
                  Text(
                    value,
                    style: theme.textTheme.labelSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 4),
            Text(label, style: theme.textTheme.labelSmall),
          ],
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.title, this.icon);

  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, size: 20, color: theme.colorScheme.primary),
        const SizedBox(width: AppSpacing.xs),
        Text(
          title,
          style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
        ),
      ],
    );
  }
}

class _InsightCard extends StatelessWidget {
  const _InsightCard({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.xs),
      color: theme.colorScheme.primaryContainer.withValues(alpha: 0.35),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.format_quote, size: 18, color: theme.colorScheme.primary),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Text(
                text,
                style: theme.textTheme.bodyMedium?.copyWith(height: 1.4),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AchievementBadge extends StatelessWidget {
  const _AchievementBadge({required this.achievement});

  final MonthlyAchievement achievement;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
  final icon = switch (achievement.kind) {
      AchievementKind.budgetAchieved => Icons.verified_outlined,
      AchievementKind.goalCompleted => Icons.flag_rounded,
      AchievementKind.savingsMilestone => Icons.savings_rounded,
      AchievementKind.noSpendStreak => Icons.nightlight_round,
      AchievementKind.trackingConsistency => Icons.edit_note_rounded,
      AchievementKind.healthImprovement => Icons.favorite_rounded,
      AchievementKind.subscriptionControl => Icons.subscriptions_rounded,
    };

    return Container(
      width: 148,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.tertiaryContainer,
            theme.colorScheme.primaryContainer,
          ],
        ),
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: theme.colorScheme.primary),
          const Spacer(),
          Text(
            achievement.title,
            style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w700),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            achievement.subtitle,
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _BehaviourCard extends StatelessWidget {
  const _BehaviourCard({required this.behaviour, required this.report});

  final SpendingBehaviourReview behaviour;
  final MonthlyClosingReport report;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final total = behaviour.weekendPaise + behaviour.weekdayPaise;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (behaviour.impulseCount > 0)
              _BehaviourRow(
                icon: Icons.flash_on_outlined,
                label: 'Impulse purchases',
                value:
                    '${behaviour.impulseCount} · ${formatPaise(behaviour.impulseTotalPaise)}',
              ),
            if (behaviour.overspendingCategories.isNotEmpty)
              _BehaviourRow(
                icon: Icons.warning_amber_rounded,
                label: 'Overspending',
                value: behaviour.overspendingCategories.join(', '),
              ),
            if (behaviour.bestSavingCategory != null)
              _BehaviourRow(
                icon: Icons.thumb_up_alt_outlined,
                label: 'Best category',
                value: behaviour.bestSavingCategory!,
              ),
            if (behaviour.worstSpendingHabit != null)
              _BehaviourRow(
                icon: Icons.trending_up,
                label: 'Watch area',
                value: behaviour.worstSpendingHabit!,
              ),
            if (total > 0) ...[
              const SizedBox(height: AppSpacing.sm),
              Text('Weekend vs weekday', style: theme.textTheme.labelMedium),
              const SizedBox(height: AppSpacing.xs),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: Row(
                  children: [
                    Expanded(
                      flex: behaviour.weekdayPaise,
                      child: Container(
                        height: 8,
                        color: BrandColors.primary,
                      ),
                    ),
                    Expanded(
                      flex: math.max(behaviour.weekendPaise, 1),
                      child: Container(
                        height: 8,
                        color: BrandColors.secondary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Weekday ${formatPaise(behaviour.weekdayPaise)} · '
                'Weekend ${formatPaise(behaviour.weekendPaise)} '
                '(${behaviour.weekendSharePercent.toStringAsFixed(0)}%)',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
            if (behaviour.recurringExpenses.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.sm),
              Text('Recurring', style: theme.textTheme.labelMedium),
              ...behaviour.recurringExpenses.map(
                (r) => Text('• $r', style: theme.textTheme.bodySmall),
              ),
            ],
            if (behaviour.merchantTrend != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(behaviour.merchantTrend!, style: theme.textTheme.bodySmall),
            ],
            _BehaviourRow(
              icon: Icons.subscriptions_outlined,
              label: 'Subscriptions',
              value:
                  '${formatPaise(report.subscriptions.monthlyRecurringPaise)}/mo',
            ),
            _BehaviourRow(
              icon: Icons.handshake_outlined,
              label: 'Loans',
              value:
                  '${formatPaise(report.loans.pendingBorrowedPaise)} pending',
            ),
          ],
        ),
      ),
    );
  }
}

class _BehaviourRow extends StatelessWidget {
  const _BehaviourRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18),
          const SizedBox(width: AppSpacing.sm),
          Expanded(child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600))),
          Flexible(child: Text(value, textAlign: TextAlign.end)),
        ],
      ),
    );
  }
}

class _CategoryChart extends StatelessWidget {
  const _CategoryChart({required this.categories});

  final List<CategoryReportLine> categories;

  @override
  Widget build(BuildContext context) {
    final top = categories.take(5).toList();
    final max = top.isEmpty
        ? 1.0
        : top.map((c) => c.totalPaise).reduce(math.max).toDouble();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: SizedBox(
          height: 160,
          child: BarChart(
            BarChartData(
              alignment: BarChartAlignment.spaceAround,
              maxY: max * 1.15,
              titlesData: FlTitlesData(
                leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (value, meta) {
                      final i = value.toInt();
                      if (i < 0 || i >= top.length) return const SizedBox.shrink();
                      return Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text(
                          top[i].name.length > 6
                              ? '${top[i].name.substring(0, 5)}…'
                              : top[i].name,
                          style: const TextStyle(fontSize: 9),
                        ),
                      );
                    },
                  ),
                ),
              ),
              gridData: const FlGridData(show: false),
              borderData: FlBorderData(show: false),
              barGroups: [
                for (var i = 0; i < top.length; i++)
                  BarChartGroupData(
                    x: i,
                    barRods: [
                      BarChartRodData(
                        toY: top[i].totalPaise.toDouble(),
                        color: Color(top[i].colorValue),
                        width: 18,
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(4),
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RecommendationTile extends StatelessWidget {
  const _RecommendationTile(this.rec);

  final MonthlyRecommendation rec;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: ListTile(
        leading: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
        title: Text(rec.title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(rec.detail),
      ),
    );
  }
}
