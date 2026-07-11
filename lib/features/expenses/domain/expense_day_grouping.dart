import 'package:intl/intl.dart';
import 'package:rupee_track/core/database/daos/expenses_dao.dart';
import 'package:rupee_track/core/utils/date_utils.dart';

/// One IST calendar day of expenses (newest days first in lists).
class ExpenseDayGroup {
  const ExpenseDayGroup({
    required this.istDay,
    required this.items,
  });

  final DateTime istDay;
  final List<ExpenseWithCategory> items;

  int get totalPaise => items.fold<int>(
        0,
        (int sum, ExpenseWithCategory row) => sum + row.expense.amountPaise,
      );
}

List<ExpenseDayGroup> groupExpensesByIstDay(
  List<ExpenseWithCategory> expenses,
) {
  final buckets = <DateTime, List<ExpenseWithCategory>>{};
  for (final item in expenses) {
    final ist = toIst(item.expense.occurredAt);
    final day = DateTime(ist.year, ist.month, ist.day);
    buckets.putIfAbsent(day, () => []).add(item);
  }

  final days = buckets.keys.toList()..sort((a, b) => b.compareTo(a));
  return days
      .map((day) => ExpenseDayGroup(istDay: day, items: buckets[day]!))
      .toList();
}

String expenseDayHeaderLabel(DateTime istDay, {DateTime? todayIst}) {
  final today = todayIst ?? nowIst();
  final todayDate = DateTime(today.year, today.month, today.day);
  final yesterday = todayDate.subtract(const Duration(days: 1));

  if (istDay == todayDate) return 'Today';
  if (istDay == yesterday) return 'Yesterday';
  return DateFormat('EEEE, d MMM').format(istDay);
}
