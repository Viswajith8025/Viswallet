import 'package:drift/drift.dart' hide isNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rupee_track/core/database/app_database.dart';
import 'package:rupee_track/core/utils/money_utils.dart';

void main() {
  group('remapDataToSalaryDay', () {
    late AppDatabase db;

    setUp(() async {
      db = AppDatabase(NativeDatabase.memory());
    });

    tearDown(() async {
      await db.close();
    });

    test('moves salary and deductions when salary date changes', () async {
      final receivedAt = DateTime.utc(2026, 7, 11, 6, 30);

      await db.into(db.monthlySalaryTable).insert(
            MonthlySalaryTableCompanion.insert(
              monthKey: '2026-07-01',
              amountPaise: rupeesToPaise('50000'),
              receivedAt: Value(receivedAt),
            ),
          );

      await db.into(db.salaryDeductionsTable).insert(
            SalaryDeductionsTableCompanion.insert(
              monthKey: '2026-07-01',
              type: 'pf',
              amountPaise: rupeesToPaise('1800'),
            ),
          );

      await db.remapDataToSalaryDay(11);

      final salary = await db.salaryDao.getSalaryForMonth('2026-07-11');
      expect(salary?.amountPaise, rupeesToPaise('50000'));

      final oldSalary = await db.salaryDao.getSalaryForMonth('2026-07-01');
      expect(oldSalary, isNull);

      final deductions = await db.salaryDao.getDeductionsForMonth('2026-07-11');
      expect(deductions, hasLength(1));
      expect(deductions.single.amountPaise, rupeesToPaise('1800'));
    });

    test('keeps salary on same key when salary date unchanged', () async {
      await db.into(db.monthlySalaryTable).insert(
            MonthlySalaryTableCompanion.insert(
              monthKey: '2026-07-11',
              amountPaise: rupeesToPaise('25000'),
              receivedAt: Value(DateTime.utc(2026, 7, 11, 6, 30)),
            ),
          );

      await db.remapDataToSalaryDay(11);

      final salary = await db.salaryDao.getSalaryForMonth('2026-07-11');
      expect(salary?.amountPaise, rupeesToPaise('25000'));
    });
  });
}
