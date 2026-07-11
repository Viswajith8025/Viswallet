import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:rupee_track/core/database/daos/expenses_dao.dart';
import 'package:rupee_track/core/database/app_database.dart';
import 'package:rupee_track/core/design_system/context_banner.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_app_bar.dart';
import 'package:rupee_track/core/design_system/premium_card.dart';
import 'package:rupee_track/core/design_system/premium_chip.dart';
import 'package:rupee_track/core/design_system/premium_list_tile.dart';
import 'package:rupee_track/core/design_system/skeleton_loader.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/core/design_system/shell_bottom_inset.dart';
import 'package:rupee_track/core/providers/salary_cycle_provider.dart';
import 'package:rupee_track/core/providers/settings_provider.dart';
import 'package:rupee_track/core/utils/date_utils.dart';
import 'package:rupee_track/core/widgets/empty_state.dart';
import 'package:rupee_track/core/widgets/error_state.dart';
import 'package:rupee_track/core/widgets/money_text.dart';
import 'package:rupee_track/features/expenses/data/expense_repository.dart';
import 'package:rupee_track/features/expenses/domain/expense_date_filter.dart';
import 'package:rupee_track/features/expenses/domain/expense_day_grouping.dart';
import 'package:rupee_track/features/expenses/domain/expense_display_utils.dart';
import 'package:rupee_track/features/quick_add/presentation/quick_add_hub_sheet.dart';
import 'package:rupee_track/features/smart_tagging/domain/classification_models.dart';
import 'package:rupee_track/features/expenses/presentation/widgets/expense_delete_utils.dart';
import 'package:rupee_track/features/smart_tagging/presentation/expense_correction_sheet.dart';

class ExpenseListScreen extends ConsumerWidget {
  const ExpenseListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filter = ref.watch(expenseDateFilterProvider);
    final salaryDay = ref.watch(salaryDayProvider);
    final settings = ref.watch(appSettingsProvider).valueOrNull;
    final swipeLocked = ref.watch(expenseSwipeDeleteLockedProvider);
    final expensesAsync = ref.watch(expensesForDateFilterProvider);
    final timeFormat = DateFormat('h:mm a');
    final todayIst = nowIst();
    final headerDate = DateFormat('EEEE, d MMM').format(todayIst);

    return Scaffold(
      appBar: PremiumAppBar(
        title: 'Expenses',
        subtitle: 'Track what you spend · $headerDate',
        actions: [
          IconButton(
            icon: Icon(
              swipeLocked ? Icons.lock_rounded : Icons.lock_open_rounded,
            ),
            tooltip: swipeLocked
                ? 'Swipe delete locked — tap to unlock'
                : 'Swipe delete unlocked — tap to lock',
            onPressed: () => ref
                .read(expenseSwipeDeleteLockedProvider.notifier)
                .toggle(),
          ),
          IconButton(
            icon: const Icon(Icons.add_rounded),
            onPressed: () => showQuickAddSheet(context, ref),
            tooltip: 'Add expense',
          ),
        ],
      ),
      body: ResponsiveBody(
        padding: EdgeInsets.zero,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                0,
                AppSpacing.sm,
                0,
                AppSpacing.xs,
              ),
              child: Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: [
                  PremiumFilterChip(
                    label: 'Today',
                    selected: filter.mode == ExpenseDateFilterMode.today,
                    onSelected: (_) =>
                        ref.read(expenseDateFilterProvider.notifier).setToday(),
                  ),
                  PremiumFilterChip(
                    label: 'Date range',
                    selected: filter.mode == ExpenseDateFilterMode.dateRange,
                    onSelected: (_) => _pickDateRange(context, ref, filter),
                  ),
                  PremiumFilterChip(
                    label: 'Pay cycle',
                    selected: filter.mode == ExpenseDateFilterMode.payCycle,
                    onSelected: (_) => ref
                        .read(expenseDateFilterProvider.notifier)
                        .setPayCycle(),
                  ),
                ],
              ),
            ),
            ContextBanner(
              icon: swipeLocked ? Icons.lock_rounded : Icons.swipe_left_rounded,
              message: _filterHint(filter, salaryDay, swipeLocked: swipeLocked),
            ),
            Expanded(
              child: expensesAsync.when(
                loading: () => ListView.separated(
                  padding: ShellBottomInset.bottomOnly(context),
                  itemCount: 8,
                  separatorBuilder: (_, __) =>
                      const SizedBox(height: AppSpacing.xs),
                  itemBuilder: (_, __) => const SkeletonCard(height: 80),
                ),
                error: (e, _) => ErrorState(
                  message: 'We couldn\'t load your expenses.',
                  onRetry: () => ref.invalidate(expensesForDateFilterProvider),
                ),
                data: (expenses) {
                  if (expenses.isEmpty) {
                    return EmptyStates.expenses(
                      onAdd: () => showQuickAddSheet(context, ref),
                    );
                  }

                  final totalPaise = expenses.fold<int>(
                    0,
                    (sum, e) => sum + e.expense.amountPaise,
                  );
                  final dayGroups = groupExpensesByIstDay(expenses);
                  final listChildren = <Widget>[
                    _ExpenseSummaryCard(
                      totalPaise: totalPaise,
                      count: expenses.length,
                      periodLabel: filter.label(salaryDay: salaryDay),
                    ),
                  ];

                  for (final group in dayGroups) {
                    listChildren.add(
                      PremiumSectionHeader(
                        title: expenseDayHeaderLabel(
                          group.istDay,
                          todayIst: todayIst,
                        ),
                        subtitle: filter.mode == ExpenseDateFilterMode.payCycle
                            ? '${group.items.length} ${group.items.length == 1 ? 'expense' : 'expenses'}'
                            : null,
                        trailing: MoneyText(
                          group.totalPaise,
                          compact: true,
                          color: context.semanticColors.expense,
                          style: AppTypography.moneyCompact(
                            context,
                            color: context.semanticColors.expense,
                          ),
                        ),
                      ),
                    );

                    for (final item in group.items) {
                      listChildren.add(
                        _buildExpenseRow(
                          context: context,
                          ref: ref,
                          item: item,
                          settings: settings,
                          timeFormat: timeFormat,
                          swipeLocked: swipeLocked,
                        ),
                      );
                      listChildren.add(const SizedBox(height: AppSpacing.xs));
                    }
                    listChildren.add(const SizedBox(height: AppSpacing.sm));
                  }

                  return ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: EdgeInsets.only(
                      top: AppSpacing.xs,
                      bottom: ShellBottomInset.scrollBottom(context),
                    ),
                    children: listChildren,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildExpenseRow({
    required BuildContext context,
    required WidgetRef ref,
    required ExpenseWithCategory item,
    required AppSettingsTableData? settings,
    required DateFormat timeFormat,
    required bool swipeLocked,
  }) {
    final expense = item.expense;
    final tags = parseTagsJson(expense.tags);
    final amountLabels = settings == null
        ? <String>[]
        : expenseAmountLabels(
            settings: settings,
            amountPaise: expense.amountPaise,
          );
    final displayTags = expenseDisplayTags(
      title: expense.title,
      categoryName: item.category.name,
      amountLabels: amountLabels,
      classificationTags: tags,
    );
    final subtitle = expenseDisplaySubtitle(
      categoryName: item.category.name,
      title: expense.title,
      meta: timeFormat.format(expense.occurredAt.toLocal()),
    );

    final tile = PremiumExpenseTile(
      title: expense.title,
      amountPaise: expense.amountPaise,
      categoryName: item.category.name,
      categoryColor: item.category.colorValue,
      categoryIconName: item.category.iconName,
      subtitle: subtitle,
      tags: displayTags,
      onTap: () => showExpenseCorrectionSheet(context, ref, item),
    );

    if (swipeLocked) return tile;

    return Dismissible(
      key: ValueKey(expense.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: AppSpacing.lg),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.errorContainer,
          borderRadius: BorderRadius.circular(AppRadius.card),
        ),
        child: Icon(
          Icons.delete_outline_rounded,
          color: Theme.of(context).colorScheme.error,
        ),
      ),
      confirmDismiss: (_) => confirmDeleteExpense(context),
      onDismissed: (_) => deleteExpenseWithFeedback(
        context,
        ref,
        expense.id,
        skipConfirm: true,
      ),
      child: tile,
    );
  }

  String _filterHint(
    ExpenseDateFilter filter,
    int salaryDay, {
    required bool swipeLocked,
  }) {
    if (swipeLocked) {
      return switch (filter.mode) {
        ExpenseDateFilterMode.today =>
          'Swipe delete is locked. Tap an expense to edit or delete.',
        ExpenseDateFilterMode.dateRange =>
          '${filter.label(salaryDay: salaryDay)}. Tap a row to edit or delete.',
        ExpenseDateFilterMode.payCycle =>
          'Pay cycle (${filter.label(salaryDay: salaryDay)}). Tap a row to edit or delete.',
      };
    }

    return switch (filter.mode) {
      ExpenseDateFilterMode.today =>
        'Grouped by day · swipe left to delete, or tap to edit.',
      ExpenseDateFilterMode.dateRange =>
        'Showing ${filter.label(salaryDay: salaryDay)} · grouped by day.',
      ExpenseDateFilterMode.payCycle =>
        'This pay cycle (${filter.label(salaryDay: salaryDay)}) · grouped by day.',
    };
  }

  Future<void> _pickDateRange(
    BuildContext context,
    WidgetRef ref,
    ExpenseDateFilter filter,
  ) async {
    final now = DateTime.now();
    final initialStart = filter.rangeStart ?? now.subtract(const Duration(days: 6));
    final initialEnd = filter.rangeEnd ?? now;
    final range = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: now.add(const Duration(days: 1)),
      initialDateRange: DateTimeRange(
        start: initialStart.isBefore(initialEnd) ? initialStart : initialEnd,
        end: initialStart.isBefore(initialEnd) ? initialEnd : initialStart,
      ),
      helpText: 'Select date range',
    );
    if (range != null) {
      ref.read(expenseDateFilterProvider.notifier).setDateRange(
            start: range.start,
            end: range.end,
          );
    }
  }
}

class _ExpenseSummaryCard extends StatelessWidget {
  const _ExpenseSummaryCard({
    required this.totalPaise,
    required this.count,
    required this.periodLabel,
  });

  final int totalPaise;
  final int count;
  final String periodLabel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final expenseColor = context.semanticColors.expense;

    return PremiumCard(
      variant: PremiumCardVariant.tinted,
      tintColor: expenseColor,
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  periodLabel,
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                MoneyText(
                  totalPaise,
                  color: expenseColor,
                  style: AppTypography.moneyHero(context, color: expenseColor),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.sm,
            ),
            decoration: BoxDecoration(
              color: expenseColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppRadius.pill),
            ),
            child: Text(
              '$count ${count == 1 ? 'item' : 'items'}',
              style: theme.textTheme.labelLarge?.copyWith(
                fontWeight: FontWeight.w700,
                color: expenseColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
