import 'package:flutter/material.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/responsive.dart';

/// Bottom space reserved for the floating shell navigation bar and quick-add FAB.
abstract final class ShellBottomInset {
  static const fabSize = 56.0;
  static const fabMargin = AppSpacing.md;

  /// Floating [PremiumBottomNav] height (chrome only, safe area added separately).
  static double navBarHeight(BuildContext context) {
    final compact = AppResponsive.useCompactNav(context);
    const innerPadding = AppSpacing.xs * 2;
    final itemHeight = compact ? 44.0 : 60.0;
    return innerPadding + itemHeight;
  }

  /// Height to keep scrollable content clear of [PremiumBottomNav].
  static double of(BuildContext context, {bool hasBottomNav = true}) {
    final safeBottom = MediaQuery.viewPaddingOf(context).bottom;
    if (!hasBottomNav) {
      return safeBottom + AppSpacing.md;
    }
    return safeBottom + navBarHeight(context);
  }

  /// Bottom padding for lists — clears the nav bar only (FAB is draggable overlay).
  static double scrollBottom(BuildContext context) =>
      of(context) + AppSpacing.xs;

  /// Pinned composer flush above floating nav (Jithu chat input).
  static double composerBottom(BuildContext context) {
    return of(context) + AppSpacing.md;
  }

  /// Symmetric horizontal + bottom padding for shell tab scroll views.
  static EdgeInsets scrollPadding(
    BuildContext context, {
    double top = 0,
  }) {
    final horizontal =
        AppResponsive.horizontalPadding(MediaQuery.sizeOf(context).width);
    return EdgeInsets.fromLTRB(
      horizontal,
      top,
      horizontal,
      scrollBottom(context),
    );
  }

  /// Use inside [ResponsiveBody] when horizontal padding is already applied.
  static EdgeInsets bottomOnly(BuildContext context) {
    return EdgeInsets.only(bottom: scrollBottom(context));
  }

  /// Bottom offset for the anchored quick-add FAB above the nav bar.
  static double fabBottom(BuildContext context, {bool hasBottomNav = true}) {
    return of(context, hasBottomNav: hasBottomNav) + fabMargin;
  }
}
