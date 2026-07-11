import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:rupee_track/core/branding/vis_wallet_logo.dart';
import 'package:rupee_track/core/design_system/animated_money_text.dart';
import 'package:rupee_track/core/design_system/compact_label.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/greeting_utils.dart';
import 'package:rupee_track/core/design_system/premium_card.dart';
import 'package:rupee_track/core/design_system/progress_ring.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:rupee_track/features/dashboard/domain/monthly_summary.dart';
import 'package:rupee_track/features/safe_spend/domain/safe_spend_snapshot.dart';

/// Financial command-center hero — balance plus safe-spend guide in one card.
class DashboardHero extends StatelessWidget {
  const DashboardHero({
    required this.summary,
    this.safeSpend,
    super.key,
  });

  final MonthlySummary summary;
  final SafeSpendSnapshot? safeSpend;

  @override
  Widget build(BuildContext context) {
    if (!summary.salaryEntered) {
      return _SalarySetupHero(onAddSalary: () => context.push(AppRoutes.salary));
    }
    return _BalanceHero(summary: summary, safeSpend: safeSpend);
  }
}

class _SalarySetupHero extends StatelessWidget {
  const _SalarySetupHero({required this.onAddSalary});

  final VoidCallback onAddSalary;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return PremiumCard(
      variant: PremiumCardVariant.hero,
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const VisWalletLogo(size: 52, showShadow: true),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  GreetingUtils.timeOfDayGreeting(),
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  'Add your salary to start',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  'Unlock your daily spending guide, savings view, and Jithu.',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          FilledButton(
            onPressed: onAddSalary,
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.sm,
              ),
            ),
            child: const Text('Add salary'),
          ),
        ],
      ),
    );
  }
}

class _BalanceHero extends StatelessWidget {
  const _BalanceHero({
    required this.summary,
    this.safeSpend,
  });

  final MonthlySummary summary;
  final SafeSpendSnapshot? safeSpend;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final semantics = context.semanticColors;
    final isPositive = summary.moneyLeftPaise >= 0;
    final moneyColor =
        isPositive ? theme.colorScheme.onSurface : theme.colorScheme.error;
    final spentProgress = summary.salaryPaise > 0
        ? (summary.spentPaise / summary.salaryPaise).clamp(0.0, 1.0)
        : 0.0;
    final ringColor = spentProgress > 0.85
        ? theme.colorScheme.error
        : spentProgress > 0.65
            ? semantics.warning
            : theme.colorScheme.primary;

    return PremiumCard(
      variant: PremiumCardVariant.hero,
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Money left this cycle',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    AnimatedMoneyText(
                      summary.moneyLeftPaise,
                      style: AppTypography.moneyHero(context, color: moneyColor),
                    ),
                  ],
                ),
              ),
              ProgressRing(
                progress: spentProgress,
                size: 56,
                strokeWidth: 4.5,
                color: ringColor,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '${(spentProgress * 100).round()}%',
                      style: theme.textTheme.labelSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        fontSize: 11,
                      ),
                    ),
                    Text(
                      'spent',
                      style: theme.textTheme.labelSmall?.copyWith(
                        fontSize: 8,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (safeSpend != null) ...[
            const SizedBox(height: AppSpacing.md),
            _SafeSpendHeroStrip(snapshot: safeSpend!),
          ],
          const SizedBox(height: AppSpacing.sm),
          Text(
            GreetingUtils.motivationalLine(
              moneyLeftPaise: summary.moneyLeftPaise,
              savingsPercent: summary.savingsPercent,
              isOverBudget: summary.moneyLeftPaise < 0,
            ),
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              height: 1.4,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: _HeroStat(
                  label: 'Spent',
                  value: formatPaise(summary.spentPaise),
                  icon: Icons.trending_down_rounded,
                  valueColor: semantics.expense,
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: _HeroStat(
                  label: 'Saved',
                  value: summary.savingsPaise > 0
                      ? formatPaise(summary.savingsPaise)
                      : '${summary.savingsPercent.round()}%',
                  icon: Icons.savings_outlined,
                  valueColor: semantics.income,
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: _HeroStat(
                  label: 'To salary',
                  value: '${summary.daysToSalary}d',
                  icon: Icons.calendar_today_outlined,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SafeSpendHeroStrip extends StatelessWidget {
  const _SafeSpendHeroStrip({required this.snapshot});

  final SafeSpendSnapshot snapshot;

  Color _riskColor(BuildContext context) {
    final theme = Theme.of(context);
    final semantics = context.semanticColors;
    return switch (snapshot.riskLevel) {
      SafeSpendRiskLevel.onTrack => semantics.income,
      SafeSpendRiskLevel.comfortable => theme.colorScheme.primary,
      SafeSpendRiskLevel.watch => semantics.warning,
      SafeSpendRiskLevel.elevated => semantics.expense,
      SafeSpendRiskLevel.critical => theme.colorScheme.error,
      SafeSpendRiskLevel.noData => semantics.neutral,
    };
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final riskColor = _riskColor(context);
    final usage = snapshot.todayUsagePercent.clamp(0, 200) / 100;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: riskColor.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppRadius.sm),
        border: Border.all(color: riskColor.withValues(alpha: 0.22)),
      ),
      child: Row(
        children: [
          Icon(Icons.shield_outlined, color: riskColor, size: AppIconSize.md),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Safe to spend today',
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                AnimatedMoneyText(
                  snapshot.safeDailyLimitPaise,
                  style: AppTypography.moneyCompact(
                    context,
                    color: riskColor,
                  ),
                ),
              ],
            ),
          ),
          ProgressRing(
            progress: usage > 1 ? 1 : usage,
            size: 48,
            strokeWidth: 5,
            color: riskColor,
            child: Text(
              '${snapshot.todayUsagePercent.round()}%',
              style: theme.textTheme.labelSmall?.copyWith(
                fontWeight: FontWeight.w700,
                fontSize: 10,
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.sm,
              vertical: AppSpacing.xxs,
            ),
            decoration: BoxDecoration(
              color: riskColor.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(AppRadius.pill),
            ),
            child: Text(
              snapshot.riskLevel.label,
              style: theme.textTheme.labelSmall?.copyWith(
                color: riskColor,
                fontWeight: FontWeight.w700,
              ),
            ),
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
    required this.icon,
    this.valueColor,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final brightness = theme.brightness;
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: AppColors.card(brightness).withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(AppRadius.sm),
        border: Border.all(
          color: AppColors.hairline(brightness),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: AppIconSize.sm, color: theme.colorScheme.primary),
          const SizedBox(height: AppSpacing.xxs),
          FittingLabel(
            value,
            style: theme.textTheme.labelLarge?.copyWith(
              fontWeight: FontWeight.w800,
              color: valueColor,
            ),
          ),
          FittingLabel(
            label,
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }
}
