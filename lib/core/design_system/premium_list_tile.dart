import 'package:flutter/material.dart';
import 'package:rupee_track/core/utils/category_icon_utils.dart';
import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:rupee_track/core/design_system/compact_label.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/tokens/app_colors.dart';
import 'package:rupee_track/core/design_system/tokens/app_elevation.dart';
import 'package:rupee_track/core/design_system/tokens/app_icon_size.dart';
import 'package:rupee_track/core/design_system/tokens/app_motion.dart';
import 'package:rupee_track/core/design_system/tokens/app_typography.dart';
import 'package:rupee_track/core/design_system/premium_card.dart';
import 'package:rupee_track/core/widgets/pressable_scale.dart';

class PremiumSectionHeader extends StatelessWidget {
  const PremiumSectionHeader({
    required this.title,
    super.key,
    this.subtitle,
    this.trailing,
  });

  final String title;
  final String? subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (subtitle != null)
                  Text(
                    subtitle!,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
              ],
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

/// Navigation menu row — More screen, settings links.
class PremiumMenuTile extends StatelessWidget {
  const PremiumMenuTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    super.key,
    this.iconColor,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final Color? iconColor;

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final scheme = Theme.of(context).colorScheme;
    final accent = iconColor ?? scheme.primary;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.half),
      child: PressableScale(
        onTap: onTap,
        scale: AppMotion.pressScale,
        semanticLabel: '$title. $subtitle',
        child: DecoratedBox(
          decoration: AppElevation.surface(
            brightness: brightness,
            background: AppColors.card(brightness),
            level: AppElevationLevel.raised,
            borderRadius: BorderRadius.circular(AppRadius.iconBox),
          ),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.menuTilePadding),
            child: Row(
              children: [
                DecoratedBox(
                  decoration: BoxDecoration(
                    color: accent.withValues(
                      alpha: brightness == Brightness.dark ? 0.16 : 0.1,
                    ),
                    borderRadius: BorderRadius.circular(AppRadius.iconBox),
                    border: Border.all(
                      color: accent.withValues(alpha: 0.2),
                      width: AppElevation.hairlineWidth,
                    ),
                  ),
                  child: SizedBox(
                    width: AppSpacing.iconBox,
                    height: AppSpacing.iconBox,
                    child: Icon(
                      icon,
                      color: accent,
                      size: AppIconSize.menuLeading,
                    ),
                  ),
                ),
                SizedBox(width: AppSpacing.menuTilePadding),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SingleLineLabel(
                        title,
                        style: AppTypography.menuTitle(brightness),
                      ),
                      SizedBox(height: AppSpacing.half),
                      Text(
                        subtitle,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.menuSubtitle(brightness),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.chevron_right_rounded,
                  color: scheme.onSurfaceVariant,
                  size: AppIconSize.chevron,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Compact data row with dot/icon leading.
class PremiumRowTile extends StatelessWidget {
  const PremiumRowTile({
    required this.title,
    super.key,
    this.subtitle,
    this.trailing,
    this.leading,
    this.leadingColor,
    this.onTap,
  });

  final String title;
  final String? subtitle;
  final Widget? trailing;
  final Widget? leading;
  final Color? leadingColor;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return PressableScale(
      onTap: onTap,
      semanticLabel: onTap != null ? title : null,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
        child: Row(
          children: [
            if (leading != null) ...[
              leading!,
              const SizedBox(width: AppSpacing.sm),
            ],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (subtitle != null)
                    Text(
                      subtitle!,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                ],
              ),
            ),
            if (trailing != null) trailing!,
          ],
        ),
      ),
    );
  }
}

/// Expense / transaction list item.
class PremiumExpenseTile extends StatelessWidget {
  const PremiumExpenseTile({
    required this.title,
    required this.amountPaise,
    required this.categoryName,
    required this.categoryColor,
    required this.categoryIconName,
    required this.subtitle,
    super.key,
    this.tags = const [],
    this.onTap,
  });

  final String title;
  final int amountPaise;
  final String categoryName;
  final int categoryColor;
  final String categoryIconName;
  final String subtitle;
  final List<String> tags;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = Color(categoryColor);

    return PremiumCard(
      variant: PremiumCardVariant.elevated,
      onTap: onTap,
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  color.withValues(alpha: 0.22),
                  color.withValues(alpha: 0.08),
                ],
              ),
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: Icon(
              categoryIconFromName(categoryIconName),
              color: color,
              size: 22,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                if (tags.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 4,
                    runSpacing: 4,
                    children: tags.take(3).map((t) {
                      return Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surfaceContainerHighest
                              .withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(AppRadius.xs),
                        ),
                        child: Text(
                          t,
                          style: theme.textTheme.labelSmall,
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Text(
            formatPaise(amountPaise),
            style: AppTypography.moneyCompact(
              context,
              color: context.semanticColors.expense,
            ),
          ),
        ],
      ),
    );
  }
}
