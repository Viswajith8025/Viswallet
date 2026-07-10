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
        subtitle: 'Everything else in one place',
      ),
      body: ResponsiveBody(
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: ShellBottomInset.bottomOnly(context),
          children: [
            const ContextBanner(
              icon: Icons.explore_outlined,
              message:
                  'Reports, planning tools, and account settings live here. Pick what you need — no hunting through menus.',
            ),
            _Section(
              title: 'See your money',
              subtitle: 'Visualize spending over time',
              children: [
                PremiumMenuTile(
                  icon: Icons.calendar_month_rounded,
                  title: 'Financial calendar',
                  subtitle: 'Salary days, bills, and spending on a timeline',
                  onTap: () => context.push(AppRoutes.calendar),
                ),
                PremiumMenuTile(
                  icon: Icons.grid_on_rounded,
                  title: 'Expense heatmap',
                  subtitle: 'Which days you spend the most',
                  onTap: () => context.push(AppRoutes.expenseHeatmap),
                ),
                PremiumMenuTile(
                  icon: Icons.search_rounded,
                  title: 'Search',
                  subtitle: 'Find any expense, sub, or goal instantly',
                  onTap: () => context.push(AppRoutes.search),
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
              subtitle: 'Budgets, forecasts, and reviews',
              children: [
                PremiumMenuTile(
                  icon: Icons.pie_chart_outline,
                  title: 'Budget planner',
                  subtitle: 'Split salary into Food, Bills, Fun, and more',
                  onTap: () => context.push(AppRoutes.budget),
                ),
                PremiumMenuTile(
                  icon: Icons.category_outlined,
                  title: 'Category budgets',
                  subtitle: 'Set limits per category and get alerts',
                  onTap: () => context.push(AppRoutes.categoryBudget),
                ),
                PremiumMenuTile(
                  icon: Icons.trending_up_rounded,
                  title: 'Savings forecast',
                  subtitle: 'Where your money could be in 12 months',
                  onTap: () => context.push(AppRoutes.savingsForecast),
                ),
                PremiumMenuTile(
                  icon: Icons.auto_awesome_rounded,
                  title: 'AI monthly review',
                  subtitle: 'Highlights from your month, explained simply',
                  onTap: () => context.push(AppRoutes.monthlyReport),
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
                  subtitle: 'Theme, salary day, lock, and data',
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
