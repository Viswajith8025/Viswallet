import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rupee_track/core/utils/date_utils.dart';
import 'package:rupee_track/features/trends/domain/spending_trends_engine.dart';

enum ExpenseDateFilterMode { today, dateRange, payCycle }

class ExpenseDateFilter {
  const ExpenseDateFilter({
    this.mode = ExpenseDateFilterMode.today,
    this.rangeStart,
    this.rangeEnd,
  });

  final ExpenseDateFilterMode mode;
  final DateTime? rangeStart;
  final DateTime? rangeEnd;

  ExpenseDateFilter copyWith({
    ExpenseDateFilterMode? mode,
    DateTime? rangeStart,
    DateTime? rangeEnd,
    bool clearRange = false,
  }) {
    return ExpenseDateFilter(
      mode: mode ?? this.mode,
      rangeStart: clearRange ? null : (rangeStart ?? this.rangeStart),
      rangeEnd: clearRange ? null : (rangeEnd ?? this.rangeEnd),
    );
  }

  (DateTime startUtc, DateTime endUtc) boundsUtc({required int salaryDay}) {
    switch (mode) {
      case ExpenseDateFilterMode.today:
        return istDayBoundsUtc(DateTime.now());
      case ExpenseDateFilterMode.dateRange:
        final start = rangeStart ?? DateTime.now();
        final end = rangeEnd ?? start;
        final normalizedStart = start.isBefore(end) ? start : end;
        final normalizedEnd = start.isBefore(end) ? end : start;
        final startBounds = istDayBoundsUtc(normalizedStart);
        final endBounds = istDayBoundsUtc(normalizedEnd);
        return (startBounds.$1, endBounds.$2);
      case ExpenseDateFilterMode.payCycle:
        final cycleKey = currentCycleKey(salaryDay: salaryDay);
        final bounds = SpendingTrendsEngine.cycleBoundsUtc(
          cycleKey,
          salaryDay: salaryDay,
        );
        return (bounds.startUtc, bounds.endUtc);
    }
  }

  String label({required int salaryDay}) {
    switch (mode) {
      case ExpenseDateFilterMode.today:
        final today = nowIst();
        return 'Today · ${today.day} ${_monthShort(today.month)}';
      case ExpenseDateFilterMode.dateRange:
        return _rangeLabel();
      case ExpenseDateFilterMode.payCycle:
        return formatCycleLabelShort(
          currentCycleKey(salaryDay: salaryDay),
          salaryDay: salaryDay,
        );
    }
  }

  String _rangeLabel() {
    final start = toIst(rangeStart ?? DateTime.now());
    final end = toIst(rangeEnd ?? rangeStart ?? DateTime.now());
    final sameYear = start.year == end.year;
    final sameMonth = sameYear && start.month == end.month;
    final sameDay = sameMonth && start.day == end.day;

    if (sameDay) {
      return '${start.day} ${_monthShort(start.month)} ${start.year}';
    }
    if (sameMonth) {
      return '${start.day}–${end.day} ${_monthShort(end.month)} ${end.year}';
    }
    if (sameYear) {
      return '${start.day} ${_monthShort(start.month)} – '
          '${end.day} ${_monthShort(end.month)} ${end.year}';
    }
    return '${start.day} ${_monthShort(start.month)} ${start.year} – '
        '${end.day} ${_monthShort(end.month)} ${end.year}';
  }

  static String _monthShort(int month) => const [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ][month - 1];
}

final expenseDateFilterProvider =
    NotifierProvider<ExpenseDateFilterNotifier, ExpenseDateFilter>(
  ExpenseDateFilterNotifier.new,
);

class ExpenseDateFilterNotifier extends Notifier<ExpenseDateFilter> {
  @override
  ExpenseDateFilter build() => const ExpenseDateFilter();

  void setToday() => state = const ExpenseDateFilter(mode: ExpenseDateFilterMode.today);

  void setPayCycle() =>
      state = const ExpenseDateFilter(mode: ExpenseDateFilterMode.payCycle);

  void setDateRange({required DateTime start, required DateTime end}) {
    final normalizedStart = start.isBefore(end) ? start : end;
    final normalizedEnd = start.isBefore(end) ? end : start;
    state = ExpenseDateFilter(
      mode: ExpenseDateFilterMode.dateRange,
      rangeStart: normalizedStart,
      rangeEnd: normalizedEnd,
    );
  }
}
