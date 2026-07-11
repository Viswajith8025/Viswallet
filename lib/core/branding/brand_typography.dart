import 'package:flutter/material.dart';
import 'package:rupee_track/core/design_system/tokens/app_typography.dart';

/// Typography facade — delegates to [AppTypography] token layer.
abstract final class BrandTypography {
  static TextTheme textTheme(Brightness brightness) =>
      AppTypography.textTheme(brightness);

  static TextStyle button(Brightness brightness) =>
      AppTypography.button(brightness);

  static TextStyle money(
    BuildContext context, {
    double? fontSize,
    FontWeight fontWeight = FontWeight.w700,
    Color? color,
  }) =>
      AppTypography.money(
        context,
        fontSize: fontSize ?? 28,
        fontWeight: fontWeight,
        color: color,
      );

  static TextStyle moneyLarge(BuildContext context, {Color? color}) =>
      AppTypography.moneyLarge(context, color: color);

  static TextStyle moneyHero(BuildContext context, {Color? color}) =>
      AppTypography.moneyHero(context, color: color);
}
