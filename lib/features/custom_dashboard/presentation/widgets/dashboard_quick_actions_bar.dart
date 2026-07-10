import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:rupee_track/core/design_system/app_scroll_behavior.dart';
import 'package:rupee_track/core/design_system/context_banner.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/features/quick_add/presentation/quick_add_hub_sheet.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class DashboardQuickActionsBar extends ConsumerWidget {
  const DashboardQuickActionsBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const ScreenSectionHeader(
          title: 'Quick actions',
          padding: EdgeInsets.fromLTRB(
            AppSpacing.md,
            AppSpacing.xs,
            AppSpacing.md,
            AppSpacing.xxs,
          ),
        ),
        AppHorizontalScrollRow(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
          children: [
            _QuickAction(
              icon: Icons.add_rounded,
              label: 'Expense',
              color: theme.colorScheme.primary,
              onTap: () => showQuickAddSheet(context, ref),
            ),
            _QuickAction(
              icon: Icons.payments_outlined,
              label: 'Income',
              color: theme.colorScheme.tertiary,
              onTap: () => context.push(AppRoutes.salary),
            ),
            _QuickAction(
              icon: Icons.search_rounded,
              label: 'Search',
              color: theme.colorScheme.primary,
              onTap: () => context.push(AppRoutes.search),
            ),
            _QuickAction(
              icon: Icons.replay_circle_filled_outlined,
              label: 'Borrowed',
              color: const Color(0xFF7C4DFF),
              onTap: () => context.push(AppRoutes.borrowed),
            ),
            _QuickAction(
              icon: Icons.handshake_outlined,
              label: 'Lent',
              color: const Color(0xFFE65100),
              onTap: () => context.push(AppRoutes.loans),
            ),
          ],
        ),
      ],
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.only(right: AppSpacing.md),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () {
                HapticFeedback.lightImpact();
                onTap();
              },
              borderRadius: BorderRadius.circular(AppRadius.md),
              child: Ink(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      color.withValues(alpha: isDark ? 0.35 : 0.18),
                      color.withValues(alpha: isDark ? 0.15 : 0.08),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  border: Border.all(color: color.withValues(alpha: 0.25)),
                  boxShadow: [
                    BoxShadow(
                      color: color.withValues(alpha: 0.2),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Icon(icon, color: color, size: 26),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: theme.textTheme.labelSmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
