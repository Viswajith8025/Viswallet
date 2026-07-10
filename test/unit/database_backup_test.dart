import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rupee_track/bootstrap.dart';
import 'package:rupee_track/core/database/app_database.dart';
import 'package:rupee_track/core/database/database_backup.dart';
import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  group('DatabaseBackup', () {
    late AppDatabase db;

    setUpAll(() async {
      SharedPreferences.setMockInitialValues({});
      sharedPreferences = await SharedPreferences.getInstance();
    });

    setUp(() async {
      db = AppDatabase(NativeDatabase.memory());
    });

    tearDown(() async {
      await db.close();
    });

    test('isPristineLocalData is true on fresh database', () async {
      expect(await DatabaseBackup.isPristineLocalData(db), isTrue);
    });

    test('export and import roundtrip preserves expenses', () async {
      final categories = await db.select(db.categoriesTable).get();
      final food = categories.firstWhere((c) => c.slug == 'food');

      await db.into(db.expensesTable).insert(
            ExpensesTableCompanion.insert(
              amountPaise: 25000,
              categoryId: food.id,
              title: 'Lunch',
              occurredAt: DateTime.utc(2026, 6, 15),
              monthKey: '2026-06',
            ),
          );

      expect(await DatabaseBackup.isPristineLocalData(db), isFalse);

      final payload = await DatabaseBackup.exportPayload(db);
      final freshDb = AppDatabase(NativeDatabase.memory());
      addTearDown(freshDb.close);

      await DatabaseBackup.importPayload(freshDb, payload);

      final restored = await freshDb.select(freshDb.expensesTable).get();
      expect(restored, hasLength(1));
      expect(restored.first.title, 'Lunch');
      expect(restored.first.amountPaise, 25000);
    });

    test('canRestoreFromRemote allows salary-only onboarding data', () async {
      await db.into(db.monthlySalaryTable).insert(
            MonthlySalaryTableCompanion.insert(
              monthKey: '2026-06',
              amountPaise: rupeesToPaise('50000'),
            ),
          );

      expect(await DatabaseBackup.isPristineLocalData(db), isFalse);
      expect(await DatabaseBackup.canRestoreFromRemote(db), isTrue);
    });

    test('canRestoreFromRemote is false after expenses exist', () async {
      final categories = await db.select(db.categoriesTable).get();
      final food = categories.firstWhere((c) => c.slug == 'food');

      await db.into(db.expensesTable).insert(
            ExpensesTableCompanion.insert(
              amountPaise: 10000,
              categoryId: food.id,
              title: 'Tea',
              occurredAt: DateTime.utc(2026, 6, 1),
              monthKey: '2026-06',
            ),
          );

      expect(await DatabaseBackup.canRestoreFromRemote(db), isFalse);
    });

    test('import rejects unsupported schema versions', () async {
      expect(
        () => DatabaseBackup.importPayload(db, {'schemaVersion': 99}),
        throwsFormatException,
      );
    });

    test('import restores salary rows', () async {
      await db.into(db.monthlySalaryTable).insert(
            MonthlySalaryTableCompanion.insert(
              monthKey: '2026-06',
              amountPaise: rupeesToPaise('50000'),
            ),
          );

      final payload = await DatabaseBackup.exportPayload(db);
      final freshDb = AppDatabase(NativeDatabase.memory());
      addTearDown(freshDb.close);

      await DatabaseBackup.importPayload(freshDb, payload);

      final salaries = await freshDb.select(freshDb.monthlySalaryTable).get();
      expect(salaries, hasLength(1));
      expect(salaries.first.amountPaise, rupeesToPaise('50000'));
    });
  });
}
