import 'package:flutter/material.dart';

/// Mechanical motion — linear / ease-out only, capped at 300 ms.
abstract final class AppMotion {
  static const durationInstant = Duration(milliseconds: 80);
  static const durationFast = Duration(milliseconds: 120);
  static const durationNormal = Duration(milliseconds: 200);
  static const durationSlow = Duration(milliseconds: 300);
  static const durationMoneyCount = Duration(milliseconds: 280);

  static const curveStandard = Curves.easeOut;
  static const curveEnter = Curves.easeOut;
  static const curveExit = Curves.easeIn;
  static const curveLinear = Curves.linear;

  static const pressScale = 0.98;

  static Duration clamp(Duration d) =>
      d > durationSlow ? durationSlow : d;

  /// Honors platform reduced-motion / disable-animations settings.
  static bool reducedMotion(BuildContext context) =>
      MediaQuery.disableAnimationsOf(context);

  static Duration resolve(BuildContext context, Duration duration) =>
      reducedMotion(context) ? Duration.zero : clamp(duration);

  static AnimationStyle sheetAnimation(BuildContext context) {
    if (reducedMotion(context)) {
      return const AnimationStyle(
        duration: Duration.zero,
        reverseDuration: Duration.zero,
      );
    }
    return const AnimationStyle(
      duration: durationNormal,
      reverseDuration: durationFast,
      curve: curveEnter,
      reverseCurve: curveExit,
    );
  }
}
