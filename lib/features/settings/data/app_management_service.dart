import 'dart:convert';
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:rupee_track/core/database/app_database.dart';
import 'package:rupee_track/core/providers/database_provider.dart';
import 'package:rupee_track/core/database/database_backup.dart';
import 'package:rupee_track/core/utils/backup_sanitizer.dart';
import 'package:rupee_track/features/cloud_backup/data/cloud_backup_coordinator.dart';
import 'package:share_plus/share_plus.dart';

final appManagementServiceProvider = Provider<AppManagementService>((ref) {
  return AppManagementService(ref);
});

class AppManagementService {
  AppManagementService(this._ref);

  final Ref _ref;

  Future<AppDatabase> _db() => _ref.read(databaseProvider.future);

  void _refresh({bool syncCloud = true}) {
    _ref.invalidate(databaseProvider);
    if (syncCloud) {
      _ref.read(cloudBackupCoordinatorProvider).schedulePush();
    }
  }

  Future<Map<String, dynamic>> exportBackup() async {
    final db = await _db();
    final payload = await DatabaseBackup.exportPayload(db);
    return BackupSanitizer.sanitizeBackup({
      'version': DatabaseBackup.schemaVersion,
      'exportedAt': DateTime.now().toUtc().toIso8601String(),
      'app': 'Viswallet',
      ...payload,
    });
  }

  Future<void> shareExport() async {
    final backup = await exportBackup();
    final json = const JsonEncoder.withIndent('  ').convert(backup);
    final dir = await getTemporaryDirectory();
    final file = File(
      p.join(
        dir.path,
        'Viswallet_backup_${DateTime.now().millisecondsSinceEpoch}.json',
      ),
    );
    await file.writeAsString(json);
    await Share.shareXFiles(
      [XFile(file.path)],
      subject: 'Viswallet backup',
      text: 'Your Viswallet data export',
    );
  }

  Future<void> clearExpenses() async {
    final db = await _db();
    await db.customStatement('DELETE FROM expenses_table');
    _refresh();
  }

  Future<void> resetBudgets() async {
    final db = await _db();
    await db.customStatement('DELETE FROM budget_buckets_table');
    await db.customStatement('DELETE FROM budget_plans_table');
    _refresh();
  }

  Future<void> resetGoals() async {
    final db = await _db();
    await db.customStatement(
      'DELETE FROM savings_goals_table WHERE is_wishlist = 0',
    );
    _refresh();
  }

  Future<void> resetWishlist() async {
    final db = await _db();
    await db.customStatement(
      'DELETE FROM savings_goals_table WHERE is_wishlist = 1',
    );
    _refresh();
  }

  Future<void> clearSubscriptions() async {
    final db = await _db();
    await db.customStatement('DELETE FROM subscription_payments_table');
    await db.customStatement('DELETE FROM subscriptions_table');
    _refresh();
  }

  Future<void> clearLoans() async {
    final db = await _db();
    await db.customStatement('DELETE FROM loan_payments_table');
    await db.customStatement('DELETE FROM loans_table');
    _refresh();
  }

  Future<void> clearActivityLog() async {
    final db = await _db();
    await db.customStatement('DELETE FROM activity_log_table');
    _refresh();
  }

  /// Full factory reset — only way to intentionally erase all data (device + cloud).
  Future<void> factoryReset() async {
    await _ref.read(cloudBackupCoordinatorProvider).factoryResetAllData();
  }
}
