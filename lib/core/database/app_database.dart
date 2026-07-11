import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:rupee_track/core/constants/app_constants.dart';
import 'package:rupee_track/core/constants/category_defaults.dart';
import 'package:rupee_track/core/database/daos/activity_log_dao.dart';
import 'package:rupee_track/core/database/daos/budget_dao.dart';
import 'package:rupee_track/core/database/daos/categories_dao.dart';
import 'package:rupee_track/core/database/daos/expenses_dao.dart';
import 'package:rupee_track/core/database/daos/loans_dao.dart';
import 'package:rupee_track/core/database/daos/salary_dao.dart';
import 'package:rupee_track/core/database/daos/settings_dao.dart';
import 'package:rupee_track/core/database/daos/subscriptions_dao.dart';
import 'package:rupee_track/core/database/tables.dart';
import 'package:rupee_track/core/database/daos/income_sources_dao.dart';
import 'package:rupee_track/core/database/daos/savings_goals_dao.dart';
import 'package:rupee_track/core/database/daos/tagging_rules_dao.dart';
import 'package:rupee_track/core/database/database_paths.dart';
import 'package:rupee_track/core/salary_cycle/salary_cycle_engine.dart';
import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:rupee_track/features/smart_tagging/domain/default_tagging_rules.dart';

part 'app_database.g.dart';

@DriftDatabase(
  tables: [
    AppSettingsTable,
    MonthlySalaryTable,
    SalaryDeductionsTable,
    CycleExtraIncomeTable,
    CategoriesTable,
    ExpensesTable,
    SubscriptionsTable,
    SubscriptionPaymentsTable,
    LoansTable,
    LoanPaymentsTable,
    BudgetPlansTable,
    BudgetBucketsTable,
    IncomeSourcesTable,
    SavingsGoalsTable,
    TaggingRulesTable,
    ActivityLogTable,
  ],
  daos: [
    ExpensesDao,
    SalaryDao,
    CategoriesDao,
    SettingsDao,
    SubscriptionsDao,
    LoansDao,
    BudgetDao,
    IncomeSourcesDao,
    SavingsGoalsDao,
    TaggingRulesDao,
    ActivityLogDao,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase(super.e);

  @override
  int get schemaVersion => 13;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (Migrator m) async {
          await m.createAll();
          await _createIndexes();
          await _addSearchIndexes();
          await _createActivityIndexes();
          await _seedDefaults();
          await _seedTaggingRules();
        },
        onUpgrade: (Migrator m, int from, int to) async {
          if (from < 2) {
            await m.createTable(budgetPlansTable);
            await m.createTable(budgetBucketsTable);
          }
          if (from < 3) {
            await m.createTable(incomeSourcesTable);
            final settings = await select(appSettingsTable).getSingleOrNull();
            final salaryDay = settings?.salaryDay ?? AppConstants.defaultSalaryDay;
            await into(incomeSourcesTable).insert(
              IncomeSourcesTableCompanion.insert(
                dayOfMonth: Value(salaryDay),
              ),
            );
            await _migrateToSalaryCycleKeys(salaryDay);
          }
          if (from < 4) {
            await m.createTable(taggingRulesTable);
            await _seedTaggingRules();
          }
          if (from < 5) {
            await _createIndexes();
          }
          if (from < 6) {
            await m.addColumn(subscriptionsTable, subscriptionsTable.status);
            await m.addColumn(
              subscriptionsTable,
              subscriptionsTable.usageFrequency,
            );
            await customStatement(
              "UPDATE subscriptions_table SET status = CASE "
              "WHEN is_active = 1 THEN 'active' ELSE 'cancelled' END",
            );
          }
          if (from < 7) {
            await m.createTable(savingsGoalsTable);
          }
          if (from < 8) {
            await _addSearchIndexes();
          }
          if (from < 9) {
            await m.createTable(activityLogTable);
            await m.addColumn(
              appSettingsTable,
              appSettingsTable.recycleBinRetentionDays,
            );
            await m.addColumn(expensesTable, expensesTable.deletedAt);
            await m.addColumn(loansTable, loansTable.deletedAt);
            await m.addColumn(categoriesTable, categoriesTable.deletedAt);
            await _createActivityIndexes();
          }
          if (from < 10) {
            await _migrateExpenseAmountThresholds();
          }
          if (from < 11) {
            await m.createTable(salaryDeductionsTable);
            await customStatement(
              'CREATE INDEX IF NOT EXISTS idx_salary_deductions_month '
              'ON salary_deductions_table (month_key)',
            );
          }
          if (from < 12) {
            await m.createTable(cycleExtraIncomeTable);
            await customStatement(
              'CREATE INDEX IF NOT EXISTS idx_cycle_extra_income_month '
              'ON cycle_extra_income_table (month_key)',
            );
          }
          if (from < 13) {
            await _ensureJupiterSavingsCategory();
          }
        },
        beforeOpen: (details) async {
          // Enforce foreign-key constraints (SQLite leaves these off by default).
          await customStatement('PRAGMA foreign_keys = ON');
        },
      );

  /// Indexes for the hottest query paths (expense lists & monthly aggregates).
  Future<void> _createIndexes() async {
    await customStatement(
      'CREATE INDEX IF NOT EXISTS idx_expenses_month_deleted '
      'ON expenses_table (month_key, is_deleted)',
    );
    await customStatement(
      'CREATE INDEX IF NOT EXISTS idx_expenses_occurred_at '
      'ON expenses_table (occurred_at)',
    );
    await customStatement(
      'CREATE INDEX IF NOT EXISTS idx_expenses_category '
      'ON expenses_table (category_id)',
    );
  }

  Future<void> _addSearchIndexes() async {
    await customStatement(
      'CREATE INDEX IF NOT EXISTS idx_expenses_title '
      'ON expenses_table (title)',
    );
    await customStatement(
      'CREATE INDEX IF NOT EXISTS idx_expenses_payment_method '
      'ON expenses_table (payment_method)',
    );
  }

  Future<void> _createActivityIndexes() async {
    await customStatement(
      'CREATE INDEX IF NOT EXISTS idx_activity_occurred_at '
      'ON activity_log_table (occurred_at DESC)',
    );
    await customStatement(
      'CREATE INDEX IF NOT EXISTS idx_activity_module_action '
      'ON activity_log_table (module, action)',
    );
    await customStatement(
      'CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at '
      'ON expenses_table (is_deleted, deleted_at)',
    );
    await customStatement(
      'CREATE INDEX IF NOT EXISTS idx_loans_deleted_at '
      'ON loans_table (is_deleted, deleted_at)',
    );
  }

  /// Remaps cycle-keyed finance rows after the user changes their salary date.
  Future<void> remapDataToSalaryDay(int salaryDay) =>
      _migrateToSalaryCycleKeys(salaryDay);

  Future<void> _migrateToSalaryCycleKeys(int salaryDay) async {
    final expenses = await select(expensesTable).get();
    for (final expense in expenses) {
      final newKey = SalaryCycleEngine.cycleKeyFromDate(
        expense.occurredAt,
        salaryDay: salaryDay,
      );
      if (newKey != expense.monthKey) {
        await (update(expensesTable)..where((t) => t.id.equals(expense.id)))
            .write(ExpensesTableCompanion(monthKey: Value(newKey)));
      }
    }

    final keyMapping = <String, String>{};

    final salaries = await select(monthlySalaryTable).get();
    for (final salary in salaries) {
      final newKey = _remapMonthKey(
        salary.monthKey,
        salaryDay: salaryDay,
        anchorDate: salary.receivedAt,
      );
      if (newKey != salary.monthKey) {
        keyMapping[salary.monthKey] = newKey;
        await (update(monthlySalaryTable)
              ..where((t) => t.id.equals(salary.id)))
            .write(MonthlySalaryTableCompanion(monthKey: Value(newKey)));
      }
    }

    final plans = await select(budgetPlansTable).get();
    for (final plan in plans) {
      final newKey = keyMapping[plan.monthKey] ??
          _remapMonthKey(plan.monthKey, salaryDay: salaryDay);
      if (newKey != plan.monthKey) {
        await (update(budgetPlansTable)..where((t) => t.id.equals(plan.id)))
            .write(BudgetPlansTableCompanion(monthKey: Value(newKey)));
      }
    }

    final deductions = await select(salaryDeductionsTable).get();
    for (final deduction in deductions) {
      final newKey = keyMapping[deduction.monthKey] ??
          _remapMonthKey(deduction.monthKey, salaryDay: salaryDay);
      if (newKey != deduction.monthKey) {
        await (update(salaryDeductionsTable)
              ..where((t) => t.id.equals(deduction.id)))
            .write(SalaryDeductionsTableCompanion(monthKey: Value(newKey)));
      }
    }

    final extraIncome = await select(cycleExtraIncomeTable).get();
    for (final row in extraIncome) {
      final newKey = keyMapping[row.monthKey] ??
          _remapMonthKey(
            row.monthKey,
            salaryDay: salaryDay,
            anchorDate: row.receivedAt,
          );
      if (newKey != row.monthKey) {
        await (update(cycleExtraIncomeTable)..where((t) => t.id.equals(row.id)))
            .write(CycleExtraIncomeTableCompanion(monthKey: Value(newKey)));
      }
    }

    final payments = await select(subscriptionPaymentsTable).get();
    for (final payment in payments) {
      final newKey = SalaryCycleEngine.cycleKeyFromDate(
        payment.paidAt,
        salaryDay: salaryDay,
      );
      if (newKey != payment.monthKey) {
        await (update(subscriptionPaymentsTable)
              ..where((t) => t.id.equals(payment.id)))
            .write(
          SubscriptionPaymentsTableCompanion(monthKey: Value(newKey)),
        );
      }
    }
  }

  String _remapMonthKey(
    String monthKey, {
    required int salaryDay,
    DateTime? anchorDate,
  }) {
    final anchor = anchorDate ??
        SalaryCycleEngine.parseCycleKey(
          SalaryCycleEngine.isLegacyMonthKey(monthKey)
              ? SalaryCycleEngine.migrateLegacyMonthKey(
                  monthKey,
                  salaryDay: salaryDay,
                )
              : monthKey,
          salaryDay: salaryDay,
        );
    return SalaryCycleEngine.cycleKeyFromDate(anchor, salaryDay: salaryDay);
  }

  Future<void> _ensureJupiterSavingsCategory() async {
    final existing = await (select(categoriesTable)
          ..where((t) => t.slug.equals('jupiter_savings')))
        .getSingleOrNull();
    if (existing != null) return;

    final category = defaultCategories.firstWhere(
      (c) => c.slug == 'jupiter_savings',
    );
    await into(categoriesTable).insert(
      CategoriesTableCompanion.insert(
        name: category.name,
        slug: category.slug,
        iconName: Value(category.iconName),
        colorValue: Value(category.colorValue),
        isSystem: const Value(true),
        countsTowardSpending: Value(category.countsTowardSpending),
        sortOrder: Value(category.sortOrder),
      ),
    );
  }

  Future<void> _migrateExpenseAmountThresholds() async {
    await (update(appSettingsTable)
          ..where((t) => t.majorExpenseThresholdPaise.equals(10000)))
        .write(
      const AppSettingsTableCompanion(
        majorExpenseThresholdPaise: Value(50000),
      ),
    );
    await (update(appSettingsTable)
          ..where((t) => t.largeExpenseThresholdPaise.equals(50000)))
        .write(
      const AppSettingsTableCompanion(
        largeExpenseThresholdPaise: Value(200000),
      ),
    );
    await (update(appSettingsTable)
          ..where((t) => t.veryLargeExpenseThresholdPaise.equals(100000)))
        .write(
      const AppSettingsTableCompanion(
        veryLargeExpenseThresholdPaise: Value(1000000),
      ),
    );
  }

  Future<void> _seedDefaults() async {
    await into(appSettingsTable).insert(
      AppSettingsTableCompanion.insert(
        majorExpenseThresholdPaise: Value(
          rupeesDoubleToPaise(
            AppConstants.defaultMajorExpenseThresholdRupees.toDouble(),
          ),
        ),
        largeExpenseThresholdPaise: Value(
          rupeesDoubleToPaise(
            AppConstants.defaultLargeExpenseThresholdRupees.toDouble(),
          ),
        ),
        veryLargeExpenseThresholdPaise: Value(
          rupeesDoubleToPaise(
            AppConstants.defaultVeryLargeExpenseThresholdRupees.toDouble(),
          ),
        ),
        majorPurchaseThresholdPaise: Value(
          rupeesDoubleToPaise(
            AppConstants.defaultMajorPurchaseThresholdRupees.toDouble(),
          ),
        ),
        salaryDay: const Value(AppConstants.defaultSalaryDay),
      ),
    );

    await into(incomeSourcesTable).insert(
      IncomeSourcesTableCompanion.insert(
        dayOfMonth: const Value(AppConstants.defaultSalaryDay),
      ),
    );

    for (final category in defaultCategories) {
      await into(categoriesTable).insert(
        CategoriesTableCompanion.insert(
          name: category.name,
          slug: category.slug,
          iconName: Value(category.iconName),
          colorValue: Value(category.colorValue),
          isSystem: const Value(true),
          countsTowardSpending: Value(category.countsTowardSpending),
          sortOrder: Value(category.sortOrder),
        ),
      );
    }
  }

  Future<void> _seedTaggingRules() async {
    for (final rule in builtinMerchantRules) {
      await into(taggingRulesTable).insert(
        TaggingRulesTableCompanion.insert(
          pattern: rule.pattern,
          categorySlug: Value(rule.categorySlug),
          tags: Value(jsonEncode(rule.tags)),
          source: 'builtin',
          confidence: Value(rule.confidence),
        ),
        mode: InsertMode.insertOrIgnore,
      );
    }
  }
}

LazyDatabase openConnectionForUser(String userId) {
  return LazyDatabase(() async {
    await DatabasePaths.migrateLegacyDatabaseIfNeeded(userId);
    final file = await DatabasePaths.databaseFileForUser(userId);
    return NativeDatabase.createInBackground(file);
  });
}
