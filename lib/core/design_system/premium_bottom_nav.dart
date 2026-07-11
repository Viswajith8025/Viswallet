import 'package:flutter/material.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_surfaces.dart';
import 'package:rupee_track/core/design_system/responsive.dart';

class PremiumBottomNav extends StatelessWidget {
  const PremiumBottomNav({
    required this.selectedIndex,
    required this.onSelected,
    required this.destinations,
    super.key,
  });

  final int selectedIndex;
  final ValueChanged<int> onSelected;
  final List<PremiumNavDestination> destinations;

  static const _topRadius =
      BorderRadius.vertical(top: Radius.circular(AppRadius.xl));

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final brightness = theme.brightness;

    return PremiumSurfaces.glassNavBar(
      context: context,
      borderRadius: _topRadius,
      child: DecoratedBox(
        decoration: BoxDecoration(
          border: Border(
            top: AppElevation.hairlineBorder(brightness),
          ),
          boxShadow: AppElevation.shadow(
            brightness,
            AppElevationLevel.raised,
          ),
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.sm,
              AppSpacing.xs,
              AppSpacing.sm,
              AppSpacing.xs,
            ),
            child: Row(
              children: List.generate(destinations.length, (index) {
                final dest = destinations[index];
                final selected = index == selectedIndex;
                return Expanded(
                  child: _NavItem(
                    destination: dest,
                    selected: selected,
                    onTap: () => onSelected(index),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class PremiumNavDestination {
  const PremiumNavDestination({
    required this.icon,
    required this.selectedIcon,
    required this.label,
  });

  final IconData icon;
  final IconData selectedIcon;
  final String label;
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.destination,
    required this.selected,
    required this.onTap,
  });

  final PremiumNavDestination destination;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = selected
        ? theme.colorScheme.primary
        : theme.colorScheme.onSurfaceVariant;
    final compact = AppResponsive.useCompactNav(context);

    return Semantics(
      button: true,
      selected: selected,
      label: destination.label,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadius.md),
          splashColor: theme.colorScheme.primary.withValues(alpha: 0.08),
          child: AnimatedContainer(
            duration: AppMotion.durationFast,
            curve: AppMotion.curveStandard,
            padding: EdgeInsets.symmetric(
              horizontal: AppSpacing.xs,
              vertical: compact ? AppSpacing.sm : AppSpacing.xs,
            ),
            decoration: BoxDecoration(
              color: selected
                  ? theme.colorScheme.primary.withValues(alpha: 0.12)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: selected
                  ? Border.all(
                      color: theme.colorScheme.primary.withValues(alpha: 0.2),
                    )
                  : null,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                AnimatedSwitcher(
                  duration: AppMotion.durationFast,
                  transitionBuilder: (child, animation) => ScaleTransition(
                    scale: animation,
                    child: child,
                  ),
                  child: Icon(
                    selected ? destination.selectedIcon : destination.icon,
                    key: ValueKey(selected),
                    size: compact ? AppIconSize.lg : AppIconSize.md,
                    color: color,
                  ),
                ),
                if (!compact) ...[
                  const SizedBox(height: AppSpacing.xxs),
                  AnimatedDefaultTextStyle(
                    duration: AppMotion.durationFast,
                    style: theme.textTheme.labelSmall!.copyWith(
                      color: color,
                      fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                    ),
                    child: Text(
                      destination.label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
