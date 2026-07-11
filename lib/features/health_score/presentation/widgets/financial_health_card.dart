import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_card.dart';
import 'package:rupee_track/core/design_system/premium_list_tile.dart';
import 'package:rupee_track/core/design_system/progress_ring.dart';
import 'package:rupee_track/core/design_system/skeleton_loader.dart';
import 'package:rupee_track/core/providers/salary_cycle_provider.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/features/health_score/data/financial_health_repository.dart';
import 'package:rupee_track/features/health_score/domain/financial_health_models.dart';

class FinancialHealthCard extends ConsumerWidget {
  const FinancialHealthCard({this.compact = false, super.key});

  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cycleKey = ref.watch(selectedCycleKeyProvider);
    final healthAsync = ref.watch(financialHealthProvider(cycleKey));

    return healthAsync.when(
      loading: () => const SkeletonCard(height: 120),
      error: (_, __) => const SizedBox.shrink(),
      data: (report) => compact
          ? _CompactHealthCard(report: report)
          : _FullHealthCard(report: report),
    );
  }
}

class _FullHealthCard extends StatelessWidget {
  const _FullHealthCard({required this.report});

  final FinancialHealthReport report;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final semantics = context.semanticColors;
    final color = _scoreColor(context, report.overallScore, semantics);
    final progress = (report.overallScore / 100).clamp(0.0, 1.0);

    return PremiumCard(
      variant: PremiumCardVariant.tinted,
      tintColor: color,
      accentColor: color,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ProgressRing(
            progress: progress,
            size: 72,
            strokeWidth: 7,
            color: color,
            child: Text(
              '${report.overallScore}',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Financial health',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  report.motivationLabel,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                    height: 1.4,
                  ),
                ),
                if (report.trendDelta != 0) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Row(
                    children: [
                      Icon(
                        report.trendDelta > 0
                            ? Icons.trending_up_rounded
                            : Icons.trending_down_rounded,
                        size: AppIconSize.sm,
                        color: report.trendDelta > 0
                            ? semantics.income
                            : semantics.expense,
                      ),
                      const SizedBox(width: AppSpacing.xxs),
                      Text(
                        '${report.trendDelta > 0 ? '+' : ''}${report.trendDelta} vs last cycle',
                        style: theme.textTheme.labelMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
                if (!report.hasEnoughData &&
                    report.recommendations.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    report.recommendations.first.message,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CompactHealthCard extends StatelessWidget {
  const _CompactHealthCard({required this.report});

  final FinancialHealthReport report;

  @override
  Widget build(BuildContext context) {
    final color = _scoreColor(
      context,
      report.overallScore,
      context.semanticColors,
    );
    return PremiumCard(
      onTap: () => context.go(AppRoutes.insights),
      child: PremiumRowTile(
        title: 'Financial health',
        subtitle: report.motivationLabel,
        leading: ProgressRing(
          progress: (report.overallScore / 100).clamp(0.0, 1.0),
          size: 44,
          strokeWidth: 5,
          color: color,
          child: Text(
            '${report.overallScore}',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                  fontSize: 11,
                ),
          ),
        ),
        trailing: const Icon(Icons.chevron_right_rounded),
      ),
    );
  }
}

Color _scoreColor(
  BuildContext context,
  int score,
  AppSemanticColors semantics,
) {
  if (score >= 80) return semantics.income;
  if (score >= 60) return semantics.warning;
  if (score >= 40) return semantics.expense;
  return Theme.of(context).colorScheme.primary;
}
