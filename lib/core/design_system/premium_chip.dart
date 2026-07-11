import 'package:flutter/material.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';

class PremiumFilterChip extends StatelessWidget {
  const PremiumFilterChip({
    required this.label,
    required this.selected,
    required this.onSelected,
    super.key,
  });

  final String label;
  final bool selected;
  final ValueChanged<bool> onSelected;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;
    final neutralContainer = isDark
        ? AppColors.neutralContainerDark
        : AppColors.neutralContainerLight;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => onSelected(!selected),
        borderRadius: BorderRadius.circular(AppRadius.pill),
        child: AnimatedContainer(
          duration: AppDurations.fast,
          curve: AppCurves.standard,
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.xs,
          ),
          decoration: BoxDecoration(
            color: selected
                ? scheme.primary.withValues(alpha: isDark ? 0.2 : 0.12)
                : neutralContainer,
            borderRadius: BorderRadius.circular(AppRadius.pill),
            border: Border.all(
              color: selected
                  ? scheme.primary.withValues(alpha: 0.45)
                  : AppColors.hairline(theme.brightness),
            ),
          ),
          child: Text(
            label,
            style: theme.textTheme.labelLarge?.copyWith(
              color: selected ? scheme.primary : scheme.onSurface,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
              height: 1.25,
            ),
          ),
        ),
      ),
    );
  }
}
