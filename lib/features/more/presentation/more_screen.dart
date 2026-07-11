import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:rupee_track/core/design_system/context_banner.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_app_bar.dart';
import 'package:rupee_track/core/design_system/premium_card.dart';
import 'package:rupee_track/core/design_system/premium_list_tile.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/core/design_system/shell_bottom_inset.dart';
import 'package:rupee_track/core/router/routes.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const PremiumAppBar(
        title: 'More',
        subtitle: 'Tools, planning, and account settings',
      ),
      body: ResponsiveBody(
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: ShellBottomInset.bottomOnly(context),
          children: [
            const ContextBanner(
              icon: Icons.explore_outlined,
              message:
                  'Tools beyond the main tabs — subscriptions, budgets, loans, and settings.',
            ),
            _Section(
              title: 'See your money',
              subtitle: 'Search across your data',
              children: [
                PremiumMenuTile(
                  icon: Icons.search_rounded,
                  title: 'Search',
                  subtitle: 'Find any expense, sub, or goal instantly',
                  onTap: () => context.push(AppRoutes.search),
                ),
              ],
            ),
            _Section(
              title: 'Subscriptions & alerts',
              subtitle: 'Recurring bills and budget warnings',
              children: [
                PremiumMenuTile(
                  icon: Icons.subscriptions_outlined,
                  title: 'Subscription health',
                  subtitle: 'Track renewals, overlap, and monthly cost',
                  onTap: () => context.push(AppRoutes.subscriptions),
                ),
                PremiumMenuTile(
                  icon: Icons.notifications_active_outlined,
                  title: 'Budget alerts',
                  subtitle: 'See every spending-group warning in one place',
                  onTap: () => context.push(AppRoutes.budgetAlerts),
                ),
              ],
            ),
            _Section(
              title: 'Borrow & lend',
              subtitle: 'Money you gave others and money you owe',
              children: [
                PremiumMenuTile(
                  icon: Icons.replay_circle_filled_outlined,
                  title: 'Borrowed money',
                  subtitle: 'What you borrowed — schedule pay-back and reminders',
                  onTap: () => context.push(AppRoutes.borrowed),
                ),
                PremiumMenuTile(
                  icon: Icons.handshake_outlined,
                  title: 'Lent money',
                  subtitle: 'Money you lent — mark returned to credit salary',
                  onTap: () => context.push(AppRoutes.loans),
                ),
              ],
            ),
            _Section(
              title: 'Plan ahead',
              subtitle: 'Budgets and goals',
              children: [
                PremiumMenuTile(
                  icon: Icons.pie_chart_outline,
                  title: 'Budget planner',
                  subtitle: 'Split salary into Food, Bills, Fun, and more',
                  onTap: () => context.push(AppRoutes.budget),
                ),
              ],
            ),
            _Section(
              title: 'History & safety',
              subtitle: 'Undo mistakes and recover data',
              children: [
                PremiumMenuTile(
                  icon: Icons.history_rounded,
                  title: 'Activity history',
                  subtitle: 'See every change with undo support',
                  onTap: () => context.push(AppRoutes.activityHistory),
                ),
                PremiumMenuTile(
                  icon: Icons.delete_sweep_outlined,
                  title: 'Recycle bin',
                  subtitle: 'Restore deleted expenses and loans',
                  onTap: () => context.push(AppRoutes.recycleBin),
                ),
              ],
            ),
            _Section(
              title: 'App',
              subtitle: 'Help and preferences',
              children: [
                PremiumMenuTile(
                  icon: Icons.help_outline_rounded,
                  title: 'Help & support',
                  subtitle: 'Quick answers when you\'re stuck',
                  onTap: () => context.push(AppRoutes.helpSupport),
                ),
                PremiumMenuTile(
                  icon: Icons.settings_outlined,
                  title: 'Settings',
                  subtitle: 'Account, data, theme, and salary',
                  onTap: () => context.push(AppRoutes.settings),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({
    required this.title,
    required this.subtitle,
    required this.children,
  });

  final String title;
  final String subtitle;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: PremiumCard(
        variant: PremiumCardVariant.elevated,
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.sm,
          AppSpacing.md,
          AppSpacing.sm,
          AppSpacing.sm,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ScreenSectionHeader(
              title: title,
              subtitle: subtitle,
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
            ),
            ...children,
          ],
        ),
      ),
    );
  }
}
