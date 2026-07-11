import 'package:flutter/material.dart';
import 'package:rupee_track/core/design_system/tokens/app_colors.dart';

/// Viswallet palette — delegates to [AppColors] token layer.
abstract final class BrandColors {
  static ColorScheme get lightScheme => AppColors.colorScheme(Brightness.light);
  static ColorScheme get darkScheme => AppColors.colorScheme(Brightness.dark);

  static const primary = AppColors.accentLight;
  static const primaryLight = AppColors.accentLightMuted;
  static const primaryLightDeep = AppColors.accentLight;
  static const primaryDark = AppColors.accentDarkDeep;
  static const primaryDarkMuted = AppColors.accentDark;
  static const secondaryLight = Color(0xFF7EC8F2);
  static const secondaryDark = AppColors.accentDarkSecondary;
  static const accentLight = AppColors.accentLightBright;
  static const accentDark = AppColors.accentDarkBright;
  static const accentContainerDark = AppColors.accentContainerDark;
  static const highlightLight = AppColors.accentHighlightLight;
  static const highlightDark = AppColors.accentHighlightDark;

  static const backgroundLight = AppColors.backgroundLight;
  static const backgroundDark = AppColors.backgroundDark;
  static const surfaceLight = AppColors.surfaceLight;
  static const surfaceDark = AppColors.surfaceDark;
  static const cardLight = AppColors.surfaceRaisedLight;
  static const cardDark = AppColors.surfaceRaisedDark;
  static const cardTintDark = Color(0xFF2A2438);
  static const cardBorderLight = AppColors.outlineLight;
  static const cardBorderDark = AppColors.outlineDark;
  static const onBackgroundLight = AppColors.onBackgroundLight;
  static const onBackgroundDark = AppColors.onBackgroundDark;
  static const onSurfaceVariantLight = AppColors.onSurfaceVariantLight;
  static const onSurfaceVariantDark = AppColors.onSurfaceVariantDark;
  static const dividerLight = AppColors.hairlineLight;
  static const dividerDark = AppColors.hairlineDark;

  static const success = AppColors.income;
  static const successContainer = AppColors.incomeContainerLight;
  static const warning = AppColors.warning;
  static const warningContainer = AppColors.warningContainerLight;
  static const error = AppColors.error;
  static const errorContainer = AppColors.expenseContainerLight;

  static const secondary = success;
  static const accent = accentLight;

  static List<Color> heroGradient(Brightness brightness) =>
      AppColors.heroGradient(brightness);

  static List<Color> cardGradient(Brightness brightness) =>
      AppColors.cardGradient(brightness);

  static Color glowColor(Brightness brightness) => AppColors.glowColor(brightness);
}
