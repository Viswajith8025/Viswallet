import 'package:drift/drift.dart';
import 'package:rupee_track/core/database/app_database.dart';
import 'package:rupee_track/core/database/tables.dart';
import 'package:rupee_track/core/utils/date_utils.dart';

part 'expenses_dao.g.dart';

@DriftAccessor(tables: [ExpensesTable, CategoriesTable])
class ExpensesDao extends DatabaseAccessor<AppDatabase> with _$ExpensesDaoMixin {
  ExpensesDao(super.db);

  Stream<List<ExpenseWithCategory>> watchExpensesForMonth(String monthKey) {
    final query = select(expensesTable).join([
      innerJoin(
        categoriesTable,
        categoriesTable.id.equalsExp(expensesTable.categoryId),
      ),
    ])
      ..where(expensesTable.monthKey.equals(monthKey))
      ..where(expensesTable.isDeleted.equals(false))
      ..orderBy([
        OrderingTerm.desc(expensesTable.occurredAt),
      ]);

    return query.watch().map(
          (rows) => rows
              .map(
                (row) => ExpenseWithCategory(
                  expense: row.readTable(expensesTable),
                  category: row.readTable(categoriesTable),
                ),
              )
              .toList(),
        );
  }

  Future<int> sumSpentForMonth(String monthKey) async {
    final query = selectOnly(expensesTable)
      ..addColumns([expensesTable.amountPaise.sum()])
      ..join([
        innerJoin(
          categoriesTable,
          categoriesTable.id.equalsExp(expensesTable.categoryId),
        ),
      ])
      ..where(expensesTable.monthKey.equals(monthKey))
      ..where(expensesTable.isDeleted.equals(false))
      ..where(categoriesTable.countsTowardSpending.equals(true));

    final row = await query.getSingleOrNull();
    return row?.read(expensesTable.amountPaise.sum()) ?? 0;
  }

  /// Sum of spending-category expenses today (IST) within [cycleKey].
  Future<int> sumSpentTodayInCycle(String cycleKey, {DateTime? now}) async {
    final ist = toIst(now ?? DateTime.now());
    final dayStartUtc =
        DateTime.utc(ist.year, ist.month, ist.day).subtract(istOffset);
    final dayEndUtc = dayStartUtc.add(const Duration(days: 1));

    final sum = expensesTable.amountPaise.sum();
    final query = selectOnly(expensesTable)
      ..addColumns([sum])
      ..join([
        innerJoin(
          categoriesTable,
          categoriesTable.id.equalsExp(expensesTable.categoryId),
        ),
      ])
      ..where(expensesTable.monthKey.equals(cycleKey))
      ..where(expensesTable.isDeleted.equals(false))
      ..where(categoriesTable.countsTowardSpending.equals(true))
      ..where(expensesTable.occurredAt.isBiggerOrEqualValue(dayStartUtc))
      ..where(expensesTable.occurredAt.isSmallerThanValue(dayEndUtc));

    final row = await query.getSingleOrNull();
    return row?.read(sum) ?? 0;
  }

  Future<List<CategorySpendRow>> categoryBreakdown(String monthKey) async {
    final amountSum = expensesTable.amountPaise.sum();
    final query = selectOnly(expensesTable)
      ..addColumns([
        categoriesTable.id,
        categoriesTable.name,
        categoriesTable.iconName,
        categoriesTable.colorValue,
        amountSum,
      ])
      ..join([
        innerJoin(
          categoriesTable,
          categoriesTable.id.equalsExp(expensesTable.categoryId),
        ),
      ])
      ..where(expensesTable.monthKey.equals(monthKey))
      ..where(expensesTable.isDeleted.equals(false))
      ..where(categoriesTable.countsTowardSpending.equals(true))
      ..groupBy([
        categoriesTable.id,
        categoriesTable.name,
        categoriesTable.iconName,
        categoriesTable.colorValue,
      ])
      ..orderBy([OrderingTerm.desc(amountSum)]);

    final rows = await query.get();
    return rows
        .map(
          (row) => CategorySpendRow(
            categoryId: row.read(categoriesTable.id)!,
            categoryName: row.read(categoriesTable.name)!,
            iconName: row.read(categoriesTable.iconName)!,
            colorValue: row.read(categoriesTable.colorValue)!,
            totalPaise: row.read(amountSum) ?? 0,
          ),
        )
        .toList();
  }

  Future<int> insertExpense(ExpensesTableCompanion expense) {
    return into(expensesTable).insert(expense);
  }

  Future<int> sumForCategory(String monthKey, int categoryId) async {
    final sum = expensesTable.amountPaise.sum();
    final query = selectOnly(expensesTable)
      ..addColumns([sum])
      ..where(expensesTable.monthKey.equals(monthKey))
      ..where(expensesTable.categoryId.equals(categoryId))
      ..where(expensesTable.isDeleted.equals(false));

    final row = await query.getSingleOrNull();
    return row?.read(sum) ?? 0;
  }

  Future<Map<int, int>> sumByCategoryForMonth(String monthKey) async {
    final amountSum = expensesTable.amountPaise.sum();
    final query = selectOnly(expensesTable)
      ..addColumns([expensesTable.categoryId, amountSum])
      ..where(expensesTable.monthKey.equals(monthKey))
      ..where(expensesTable.isDeleted.equals(false))
      ..groupBy([expensesTable.categoryId]);

    final rows = await query.get();
    return {
      for (final row in rows)
        if (row.read(expensesTable.categoryId) != null)
          row.read(expensesTable.categoryId)!: row.read(amountSum) ?? 0,
    };
  }

  /// Average monthly spend per category slug over the given month keys.
  Future<Map<String, int>> averageSpendByCategorySlug(
    List<String> monthKeys,
  ) async {
    if (monthKeys.isEmpty) return {};

    final totals = <String, int>{};

    for (final monthKey in monthKeys) {
      final breakdown = await categoryBreakdown(monthKey);
      for (final row in breakdown) {
        final slug = await _slugForCategoryId(row.categoryId);
        if (slug == null) continue;
        totals[slug] = (totals[slug] ?? 0) + row.totalPaise;
      }
    }

    final divisor = monthKeys.length;
    return totals.map(
      (slug, total) => MapEntry(slug, (total / divisor).round()),
    );
  }

  Future<String?> _slugForCategoryId(int categoryId) async {
    final row = await (select(categoriesTable)
          ..where((t) => t.id.equals(categoryId)))
        .getSingleOrNull();
    return row?.slug;
  }

  Future<bool> softDeleteExpense(int id) {
    final now = DateTime.now().toUtc();
    return (update(expensesTable)..where((t) => t.id.equals(id))).write(
      ExpensesTableCompanion(
        isDeleted: const Value(true),
        deletedAt: Value(now),
        updatedAt: Value(now),
      ),
    ).then((count) => count > 0);
  }

  Future<bool> restoreSoftDeletedExpense(int id) {
    final now = DateTime.now().toUtc();
    return (update(expensesTable)..where((t) => t.id.equals(id))).write(
      ExpensesTableCompanion(
        isDeleted: const Value(false),
        deletedAt: const Value(null),
        updatedAt: Value(now),
      ),
    ).then((count) => count > 0);
  }

  Stream<List<ExpenseWithCategory>> watchDeletedExpenses() {
    final query = select(expensesTable).join([
      innerJoin(
        categoriesTable,
        categoriesTable.id.equalsExp(expensesTable.categoryId),
      ),
    ])
      ..where(expensesTable.isDeleted.equals(true))
      ..orderBy([OrderingTerm.desc(expensesTable.deletedAt)]);

    return query.watch().map(
          (rows) => rows
              .map(
                (row) => ExpenseWithCategory(
                  expense: row.readTable(expensesTable),
                  category: row.readTable(categoriesTable),
                ),
              )
              .toList(),
        );
  }

  Future<ExpenseWithCategory?> getExpenseByIdIncludingDeleted(int id) async {
    final query = select(expensesTable).join([
      innerJoin(
        categoriesTable,
        categoriesTable.id.equalsExp(expensesTable.categoryId),
      ),
    ])
      ..where(expensesTable.id.equals(id));

    final row = await query.getSingleOrNull();
    if (row == null) return null;
    return ExpenseWithCategory(
      expense: row.readTable(expensesTable),
      category: row.readTable(categoriesTable),
    );
  }

  Future<bool> permanentDeleteExpense(int id) {
    return (delete(expensesTable)..where((t) => t.id.equals(id)))
        .go()
        .then((count) => count > 0);
  }

  Future<List<ExpensesTableData>> listExpiredDeletedExpenses(
    DateTime deletedBeforeUtc,
  ) {
    return (select(expensesTable)
          ..where((t) => t.isDeleted.equals(true))
          ..where((t) => t.deletedAt.isSmallerThanValue(deletedBeforeUtc)))
        .get();
  }

  Future<ExpenseWithCategory?> getExpenseById(int id) async {
    final query = select(expensesTable).join([
      innerJoin(
        categoriesTable,
        categoriesTable.id.equalsExp(expensesTable.categoryId),
      ),
    ])
      ..where(expensesTable.id.equals(id))
      ..where(expensesTable.isDeleted.equals(false));

    final row = await query.getSingleOrNull();
    if (row == null) return null;
    return ExpenseWithCategory(
      expense: row.readTable(expensesTable),
      category: row.readTable(categoriesTable),
    );
  }

  Future<bool> updateExpense({
    required int id,
    required int categoryId,
    required String title,
    required String tagsJson,
    String? notes,
  }) {
    return (update(expensesTable)..where((t) => t.id.equals(id)))
        .write(
      ExpensesTableCompanion(
        categoryId: Value(categoryId),
        title: Value(title),
        tags: Value(tagsJson),
        notes: Value(notes),
        updatedAt: Value(DateTime.now().toUtc()),
      ),
    )
        .then((count) => count > 0);
  }

  /// Fires whenever spending data may have changed (for live analytics).
  Stream<void> watchSpendingChanges() {
    return (select(expensesTable)
          ..where((t) => t.isDeleted.equals(false)))
        .watch()
        .map((_) {});
  }

  Future<List<ExpenseWithCategory>> listAllBetween({
    required DateTime startUtc,
    required DateTime endUtc,
  }) async {
    final query = select(expensesTable).join([
      innerJoin(
        categoriesTable,
        categoriesTable.id.equalsExp(expensesTable.categoryId),
      ),
    ])
      ..where(expensesTable.isDeleted.equals(false))
      ..where(expensesTable.occurredAt.isBiggerOrEqualValue(startUtc))
      ..where(expensesTable.occurredAt.isSmallerThanValue(endUtc))
      ..orderBy([OrderingTerm.desc(expensesTable.occurredAt)]);

    final rows = await query.get();
    return rows
        .map(
          (row) => ExpenseWithCategory(
            expense: row.readTable(expensesTable),
            category: row.readTable(categoriesTable),
          ),
        )
        .toList();
  }

  Future<List<ExpenseWithCategory>> listSpendingBetween({
    required DateTime startUtc,
    required DateTime endUtc,
  }) async {
    final query = select(expensesTable).join([
      innerJoin(
        categoriesTable,
        categoriesTable.id.equalsExp(expensesTable.categoryId),
      ),
    ])
      ..where(expensesTable.isDeleted.equals(false))
      ..where(categoriesTable.countsTowardSpending.equals(true))
      ..where(expensesTable.occurredAt.isBiggerOrEqualValue(startUtc))
      ..where(expensesTable.occurredAt.isSmallerThanValue(endUtc))
      ..orderBy([OrderingTerm.desc(expensesTable.occurredAt)]);

    final rows = await query.get();
    return rows
        .map(
          (row) => ExpenseWithCategory(
            expense: row.readTable(expensesTable),
            category: row.readTable(categoriesTable),
          ),
        )
        .toList();
  }

  Future<int> sumSpentBetween({
    required DateTime startUtc,
    required DateTime endUtc,
  }) async {
    final list = await listSpendingBetween(startUtc: startUtc, endUtc: endUtc);
    return list.fold<int>(0, (sum, e) => sum + e.expense.amountPaise);
  }

  Stream<List<ExpenseWithCategory>> watchExpensesBetween({
    required DateTime startUtc,
    required DateTime endUtc,
  }) {
    final query = select(expensesTable).join([
      innerJoin(
        categoriesTable,
        categoriesTable.id.equalsExp(expensesTable.categoryId),
      ),
    ])
      ..where(expensesTable.isDeleted.equals(false))
      ..where(expensesTable.occurredAt.isBiggerOrEqualValue(startUtc))
      ..where(expensesTable.occurredAt.isSmallerThanValue(endUtc))
      ..orderBy([OrderingTerm.desc(expensesTable.occurredAt)]);

    return query.watch().map(
          (rows) => rows
              .map(
                (row) => ExpenseWithCategory(
                  expense: row.readTable(expensesTable),
                  category: row.readTable(categoriesTable),
                ),
              )
              .toList(),
        );
  }

  Future<List<ExpenseWithCategory>> getRecentExpenses({int limit = 25}) async {
    final query = select(expensesTable).join([
      innerJoin(
        categoriesTable,
        categoriesTable.id.equalsExp(expensesTable.categoryId),
      ),
    ])
      ..where(expensesTable.isDeleted.equals(false))
      ..orderBy([OrderingTerm.desc(expensesTable.occurredAt)])
      ..limit(limit);

    final rows = await query.get();
    return rows
        .map(
          (row) => ExpenseWithCategory(
            expense: row.readTable(expensesTable),
            category: row.readTable(categoriesTable),
          ),
        )
        .toList();
  }

  /// Indexed search for universal search — uses SQL filters before Dart scoring.
  Future<List<ExpenseWithCategory>> searchExpenses({
    String? searchTerm,
    int? categoryId,
    String? paymentMethod,
    int? minPaise,
    int? maxPaise,
    DateTime? startUtc,
    DateTime? endUtc,
    String? cycleKey,
    SearchExpenseSort sort = SearchExpenseSort.newest,
    int limit = 50,
    int offset = 0,
  }) async {
    final q = searchTerm?.trim();
    final query = select(expensesTable).join([
      innerJoin(
        categoriesTable,
        categoriesTable.id.equalsExp(expensesTable.categoryId),
      ),
    ])
      ..where(expensesTable.isDeleted.equals(false));

    if (q != null && q.isNotEmpty) {
      final pattern = '%${q.toLowerCase()}%';
      query.where(
        expensesTable.title.lower().like(pattern) |
            expensesTable.notes.lower().like(pattern) |
            expensesTable.description.lower().like(pattern) |
            expensesTable.paymentMethod.lower().like(pattern) |
            expensesTable.tags.lower().like(pattern) |
            categoriesTable.name.lower().like(pattern),
      );
    }
    if (categoryId != null) {
      query.where(expensesTable.categoryId.equals(categoryId));
    }
    if (paymentMethod != null && paymentMethod.isNotEmpty) {
      query.where(expensesTable.paymentMethod.equals(paymentMethod));
    }
    if (minPaise != null) {
      query.where(expensesTable.amountPaise.isBiggerOrEqualValue(minPaise));
    }
    if (maxPaise != null) {
      query.where(expensesTable.amountPaise.isSmallerOrEqualValue(maxPaise));
    }
    if (startUtc != null) {
      query.where(expensesTable.occurredAt.isBiggerOrEqualValue(startUtc));
    }
    if (endUtc != null) {
      query.where(expensesTable.occurredAt.isSmallerThanValue(endUtc));
    }
    if (cycleKey != null) {
      query.where(expensesTable.monthKey.equals(cycleKey));
    }

    switch (sort) {
      case SearchExpenseSort.newest:
        query.orderBy([OrderingTerm.desc(expensesTable.occurredAt)]);
      case SearchExpenseSort.oldest:
        query.orderBy([OrderingTerm.asc(expensesTable.occurredAt)]);
      case SearchExpenseSort.highestAmount:
        query.orderBy([OrderingTerm.desc(expensesTable.amountPaise)]);
      case SearchExpenseSort.lowestAmount:
        query.orderBy([OrderingTerm.asc(expensesTable.amountPaise)]);
      case SearchExpenseSort.alphabetical:
        query.orderBy([OrderingTerm.asc(expensesTable.title)]);
    }

    query.limit(limit, offset: offset);

    final rows = await query.get();
    return rows
        .map(
          (row) => ExpenseWithCategory(
            expense: row.readTable(expensesTable),
            category: row.readTable(categoriesTable),
          ),
        )
        .toList();
  }

  Future<List<String>> distinctMerchantTitles({int limit = 30}) async {
    final query = selectOnly(expensesTable, distinct: true)
      ..addColumns([expensesTable.title])
      ..where(expensesTable.isDeleted.equals(false))
      ..orderBy([OrderingTerm.asc(expensesTable.title)])
      ..limit(limit);
    final rows = await query.get();
    return rows
        .map((r) => r.read(expensesTable.title)!)
        .where((t) => t.trim().isNotEmpty)
        .toList();
  }
}

enum SearchExpenseSort {
  newest,
  oldest,
  highestAmount,
  lowestAmount,
  alphabetical,
}

class ExpenseWithCategory {
  const ExpenseWithCategory({
    required this.expense,
    required this.category,
  });

  final ExpensesTableData expense;
  final CategoriesTableData category;
}

class CategorySpendRow {
  const CategorySpendRow({
    required this.categoryId,
    required this.categoryName,
    required this.iconName,
    required this.colorValue,
    required this.totalPaise,
  });

  final int categoryId;
  final String categoryName;
  final String iconName;
  final int colorValue;
  final int totalPaise;
}
