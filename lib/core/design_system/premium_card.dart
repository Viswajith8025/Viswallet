import 'package:flutter/material.dart';
import 'package:rupee_track/core/design_system/tokens/app_motion.dart';
import 'package:rupee_track/core/design_system/tokens/app_spacing.dart';
import 'package:rupee_track/core/design_system/premium_surfaces.dart';
import 'package:rupee_track/core/widgets/pressable_scale.dart';

/// Elevated surface card — hairline border + soft shadow from elevation tokens.
class PremiumCard extends StatelessWidget {
  const PremiumCard({
    required this.child,
    super.key,
    this.onTap,
    this.padding,
    this.accentColor,
    this.showShadow = true,
    this.margin,
    this.variant = PremiumCardVariant.standard,
    this.tintColor,
  });

  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? padding;
  final Color? accentColor;
  final bool showShadow;
  final EdgeInsetsGeometry? margin;
  final PremiumCardVariant variant;
  final Color? tintColor;

  @override
  Widget build(BuildContext context) {
    final BoxDecoration decoration = switch (variant) {
      PremiumCardVariant.hero => PremiumSurfaces.heroDecoration(context),
      PremiumCardVariant.tinted =>
        PremiumSurfaces.tintedCard(context, tint: tintColor),
      PremiumCardVariant.elevated => PremiumSurfaces.elevatedCard(context),
      PremiumCardVariant.standard => PremiumSurfaces.standardCard(context),
    };

    final resolvedDecoration = showShadow
        ? decoration
        : decoration.copyWith(boxShadow: const []);

    final card = Container(
      margin: margin,
      decoration: resolvedDecoration,
      clipBehavior: Clip.antiAlias,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (accentColor != null)
            Container(
              height: AppSpacing.half,
              color: accentColor,
            ),
          Padding(
            padding: padding ?? const EdgeInsets.all(AppSpacing.cardPadding),
            child: child,
          ),
        ],
      ),
    );

    if (onTap == null) {
      return Semantics(button: false, child: card);
    }

    return Semantics(
      button: true,
      child: PressableScale(
        onTap: onTap,
        scale: AppMotion.pressScale,
        child: card,
      ),
    );
  }
}

enum PremiumCardVariant { standard, elevated, hero, tinted }
