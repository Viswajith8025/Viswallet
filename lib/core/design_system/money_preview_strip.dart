import 'package:flutter/material.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/widgets/money_text.dart';

/// Live / draft money — visually distinct from saved ledger cards.
class MoneyPreviewStrip extends StatelessWidget {
  const MoneyPreviewStrip({
    required this.label,
    required this.amountPaise,
    super.key,
    this.subtitle,
    this.detailLines = const [],
    this.moneyColor,
    this.chipLabel = 'Preview',
  });

  final String label;
  final int amountPaise;
  final String? subtitle;
  final List<String> detailLines;
  final Color? moneyColor;
  final String chipLabel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final brightness = theme.brightness;
    final semantics = context.semanticColors;
    final amountColor = moneyColor ?? semantics.neutral;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: semantics.neutralContainer,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(
          color: AppColors.hairline(brightness),
          width: AppElevation.hairlineWidth,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.sm,
                  vertical: AppSpacing.xxs,
                ),
                decoration: BoxDecoration(
                  color: semantics.neutral.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppRadius.pill),
                  border: Border.all(
                    color: semantics.neutral.withValues(alpha: 0.25),
                  ),
                ),
                child: Text(
                  chipLabel,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: semantics.neutral,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.3,
                  ),
                ),
              ),
              const Spacer(),
              Text(
                label,
                style: theme.textTheme.labelMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          MoneyText(
            amountPaise,
            color: amountColor,
            style: AppTypography.moneyLarge(context, color: amountColor),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: AppSpacing.xxs),
            Text(
              subtitle!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
                height: 1.35,
              ),
            ),
          ],
          for (final line in detailLines) ...[
            const SizedBox(height: AppSpacing.xxs),
            Text(
              line,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
