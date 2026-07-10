import 'package:flutter/material.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:go_router/go_router.dart';

import 'package:intl/intl.dart';

import 'package:rupee_track/core/design_system/premium_snackbar.dart';

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



  @override

  Widget build(BuildContext context) {

    final user = ref.watch(currentUserProvider);

    final sync = ref.watch(cloudBackupSyncStateProvider);

    final coordinator = ref.watch(cloudBackupCoordinatorProvider);

    final lastUpload =

        user == null ? null : coordinator.lastUploadAt(user.id);

    final scheme = Theme.of(context).colorScheme;



    return Column(

      crossAxisAlignment: CrossAxisAlignment.start,

      children: [

        const ListTile(

          title: Text('Account'),

          subtitle: Text('Secure access and cloud backup for your Viswallet data.'),

        ),

        Padding(

          padding: const EdgeInsets.symmetric(horizontal: 16),

          child: Card(

            child: Padding(

              padding: const EdgeInsets.all(16),

              child: Column(

                crossAxisAlignment: CrossAxisAlignment.start,

                children: [

                  Row(

                    children: [

                      Icon(

                        user != null ? Icons.cloud_done : Icons.cloud_off,

                        color: user != null ? scheme.primary : scheme.outline,

                      ),

                      const SizedBox(width: 12),

                      Expanded(

                        child: Text(

                          user != null

                              ? 'Signed in as ${user.email ?? 'user'}'

                              : 'Not signed in',

                          style: Theme.of(context).textTheme.titleSmall,

                        ),

                      ),

                    ],

                  ),

                  const SizedBox(height: 12),

                  Row(

                    children: [

                      Icon(

                        _connected == true

                            ? Icons.check_circle_outline

                            : Icons.error_outline,

                        size: 18,

                        color: _connected == true

                            ? Colors.green

                            : scheme.onSurfaceVariant,

                      ),

                      const SizedBox(width: 8),

                      Expanded(

                        child: Text(

                          _checking

                              ? 'Checking connection…'

                              : _connected == true

                                  ? 'Account service is online'

                                  : 'Account service is unavailable right now',

                          style: Theme.of(context).textTheme.bodySmall,

                        ),

                      ),

                      if (!_checking)

                        IconButton(

                          tooltip: 'Retry',

                          onPressed: _checkConnection,

                          icon: const Icon(Icons.refresh, size: 20),

                        ),

                    ],

                  ),

                  const SizedBox(height: 4),

                  Text(

                    user == null

                        ? 'Create an account so your data is backed up and restores after reinstall or app updates.'

                        : 'Your data syncs to this account. Reinstalls and updates restore automatically — only Factory reset erases it.',

                    style: Theme.of(context).textTheme.labelSmall?.copyWith(

                          color: scheme.onSurfaceVariant,

                        ),

                  ),

                  if (user != null) ...[

                    const SizedBox(height: 12),

                    Row(

                      children: [

                        Icon(

                          sync?.failed == true

                              ? Icons.cloud_off_outlined

                              : Icons.cloud_sync_outlined,

                          size: 18,

                          color: sync?.failed == true

                              ? scheme.error

                              : scheme.primary,

                        ),

                        const SizedBox(width: 8),

                        Expanded(

                          child: Text(

                            _backupStatusText(sync, lastUpload),

                            style: Theme.of(context).textTheme.bodySmall,

                          ),

                        ),

                      ],

                    ),

                  ],

                  const SizedBox(height: 16),

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

                    const SizedBox(height: 8),

                    OutlinedButton.icon(

                      onPressed: _backupBusy

                          ? null

                          : () => _runBackup(

                                () => ref

                                    .read(cloudBackupCoordinatorProvider)

                                    .restoreFromCloud(),

                              ),

                      icon: const Icon(Icons.cloud_download_outlined),

                      label: const Text('Restore from cloud'),

                    ),

                    const SizedBox(height: 8),

                    OutlinedButton.icon(

                      onPressed: () async {

                        final hint = await ref

                            .read(authRepositoryProvider)

                            .fetchPasswordHintForCurrentUser();

                        if (!context.mounted) return;

                        await showDialog<void>(

                          context: context,

                          builder: (ctx) => AlertDialog(

                            icon: Icon(

                              Icons.lightbulb_outline_rounded,

                              color: Theme.of(ctx).colorScheme.primary,

                            ),

                            title: const Text('Your password hint'),

                            content: Text(

                              hint ??

                                  'No password hint is saved for your account.',

                            ),

                            actions: [

                              TextButton(

                                onPressed: () => Navigator.pop(ctx),

                                child: const Text('OK'),

                              ),

                            ],

                          ),

                        );

                      },

                      icon: const Icon(Icons.lightbulb_outline),

                      label: const Text('View password hint'),

                    ),

                    const SizedBox(height: 8),

                    OutlinedButton.icon(

                      onPressed: () async {

                        await ref.read(authRepositoryProvider).signOut();

                        _checkConnection();

                      },

                      icon: const Icon(Icons.logout),

                      label: const Text('Sign out'),

                    ),

                  ] else ...[

                    FilledButton.icon(

                      onPressed: () => _openAuth(signUp: false),

                      icon: const Icon(Icons.login),

                      label: const Text('Sign in'),

                    ),

                    const SizedBox(height: 8),

                    OutlinedButton.icon(

                      onPressed: () => _openAuth(signUp: true),

                      icon: const Icon(Icons.person_add_outlined),

                      label: const Text('Create account'),

                    ),

                  ],

                ],

              ),

            ),

          ),

        ),

      ],

    );

  }

}


