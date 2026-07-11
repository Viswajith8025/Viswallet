import 'package:flutter/material.dart';

/// Canonical colour tokens — brand accent from pre-rebuild Viswallet palette
/// (commit 356efde): purple luxury in dark, calm sky blue in light.
///
/// Semantic money colours stay Paul Tol–inspired and colorblind-safe.
abstract final class AppColors {
  // ── Brand accent — recovered from 356efde BrandColors ─────────────────
  // Light (sky blue calm)
  static const accentLight = Color(0xFF2E7BB5); // primaryLightDeep
  static const accentLightMuted = Color(0xFF4A9FD9); // primaryLight
  static const accentLightBright = Color(0xFF2563EB); // accentLight / tertiary
  static const accentHighlightLight = Color(0xFFDBEAFE); // highlightLight

  // Dark (purple luxury)
  static const accentDarkDeep = Color(0xFF5B3FA6); // primaryDark
  static const accentDark = Color(0xFF7C5CBF); // primaryDarkMuted — dark primary
  static const accentDarkSecondary = Color(0xFF4A2F8C); // secondaryDark
  static const accentDarkBright = Color(0xFF9B6DFF); // accentDark / tertiary
  static const accentHighlightDark = Color(0xFFC4B5FD); // highlightDark
  static const accentContainerDark = Color(0xFF3D2A6B); // primaryContainer dark
  static const accentContainerDarkAlt = Color(0xFF4C2D8A); // tertiaryContainer dark
  static const accentOnTertiaryDark = Color(0xFF2E1065);
  static const accentSecondaryContainerDark = Color(0xFF352560);

  // ── Surfaces — light ──────────────────────────────────────────────────────
  static const backgroundLight = Color(0xFFF8FAFC);
  static const surfaceLight = Color(0xFFFFFFFF);
  static const surfaceRaisedLight = Color(0xFFFFFFFF);
  static const onBackgroundLight = Color(0xFF0F172A);
  static const onSurfaceVariantLight = Color(0xFF64748B);
  static const outlineLight = Color(0xFFE2E8F0);
  static const hairlineLight = Color(0xFFE8EDF3);

  // ── Surfaces — dark ───────────────────────────────────────────────────────
  static const backgroundDark = Color(0xFF0F1114);
  static const surfaceDark = Color(0xFF171A1F);
  static const surfaceRaisedDark = Color(0xFF1E2228);
  static const onBackgroundDark = Color(0xFFF1F5F9);
  static const onSurfaceVariantDark = Color(0xFF94A3B8);
  static const outlineDark = Color(0xFF2D333B);
  static const hairlineDark = Color(0xFF252A32);

  // ── Semantic (Paul Tol–inspired, colorblind-safe) ─────────────────────────
  /// Positive money in — teal (distinct from brand accent).
  static const income = Color(0xFF009988);
  static const incomeContainerLight = Color(0xFFD1FAF0);
  static const incomeContainerDark = Color(0xFF134E48);

  /// Money out — vermillion (not pure red).
  static const expense = Color(0xFFD55E00);
  static const expenseContainerLight = Color(0xFFFFEDD5);
  static const expenseContainerDark = Color(0xFF431407);

  /// Caution — amber gold (distinct hue from expense orange).
  static const warning = Color(0xFFE69F00);
  static const warningContainerLight = Color(0xFFFEF3C7);
  static const warningContainerDark = Color(0xFF422006);

  /// Muted labels, dividers, inactive chrome.
  static const neutral = Color(0xFF64748B);
  static const neutralContainerLight = Color(0xFFF1F5F9);
  static const neutralContainerDark = Color(0xFF1E293B);

  static const error = Color(0xFFCC3311);
  static const onError = Color(0xFFFFFFFF);

  static ColorScheme colorScheme(Brightness brightness) =>
      brightness == Brightness.dark ? _darkScheme : _lightScheme;

  static Color semanticIncome(Brightness b) => income;

  static Color semanticExpense(Brightness b) => expense;

  static Color semanticWarning(Brightness b) => warning;

  static Color semanticNeutral(Brightness b) =>
      b == Brightness.dark ? onSurfaceVariantDark : onSurfaceVariantLight;

  static Color background(Brightness b) =>
      b == Brightness.dark ? backgroundDark : backgroundLight;

  static Color card(Brightness b) =>
      b == Brightness.dark ? surfaceRaisedDark : surfaceRaisedLight;

  static Color hairline(Brightness b) =>
      b == Brightness.dark ? hairlineDark : hairlineLight;

  static Color outline(Brightness b) =>
      b == Brightness.dark ? outlineDark : outlineLight;

  /// Hero card gradient stops — 356efde `heroGradient`.
  static List<Color> heroGradient(Brightness brightness) =>
      brightness == Brightness.dark
          ? const [
              accentContainerDark,
              Color(0xFF22202C),
              Color(0xFF1A1A22),
            ]
          : const [
              accentHighlightLight,
              Color(0xFFF0F9FF),
              Color(0xFFFFFFFF),
            ];

  /// Tinted card gradient — 356efde `cardGradient`.
  static List<Color> cardGradient(Brightness brightness) =>
      brightness == Brightness.dark
          ? const [Color(0xFF2A2438), Color(0xFF22202C)]
          : const [Color(0xFFFFFFFF), Color(0xFFF8FAFC)];

  static Color glowColor(Brightness brightness) => brightness == Brightness.dark
      ? accentDarkBright.withValues(alpha: 0.25)
      : accentLightMuted.withValues(alpha: 0.18);

  static const _lightScheme = ColorScheme(
    brightness: Brightness.light,
    primary: accentLight,
    onPrimary: Colors.white,
    primaryContainer: accentHighlightLight,
    onPrimaryContainer: Color(0xFF1E3A5F),
    secondary: Color(0xFF7EC8F2), // secondaryLight
    onSecondary: Color(0xFF0C4A6E),
    secondaryContainer: Color(0xFFE0F2FE),
    onSecondaryContainer: Color(0xFF0C4A6E),
    tertiary: accentLightBright,
    onTertiary: Colors.white,
    tertiaryContainer: Color(0xFFDBEAFE),
    onTertiaryContainer: Color(0xFF1E3A8A),
    error: error,
    onError: onError,
    errorContainer: expenseContainerLight,
    onErrorContainer: Color(0xFF431407),
    surface: surfaceLight,
    onSurface: onBackgroundLight,
    onSurfaceVariant: onSurfaceVariantLight,
    outline: outlineLight,
    outlineVariant: hairlineLight,
    shadow: Color(0x1A2563EB),
    scrim: Colors.black54,
    inverseSurface: surfaceDark,
    onInverseSurface: onBackgroundDark,
    inversePrimary: Color(0xFF7EC8F2),
    surfaceTint: accentLightMuted,
  );

  static const _darkScheme = ColorScheme(
    brightness: Brightness.dark,
    primary: accentDark,
    onPrimary: Colors.white,
    primaryContainer: accentContainerDark,
    onPrimaryContainer: accentHighlightDark,
    secondary: accentDarkSecondary,
    onSecondary: accentHighlightDark,
    secondaryContainer: accentSecondaryContainerDark,
    onSecondaryContainer: accentHighlightDark,
    tertiary: accentDarkBright,
    onTertiary: accentOnTertiaryDark,
    tertiaryContainer: accentContainerDarkAlt,
    onTertiaryContainer: accentHighlightDark,
    error: Color(0xFFF87171),
    onError: Color(0xFF7F1D1D),
    errorContainer: expenseContainerDark,
    onErrorContainer: Color(0xFFFED7AA),
    surface: surfaceDark,
    onSurface: onBackgroundDark,
    onSurfaceVariant: onSurfaceVariantDark,
    outline: outlineDark,
    outlineVariant: hairlineDark,
    shadow: Colors.black,
    scrim: Colors.black87,
    inverseSurface: surfaceLight,
    onInverseSurface: onBackgroundLight,
    inversePrimary: accentLight,
    surfaceTint: accentDark,
  );
}

/// Semantic money colours exposed on [ThemeData].
@immutable
class AppSemanticColors extends ThemeExtension<AppSemanticColors> {
  const AppSemanticColors({
    required this.income,
    required this.expense,
    required this.warning,
    required this.neutral,
    required this.incomeContainer,
    required this.expenseContainer,
    required this.warningContainer,
    required this.neutralContainer,
  });

  final Color income;
  final Color expense;
  final Color warning;
  final Color neutral;
  final Color incomeContainer;
  final Color expenseContainer;
  final Color warningContainer;
  final Color neutralContainer;

  static AppSemanticColors of(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    return AppSemanticColors(
      income: AppColors.income,
      expense: AppColors.expense,
      warning: AppColors.warning,
      neutral: AppColors.semanticNeutral(brightness),
      incomeContainer:
          isDark ? AppColors.incomeContainerDark : AppColors.incomeContainerLight,
      expenseContainer:
          isDark ? AppColors.expenseContainerDark : AppColors.expenseContainerLight,
      warningContainer:
          isDark ? AppColors.warningContainerDark : AppColors.warningContainerLight,
      neutralContainer:
          isDark ? AppColors.neutralContainerDark : AppColors.neutralContainerLight,
    );
  }

  @override
  AppSemanticColors copyWith({
    Color? income,
    Color? expense,
    Color? warning,
    Color? neutral,
    Color? incomeContainer,
    Color? expenseContainer,
    Color? warningContainer,
    Color? neutralContainer,
  }) {
    return AppSemanticColors(
      income: income ?? this.income,
      expense: expense ?? this.expense,
      warning: warning ?? this.warning,
      neutral: neutral ?? this.neutral,
      incomeContainer: incomeContainer ?? this.incomeContainer,
      expenseContainer: expenseContainer ?? this.expenseContainer,
      warningContainer: warningContainer ?? this.warningContainer,
      neutralContainer: neutralContainer ?? this.neutralContainer,
    );
  }

  @override
  AppSemanticColors lerp(AppSemanticColors? other, double t) {
    if (other == null) return this;
    return AppSemanticColors(
      income: Color.lerp(income, other.income, t)!,
      expense: Color.lerp(expense, other.expense, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      neutral: Color.lerp(neutral, other.neutral, t)!,
      incomeContainer: Color.lerp(incomeContainer, other.incomeContainer, t)!,
      expenseContainer: Color.lerp(expenseContainer, other.expenseContainer, t)!,
      warningContainer: Color.lerp(warningContainer, other.warningContainer, t)!,
      neutralContainer: Color.lerp(neutralContainer, other.neutralContainer, t)!,
    );
  }
}

extension AppColorsX on BuildContext {
  AppSemanticColors get semanticColors =>
      Theme.of(this).extension<AppSemanticColors>() ??
      AppSemanticColors.of(Theme.of(this).brightness);
}
