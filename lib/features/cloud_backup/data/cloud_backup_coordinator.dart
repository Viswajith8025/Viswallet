import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:rupee_track/core/constants/app_constants.dart';

import 'package:rupee_track/core/database/database_backup.dart';

import 'package:rupee_track/core/providers/database_provider.dart';

import 'package:rupee_track/core/providers/supabase_provider.dart';

import 'package:rupee_track/features/cloud_backup/data/cloud_backup_repository.dart';

import 'package:rupee_track/features/cloud_backup/domain/cloud_backup_models.dart';

import 'package:rupee_track/features/custom_dashboard/data/dashboard_layout_repository.dart';

import 'package:package_info_plus/package_info_plus.dart';

import 'package:path/path.dart' as p;

import 'package:path_provider/path_provider.dart';

import 'dart:async';

import 'dart:io';



import 'package:rupee_track/bootstrap.dart';



final cloudBackupCoordinatorProvider = Provider<CloudBackupCoordinator>((ref) {

  return CloudBackupCoordinator(ref);

});



final cloudBackupSyncStateProvider =

    StateProvider<CloudSyncResult?>((ref) => null);



class CloudBackupCoordinator {

  CloudBackupCoordinator(this._ref);



  final Ref _ref;

  Timer? _debounce;



  String _lastUploadKey(String userId) => 'cloud_backup_uploaded_at_$userId';



  String _appVersionKey(String userId) => 'cloud_sync_app_version_$userId';



  DateTime? lastUploadAt(String userId) {

    final raw = sharedPreferences.getString(_lastUploadKey(userId));

    if (raw == null) return null;

    return DateTime.tryParse(raw)?.toLocal();

  }



  /// Runs on sign-in and every cold start while signed in (covers reinstall + updates).

  Future<CloudSyncResult> syncOnStartup() async {

    final user = _ref.read(currentUserProvider);

    if (user == null) {

      return const CloudSyncResult(action: CloudSyncAction.skipped);

    }



    final packageInfo = await PackageInfo.fromPlatform();

    final versionKey = _appVersionKey(user.id);

    final previousVersion = sharedPreferences.getString(versionKey);

    final appUpdated =

        previousVersion != null && previousVersion != packageInfo.version;

    await sharedPreferences.setString(versionKey, packageInfo.version);



    final repo = _ref.read(cloudBackupRepositoryProvider);

    final db = await _ref.read(databaseProvider.future);

    final fetch = await repo.fetchBackupWithStatus(user.id);



    if (fetch.hadError) {

      const result = CloudSyncResult(

        action: CloudSyncAction.failed,

        message: 'Could not reach your cloud backup. Check your connection.',

      );

      _ref.read(cloudBackupSyncStateProvider.notifier).state = result;

      return result;

    }



    final remote = fetch.backup;

    final canRestore = await DatabaseBackup.canRestoreFromRemote(db);



    if (remote != null && canRestore) {

      try {

        await DatabaseBackup.importPayload(db, remote.payload);

        _invalidateData();

        await pushBackup(silent: true);

        final message = appUpdated

            ? 'App updated — your data was restored from your account.'

            : 'Your data was restored from your account.';

        final result = CloudSyncResult(

          action: CloudSyncAction.restored,

          message: message,

        );

        _ref.read(cloudBackupSyncStateProvider.notifier).state = result;

        return result;

      } catch (_) {

        const result = CloudSyncResult(

          action: CloudSyncAction.failed,

          message: 'Could not restore your cloud backup on this device.',

        );

        _ref.read(cloudBackupSyncStateProvider.notifier).state = result;

        return result;

      }

    }



    return pushBackup(silent: true);

  }



  Future<CloudSyncResult> syncAfterAuth() => syncOnStartup();



  Future<CloudSyncResult> restoreFromCloud() async {

    final user = _ref.read(currentUserProvider);

    if (user == null) {

      return const CloudSyncResult(

        action: CloudSyncAction.skipped,

        message: 'Sign in to restore from your account.',

      );

    }



    final fetch =

        await _ref.read(cloudBackupRepositoryProvider).fetchBackupWithStatus(

              user.id,

            );

    if (fetch.hadError) {

      return const CloudSyncResult(

        action: CloudSyncAction.failed,

        message: 'Could not reach your cloud backup.',

      );

    }

    if (fetch.backup == null) {

      return const CloudSyncResult(

        action: CloudSyncAction.skipped,

        message: 'No cloud backup found for this account yet.',

      );

    }



    try {

      final db = await _ref.read(databaseProvider.future);

      await DatabaseBackup.importPayload(db, fetch.backup!.payload);

      _invalidateData();

      await pushBackup(silent: true);

      const result = CloudSyncResult(

        action: CloudSyncAction.restored,

        message: 'Your data was restored from your account.',

      );

      _ref.read(cloudBackupSyncStateProvider.notifier).state = result;

      return result;

    } catch (_) {

      return const CloudSyncResult(

        action: CloudSyncAction.failed,

        message: 'Could not restore your cloud backup.',

      );

    }

  }



  Future<CloudSyncResult> pushBackup({bool silent = false}) async {

    final user = _ref.read(currentUserProvider);

    if (user == null) {

      return const CloudSyncResult(action: CloudSyncAction.skipped);

    }



    try {

      final db = await _ref.read(databaseProvider.future);

      if (await DatabaseBackup.isPristineLocalData(db)) {

        return const CloudSyncResult(action: CloudSyncAction.skipped);

      }



      final payload = await DatabaseBackup.exportPayload(db);

      final repo = _ref.read(cloudBackupRepositoryProvider);

      final uploadedAt = await repo.uploadBackup(

        userId: user.id,

        payload: payload,

      );

      await sharedPreferences.setString(

        _lastUploadKey(user.id),

        uploadedAt.toIso8601String(),

      );



      const result = CloudSyncResult(

        action: CloudSyncAction.uploaded,

        message: 'Data saved to your account.',

      );

      if (!silent) {

        _ref.read(cloudBackupSyncStateProvider.notifier).state = result;

      }

      return result;

    } catch (_) {

      const result = CloudSyncResult(

        action: CloudSyncAction.failed,

        message: 'Could not save to the cloud. Check your internet.',

      );

      if (!silent) {

        _ref.read(cloudBackupSyncStateProvider.notifier).state = result;

      }

      return result;

    }

  }



  /// Wipes local SQLite, backed-up preferences, and the cloud snapshot.

  /// This is the only intentional full data erase.

  Future<void> factoryResetAllData() async {

    final user = _ref.read(currentUserProvider);

    if (user != null) {

      try {

        await _ref.read(cloudBackupRepositoryProvider).deleteBackup(user.id);

      } catch (_) {

        // Local wipe still proceeds if cloud delete fails offline.

      }

      await sharedPreferences.remove(_lastUploadKey(user.id));

    }



    final db = await _ref.read(databaseProvider.future);

    await db.close();



    final dir = await getApplicationDocumentsDirectory();

    final file = File(p.join(dir.path, 'vis_wallet.sqlite'));

    if (await file.exists()) {

      await file.delete();

    }



    await DatabaseBackup.clearBackedUpPreferences();

    await sharedPreferences.setBool(AppConstants.onboardingCompleteKey, false);

    _invalidateData();

  }



  void schedulePush() {

    _debounce?.cancel();

    _debounce = Timer(const Duration(seconds: 8), () {

      unawaited(pushBackup(silent: true));

    });

  }



  void _invalidateData() {

    _ref.invalidate(databaseProvider);

    _ref.invalidate(dashboardLayoutProvider);

  }



  void dispose() => _debounce?.cancel();

}


