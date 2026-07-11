/// Re-exports the canonical token layer. Prefer `tokens/` imports in new code.
export 'package:rupee_track/core/design_system/tokens/app_colors.dart';
export 'package:rupee_track/core/design_system/tokens/app_elevation.dart';
export 'package:rupee_track/core/design_system/tokens/app_icon_size.dart';
export 'package:rupee_track/core/design_system/tokens/app_motion.dart';
export 'package:rupee_track/core/design_system/tokens/app_radius.dart';
export 'package:rupee_track/core/design_system/tokens/app_spacing.dart';
export 'package:rupee_track/core/design_system/tokens/app_typography.dart';

import 'package:flutter/material.dart';
import 'package:rupee_track/core/design_system/tokens/app_elevation.dart';
import 'package:rupee_track/core/design_system/tokens/app_motion.dart';

/// @deprecated Use [AppMotion] from tokens.
abstract final class AppDurations {
  static const instant = AppMotion.durationInstant;
  static const fast = AppMotion.durationFast;
  static const normal = AppMotion.durationNormal;
  static const slow = AppMotion.durationSlow;
  static const emphasis = AppMotion.durationSlow;
}

/// @deprecated Use [AppMotion] from tokens.
abstract final class AppCurves {
  static const standard = AppMotion.curveStandard;
  static const enter = AppMotion.curveEnter;
  static const exit = AppMotion.curveExit;
  static const spring = AppMotion.curveStandard;
}

/// @deprecated Use [AppElevation] from tokens.
abstract final class AppShadows {
  static List<BoxShadow> card(bool isDark) =>
      AppElevation.shadow(
        isDark ? Brightness.dark : Brightness.light,
        AppElevationLevel.raised,
      );

  static List<BoxShadow> elevated(bool isDark) =>
      AppElevation.shadow(
        isDark ? Brightness.dark : Brightness.light,
        AppElevationLevel.floating,
      );

  static List<BoxShadow> navBar(bool isDark) =>
      AppElevation.shadow(
        isDark ? Brightness.dark : Brightness.light,
        AppElevationLevel.raised,
      );

  static List<BoxShadow> fab(bool isDark) =>
      AppElevation.shadow(
        isDark ? Brightness.dark : Brightness.light,
        AppElevationLevel.hero,
      );
}
