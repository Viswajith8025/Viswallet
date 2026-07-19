/// Strips sensitive fields from exported backup payloads.
abstract final class BackupSanitizer {
  static const _settingsSecretKeys = {
    'pinHash',
    'pin_hash',
    'pinEnabled',
    'pin_enabled',
    'biometricEnabled',
    'biometric_enabled',
  };

  static Map<String, dynamic> sanitizeSettings(Map<String, dynamic> settings) {
    return Map<String, dynamic>.from(settings)
      ..removeWhere((key, _) => _settingsSecretKeys.contains(key));
  }

  static Map<String, dynamic> sanitizeBackup(Map<String, dynamic> backup) {
    final sanitized = Map<String, dynamic>.from(backup);

    final settings = sanitized['settings'];
    if (settings is Map<String, dynamic>) {
      sanitized['settings'] = sanitizeSettings(settings);
    }

    final tables = sanitized['tables'];
    if (tables is Map) {
      sanitized['tables'] = _sanitizeTables(Map<String, dynamic>.from(tables));
    }

    return sanitized;
  }

  static Map<String, dynamic> _sanitizeTables(Map<String, dynamic> tables) {
    final next = Map<String, dynamic>.from(tables);
    final settingsRows = next['app_settings_table'];
    if (settingsRows is! List) return next;

    next['app_settings_table'] = settingsRows.map((row) {
      if (row is! Map) return row;
      return sanitizeSettings(Map<String, dynamic>.from(row));
    }).toList();
    return next;
  }
}
