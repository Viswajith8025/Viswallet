import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rupee_track/core/providers/database_provider.dart';
import 'package:rupee_track/features/expenses/data/expense_repository.dart';
import 'package:rupee_track/features/expenses/domain/expense_save_result.dart';
import 'package:rupee_track/features/quick_add/data/quick_add_store.dart';
import 'package:rupee_track/features/quick_add/domain/quick_add_models.dart';
import 'package:rupee_track/features/smart_tagging/data/tagging_repository.dart';

final quickAddStoreProvider = Provider<QuickAddStore>((ref) => QuickAddStore());

final quickAddRepositoryProvider = Provider<QuickAddRepository>((ref) {
  return QuickAddRepository(ref);
});

class QuickAddRepository {
  QuickAddRepository(this._ref);

  final Ref _ref;

  static const defaultAmountsRupees = [50, 100, 150, 200, 500, 1000];

  Future<QuickAddContext> loadContext() async {
    final db = await _ref.read(databaseProvider.future);
    final store = _ref.read(quickAddStoreProvider);
    final recent = await db.expensesDao.getRecentExpenses(limit: 30);

    final categoryUse = <int, int>{};
    final amountFreq = <int, int>{};
    final notes = <String>[];
    final repeats = <RepeatExpenseTemplate>[];
    final seenRepeat = <String>{};

    for (final row in recent) {
      final e = row.expense;
      categoryUse[e.categoryId] = (categoryUse[e.categoryId] ?? 0) + 1;
      amountFreq[e.amountPaise] = (amountFreq[e.amountPaise] ?? 0) + 1;

      if (e.notes != null && e.notes!.trim().isNotEmpty) {
        notes.add(e.notes!.trim());
      }

      final repeatKey = '${e.categoryId}:${e.title}:${e.amountPaise}';
      if (!seenRepeat.contains(repeatKey) && repeats.length < 5) {
        seenRepeat.add(repeatKey);
        repeats.add(
          RepeatExpenseTemplate(
            title: e.title,
            amountPaise: e.amountPaise,
            categoryId: e.categoryId,
            categoryName: row.category.name,
            colorValue: row.category.colorValue,
            paymentMethod: e.paymentMethod,
          ),
        );
      }
    }

    final recentCategories = categoryUse.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    final topAmounts = amountFreq.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    final suggestionPaise = <int>{
      ...defaultAmountsRupees.map((r) => r * 100),
      ...topAmounts.take(4).map((e) => e.key),
    }.toList()
      ..sort();

    return QuickAddContext(
      amountSuggestionsPaise: suggestionPaise.take(8).toList(),
      recentCategoryIds: recentCategories.map((e) => e.key).take(8).toList(),
      favoriteCategoryIds: store.favoriteCategoryIds,
      // Only show labels the user saved without a custom merchant/label field.
      recentMerchants: store.topMerchants(),
      recentNotes: notes.toSet().take(6).toList(),
      repeatTemplates: repeats,
    );
  }

  Future<ExpenseSaveResult> quickSaveExpense({
    required int amountPaise,
    required int categoryId,
    required String title,
    String paymentMethod = 'UPI',
    String? notes,
    List<String> tags = const [],
    bool rememberLabel = true,
    DateTime? occurredAt,
  }) async {
    final result = await _ref.read(expenseRepositoryProvider).addExpense(
          amountPaise: amountPaise,
          categoryId: categoryId,
          title: title,
          paymentMethod: paymentMethod,
          notes: notes,
          tags: tags,
          occurredAt: occurredAt,
        );
    if (rememberLabel) {
      await _ref.read(quickAddStoreProvider).recordMerchant(title);
    }
    return result;
  }

  Future<ExpenseSaveResult> quickSaveWithSuggestedCategory({
    required int amountPaise,
    required String title,
    String? notes,
    String paymentMethod = 'UPI',
  }) async {
    final categories = await _ref.read(categoriesProvider.future);
    final classification = await _ref.read(taggingRepositoryProvider).classify(
          title: title,
          notes: notes,
          categories: categories,
        );

    final categoryId = classification.categoryId ??
        categories.firstWhere((c) => c.countsTowardSpending).id;

    return quickSaveExpense(
      amountPaise: amountPaise,
      categoryId: categoryId,
      title: title,
      notes: notes,
      paymentMethod: paymentMethod,
      tags: classification.tags,
      rememberLabel: false,
    );
  }

  Future<ExpenseSaveResult> repeatExpense(RepeatExpenseTemplate template) async {
    return quickSaveExpense(
      amountPaise: template.amountPaise,
      categoryId: template.categoryId,
      title: template.title,
      paymentMethod: template.paymentMethod,
      rememberLabel: false,
    );
  }

  String titleForCategory(String categoryName, {String? merchant}) {
    if (merchant != null && merchant.trim().isNotEmpty) {
      return merchant.trim();
    }
    return categoryName;
  }
}

final quickAddContextProvider = FutureProvider<QuickAddContext>((ref) {
  return ref.watch(quickAddRepositoryProvider).loadContext();
});
