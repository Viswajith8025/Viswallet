import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:rupee_track/bootstrap.dart';
import 'package:rupee_track/core/constants/app_constants.dart';

/// Per-account SQLite file paths — prevents one user's data syncing to another.
abstract final class DatabasePaths {
  static const legacyFileName = 'vis_wallet.sqlite';

  static String fileNameForUser(String userId) => 'vis_wallet_$userId.sqlite';

  static Future<File> databaseFileForUser(String userId) async {
    final dir = await getApplicationDocumentsDirectory();
    return File(p.join(dir.path, fileNameForUser(userId)));
  }

  static Future<File> legacyDatabaseFile() async {
    final dir = await getApplicationDocumentsDirectory();
    return File(p.join(dir.path, legacyFileName));
  }

  /// Moves the pre-isolation DB to the first account that signs in on this device.
  static Future<void> migrateLegacyDatabaseIfNeeded(String userId) async {
    final userFile = await databaseFileForUser(userId);
    if (await userFile.exists()) return;

    final legacy = await legacyDatabaseFile();
    if (!await legacy.exists()) return;

    final owner = sharedPreferences.getString(
      AppConstants.legacyDatabaseOwnerUserIdKey,
    );
    if (owner != null && owner != userId) return;

    await legacy.rename(userFile.path);
    await sharedPreferences.setString(
      AppConstants.legacyDatabaseOwnerUserIdKey,
      userId,
    );
  }

  static Future<void> deleteDatabaseForUser(String userId) async {
    final file = await databaseFileForUser(userId);
    if (await file.exists()) {
      await file.delete();
    }
  }

  static void bindActiveDatabaseUser(String userId) {
    sharedPreferences.setString(AppConstants.activeDatabaseUserIdKey, userId);
  }

  static void clearActiveDatabaseUser() {
    sharedPreferences.remove(AppConstants.activeDatabaseUserIdKey);
  }

  /// Upload is blocked when the open DB belongs to a different signed-in account.
  static bool canUploadForSignedInUser(String userId) {
    final active = sharedPreferences.getString(AppConstants.activeDatabaseUserIdKey);
    return active != null && active == userId;
  }
}
