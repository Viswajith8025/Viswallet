import 'package:flutter/material.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/tokens/app_motion.dart';

Future<T?> showPremiumBottomSheet<T>({
  required BuildContext context,
  required Widget child,
  double initialSize = 0.92,
  double minSize = 0.45,
  double maxSize = 0.95,
  bool isDismissible = true,
}) {
  final theme = Theme.of(context);
  final screenHeight = MediaQuery.sizeOf(context).height;
  final shortScreen = screenHeight < 640;
  final resolvedInitial = shortScreen ? 0.96 : initialSize;
  final resolvedMin = shortScreen ? 0.55 : minSize;

  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    isDismissible: isDismissible,
    backgroundColor: Colors.transparent,
    sheetAnimationStyle: AppMotion.sheetAnimation(context),
    builder: (ctx) {
      return Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(ctx).bottom),
        child: DraggableScrollableSheet(
          initialChildSize: resolvedInitial,
          minChildSize: resolvedMin,
          maxChildSize: maxSize,
          expand: false,
          builder: (sheetContext, scrollController) {
            return Container(
              decoration: BoxDecoration(
                color: theme.scaffoldBackgroundColor,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(AppRadius.sheet),
                ),
                border: Border(
                  top: BorderSide(color: theme.dividerColor),
                  left: BorderSide(color: theme.dividerColor),
                  right: BorderSide(color: theme.dividerColor),
                ),
              ),
              child: Column(
                children: [
                  const SizedBox(height: AppSpacing.sm),
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.onSurfaceVariant
                          .withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(AppRadius.pill),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Expanded(
                    child: PrimaryScrollController(
                      controller: scrollController,
                      child: child,
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      );
    },
  );
}
