import 'package:drift/drift.dart';
import 'package:rupee_track/core/database/app_database.dart';
import 'package:rupee_track/core/database/tables.dart';

part 'income_sources_dao.g.dart';

@DriftAccessor(tables: [IncomeSourcesTable, AppSettingsTable])
class IncomeSourcesDao extends DatabaseAccessor<AppDatabase>
    with _$IncomeSourcesDaoMixin {
  IncomeSourcesDao(super.db);

  Stream<List<IncomeSourcesTableData>> watchActiveSources() {
    return (select(incomeSourcesTable)
          ..where((t) => t.isActive.equals(true))
          ..orderBy([(t) => OrderingTerm.desc(t.isPrimary)]))
        .watch();
  }

  Future<IncomeSourcesTableData?> getPrimarySource() {
    return (select(incomeSourcesTable)
          ..where((t) => t.isPrimary.equals(true))
          ..limit(1))
        .getSingleOrNull();
  }

  Future<void> updateSalaryDay(int dayOfMonth) async {
    final primary = await getPrimarySource();
    if (primary != null) {
      await (update(incomeSourcesTable)..where((t) => t.id.equals(primary.id)))
          .write(
        IncomeSourcesTableCompanion(
          dayOfMonth: Value(dayOfMonth),
          updatedAt: Value(DateTime.now().toUtc()),
        ),
      );
    }
    await (update(appSettingsTable)..where((t) => t.id.equals(1))).write(
      AppSettingsTableCompanion(
        salaryDay: Value(dayOfMonth),
        updatedAt: Value(DateTime.now().toUtc()),
      ),
    );
    await db.remapDataToSalaryDay(dayOfMonth);
  }
}
