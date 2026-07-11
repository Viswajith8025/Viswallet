import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:rupee_track/core/constants/app_constants.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_app_bar.dart';
import 'package:rupee_track/core/design_system/premium_card.dart';
import 'package:rupee_track/core/design_system/premium_list_tile.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/core/design_system/settings_section.dart';
import 'package:rupee_track/core/design_system/shell_bottom_inset.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/core/providers/settings_provider.dart';
import 'package:rupee_track/features/budget_alerts/presentation/widgets/budget_alert_settings.dart';
import 'package:rupee_track/features/settings/presentation/widgets/salary_cycle_settings.dart';
import 'package:rupee_track/features/app_lock/presentation/widgets/app_lock_settings_card.dart';
import 'package:rupee_track/features/auth/presentation/widgets/cloud_account_panel.dart';
import 'package:rupee_track/features/settings/presentation/widgets/app_management_settings_card.dart';
import 'package:rupee_track/core/widgets/legal_links.dart';
import 'package:rupee_track/features/expenses/presentation/widgets/expense_swipe_lock_settings.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);

    return Scaffold(
      appBar: const PremiumAppBar(
        title: 'Settings',
        subtitle: 'Your preferences, your data',
      ),
      body: ResponsiveBody(
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.only(
            top: AppSpacing.sm,
            bottom: ShellBottomInset.scrollBottom(context),
          ),
          children: [
            SettingsGroup(
              title: 'Appearance',
              subtitle: 'How Viswallet looks and feels',
              children: [
                PremiumCard(
                  variant: PremiumCardVariant.elevated,
                  child: SegmentedButton<ThemeMode>(
                    showSelectedIcon: false,
                    style: SegmentedButton.styleFrom(
                      visualDensity: VisualDensity.compact,
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.s1,
                        vertical: AppSpacing.s2,
                      ),
                      textStyle: Theme.of(context).textTheme.labelMedium,
                    ),
                    segments: const [
                      ButtonSegment(
                        value: ThemeMode.system,
                        label: Text(
                          'System',
                          maxLines: 1,
                          softWrap: false,
                        ),
                      ),
                      ButtonSegment(
                        value: ThemeMode.light,
                        label: Text(
                          'Light',
                          maxLines: 1,
                          softWrap: false,
                        ),
                      ),
                      ButtonSegment(
                        value: ThemeMode.dark,
                        label: Text(
                          'Dark',
                          maxLines: 1,
                          softWrap: false,
                        ),
                      ),
                    ],
                    selected: {themeMode},
                    onSelectionChanged: (set) {
                      ref
                          .read(themeModeProvider.notifier)
                          .setThemeMode(set.first);
                    },
                  ),
                ),
              ],
            ),
            const SettingsGroup(
              title: 'Security',
              subtitle: 'Protect your financial data',
              children: [
                AppLockSettingsCard(),
                SizedBox(height: AppSpacing.sm),
                ExpenseSwipeLockSettings(),
              ],
            ),
            const SettingsGroup(
              title: 'Money cycle',
              subtitle: 'Salary amount, pay date, and budget alerts',
              children: [
                _MonthlySalaryTile(),
                SizedBox(height: AppSpacing.sm),
                SalaryCycleSettings(),
                SizedBox(height: AppSpacing.sm),
                BudgetAlertSettings(),
              ],
            ),
            const SettingsGroup(
              title: 'Account & Data',
              subtitle: 'Sign in, cloud backup, export, and selective resets',
              children: [
                CloudAccountPanel(),
                AppManagementSettingsCard(),
                LegalLinksCard(),
              ],
            ),
            SettingsGroup(
              title: 'Support',
              subtitle: 'Help and app info',
              children: [
                PremiumMenuTile(
                  icon: Icons.help_outline_rounded,
                  title: 'Help & support',
                  subtitle: 'Answers to common questions',
                  onTap: () => context.push(AppRoutes.helpSupport),
                ),
                PremiumMenuTile(
                  icon: Icons.info_outline_rounded,
                  title: 'About ${AppConstants.appName}',
                  subtitle: 'Version, mission & brand',
                  onTap: () => context.push(AppRoutes.about),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MonthlySalaryTile extends StatelessWidget {
  const _MonthlySalaryTile();

  @override
  Widget build(BuildContext context) {
    return PremiumMenuTile(
      icon: Icons.payments_outlined,
      title: 'Monthly salary',
      subtitle: 'Set or update your income for this pay cycle',
      onTap: () => context.push(AppRoutes.salary),
    );
  }
}
