import 'dart:async';

import 'package:drift/drift.dart';
import 'package:rupee_track/core/database/app_database.dart';
import 'package:rupee_track/core/database/tables.dart';
import 'package:rupee_track/features/salary/domain/salary_breakdown.dart';
import 'package:rupee_track/features/salary/domain/salary_deduction_type.dart';

part 'salary_dao.g.dart';

@DriftAccessor(tables: [
  MonthlySalaryTable,
  SalaryDeductionsTable,
  CycleExtraIncomeTable,
])
class SalaryDao extends DatabaseAccessor<AppDatabase> with _$SalaryDaoMixin {
  SalaryDao(super.db);

  Stream<MonthlySalaryTableData?> watchSalaryForMonth(String monthKey) {
    return (select(monthlySalaryTable)
          ..where((t) => t.monthKey.equals(monthKey)))
        .watchSingleOrNull();
  }

  Future<MonthlySalaryTableData?> getSalaryForMonth(String monthKey) {
    return (select(monthlySalaryTable)
          ..where((t) => t.monthKey.equals(monthKey)))
        .getSingleOrNull();
  }

  Stream<List<SalaryDeductionsTableData>> watchDeductionsForMonth(
    String monthKey,
  ) {
    return (select(salaryDeductionsTable)
          ..where((t) => t.monthKey.equals(monthKey))
          ..orderBy([(t) => OrderingTerm.asc(t.id)]))
        .watch();
  }

  Future<List<SalaryDeductionsTableData>> getDeductionsForMonth(
    String monthKey,
  ) {
    return (select(salaryDeductionsTable)
          ..where((t) => t.monthKey.equals(monthKey))
          ..orderBy([(t) => OrderingTerm.asc(t.id)]))
        .get();
  }

  Future<SalaryBreakdown> getBreakdownForMonth(String monthKey) async {
    final salary = await getSalaryForMonth(monthKey);
    final deductions = await getDeductionsForMonth(monthKey);
    final extraIncome = await getExtraIncomeForMonth(monthKey);
    return SalaryBreakdown(
      cycleKey: monthKey,
      grossPaise: salary?.amountPaise ?? 0,
      deductions: deductions.map(SalaryDeductionRow.fromTable).toList(),
      extraIncome: extraIncome.map(ExtraIncomeRow.fromTable).toList(),
    );
  }

  Future<int> getEffectiveSalaryPaise(String monthKey) async {
    final breakdown = await getBreakdownForMonth(monthKey);
    return breakdown.netPaise;
  }

  Future<int> getTotalCycleInflowPaise(String monthKey) async {
    final breakdown = await getBreakdownForMonth(monthKey);
    return breakdown.totalInflowPaise;
  }

  Stream<List<CycleExtraIncomeTableData>> watchExtraIncomeForMonth(
    String monthKey,
  ) {
    return (select(cycleExtraIncomeTable)
          ..where((t) => t.monthKey.equals(monthKey))
          ..orderBy([(t) => OrderingTerm.asc(t.id)]))
        .watch();
  }

  Future<List<CycleExtraIncomeTableData>> getExtraIncomeForMonth(
    String monthKey,
  ) {
    return (select(cycleExtraIncomeTable)
          ..where((t) => t.monthKey.equals(monthKey))
          ..orderBy([(t) => OrderingTerm.asc(t.id)]))
        .get();
  }

  Future<int> addExtraIncome({
    required String monthKey,
    required String label,
    required int amountPaise,
    DateTime? receivedAt,
  }) {
    return into(cycleExtraIncomeTable).insert(
      CycleExtraIncomeTableCompanion.insert(
        monthKey: monthKey,
        label: label.trim(),
        amountPaise: amountPaise,
        receivedAt: Value(receivedAt ?? DateTime.now().toUtc()),
      ),
    );
  }

  Future<void> removeExtraIncome(int id) {
    return (delete(cycleExtraIncomeTable)..where((t) => t.id.equals(id))).go();
  }

  Stream<SalaryBreakdown> watchBreakdownForMonth(String monthKey) {
    final subscriptions = <StreamSubscription<dynamic>>[];
    final controller = StreamController<SalaryBreakdown>();

    Future<void> emit() async {
      if (controller.isClosed) return;
      controller.add(await getBreakdownForMonth(monthKey));
    }

    controller.onListen = () {
      emit();
      subscriptions.add(watchSalaryForMonth(monthKey).listen((_) => emit()));
      subscriptions.add(watchDeductionsForMonth(monthKey).listen((_) => emit()));
      subscriptions.add(watchExtraIncomeForMonth(monthKey).listen((_) => emit()));
    };

    controller.onCancel = () async {
      for (final subscription in subscriptions) {
        await subscription.cancel();
      }
      subscriptions.clear();
    };

    return controller.stream;
  }

  Future<void> upsertSalary({
    required String monthKey,
    required int amountPaise,
    String? notes,
    DateTime? receivedAt,
  }) async {
    final existing = await getSalaryForMonth(monthKey);
    final now = DateTime.now().toUtc();

    if (existing == null) {
      await into(monthlySalaryTable).insert(
        MonthlySalaryTableCompanion.insert(
          monthKey: monthKey,
          amountPaise: amountPaise,
          notes: Value(notes),
          receivedAt: Value(receivedAt),
          createdAt: Value(now),
          updatedAt: Value(now),
        ),
      );
    } else {
      await (update(monthlySalaryTable)
            ..where((t) => t.monthKey.equals(monthKey)))
          .write(
        MonthlySalaryTableCompanion(
          amountPaise: Value(amountPaise),
          notes: Value(notes),
          receivedAt: Value(receivedAt),
          updatedAt: Value(now),
        ),
      );
    }
  }

  Future<int> addDeduction({
    required String monthKey,
    required SalaryDeductionType type,
    required int amountPaise,
    String? label,
  }) {
    return into(salaryDeductionsTable).insert(
      SalaryDeductionsTableCompanion.insert(
        monthKey: monthKey,
        type: type.storageKey,
        label: Value(label?.trim()),
        amountPaise: amountPaise,
      ),
    );
  }

  Future<void> updateDeduction({
    required int id,
    required SalaryDeductionType type,
    required int amountPaise,
    String? label,
  }) {
    return (update(salaryDeductionsTable)..where((t) => t.id.equals(id))).write(
      SalaryDeductionsTableCompanion(
        type: Value(type.storageKey),
        label: Value(label?.trim()),
        amountPaise: Value(amountPaise),
      ),
    );
  }

  Future<void> removeDeduction(int id) {
    return (delete(salaryDeductionsTable)..where((t) => t.id.equals(id))).go();
  }

  Future<void> replaceDeductionsForMonth({
    required String monthKey,
    required List<SalaryDeductionDraft> deductions,
  }) async {
    await (delete(salaryDeductionsTable)
          ..where((t) => t.monthKey.equals(monthKey)))
        .go();
    for (final draft in deductions) {
      if (draft.amountPaise <= 0) continue;
      await addDeduction(
        monthKey: monthKey,
        type: draft.type,
        amountPaise: draft.amountPaise,
        label: draft.label,
      );
    }
  }

  Future<List<MonthlySalaryTableData>> listSalariesInRange({
    required DateTime startUtc,
    required DateTime endUtc,
  }) {
    return (select(monthlySalaryTable)
          ..where((t) => t.receivedAt.isBiggerOrEqualValue(startUtc))
          ..where((t) => t.receivedAt.isSmallerThanValue(endUtc)))
        .get();
  }
}

class SalaryDeductionDraft {
  const SalaryDeductionDraft({
    required this.type,
    required this.amountPaise,
    this.label,
  });

  final SalaryDeductionType type;
  final int amountPaise;
  final String? label;
}
