import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/greeting_utils.dart';
import 'package:rupee_track/features/custom_dashboard/data/dashboard_layout_repository.dart';
import 'package:rupee_track/features/custom_dashboard/presentation/sheets/dashboard_widget_edit_sheet.dart';

/// Secondary customise entry — visible on the home canvas, not buried in the app bar.
class DashboardCustomizeBar extends ConsumerWidget {
  const DashboardCustomizeBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final editMode = ref.watch(dashboardEditModeProvider);
    if (editMode) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.screenHorizontal,
        AppSpacing.xs,
        AppSpacing.screenHorizontal,
        AppSpacing.sm,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  GreetingUtils.timeOfDayGreeting(),
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  'Your home',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          OutlinedButton.icon(
            onPressed: () {
              ref.read(dashboardEditModeProvider.notifier).state = true;
            },
            icon: const Icon(Icons.dashboard_customize_outlined, size: AppIconSize.md),
            label: const Text('Customise'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.sm,
              ),
              visualDensity: VisualDensity.compact,
            ),
          ),
          const SizedBox(width: AppSpacing.xs),
          IconButton(
            tooltip: 'Dashboard settings',
            onPressed: () => showDashboardCustomizeSheet(context, ref),
            icon: const Icon(Icons.tune_rounded, size: AppIconSize.md),
            style: IconButton.styleFrom(
              visualDensity: VisualDensity.compact,
            ),
          ),
        ],
      ),
    );
  }
}
