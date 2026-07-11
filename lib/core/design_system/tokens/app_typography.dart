import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:rupee_track/core/design_system/tokens/app_colors.dart';

/// Type scale + tabular money styles.
abstract final class AppTypography {
  static const _tabular = [FontFeature.tabularFigures()];

  static TextTheme textTheme(Brightness brightness) {
    final onSurface =
        brightness == Brightness.dark
            ? AppColors.onBackgroundDark
            : AppColors.onBackgroundLight;

    final display = GoogleFonts.plusJakartaSansTextTheme(
      ThemeData(brightness: brightness).textTheme,
    );
    final body = GoogleFonts.interTextTheme(display);

    return body.copyWith(
      displayLarge: _display(40, FontWeight.w800, -1.2, onSurface),
      displayMedium: _display(32, FontWeight.w700, -0.8, onSurface),
      headlineLarge: _display(28, FontWeight.w700, -0.5, onSurface),
      headlineMedium: _display(24, FontWeight.w600, -0.3, onSurface),
      headlineSmall: _display(20, FontWeight.w600, -0.2, onSurface),
      titleLarge: _display(18, FontWeight.w600, -0.1, onSurface),
      titleMedium: _body(16, FontWeight.w600, 0, onSurface),
      titleSmall: _body(14, FontWeight.w600, 0, onSurface),
      bodyLarge: _body(16, FontWeight.w400, 0, onSurface),
      bodyMedium: _body(14, FontWeight.w400, 0, onSurface),
      bodySmall: _body(12, FontWeight.w400, 0, onSurface),
      labelLarge: _body(14, FontWeight.w500, 0.1, onSurface),
      labelMedium: _body(12, FontWeight.w500, 0.2, onSurface),
      labelSmall: _body(11, FontWeight.w500, 0.3, onSurface),
    );
  }

  static TextStyle button(Brightness brightness) => _body(
        15,
        FontWeight.w600,
        0.2,
        brightness == Brightness.dark
            ? AppColors.onBackgroundDark
            : AppColors.onBackgroundLight,
      );

  static TextStyle appBarTitle(Brightness brightness) => _display(
        18,
        FontWeight.w700,
        -0.1,
        brightness == Brightness.dark
            ? AppColors.onBackgroundDark
            : AppColors.onBackgroundLight,
      );

  static TextStyle appBarSubtitle(Brightness brightness) => _body(
        12,
        FontWeight.w500,
        0.2,
        AppColors.semanticNeutral(brightness),
      );

  static TextStyle menuTitle(Brightness brightness) => _body(
        14,
        FontWeight.w600,
        0,
        brightness == Brightness.dark
            ? AppColors.onBackgroundDark
            : AppColors.onBackgroundLight,
      );

  static TextStyle menuSubtitle(Brightness brightness) => _body(
        12,
        FontWeight.w400,
        0,
        AppColors.semanticNeutral(brightness),
      );

  /// All monetary values — always tabular figures.
  static TextStyle money(
    BuildContext context, {
    double fontSize = 28,
    FontWeight fontWeight = FontWeight.w700,
    Color? color,
  }) {
    final theme = Theme.of(context);
    return GoogleFonts.inter(
      fontSize: fontSize,
      fontWeight: fontWeight,
      letterSpacing: -0.3,
      height: 1.1,
      color: color ?? theme.colorScheme.onSurface,
      fontFeatures: _tabular,
    );
  }

  static TextStyle moneyLarge(BuildContext context, {Color? color}) =>
      money(context, fontSize: 36, fontWeight: FontWeight.w800, color: color);

  static TextStyle moneyHero(BuildContext context, {Color? color}) =>
      money(context, fontSize: 44, fontWeight: FontWeight.w800, color: color);

  static TextStyle moneyCompact(BuildContext context, {Color? color}) =>
      money(context, fontSize: 16, fontWeight: FontWeight.w700, color: color);

  static TextStyle _display(
    double size,
    FontWeight weight,
    double letterSpacing,
    Color color,
  ) =>
      GoogleFonts.plusJakartaSans(
        fontSize: size,
        fontWeight: weight,
        letterSpacing: letterSpacing,
        height: 1.2,
        color: color,
      );

  static TextStyle _body(
    double size,
    FontWeight weight,
    double letterSpacing,
    Color color,
  ) =>
      GoogleFonts.inter(
        fontSize: size,
        fontWeight: weight,
        letterSpacing: letterSpacing,
        height: 1.45,
        color: color,
      );
}
