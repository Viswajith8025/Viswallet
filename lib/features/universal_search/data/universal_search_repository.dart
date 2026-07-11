import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rupee_track/bootstrap.dart';
import 'package:rupee_track/core/database/daos/expenses_dao.dart';
import 'package:rupee_track/core/providers/database_provider.dart';
import 'package:rupee_track/core/providers/salary_cycle_provider.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/core/salary_cycle/salary_cycle_engine.dart';
import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:rupee_track/features/financial_calendar/domain/financial_calendar_engine.dart';
import 'package:rupee_track/features/universal_search/domain/universal_search_engine.dart';
import 'package:rupee_track/features/universal_search/domain/universal_search_models.dart';

const _recentKey = 'universal_search_recent';
const _savedKey = 'universal_search_saved';

final searchHistoryStoreProvider = Provider<SearchHistoryStore>((ref) {
  return SearchHistoryStore();
});

class SearchHistoryStore {
  List<String> get recent =>
      sharedPreferences.getStringList(_recentKey) ?? [];

  List<String> get saved => sharedPreferences.getStringList(_savedKey) ?? [];

  Future<void> addRecent(String query) async {
    final q = query.trim();
    if (q.isEmpty) return;
    final list = recent.where((r) => r != q).toList();
    list.insert(0, q);
    await sharedPreferences.setStringList(
      _recentKey,
      list.take(12).toList(),
    );
  }

  Future<void> toggleSaved(String query) async {
    final q = query.trim();
    if (q.isEmpty) return;
    final list = [...saved];
    if (list.contains(q)) {
      list.remove(q);
    } else {
      list.insert(0, q);
    }
    await sharedPreferences.setStringList(_savedKey, list.take(20).toList());
  }

  Future<void> clearRecent() async {
    await sharedPreferences.remove(_recentKey);
  }
}

final universalSearchRepositoryProvider =
    Provider<UniversalSearchRepository>((ref) {
  return UniversalSearchRepository(ref);
});

class UniversalSearchRepository {
  UniversalSearchRepository(this._ref);

  final Ref _ref;

  Future<UniversalSearchReport> search({
    required String query,
    SearchFilters filters = const SearchFilters(),
    int limit = 50,
    int offset = 0,
  }) async {
    final db = await _ref.read(databaseProvider.future);
    final parsed = UniversalSearchEngine.parse(query);
    final settings = await db.settingsDao.getSettings();
    final salaryDay = settings.salaryDay;
    final String cycleKey =
        filters.cycleKey ?? _ref.read(selectedCycleKeyProvider);

    DateTime? startUtc = filters.startUtc;
    DateTime? endUtc = filters.endUtc;
    if (filters.cycleKey != null || parsed.rawQuery.contains('cycle')) {
      final bounds =
          SalaryCycleEngine.cycleBounds(cycleKey, salaryDay: salaryDay);
      startUtc ??= FinancialCalendarEngine.utcStartOfIstDay(bounds.startIst);
      endUtc ??= FinancialCalendarEngine.utcEndOfIstDay(bounds.endIst);
    }

    if (parsed.rawQuery.toLowerCase().contains('last month')) {
      final now = FinancialCalendarEngine.istDateOnly(DateTime.now());
      final start = DateTime(now.year, now.month - 1, 1);
      final end = DateTime(now.year, now.month, 0);
      startUtc = FinancialCalendarEngine.utcStartOfIstDay(start);
      endUtc = FinancialCalendarEngine.utcEndOfIstDay(end);
    }

    final minPaise = filters.minPaise ?? parsed.minPaise;
    final maxPaise = filters.maxPaise ?? parsed.maxPaise;

    final searchTerms = parsed.expandedTerms.isEmpty
        ? (parsed.rawQuery.isEmpty ? null : parsed.rawQuery)
        : parsed.expandedTerms.join(' ');

    final expenseSort = _mapSort(filters.sort);

    final items = <SearchResultItem>[];

    if (parsed.nlAnswer != null) {
      items.add(
        SearchResultItem(
          id: 'nl-answer',
          kind: SearchResultKind.nlAnswer,
          title: parsed.nlAnswer!,
          subtitle: 'Smart interpretation',
          route: parsed.suggestedRoute ?? AppRoutes.home,
          icon: Icons.auto_awesome_outlined,
          score: 1000,
        ),
      );
    }

    if (filters.transactionType != SearchTransactionType.income) {
      final expenses = await db.expensesDao.searchExpenses(
        searchTerm: parsed.merchantHint ?? parsed.categoryHint ?? searchTerms,
        categoryId: filters.categoryId ?? _categoryIdForHint(parsed.categoryHint),
        paymentMethod: filters.paymentMethod,
        minPaise: minPaise,
        maxPaise: maxPaise,
        startUtc: startUtc,
        endUtc: endUtc,
        cycleKey: filters.cycleKey,
        sort: expenseSort,
        limit: limit,
        offset: offset,
      );

      for (final row in expenses) {
        final e = row.expense;
        items.add(
          SearchResultItem(
            id: 'expense-${e.id}',
            kind: SearchResultKind.expense,
            title: e.title,
            subtitle:
                '${row.category.name} · ${formatPaise(e.amountPaise)} · ${e.paymentMethod}',
            amountPaise: e.amountPaise,
            occurredAt: e.occurredAt,
            route: AppRoutes.expenses,
            icon: Icons.receipt_long_outlined,
            colorValue: row.category.colorValue,
          ),
        );
        if (e.notes != null && e.notes!.trim().isNotEmpty) {
          final noteMatch = parsed.rawQuery.isEmpty ||
              e.notes!.toLowerCase().contains(parsed.rawQuery.toLowerCase());
          if (noteMatch) {
            items.add(
              SearchResultItem(
                id: 'note-${e.id}',
                kind: SearchResultKind.note,
                title: e.notes!,
                subtitle: 'Note on ${e.title}',
                route: AppRoutes.expenses,
                icon: Icons.sticky_note_2_outlined,
              ),
            );
          }
        }
      }
    }

    if (filters.transactionType != SearchTransactionType.expense) {
      final salaries = await db.select(db.monthlySalaryTable).get();
      for (final salary in salaries) {
        final label = salary.notes ?? 'Salary ${salary.monthKey}';
        if (!_matchesQuery(label, parsed) &&
            !_matchesQuery(salary.monthKey, parsed) &&
            parsed.rawQuery.isNotEmpty) {
          continue;
        }
        items.add(
          SearchResultItem(
            id: 'income-${salary.id}',
            kind: SearchResultKind.income,
            title: label,
            subtitle: '${salary.monthKey} · ${formatPaise(salary.amountPaise)}',
            amountPaise: salary.amountPaise,
            occurredAt: salary.receivedAt,
            route: AppRoutes.salary,
            icon: Icons.payments_outlined,
          ),
        );
      }
    }

    final subs = await db.subscriptionsDao.watchAllSubscriptions().first;
    for (final sub in subs) {
      if (filters.subscriptionStatus != null &&
          sub.status != filters.subscriptionStatus) {
        continue;
      }
      if (parsed.rawQuery.isNotEmpty && !_matchesQuery(sub.name, parsed)) {
        continue;
      }
      items.add(
        SearchResultItem(
          id: 'sub-${sub.id}',
          kind: SearchResultKind.subscription,
          title: sub.name,
          subtitle:
              '${sub.status} · ${sub.billingCycle} · ${formatPaise(sub.amountPaise)}',
          amountPaise: sub.amountPaise,
          route: AppRoutes.subscriptions,
          icon: Icons.subscriptions_outlined,
        ),
      );
    }

    final loans = await db.loansDao.watchActiveLoans().first;
    for (final loan in loans) {
      if (parsed.personHint != null &&
          !loan.personName.toLowerCase().contains(parsed.personHint!)) {
        continue;
      }
      if (parsed.rawQuery.isNotEmpty &&
          !_matchesQuery(loan.personName, parsed) &&
          !_matchesQuery(loan.reason ?? '', parsed)) {
        continue;
      }
      final kind = loan.direction == 'borrowed_by_me'
          ? SearchResultKind.loan
          : SearchResultKind.borrowedMoney;
      items.add(
        SearchResultItem(
          id: 'loan-${loan.id}',
          kind: kind,
          title: loan.personName,
          subtitle:
              '${loan.status} · balance ${formatPaise(loan.balancePaise)}',
          amountPaise: loan.balancePaise,
          route: AppRoutes.loans,
          icon: Icons.handshake_outlined,
        ),
      );
    }

    final goals = await db.savingsGoalsDao.listActiveGoals();
    for (final goal in goals) {
      if (parsed.rawQuery.isNotEmpty && !_matchesQuery(goal.name, parsed)) {
        continue;
      }
      items.add(
        SearchResultItem(
          id: 'goal-${goal.id}',
          kind: goal.isWishlist ? SearchResultKind.wishlist : SearchResultKind.goal,
          title: goal.name,
          subtitle:
              '${formatPaise(goal.savedPaise)} / ${formatPaise(goal.targetPaise)}',
          amountPaise: goal.targetPaise,
          route: AppRoutes.insights,
          icon: goal.isWishlist
              ? Icons.favorite_border
              : Icons.flag_outlined,
        ),
      );
    }

    final categories = await db.categoriesDao.getActiveCategories();
    for (final cat in categories) {
      if (parsed.rawQuery.isNotEmpty && !_matchesQuery(cat.name, parsed)) {
        continue;
      }
      items.add(
        SearchResultItem(
          id: 'cat-${cat.id}',
          kind: SearchResultKind.category,
          title: cat.name,
          subtitle: 'Category',
          route: AppRoutes.budget,
          icon: Icons.category_outlined,
          colorValue: cat.colorValue,
        ),
      );
    }

    final merchants = await db.expensesDao.distinctMerchantTitles(limit: 100);
    for (final title in merchants) {
      if (parsed.rawQuery.isNotEmpty && !_matchesQuery(title, parsed)) continue;
      items.add(
        SearchResultItem(
          id: 'merchant-$title',
          kind: SearchResultKind.merchant,
          title: title,
          subtitle: 'Merchant',
          route: AppRoutes.expenses,
          icon: Icons.storefront_outlined,
        ),
      );
    }

    items.addAll(_navigationShortcuts(parsed));

    final ranked = UniversalSearchEngine.rankItems(items, parsed);
    final deduped = <String, SearchResultItem>{};
    for (final item in ranked) {
      deduped.putIfAbsent(item.id, () => item);
    }
    final finalItems = deduped.values.toList();

    final groups = UniversalSearchEngine.groupResults(finalItems);
    final history = _ref.read(searchHistoryStoreProvider);
    final suggestions = UniversalSearchEngine.suggestionsFor(
      query: parsed.rawQuery,
      merchants: merchants,
      recent: history.recent,
    );

    SearchResultItem? nlItem;
    for (final item in finalItems) {
      if (item.kind == SearchResultKind.nlAnswer) {
        nlItem = item;
        break;
      }
    }

    return UniversalSearchReport(
      query: parsed.rawQuery,
      parsed: parsed,
      groups: groups,
      suggestions: suggestions,
      totalCount: finalItems.length,
      hasMore: finalItems
              .where((i) => i.kind == SearchResultKind.expense)
              .length >=
          limit,
      nlAnswerItem: nlItem,
    );
  }

  List<SearchResultItem> _navigationShortcuts(ParsedSearchQuery parsed) {
    const shortcuts = [
      ('insights', 'Insights', AppRoutes.insights, Icons.insights_outlined),
      ('report', 'Monthly review (Insights)', AppRoutes.insights, Icons.auto_awesome),
      ('budget', 'Budget planner', AppRoutes.budget, Icons.pie_chart_outline),
      ('forecast', 'Savings forecast (Insights)', AppRoutes.insights, Icons.trending_up),
      ('health', 'Financial health (Insights)', AppRoutes.insights, Icons.favorite),
      ('settings', 'Settings', AppRoutes.settings, Icons.settings_outlined),
    ];

    if (parsed.rawQuery.isEmpty) return [];

    return shortcuts
        .where((s) => s.$1.contains(parsed.rawQuery.toLowerCase()) ||
            parsed.rawQuery.toLowerCase().contains(s.$1))
        .map(
          (s) => SearchResultItem(
            id: 'nav-${s.$1}',
            kind: SearchResultKind.navigation,
            title: s.$2,
            subtitle: 'Navigate',
            route: s.$3,
            icon: s.$4,
          ),
        )
        .toList();
  }

  bool _matchesQuery(String text, ParsedSearchQuery parsed) {
    if (parsed.rawQuery.isEmpty) return true;
    final lower = text.toLowerCase();
    for (final term in parsed.expandedTerms) {
      if (lower.contains(term)) return true;
    }
    return UniversalSearchEngine.scoreMatch(
          haystack: text,
          terms: parsed.expandedTerms,
          rawQuery: parsed.rawQuery,
        ) >
        0;
  }

  int? _categoryIdForHint(String? hint) {
    if (hint == null) return null;
    return switch (hint) {
      'food' => 1,
      _ => null,
    };
  }

  SearchExpenseSort _mapSort(SearchSort sort) => switch (sort) {
        SearchSort.oldest => SearchExpenseSort.oldest,
        SearchSort.highestAmount => SearchExpenseSort.highestAmount,
        SearchSort.lowestAmount => SearchExpenseSort.lowestAmount,
        SearchSort.alphabetical => SearchExpenseSort.alphabetical,
        _ => SearchExpenseSort.newest,
      };
}

final searchQueryProvider = StateProvider<String>((ref) => '');

final searchFiltersProvider =
    StateProvider<SearchFilters>((ref) => const SearchFilters());

final universalSearchReportProvider =
    FutureProvider.family<UniversalSearchReport, String>((ref, query) async {
  final filters = ref.watch(searchFiltersProvider);
  return ref.read(universalSearchRepositoryProvider).search(
        query: query,
        filters: filters,
      );
});

final debouncedSearchQueryProvider =
    StateProvider<String>((ref) => '');
