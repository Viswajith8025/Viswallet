import 'package:flutter/material.dart';

/// 8-point spacing system and premium design tokens for Viswallet.
abstract final class AppSpacing {
  static const xxs = 4.0;
  static const xs = 8.0;
  static const sm = 12.0;
  static const md = 16.0;
  static const lg = 20.0;
  static const xl = 24.0;
  static const xxl = 32.0;
  static const xxxl = 40.0;
  static const huge = 48.0;

  static const screenHorizontal = lg;
  static const cardPadding = lg;
  static const sectionGap = xl;
}

abstract final class AppRadius {
  static const xs = 8.0;
  static const sm = 12.0;
  static const md = 16.0;
  static const lg = 20.0;
  static const xl = 24.0;
  static const pill = 999.0;

  static const card = lg;
  static const button = md;
  static const sheet = xl;
  static const fab = 20.0;
}

abstract final class AppDurations {
  static const instant = Duration(milliseconds: 100);
  static const fast = Duration(milliseconds: 200);
  static const normal = Duration(milliseconds: 300);
  static const slow = Duration(milliseconds: 450);
  static const emphasis = Duration(milliseconds: 600);
}

abstract final class AppCurves {
  static const standard = Curves.easeOutCubic;
  static const enter = Curves.easeOutQuart;
  static const exit = Curves.easeInCubic;
  static const spring = Curves.easeOutBack;
}

abstract final class AppShadows {
  static List<BoxShadow> card(bool isDark) => [
        BoxShadow(
          color: isDark
              ? const Color(0xFF5B3FA6).withValues(alpha: 0.12)
              : const Color(0xFF2563EB).withValues(alpha: 0.06),
          blurRadius: isDark ? 20 : 28,
          offset: const Offset(0, 10),
        ),
        BoxShadow(
          color: isDark
              ? Colors.black.withValues(alpha: 0.35)
              : const Color(0xFF0F172A).withValues(alpha: 0.04),
          blurRadius: isDark ? 12 : 16,
          offset: const Offset(0, 4),
        ),
      ];

  static List<BoxShadow> elevated(bool isDark) => [
        ...card(isDark),
        BoxShadow(
          color: isDark
              ? const Color(0xFF9B6DFF).withValues(alpha: 0.08)
              : const Color(0xFF4A9FD9).withValues(alpha: 0.1),
          blurRadius: 40,
          spreadRadius: -4,
          offset: const Offset(0, 16),
        ),
      ];

  static List<BoxShadow> navBar(bool isDark) => [
        BoxShadow(
          color: isDark
              ? Colors.black.withValues(alpha: 0.18)
              : const Color(0xFF2563EB).withValues(alpha: 0.05),
          blurRadius: 16,
          offset: const Offset(0, -2),
        ),
      ];

  static List<BoxShadow> fab(bool isDark) => [
        BoxShadow(
          color: isDark
              ? const Color(0xFF9B6DFF).withValues(alpha: 0.4)
              : const Color(0xFF2563EB).withValues(alpha: 0.28),
          blurRadius: 24,
          offset: const Offset(0, 10),
        ),
      ];
}
