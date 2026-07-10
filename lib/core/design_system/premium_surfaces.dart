import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:rupee_track/core/branding/brand_colors.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';

/// Gradient and glass surface helpers for premium fintech UI.
abstract final class PremiumSurfaces {
  static BoxDecoration heroDecoration(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final isDark = brightness == Brightness.dark;
    return BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: BrandColors.heroGradient(brightness),
      ),
      borderRadius: BorderRadius.circular(AppRadius.card),
      border: Border.all(
        color: isDark
            ? BrandColors.cardBorderDark.withValues(alpha: 0.6)
            : BrandColors.cardBorderLight,
      ),
      boxShadow: [
        BoxShadow(
          color: BrandColors.glowColor(brightness),
          blurRadius: isDark ? 28 : 32,
          offset: const Offset(0, 12),
        ),
        ...AppShadows.card(isDark),
      ],
    );
  }

  static BoxDecoration tintedCard(BuildContext context, {Color? tint}) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final base = tint ?? theme.colorScheme.primary;
    return BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          Color.alphaBlend(base.withValues(alpha: isDark ? 0.14 : 0.08), theme.cardColor),
          theme.cardColor,
        ],
      ),
      borderRadius: BorderRadius.circular(AppRadius.card),
      border: Border.all(color: theme.dividerColor),
      boxShadow: AppShadows.card(isDark),
    );
  }

  static Widget glassOverlay({
    required Widget child,
    double sigma = 12,
    double opacity = 0.72,
  }) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(AppRadius.card),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: sigma, sigmaY: sigma),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: opacity * 0.08),
          ),
          child: child,
        ),
      ),
    );
  }

  /// Frosted glass shell for floating bottom navigation.
  static Widget glassNavBar({
    required BuildContext context,
    required BorderRadius borderRadius,
    required Widget child,
    double blurSigma = 36,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ClipRRect(
      borderRadius: borderRadius,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blurSigma, sigmaY: blurSigma),
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: borderRadius,
            color: isDark
                ? const Color(0xFF14141A).withValues(alpha: 0.32)
                : Colors.white.withValues(alpha: 0.58),
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: isDark
                  ? [
                      Colors.white.withValues(alpha: 0.1),
                      Colors.white.withValues(alpha: 0.03),
                    ]
                  : [
                      Colors.white.withValues(alpha: 0.72),
                      Colors.white.withValues(alpha: 0.42),
                    ],
            ),
          ),
          child: child,
        ),
      ),
    );
  }
}
