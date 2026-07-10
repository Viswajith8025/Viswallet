import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:rupee_track/bootstrap.dart';
import 'package:rupee_track/core/constants/app_constants.dart';
import 'package:rupee_track/core/database/app_database.dart';
import 'package:rupee_track/features/custom_dashboard/data/dashboard_layout_store.dart';

/// Full-device backup payload for cloud restore after reinstall.
abstract final class DatabaseBackup {
  static const schemaVersion = 1;

  static const tableNames = [
    'app_settings_table',
    'categories_table',
    'income_sources_table',
    'monthly_salary_table',
    'salary_deductions_table',
    'cycle_extra_income_table',
    'budget_plans_table',
    'budget_buckets_table',
    'subscriptions_table',
    'subscription_payments_table',
    'loans_table',
    'loan_payments_table',
    'expenses_table',
    'savings_goals_table',
    'tagging_rules_table',
    'activity_log_table',
  ];

  static Future<Map<String, dynamic>> exportPayload(AppDatabase db) async {
    final tables = <String, List<Map<String, dynamic>>>{};
    for (final name in tableNames) {
      tables[name] = await _exportTable(db, name);
    }

    return {
      'schemaVersion': schemaVersion,
      'exportedAt': DateTime.now().toUtc().toIso8601String(),
      'tables': tables,
      'preferences': await _exportPreferences(),
    };
  }

  static Future<void> importPayload(
    AppDatabase db,
    Map<String, dynamic> payload,
  ) async {
    final version = payload['schemaVersion'] as int?;
    if (version == null || version > schemaVersion) {
      throw FormatException('Unsupported backup version: $version');
    }

    final tables = payload['tables'] as Map<String, dynamic>?;
    if (tables == null) {
      throw FormatException('Backup missing tables section');
    }

    await db.transaction(() async {
      await db.customStatement('PRAGMA foreign_keys = OFF');
      for (final name in tableNames.reversed) {
        await db.customStatement('DELETE FROM $name');
      }

      for (final name in tableNames) {
        final raw = tables[name];
        if (raw is! List) continue;
        for (final entry in raw) {
          if (entry is Map) {
            await _insertRow(db, name, Map<String, dynamic>.from(entry));
          }
        }
      }
      await db.customStatement('PRAGMA foreign_keys = ON');
    });

    await _importPreferences(payload['preferences']);
  }

  /// True when the local DB only has factory defaults (fresh install).
  static Future<bool> isPristineLocalData(AppDatabase db) async {
    final counts = await _userDataCounts(db);
    return counts.every((c) => c == 0);
  }

  /// True when the user has not entered real finance data yet (e.g. onboarding salary only).
  static Future<bool> canRestoreFromRemote(AppDatabase db) async {
    if (await isPristineLocalData(db)) return true;
    return _isOnboardingOnlyCounts(await _userDataCounts(db));
  }

  static Future<List<int>> _userDataCounts(AppDatabase db) => Future.wait([
        _count(db, 'expenses_table', where: 'is_deleted = 0'),
        _count(db, 'monthly_salary_table'),
        _count(db, 'loans_table', where: 'is_deleted = 0'),
        _count(db, 'subscriptions_table'),
        _count(db, 'budget_plans_table'),
        _count(db, 'savings_goals_table'),
        _count(db, 'activity_log_table'),
        _count(db, 'cycle_extra_income_table'),
      ]);

  static bool _isOnboardingOnlyCounts(List<int> counts) {
    final expenses = counts[0];
    if (expenses > 0) return false;
    return counts.sublist(2).every((c) => c == 0);
  }

  static Future<List<Map<String, dynamic>>> _exportTable(
    AppDatabase db,
    String tableName,
  ) async {
    final rows = await db.customSelect('SELECT * FROM $tableName').get();
    return rows
        .map(
          (row) => row.data.map(
            (key, value) => MapEntry(key, _serializeValue(value)),
          ),
        )
        .toList();
  }

  static Future<void> _insertRow(
    AppDatabase db,
    String tableName,
    Map<String, dynamic> row,
  ) async {
    if (row.isEmpty) return;
    final columns = row.keys.toList();
    final placeholders = <String>[];
    final variables = <Variable<Object>>[];

    for (final column in columns) {
      final value = _deserializeValue(row[column]);
      if (value == null) {
        placeholders.add('NULL');
      } else {
        placeholders.add('?');
        variables.add(Variable<Object>(value));
      }
    }

    await db.customInsert(
      'INSERT OR REPLACE INTO $tableName (${columns.join(', ')}) '
      'VALUES (${placeholders.join(', ')})',
      variables: variables,
    );
  }

  static Future<int> _count(
    AppDatabase db,
    String table, {
    String? where,
  }) async {
    final sql = where == null
        ? 'SELECT COUNT(*) AS c FROM $table'
        : 'SELECT COUNT(*) AS c FROM $table WHERE $where';
    final row = await db.customSelect(sql).getSingle();
    return row.read<int>('c');
  }

  static dynamic _serializeValue(dynamic value) {
    if (value is DateTime) return value.toUtc().toIso8601String();
    return value;
  }

  static dynamic _deserializeValue(dynamic value) {
    if (value is String) {
      final parsed = DateTime.tryParse(value);
      if (parsed != null &&
          (value.contains('T') || value.contains('-'))) {
        return parsed.toUtc();
      }
    }
    return value;
  }

  static Future<Map<String, dynamic>> _exportPreferences() async {
    final prefs = sharedPreferences;
    return {
      AppConstants.onboardingCompleteKey:
          prefs.getBool(AppConstants.onboardingCompleteKey) ?? false,
      AppConstants.selectedCycleKeyPref:
          prefs.getString(AppConstants.selectedCycleKeyPref),
      AppConstants.selectedMonthKeyPref:
          prefs.getString(AppConstants.selectedMonthKeyPref),
      'theme_mode': prefs.getString('theme_mode'),
      DashboardLayoutStore.prefsKey:
          prefs.getString(DashboardLayoutStore.prefsKey),
      'universal_search_recent':
          prefs.getStringList('universal_search_recent'),
      'universal_search_saved':
          prefs.getStringList('universal_search_saved'),
    };
  }

  static Future<void> _importPreferences(dynamic raw) async {
    if (raw is! Map) return;
    final prefs = sharedPreferences;
    final map = Map<String, dynamic>.from(raw);

    Future<void> setBool(String key) async {
      final value = map[key];
      if (value is bool) await prefs.setBool(key, value);
    }

    Future<void> setString(String key) async {
      final value = map[key];
      if (value is String && value.isNotEmpty) {
        await prefs.setString(key, value);
      }
    }

    Future<void> setStringList(String key) async {
      final value = map[key];
      if (value is List) {
        await prefs.setStringList(
          key,
          value.whereType<String>().toList(),
        );
      }
    }

    await setBool(AppConstants.onboardingCompleteKey);
    await setString(AppConstants.selectedCycleKeyPref);
    await setString(AppConstants.selectedMonthKeyPref);
    await setString('theme_mode');
    await setString(DashboardLayoutStore.prefsKey);
    await setStringList('universal_search_recent');
    await setStringList('universal_search_saved');
  }

  static String encodePayload(Map<String, dynamic> payload) =>
      jsonEncode(payload);

  static Map<String, dynamic> decodePayload(String raw) =>
      jsonDecode(raw) as Map<String, dynamic>;

  /// Clears preferences included in cloud backups (factory reset only).
  static Future<void> clearBackedUpPreferences() async {
    final prefs = sharedPreferences;
    await prefs.remove(AppConstants.onboardingCompleteKey);
    await prefs.remove(AppConstants.selectedCycleKeyPref);
    await prefs.remove(AppConstants.selectedMonthKeyPref);
    await prefs.remove('theme_mode');
    await prefs.remove(DashboardLayoutStore.prefsKey);
    await prefs.remove('universal_search_recent');
    await prefs.remove('universal_search_saved');
  }
}
