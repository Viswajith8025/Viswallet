import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rupee_track/bootstrap.dart';
import 'package:rupee_track/core/constants/app_constants.dart';
import 'package:rupee_track/core/database/app_database.dart';
import 'package:rupee_track/core/database/database_backup.dart';
import 'package:rupee_track/core/database/database_paths.dart';
import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<void> _seedAllUserTables(AppDatabase db) async {
  final food = (await db.select(db.categoriesTable).get())
      .firstWhere((c) => c.slug == 'food');

  await db.into(db.monthlySalaryTable).insert(
        MonthlySalaryTableCompanion.insert(
          monthKey: '2026-06',
          amountPaise: rupeesToPaise('50000'),
        ),
      );

  await db.into(db.salaryDeductionsTable).insert(
        SalaryDeductionsTableCompanion.insert(
          monthKey: '2026-06',
          type: 'pf',
          amountPaise: rupeesToPaise('1800'),
        ),
      );

  await db.into(db.cycleExtraIncomeTable).insert(
        CycleExtraIncomeTableCompanion.insert(
          monthKey: '2026-06',
          label: 'Bonus',
          amountPaise: rupeesToPaise('5000'),
        ),
      );

  final planId = await db.into(db.budgetPlansTable).insert(
        BudgetPlansTableCompanion.insert(
          monthKey: '2026-06',
          salaryPaise: rupeesToPaise('50000'),
        ),
      );

  await db.into(db.budgetBucketsTable).insert(
        BudgetBucketsTableCompanion.insert(
          planId: planId,
          bucketKey: 'needs',
          displayName: 'Needs',
          allocatedPaise: rupeesToPaise('25000'),
        ),
      );

  final subId = await db.into(db.subscriptionsTable).insert(
        SubscriptionsTableCompanion.insert(
          name: 'Netflix',
          amountPaise: rupeesToPaise('649'),
        ),
      );

  await db.into(db.subscriptionPaymentsTable).insert(
        SubscriptionPaymentsTableCompanion.insert(
          subscriptionId: subId,
          amountPaise: rupeesToPaise('649'),
          paidAt: DateTime.utc(2026, 6, 5),
          monthKey: '2026-06',
        ),
      );

  final loanId = await db.into(db.loansTable).insert(
        LoansTableCompanion.insert(
          personName: 'Alex',
          principalPaise: rupeesToPaise('10000'),
          balancePaise: rupeesToPaise('5000'),
          borrowedAt: DateTime.utc(2026, 5, 1),
        ),
      );

  await db.into(db.loanPaymentsTable).insert(
        LoanPaymentsTableCompanion.insert(
          loanId: loanId,
          amountPaise: rupeesToPaise('5000'),
          paidAt: DateTime.utc(2026, 6, 10),
        ),
      );

  await db.into(db.expensesTable).insert(
        ExpensesTableCompanion.insert(
          amountPaise: rupeesToPaise('250'),
          categoryId: food.id,
          title: 'Lunch',
          occurredAt: DateTime.utc(2026, 6, 15),
          monthKey: '2026-06',
        ),
      );

  await db.into(db.savingsGoalsTable).insert(
        SavingsGoalsTableCompanion.insert(
          name: 'Emergency fund',
          targetPaise: rupeesToPaise('100000'),
        ),
      );

  await db.into(db.taggingRulesTable).insert(
        TaggingRulesTableCompanion.insert(
          pattern: 'swiggy_roundtrip_test',
          source: 'user',
        ),
      );

  await db.into(db.activityLogTable).insert(
        ActivityLogTableCompanion.insert(
          action: 'create',
          module: 'expense',
        ),
      );
}

Future<Map<String, int>> _tableRowCounts(AppDatabase db) async {
  final counts = <String, int>{};
  for (final name in DatabaseBackup.tableNames) {
    final row = await db.customSelect('SELECT COUNT(*) AS c FROM $name').getSingle();
    counts[name] = row.read<int>('c');
  }
  return counts;
}

void main() {
  setUpAll(() async {
    SharedPreferences.setMockInitialValues({});
    sharedPreferences = await SharedPreferences.getInstance();
  });

  group('DatabaseBackup', () {
    late AppDatabase db;

    setUp(() async {
      db = AppDatabase(NativeDatabase.memory());
    });

    tearDown(() async {
      await db.close();
    });

    test('isPristineLocalData is true on fresh database', () async {
      expect(await DatabaseBackup.isPristineLocalData(db), isTrue);
    });

    test('export and import roundtrip preserves all schema-v13 tables', () async {
      await _seedAllUserTables(db);
      final beforeCounts = await _tableRowCounts(db);

      final payload = await DatabaseBackup.exportPayload(db);
      final freshDb = AppDatabase(NativeDatabase.memory());
      addTearDown(freshDb.close);

      await DatabaseBackup.importPayload(freshDb, payload);
      final afterCounts = await _tableRowCounts(freshDb);

      expect(afterCounts, equals(beforeCounts));
      for (final name in DatabaseBackup.tableNames) {
        expect(afterCounts[name], greaterThan(0), reason: name);
      }
    });

    test('canRestoreFromRemote is false when only salary exists', () async {
      await db.into(db.monthlySalaryTable).insert(
            MonthlySalaryTableCompanion.insert(
              monthKey: '2026-06',
              amountPaise: rupeesToPaise('50000'),
            ),
          );

      expect(await DatabaseBackup.isPristineLocalData(db), isFalse);
      expect(await DatabaseBackup.canRestoreFromRemote(db), isFalse);
      expect(await DatabaseBackup.hasLocalUserData(db), isTrue);
    });

    test('hasLocalUserData blocks auto-restore after salary is saved', () async {
      expect(await DatabaseBackup.canRestoreFromRemote(db), isTrue);

      await db.into(db.monthlySalaryTable).insert(
            MonthlySalaryTableCompanion.insert(
              monthKey: '2026-07-11',
              amountPaise: rupeesToPaise('50000'),
            ),
          );

      expect(await DatabaseBackup.hasLocalUserData(db), isTrue);
      expect(await DatabaseBackup.canRestoreFromRemote(db), isFalse);
    });

    test('canRestoreFromRemote is true only on pristine local data', () async {
      expect(await DatabaseBackup.canRestoreFromRemote(db), isTrue);

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

    test('allowsImport blocks overwrite without confirmation', () {
      expect(
        DatabaseBackup.allowsImport(
          localHasUserData: true,
          replaceLocalConfirmed: false,
        ),
        isFalse,
      );
      expect(
        DatabaseBackup.allowsImport(
          localHasUserData: true,
          replaceLocalConfirmed: true,
        ),
        isTrue,
      );
      expect(
        DatabaseBackup.allowsImport(
          localHasUserData: false,
          replaceLocalConfirmed: false,
        ),
        isTrue,
      );
    });

    test('import rejects unsupported schema versions', () async {
      expect(
        () => DatabaseBackup.importPayload(db, {'schemaVersion': 99}),
        throwsFormatException,
      );
    });
  });

  group('DatabasePaths account isolation', () {
    test('different users get different database file names', () {
      expect(
        DatabasePaths.fileNameForUser('user-a'),
        isNot(DatabasePaths.fileNameForUser('user-b')),
      );
      expect(
        DatabasePaths.fileNameForUser('user-a'),
        'vis_wallet_user-a.sqlite',
      );
    });

    test('upload is blocked when active database user mismatches', () {
      DatabasePaths.bindActiveDatabaseUser('account-a');
      expect(DatabasePaths.canUploadForSignedInUser('account-a'), isTrue);
      expect(DatabasePaths.canUploadForSignedInUser('account-b'), isFalse);
    });

    test('upload is blocked when no database is bound', () {
      DatabasePaths.clearActiveDatabaseUser();
      expect(DatabasePaths.canUploadForSignedInUser('account-a'), isFalse);
    });
  });
}
