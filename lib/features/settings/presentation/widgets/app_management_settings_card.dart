import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/core/design_system/premium_card.dart';
import 'package:rupee_track/core/design_system/premium_confirm_dialog.dart';
import 'package:rupee_track/core/design_system/premium_list_tile.dart';
import 'package:rupee_track/core/design_system/premium_snackbar.dart';
import 'package:rupee_track/features/settings/data/app_management_service.dart';

class AppManagementSettingsCard extends ConsumerStatefulWidget {
  const AppManagementSettingsCard({super.key});

  @override
  ConsumerState<AppManagementSettingsCard> createState() =>
      _AppManagementSettingsCardState();
}

class _AppManagementSettingsCardState
    extends ConsumerState<AppManagementSettingsCard> {
  bool _busy = false;

  Future<void> _run(
    String title,
    String message,
    Future<void> Function() action, {
    bool destructive = true,
  }) async {
    final ok = await showPremiumConfirmDialog(
      context: context,
      title: title,
      message: message,
      confirmLabel: destructive ? 'Yes, proceed' : 'Confirm',
      destructive: destructive,
    );
    if (!ok || !mounted) return;

    setState(() => _busy = true);
    try {
      await action();
      if (mounted) {
        showPremiumSnackBar(
          context,
          message: '$title completed',
          kind: PremiumSnackBarKind.success,
        );
      }
    } catch (e) {
      if (mounted) {
        showPremiumSnackBar(
          context,
          message: 'Something went wrong: $e',
          kind: PremiumSnackBarKind.error,
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final service = ref.read(appManagementServiceProvider);

    return PremiumCard(
      variant: PremiumCardVariant.elevated,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Data on this device',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Export a file, clear specific modules, or factory reset everything.',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              height: 1.45,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          _ActionTile(
            icon: Icons.upload_file_rounded,
            title: 'Export data',
            subtitle: 'Full JSON backup — same data as cloud sync',
            enabled: !_busy,
            onTap: () async {
              setState(() => _busy = true);
              try {
                await service.shareExport();
              } finally {
                if (mounted) setState(() => _busy = false);
              }
            },
          ),
          _ActionTile(
            icon: Icons.receipt_long_outlined,
            title: 'Clear all expenses',
            subtitle: 'Remove every expense entry',
            enabled: !_busy,
            destructive: true,
            onTap: () => _run(
              'Clear expenses',
              'All expense history will be permanently deleted from this device.',
              service.clearExpenses,
            ),
          ),
          _ActionTile(
            icon: Icons.pie_chart_outline_rounded,
            title: 'Reset budgets',
            subtitle: 'Remove budget plans and buckets',
            enabled: !_busy,
            destructive: true,
            onTap: () => _run(
              'Reset budgets',
              'Your budget allocations for all cycles will be removed.',
              service.resetBudgets,
            ),
          ),
          _ActionTile(
            icon: Icons.flag_outlined,
            title: 'Reset goals',
            subtitle: 'Clear savings goals (not wishlist)',
            enabled: !_busy,
            destructive: true,
            onTap: () => _run(
              'Reset goals',
              'All savings goals will be deleted. Wishlist items stay.',
              service.resetGoals,
            ),
          ),
          _ActionTile(
            icon: Icons.favorite_border_rounded,
            title: 'Reset wishlist',
            subtitle: 'Remove wishlist items only',
            enabled: !_busy,
            destructive: true,
            onTap: () => _run(
              'Reset wishlist',
              'Every wishlist item will be removed from this device.',
              service.resetWishlist,
            ),
          ),
          _ActionTile(
            icon: Icons.subscriptions_outlined,
            title: 'Clear subscriptions',
            subtitle: 'Remove all subscriptions and payment history',
            enabled: !_busy,
            destructive: true,
            onTap: () => _run(
              'Clear subscriptions',
              'Every subscription and its payment history will be deleted from this device.',
              service.clearSubscriptions,
            ),
          ),
          _ActionTile(
            icon: Icons.handshake_outlined,
            title: 'Clear loans',
            subtitle: 'Remove borrowed and lent money records',
            enabled: !_busy,
            destructive: true,
            onTap: () => _run(
              'Clear loans',
              'All loan and repayment records will be deleted from this device.',
              service.clearLoans,
            ),
          ),
          _ActionTile(
            icon: Icons.delete_forever_rounded,
            title: 'Factory reset',
            subtitle: 'Erase all data on this device and in your cloud backup',
            enabled: !_busy,
            destructive: true,
            onTap: () => _run(
              'Factory reset',
              'This permanently deletes all finance data — on this phone and in your account backup — and signs you out.\n\nExpenses, salary, budgets, goals, subscriptions, and loans will be gone. Your sign-in is removed; data will not come back unless you exported a file first.\n\nUninstalling or updating the app does not do this.',
              () async {
                await service.factoryReset();
                if (context.mounted) context.go(AppRoutes.onboarding);
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.enabled = true,
    this.destructive = false,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final bool enabled;
  final bool destructive;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = destructive ? theme.colorScheme.error : theme.colorScheme.primary;

    return PremiumMenuTile(
      icon: icon,
      iconColor: color,
      title: title,
      subtitle: subtitle,
      onTap: enabled ? onTap : () {},
    );
  }
}
