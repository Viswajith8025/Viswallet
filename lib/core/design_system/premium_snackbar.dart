import 'package:flutter/material.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';

enum PremiumSnackBarKind { info, success, error }

/// Brief save confirmation — calm success feedback after persisting money data.
void showSaveConfirmation(
  BuildContext context, {
  required String message,
}) {
  showPremiumSnackBar(
    context,
    message: message,
    kind: PremiumSnackBarKind.success,
    duration: const Duration(seconds: 2),
  );
}

/// Floating snackbar aligned with the Viswallet design system.
void showPremiumSnackBar(
  BuildContext context, {
  required String message,
  String? actionLabel,
  VoidCallback? onAction,
  PremiumSnackBarKind kind = PremiumSnackBarKind.info,
  Duration duration = const Duration(seconds: 3),
}) {
  final theme = Theme.of(context);
  final isDark = theme.brightness == Brightness.dark;

  final (IconData icon, Color accent) = switch (kind) {
    PremiumSnackBarKind.success => (
        Icons.check_circle_rounded,
        theme.colorScheme.tertiary,
      ),
    PremiumSnackBarKind.error => (
        Icons.error_outline_rounded,
        theme.colorScheme.error,
      ),
    PremiumSnackBarKind.info => (
        Icons.info_outline_rounded,
        theme.colorScheme.primary,
      ),
  };

  ScaffoldMessenger.of(context).hideCurrentSnackBar();
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      behavior: SnackBarBehavior.floating,
      duration: duration,
      elevation: 0,
      margin: const EdgeInsets.fromLTRB(
        AppSpacing.md,
        0,
        AppSpacing.md,
        AppSpacing.lg,
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      backgroundColor: isDark
          ? theme.colorScheme.surfaceContainerHighest
          : theme.colorScheme.inverseSurface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        side: BorderSide(
          color: accent.withValues(alpha: 0.25),
        ),
      ),
      content: Row(
        children: [
          Icon(icon, color: accent, size: 22),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: isDark
                    ? theme.colorScheme.onSurface
                    : theme.colorScheme.onInverseSurface,
                fontWeight: FontWeight.w500,
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
      action: actionLabel != null && onAction != null
          ? SnackBarAction(
              label: actionLabel,
              onPressed: onAction,
              textColor: accent,
            )
          : null,
      showCloseIcon: actionLabel != null,
      closeIconColor: accent,
    ),
  );
}
