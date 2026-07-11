import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rupee_track/core/database/app_database.dart';
import 'package:rupee_track/core/providers/database_provider.dart';
import 'package:rupee_track/features/expenses/data/expense_repository.dart';
import 'package:rupee_track/features/smart_tagging/domain/classification_models.dart';
import 'package:rupee_track/features/smart_tagging/domain/tagging_engine.dart';
import 'package:rupee_track/features/smart_tagging/domain/transaction_classifiers.dart';

final taggingRepositoryProvider = Provider<TaggingRepository>((ref) {
  return TaggingRepository(ref);
});

class TaggingRepository {
  TaggingRepository(this._ref);

  final Ref _ref;
  final _engine = const TaggingEngine();

  Future<TransactionClassification> classify({
    required String title,
    String? description,
    String? notes,
    List<CategoriesTableData> categories = const [],
  }) async {
    final db = await _ref.read(databaseProvider.future);
    final rules = await db.taggingRulesDao.getAllRules();
    final history = await _historyForTitle(db, title);

    final slugById = {for (final c in categories) c.id: c.slug};

    final request = ClassificationRequest(
      title: title,
      description: description,
      notes: notes,
      categorySlugsById: slugById,
      historyCategorySlug:
          history != null ? slugById[history.categoryId] : null,
      historyTags: history != null ? parseTagsJson(history.tags) : const [],
    );

    final classifiers = <TransactionClassifier>[
      UserLearnedClassifier(rules),
      const HistoryClassifier(),
      MerchantRuleClassifier(
        dbRules: rules.where((r) => r.source == 'builtin').toList(),
      ),
      const KeywordClassifier(),
    ];

    final signals = <ClassificationSignal>[];
    for (final classifier in classifiers) {
      final signal = await classifier.classify(request);
      if (signal != null) signals.add(signal);
    }

    return _engine.mergeSignals(
      request,
      signals,
      categories: categories,
    );
  }

  Future<ExpensesTableData?> _historyForTitle(
    AppDatabase db,
    String title,
  ) async {
    final pattern = normalizeTaggingPattern(title);
    if (pattern.isEmpty) return null;

    final recent = await db.expensesDao.getRecentExpenses(limit: 40);
    for (final row in recent) {
      final past = normalizeTaggingPattern(row.expense.title);
      if (past == pattern ||
          past.contains(pattern) ||
          pattern.contains(past)) {
        return row.expense;
      }
    }
    return null;
  }

  Future<void> recordCorrection({
    required String title,
    required String categorySlug,
    required List<String> tags,
  }) async {
    final db = await _ref.read(databaseProvider.future);
    final pattern = normalizeTaggingPattern(title);
    if (pattern.isEmpty) return;

    await db.taggingRulesDao.upsertRule(
      pattern: pattern,
      matchField: 'title',
      categorySlug: categorySlug,
      tags: tags,
      source: 'user',
      confidence: 1.0,
    );
  }

  Future<List<TagSpendRow>> spendingByTags(String cycleKey) async {
    final dao = await _ref.read(expensesDaoProvider.future);
    final expenses = await dao.watchExpensesForMonth(cycleKey).first;
    final totals = <String, _TagAccumulator>{};

    for (final row in expenses) {
      final tags = parseTagsJson(row.expense.tags);
      if (tags.isEmpty) {
        totals.putIfAbsent('Untagged', () => _TagAccumulator()).add(
              row.expense.amountPaise,
            );
        continue;
      }
      for (final tag in tags) {
        totals.putIfAbsent(tag, () => _TagAccumulator()).add(
              row.expense.amountPaise,
            );
      }
    }

    return totals.entries
        .map(
          (e) => TagSpendRow(
            tag: e.key,
            totalPaise: e.value.totalPaise,
            transactionCount: e.value.count,
          ),
        )
        .toList()
      ..sort((a, b) => b.totalPaise.compareTo(a.totalPaise));
  }

  List<String> autoTagsForSave(TransactionClassification? classification) {
    if (classification == null || classification.tags.isEmpty) {
      return const [];
    }
    return classification.tags;
  }
}

class _TagAccumulator {
  int totalPaise = 0;
  int count = 0;

  void add(int paise) {
    totalPaise += paise;
    count++;
  }
}

final transactionClassificationProvider =
    FutureProvider.family<TransactionClassification, String>((ref, title) async {
  final categories = await ref.watch(categoriesProvider.future);
  if (title.trim().isEmpty) return const TransactionClassification();
  return ref.read(taggingRepositoryProvider).classify(
        title: title,
        categories: categories,
      );
});

final spendingByTagsProvider =
    FutureProvider.family<List<TagSpendRow>, String>((ref, cycleKey) {
  return ref.watch(taggingRepositoryProvider).spendingByTags(cycleKey);
});
