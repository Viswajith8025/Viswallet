import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rupee_track/core/design_system/premium_snackbar.dart';
import 'package:rupee_track/core/providers/supabase_provider.dart';
import 'package:rupee_track/features/cloud_backup/data/cloud_backup_coordinator.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Keeps the signed-in account backup in sync with the device.
class CloudBackupListener extends ConsumerStatefulWidget {
  const CloudBackupListener({required this.child, super.key});

  final Widget child;

  @override
  ConsumerState<CloudBackupListener> createState() =>
      _CloudBackupListenerState();
}

class _CloudBackupListenerState extends ConsumerState<CloudBackupListener>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _syncIfSignedIn();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    ref.read(cloudBackupCoordinatorProvider).dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      unawaited(ref.read(cloudBackupCoordinatorProvider).syncOnStartup());
    } else if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive) {
      ref.read(cloudBackupCoordinatorProvider).pushBackup(silent: true);
    }
  }

  Future<void> _syncIfSignedIn() async {
    if (ref.read(currentUserProvider) == null) return;
    await ref.read(cloudBackupCoordinatorProvider).syncOnStartup();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(authStateProvider, (previous, next) async {
      final authState = next.asData?.value;
      if (authState?.event != AuthChangeEvent.signedIn) return;
      final result =
          await ref.read(cloudBackupCoordinatorProvider).syncOnStartup();
      if (!context.mounted || result.message == null) return;
      if (result.restored) {
        showPremiumSnackBar(
          context,
          message: result.message!,
          kind: PremiumSnackBarKind.success,
        );
      }
    });

    ref.listen(cloudBackupSyncStateProvider, (previous, next) {
      if (next?.message == null || next!.restored) return;
      if (!context.mounted) return;
      showPremiumSnackBar(
        context,
        message: next.message!,
        kind: next.failed
            ? PremiumSnackBarKind.error
            : PremiumSnackBarKind.info,
      );
    });

    return widget.child;
  }
}
