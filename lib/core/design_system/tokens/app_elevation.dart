import 'package:flutter/material.dart';
import 'package:rupee_track/core/design_system/tokens/app_colors.dart';
import 'package:rupee_track/core/design_system/tokens/app_radius.dart';

/// Layered surfaces: hairline border + soft shadow (no heavy Material elevation).
enum AppElevationLevel { flat, raised, floating, hero }

abstract final class AppElevation {
  static const hairlineWidth = 1.0;

  static Color hairlineColor(Brightness brightness) =>
      AppColors.hairline(brightness);

  static BorderSide hairlineBorder(Brightness brightness) => BorderSide(
        color: hairlineColor(brightness),
        width: hairlineWidth,
      );

  static List<BoxShadow> shadow(
    Brightness brightness,
    AppElevationLevel level,
  ) {
    final isDark = brightness == Brightness.dark;
    final umbra = isDark
        ? Colors.black.withValues(alpha: 0.32)
        : const Color(0xFF0F172A).withValues(alpha: 0.06);
    final penumbra = isDark
        ? Colors.black.withValues(alpha: 0.18)
        : const Color(0xFF0F172A).withValues(alpha: 0.03);

    return switch (level) {
      AppElevationLevel.flat => const [],
      AppElevationLevel.raised => [
          BoxShadow(
            color: penumbra,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      AppElevationLevel.floating => [
          BoxShadow(
            color: umbra,
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
          BoxShadow(
            color: penumbra,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      AppElevationLevel.hero => [
          BoxShadow(
            color: isDark
                ? AppColors.accentDark.withValues(alpha: 0.12)
                : AppColors.accentLight.withValues(alpha: 0.1),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
          ...shadow(brightness, AppElevationLevel.floating),
        ],
    };
  }

  static BoxDecoration surface({
    required Brightness brightness,
    required Color background,
    AppElevationLevel level = AppElevationLevel.raised,
    BorderRadius? borderRadius,
    Color? borderColor,
  }) {
    return BoxDecoration(
      color: background,
      borderRadius: borderRadius ?? BorderRadius.circular(AppRadius.card),
      border: Border.all(
        color: borderColor ?? hairlineColor(brightness),
        width: hairlineWidth,
      ),
      boxShadow: shadow(brightness, level),
    );
  }
}
