import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:rupee_track/core/design_system/tokens/app_colors.dart';
import 'package:rupee_track/core/design_system/tokens/app_elevation.dart';
import 'package:rupee_track/core/design_system/tokens/app_radius.dart';

/// Surface decoration helpers built on elevation tokens.
abstract final class PremiumSurfaces {
  static BoxDecoration heroDecoration(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final scheme = Theme.of(context).colorScheme;
    return AppElevation.surface(
      brightness: brightness,
      background: Color.alphaBlend(
        scheme.primary.withValues(alpha: brightness == Brightness.dark ? 0.1 : 0.06),
        AppColors.card(brightness),
      ),
      level: AppElevationLevel.hero,
      borderRadius: BorderRadius.circular(AppRadius.card),
    );
  }

  static BoxDecoration tintedCard(BuildContext context, {Color? tint}) {
    final theme = Theme.of(context);
    final brightness = theme.brightness;
    final base = tint ?? theme.colorScheme.primary;
    return AppElevation.surface(
      brightness: brightness,
      background: Color.alphaBlend(
        base.withValues(alpha: brightness == Brightness.dark ? 0.12 : 0.08),
        AppColors.card(brightness),
      ),
      level: AppElevationLevel.raised,
      borderRadius: BorderRadius.circular(AppRadius.card),
    );
  }

  static BoxDecoration standardCard(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    return AppElevation.surface(
      brightness: brightness,
      background: AppColors.card(brightness),
      level: AppElevationLevel.raised,
      borderRadius: BorderRadius.circular(AppRadius.card),
    );
  }

  static BoxDecoration elevatedCard(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    return AppElevation.surface(
      brightness: brightness,
      background: AppColors.card(brightness),
      level: AppElevationLevel.floating,
      borderRadius: BorderRadius.circular(AppRadius.card),
    );
  }

  static BoxDecoration appBarUnderline(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    return BoxDecoration(
      border: Border(
        bottom: AppElevation.hairlineBorder(brightness),
      ),
    );
  }

  /// Frosted glass shell for floating bottom navigation.
  static Widget glassNavBar({
    required BuildContext context,
    required BorderRadius borderRadius,
    required Widget child,
    double blurSigma = 24,
  }) {
    final brightness = Theme.of(context).brightness;
    final isDark = brightness == Brightness.dark;

    return ClipRRect(
      borderRadius: borderRadius,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blurSigma, sigmaY: blurSigma),
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: borderRadius,
            color: AppColors.card(brightness).withValues(alpha: isDark ? 0.72 : 0.88),
            border: Border.all(color: AppColors.hairline(brightness)),
            boxShadow: AppElevation.shadow(brightness, AppElevationLevel.floating),
          ),
          child: child,
        ),
      ),
    );
  }
}
