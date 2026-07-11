import 'package:flutter/material.dart';
import 'package:rupee_track/core/design_system/compact_label.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_card.dart';
import 'package:rupee_track/core/widgets/money_text.dart';
import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:rupee_track/features/budget/domain/allocation_mode.dart';
import 'package:rupee_track/features/budget/domain/bucket_status.dart';
import 'package:rupee_track/features/budget/presentation/widgets/budget_progress_bar.dart';

class BudgetBucketCard extends StatelessWidget {
  const BudgetBucketCard({
    required this.bucket,
    super.key,
    this.onTap,
  });

  final BucketStatus bucket;
  final VoidCallback? onTap;

  String get _alertLabel => switch (bucket.alertLevel) {
        BudgetAlertLevel.exceeded => 'Over budget',
        BudgetAlertLevel.critical90 => '90% used',
        BudgetAlertLevel.watch75 => '75% used',
        BudgetAlertLevel.watch50 => '50% used',
        BudgetAlertLevel.none => '',
      };

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final semantics = context.semanticColors;

    return PremiumCard(
      onTap: onTap,
      accentColor: _alertColor(context, bucket.alertLevel),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (bucket.colorValue != null) ...[
                CircleAvatar(
                  radius: 8,
                  backgroundColor:
                      Color(bucket.colorValue!).withValues(alpha: 0.18),
                  child: Icon(
                    Icons.circle,
                    size: 8,
                    color: Color(bucket.colorValue!),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
              ],
              Expanded(
                child: SingleLineLabel(
                  bucket.displayName,
                  style: theme.textTheme.titleMedium,
                ),
              ),
              if (bucket.alertLevel != BudgetAlertLevel.none)
                Flexible(
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm,
                      vertical: AppSpacing.xxs,
                    ),
                    decoration: BoxDecoration(
                      color: _alertColor(context, bucket.alertLevel)
                          .withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(AppRadius.xs),
                    ),
                    child: Text(
                      _alertLabel,
                      maxLines: 1,
                      softWrap: false,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: _alertColor(context, bucket.alertLevel),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          BudgetProgressBar(
            percentUsed: bucket.percentUsed,
            alertLevel: bucket.alertLevel,
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              _Metric(
                label: 'Planned',
                amountPaise: bucket.totalBudgetPaise,
              ),
              _Metric(
                label: 'Used',
                amountPaise: bucket.spentPaise,
                color: semantics.expense,
              ),
              _Metric(
                label: 'Left',
                amountPaise: bucket.remainingPaise,
                color: bucket.remainingPaise < 0
                    ? semantics.expense
                    : semantics.income,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Row(
            children: [
              Flexible(
                child: SingleLineLabel(
                  '${bucket.percentUsed.toStringAsFixed(0)}% used',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Flexible(
                child: SingleLineLabel(
                  '${formatPaise(bucket.dailyAllowancePaise)}/day · ${bucket.daysRemaining}d left',
                  textAlign: TextAlign.end,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            ],
          ),
          if (bucket.rolloverPaise > 0) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Includes ${formatPaise(bucket.rolloverPaise)} from last cycle',
              style: theme.textTheme.labelSmall?.copyWith(
                color: semantics.income,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Color _alertColor(BuildContext context, BudgetAlertLevel level) {
    final semantics = context.semanticColors;
    final scheme = Theme.of(context).colorScheme;
    return switch (level) {
      BudgetAlertLevel.exceeded => semantics.expense,
      BudgetAlertLevel.critical90 => semantics.warning,
      BudgetAlertLevel.watch75 => semantics.warning,
      BudgetAlertLevel.watch50 => scheme.primary,
      BudgetAlertLevel.none => scheme.primary,
    };
  }
}

class _Metric extends StatelessWidget {
  const _Metric({
    required this.label,
    required this.amountPaise,
    this.color,
  });

  final String label;
  final int amountPaise;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          FittingLabel(
            label,
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          MoneyText(
            amountPaise,
            compact: true,
            color: color,
            style: AppTypography.moneyCompact(context, color: color),
          ),
        ],
      ),
    );
  }
}
