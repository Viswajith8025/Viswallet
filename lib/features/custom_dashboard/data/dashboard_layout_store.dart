import 'dart:convert';

import 'package:rupee_track/bootstrap.dart';
import 'package:rupee_track/features/custom_dashboard/domain/dashboard_layout_models.dart';

class DashboardLayoutStore {
  static const prefsKey = 'custom_dashboard_layout_v1';
  static const _key = prefsKey;

  Future<DashboardLayoutConfig?> load() async {
    final raw = sharedPreferences.getString(_key);
    if (raw == null) return null;
    try {
      return DashboardLayoutConfig.fromJson(
        jsonDecode(raw) as Map<String, dynamic>,
      );
    } catch (_) {
      return null;
    }
  }

  Future<void> save(DashboardLayoutConfig config) async {
    await sharedPreferences.setString(_key, jsonEncode(config.toJson()));
  }

  Future<void> clear() async {
    await sharedPreferences.remove(_key);
  }
}
