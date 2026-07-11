import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_card.dart';
import 'package:rupee_track/core/design_system/premium_confirm_dialog.dart';
import 'package:rupee_track/core/design_system/premium_list_tile.dart';
import 'package:rupee_track/core/design_system/premium_snackbar.dart';
import 'package:rupee_track/core/database/database_backup.dart';
import 'package:rupee_track/core/database/database_paths.dart';
import 'package:rupee_track/core/providers/database_provider.dart';
import 'package:rupee_track/core/providers/supabase_provider.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/features/auth/data/auth_repository.dart';
import 'package:rupee_track/features/cloud_backup/data/cloud_backup_coordinator.dart';
import 'package:rupee_track/features/cloud_backup/domain/cloud_backup_models.dart';

class CloudAccountPanel extends ConsumerStatefulWidget {
  const CloudAccountPanel({super.key});

  @override
  ConsumerState<CloudAccountPanel> createState() => _CloudAccountPanelState();
}

class _CloudAccountPanelState extends ConsumerState<CloudAccountPanel> {
  bool? _connected;
  bool _checking = false;
  bool _backupBusy = false;

  @override
  void initState() {
    super.initState();
    _checkConnection();
  }

  Future<void> _checkConnection() async {
    setState(() => _checking = true);
    final ok = await ref.read(authRepositoryProvider).checkConnection();
    if (mounted) {
      setState(() {
        _connected = ok;
        _checking = false;
      });
    }
  }

  Future<void> _openAuth({required bool signUp}) async {
    final route = signUp ? '${AppRoutes.auth}?signup=1' : AppRoutes.auth;
    final signedIn = await context.push<bool>(route);
    if (signedIn == true) _checkConnection();
  }

  Future<void> _restoreFromCloud() async {
    final coordinator = ref.read(cloudBackupCoordinatorProvider);
    final db = await ref.read(databaseProvider.future);
    if (!mounted) return;
    final hasLocal = await DatabaseBackup.hasLocalUserData(db);

    if (hasLocal) {
      final replace = await showPremiumConfirmDialog(
        context: context,
        title: 'Replace local data with cloud backup?',
        message:
            'Your finance data on this device will be replaced by the cloud backup for this account.\n\nChoose Keep local to keep what is on this phone.',
        confirmLabel: 'Replace local',
        cancelLabel: 'Keep local',
        destructive: true,
      );
      if (!replace || !mounted) return;
      await _runBackup(
        () => coordinator.restoreFromCloud(replaceLocalConfirmed: true),
      );
      return;
    }

    await _runBackup(() => coordinator.restoreFromCloud());
  }

  Future<void> _signOut() async {
    final confirmed = await showPremiumConfirmDialog(
      context: context,
      title: 'Sign out?',
      message:
          'Your data stays on this device in a local copy for this account. Your cloud backup remains in your account.\n\nSign in again with the same email to sync.',
      confirmLabel: 'Sign out',
      destructive: false,
      icon: Icons.logout_rounded,
    );
    if (!confirmed || !mounted) return;

    ref.invalidate(databaseProvider);
    DatabasePaths.clearActiveDatabaseUser();
    await ref.read(authRepositoryProvider).signOut();
    if (mounted) {
      _checkConnection();
      context.push(AppRoutes.auth);
    }
  }

  Future<void> _runBackup(Future<CloudSyncResult> Function() action) async {
    setState(() => _backupBusy = true);
    try {
      final result = await action();
      if (!mounted || result.message == null) return;
      showPremiumSnackBar(
        context,
        message: result.message!,
        kind: result.failed
            ? PremiumSnackBarKind.error
            : result.restored
                ? PremiumSnackBarKind.success
                : PremiumSnackBarKind.info,
      );
      if (result.restored) setState(() {});
    } finally {
      if (mounted) setState(() => _backupBusy = false);
    }
  }

  String _backupStatusText(CloudSyncResult? sync, DateTime? lastUpload) {
    if (sync?.failed == true) {
      return sync!.message ?? 'Last backup failed';
    }
    if (lastUpload != null) {
      return 'Last backed up ${DateFormat('d MMM · h:mm a').format(lastUpload)}';
    }
    return 'Automatic backup runs when you leave the app';
  }

  Future<void> _showPasswordHint() async {
    final hint =
        await ref.read(authRepositoryProvider).fetchPasswordHintForCurrentUser();
    if (!mounted) return;
    final theme = Theme.of(context);
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.xl),
        ),
        title: const Text('Your password hint'),
        content: Text(
          hint ?? 'No password hint is saved for your account.',
          style: theme.textTheme.bodyMedium,
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final sync = ref.watch(cloudBackupSyncStateProvider);
    final coordinator = ref.watch(cloudBackupCoordinatorProvider);
    final lastUpload = user == null ? null : coordinator.lastUploadAt(user.id);
    final theme = Theme.of(context);
    final semantics = context.semanticColors;

    return PremiumCard(
      variant: PremiumCardVariant.elevated,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(
                user != null ? Icons.cloud_done_rounded : Icons.cloud_off_rounded,
                color: user != null ? theme.colorScheme.primary : semantics.neutral,
                size: AppIconSize.lg,
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user != null
                          ? 'Signed in'
                          : 'Not signed in',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (user?.email != null)
                      Text(
                        user!.email!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                  ],
                ),
              ),
              if (!_checking)
                IconButton(
                  tooltip: 'Retry connection',
                  onPressed: _checkConnection,
                  icon: const Icon(Icons.refresh_rounded, size: AppIconSize.md),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          PremiumRowTile(
            title: _checking
                ? 'Checking connection…'
                : _connected == true
                    ? 'Account service online'
                    : 'Account service unavailable',
            leading: Icon(
              _connected == true
                  ? Icons.check_circle_outline_rounded
                  : Icons.error_outline_rounded,
              color: _connected == true ? semantics.income : semantics.neutral,
              size: AppIconSize.md,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            user == null
                ? 'Create an account so your data backs up and restores after reinstall.'
                : 'Local data lives on this device. Cloud backup is a copy in your account.',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              height: 1.4,
            ),
          ),
          if (user != null) ...[
            const SizedBox(height: AppSpacing.sm),
            PremiumRowTile(
              title: _backupStatusText(sync, lastUpload),
              leading: Icon(
                sync?.failed == true
                    ? Icons.cloud_off_outlined
                    : Icons.cloud_sync_outlined,
                color: sync?.failed == true
                    ? semantics.expense
                    : theme.colorScheme.primary,
                size: AppIconSize.md,
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.md),
          if (user != null) ...[
            OutlinedButton.icon(
              onPressed: _backupBusy
                  ? null
                  : () => _runBackup(
                        () => ref
                            .read(cloudBackupCoordinatorProvider)
                            .pushBackup(),
                      ),
              icon: _backupBusy
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.cloud_upload_outlined),
              label: const Text('Back up now'),
            ),
            const SizedBox(height: AppSpacing.sm),
            OutlinedButton.icon(
              onPressed: _backupBusy ? null : _restoreFromCloud,
              icon: const Icon(Icons.cloud_download_outlined),
              label: const Text('Restore from cloud'),
            ),
            const SizedBox(height: AppSpacing.sm),
            OutlinedButton.icon(
              onPressed: _showPasswordHint,
              icon: const Icon(Icons.lightbulb_outline_rounded),
              label: const Text('View password hint'),
            ),
            const SizedBox(height: AppSpacing.sm),
            OutlinedButton.icon(
              onPressed: _signOut,
              icon: const Icon(Icons.logout_rounded),
              label: const Text('Sign out'),
            ),
          ] else ...[
            FilledButton.icon(
              onPressed: () => _openAuth(signUp: false),
              icon: const Icon(Icons.login_rounded),
              label: const Text('Sign in'),
            ),
            const SizedBox(height: AppSpacing.sm),
            OutlinedButton.icon(
              onPressed: () => _openAuth(signUp: true),
              icon: const Icon(Icons.person_add_outlined),
              label: const Text('Create account'),
            ),
          ],
        ],
      ),
    );
  }
}
