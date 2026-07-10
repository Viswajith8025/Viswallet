import 'dart:async';
import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rupee_track/core/database/app_database.dart';
import 'package:rupee_track/core/database/daos/expenses_dao.dart';
import 'package:rupee_track/core/providers/database_provider.dart';
import 'package:rupee_track/core/providers/salary_cycle_provider.dart';
import 'package:rupee_track/core/utils/auto_label_utils.dart';
import 'package:rupee_track/core/utils/date_utils.dart';
import 'package:rupee_track/features/activity_history/data/activity_log_service.dart';
import 'package:rupee_track/features/activity_history/domain/activity_models.dart';
import 'package:rupee_track/features/cloud_backup/data/cloud_backup_coordinator.dart';
import 'package:rupee_track/features/expenses/domain/expense_classification_helper.dart';
import 'package:rupee_track/features/expenses/domain/expense_date_filter.dart';
import 'package:rupee_track/features/expenses/domain/expense_save_result.dart';
import 'package:rupee_track/features/home_widget/data/home_widget_sync_service.dart';
import 'package:rupee_track/features/smart_tagging/data/tagging_repository.dart';

final expenseRepositoryProvider = Provider<ExpenseRepository>((ref) {
  return ExpenseRepository(ref);
});

class ExpenseRepository {
  ExpenseRepository(this._ref);

  final Ref _ref;

  Stream<List<ExpenseWithCategory>> watchForMonth(String monthKey) async* {
    final dao = await _ref.read(expensesDaoProvider.future);
    yield* dao.watchExpensesForMonth(monthKey);
  }

  Stream<List<ExpenseWithCategory>> watchBetween({
    required DateTime startUtc,
    required DateTime endUtc,
  }) async* {
    final dao = await _ref.read(expensesDaoProvider.future);
    yield* dao.watchExpensesBetween(startUtc: startUtc, endUtc: endUtc);
  }

  Future<ExpenseSaveResult> addExpense({
    required int amountPaise,
    required int categoryId,
    required String title,
    String? description,
    DateTime? occurredAt,
    String paymentMethod = 'UPI',
    List<String> tags = const [],
    String? notes,
    bool autoClassify = true,
  }) async {
    final dao = await _ref.read(expensesDaoProvider.future);
    final settingsDao = await _ref.read(settingsDaoProvider.future);
    final settings = await settingsDao.getSettings();
    final categories = await _ref.read(categoriesProvider.future);

    var resolvedCategoryId = categoryId;
    var classifiedTags = <String>[];

    if (autoClassify) {
      final classification = await _ref.read(taggingRepositoryProvider).classify(
            title: title,
            description: description,
            notes: notes,
            categories: categories,
          );
      classifiedTags = classification.tags;
      if (classifiedTags.isEmpty) {
        classifiedTags =
            _ref.read(taggingRepositoryProvider).autoTagsForSave(classification);
      }
      resolvedCategoryId = resolveCategoryId(
        selectedCategoryId: categoryId,
        classification: classification,
        title: title,
        categories: categories,
      );
    }

    final category = categories.firstWhere((c) => c.id == resolvedCategoryId);
    final resolvedTags = mergeExpenseTags(
      userTags: tags,
      classifiedTags: classifiedTags,
      categoryName: category.name,
    );

    final when = (occurredAt ?? DateTime.now()).toUtc();
    final salaryDay = settings.salaryDay;
    final labels = computeAutoLabels(
      amountPaise: amountPaise,
      majorThresholdPaise: settings.majorExpenseThresholdPaise,
      largeThresholdPaise: settings.largeExpenseThresholdPaise,
      veryLargeThresholdPaise: settings.veryLargeExpenseThresholdPaise,
    );

    final id = await dao.insertExpense(
      ExpensesTableCompanion.insert(
        amountPaise: amountPaise,
        categoryId: resolvedCategoryId,
        title: title,
        description: Value(description),
        occurredAt: when,
        monthKey: cycleKeyFromDate(when, salaryDay: salaryDay),
        paymentMethod: Value(paymentMethod),
        tags: Value(jsonEncode(resolvedTags)),
        notes: Value(notes),
        autoLabels: Value(jsonEncode(labels)),
      ),
    );
    await _ref.read(activityLogServiceProvider).log(
          action: ActivityAction.created,
          module: ActivityModule.expense,
          entityId: id,
          entityLabel: title,
          newValue: {
            'amountPaise': amountPaise,
            'category': category.name,
            'title': title,
          },
        );
    _ref.invalidate(spendingByTagsProvider(cycleKeyFromDate(when, salaryDay: salaryDay)));
    unawaited(_ref.read(homeWidgetSyncServiceProvider).sync());
    _ref.read(cloudBackupCoordinatorProvider).schedulePush();

    return ExpenseSaveResult(
      title: title,
      amountPaise: amountPaise,
      categoryId: resolvedCategoryId,
      categoryName: category.name,
      tags: resolvedTags,
      labels: labels,
    );
  }

  Future<void> updateExpenseClassification({
    required int expenseId,
    required int categoryId,
    required String title,
    required List<String> tags,
    String? notes,
    required String monthKey,
  }) async {
    final dao = await _ref.read(expensesDaoProvider.future);
    final categories = await _ref.read(categoriesProvider.future);
    final category = categories.firstWhere((c) => c.id == categoryId);

    final existing = await dao.getExpenseById(expenseId);

    await dao.updateExpense(
      id: expenseId,
      categoryId: categoryId,
      title: title,
      tagsJson: jsonEncode(tags),
      notes: notes,
    );

    if (existing != null) {
      await _ref.read(activityLogServiceProvider).log(
            action: ActivityAction.updated,
            module: ActivityModule.expense,
            entityId: expenseId,
            entityLabel: title,
            isUndoable: true,
            oldValue: {
              'categoryId': existing.expense.categoryId,
              'title': existing.expense.title,
              'tags': existing.expense.tags,
              'notes': existing.expense.notes,
            },
            newValue: {
              'categoryId': categoryId,
              'title': title,
              'tags': jsonEncode(tags),
              'notes': notes,
            },
          );
    }

    await _ref.read(taggingRepositoryProvider).recordCorrection(
          title: title,
          categorySlug: category.slug,
          tags: tags,
        );
    _ref.invalidate(spendingByTagsProvider(monthKey));
    _ref.read(cloudBackupCoordinatorProvider).schedulePush();
  }

  Future<int?> deleteExpense(int id) async {
    final dao = await _ref.read(expensesDaoProvider.future);
    final existing = await dao.getExpenseByIdIncludingDeleted(id) ??
        await dao.getExpenseById(id);
    await dao.softDeleteExpense(id);
    unawaited(_ref.read(homeWidgetSyncServiceProvider).sync());

    if (existing == null) return null;
    _ref.read(cloudBackupCoordinatorProvider).schedulePush();
    return _ref.read(activityLogServiceProvider).log(
          action: ActivityAction.deleted,
          module: ActivityModule.expense,
          entityId: id,
          entityLabel: existing.expense.title,
          isUndoable: true,
          oldValue: {
            'title': existing.expense.title,
            'amountPaise': existing.expense.amountPaise,
            'category': existing.category.name,
          },
          severity: ActivitySeverity.warning,
        );
  }

  Future<void> restoreExpense(ExpenseWithCategory item) async {
    final dao = await _ref.read(expensesDaoProvider.future);
    await dao.restoreSoftDeletedExpense(item.expense.id);
    await _ref.read(activityLogServiceProvider).log(
          action: ActivityAction.restored,
          module: ActivityModule.expense,
          entityId: item.expense.id,
          entityLabel: item.expense.title,
        );
    _ref.invalidate(spendingByTagsProvider(item.expense.monthKey));
    unawaited(_ref.read(homeWidgetSyncServiceProvider).sync());
    _ref.read(cloudBackupCoordinatorProvider).schedulePush();
  }

  Future<bool> undoExpenseActivity(int activityId) async {
    return _ref.read(activityLogServiceProvider).undo(activityId);
  }
}

final expensesForMonthProvider =
    StreamProvider.family<List<ExpenseWithCategory>, String>((ref, monthKey) {
  final repo = ref.watch(expenseRepositoryProvider);
  return repo.watchForMonth(monthKey);
});

final expensesForDateFilterProvider =
    StreamProvider<List<ExpenseWithCategory>>((ref) {
  final filter = ref.watch(expenseDateFilterProvider);
  final salaryDay = ref.watch(salaryDayProvider);
  final bounds = filter.boundsUtc(salaryDay: salaryDay);
  final repo = ref.watch(expenseRepositoryProvider);
  return repo.watchBetween(startUtc: bounds.$1, endUtc: bounds.$2);
});

final categoriesProvider = StreamProvider<List<CategoriesTableData>>((ref) async* {
  final dao = await ref.watch(categoriesDaoProvider.future);
  yield* dao.watchActiveCategories();
});
