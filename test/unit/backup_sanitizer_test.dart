import 'package:flutter_test/flutter_test.dart';
import 'package:rupee_track/core/utils/backup_sanitizer.dart';

void main() {
  group('BackupSanitizer', () {
    test('strips pin fields from top-level settings', () {
      final sanitized = BackupSanitizer.sanitizeBackup({
        'settings': {
          'salaryDay': 1,
          'pinHash': 'abc',
          'pin_hash': 'def',
          'pinEnabled': true,
          'pin_enabled': true,
          'biometricEnabled': true,
        },
      });

      final settings = sanitized['settings'] as Map<String, dynamic>;
      expect(settings['salaryDay'], 1);
      expect(settings.containsKey('pinHash'), isFalse);
      expect(settings.containsKey('pin_hash'), isFalse);
      expect(settings.containsKey('pinEnabled'), isFalse);
      expect(settings.containsKey('pin_enabled'), isFalse);
      expect(settings.containsKey('biometricEnabled'), isFalse);
    });

    test('strips pin fields from app_settings_table rows', () {
      final sanitized = BackupSanitizer.sanitizeBackup({
        'schemaVersion': 1,
        'tables': {
          'app_settings_table': [
            {
              'id': 1,
              'salary_day': 5,
              'pin_hash': 'should-not-upload',
              'pin_enabled': 1,
              'biometric_enabled': 0,
            },
          ],
          'expenses_table': [
            {'id': 1, 'title': 'Lunch'},
          ],
        },
      });

      final tables = sanitized['tables'] as Map<String, dynamic>;
      final settingsRows = tables['app_settings_table'] as List;
      final row = settingsRows.first as Map<String, dynamic>;

      expect(row['salary_day'], 5);
      expect(row.containsKey('pin_hash'), isFalse);
      expect(row.containsKey('pin_enabled'), isFalse);
      expect(row.containsKey('biometric_enabled'), isFalse);

      final expenses = tables['expenses_table'] as List;
      expect((expenses.first as Map)['title'], 'Lunch');
    });
  });
}
