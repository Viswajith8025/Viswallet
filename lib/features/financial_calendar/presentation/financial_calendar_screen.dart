import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_app_bar.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/core/design_system/skeleton_loader.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/core/widgets/error_state.dart';
import 'package:rupee_track/features/financial_calendar/data/financial_calendar_repository.dart';
import 'package:rupee_track/features/financial_calendar/domain/financial_calendar_models.dart';
import 'package:rupee_track/features/financial_calendar/presentation/widgets/calendar_agenda_view.dart';
import 'package:rupee_track/features/financial_calendar/presentation/widgets/calendar_day_detail_sheet.dart';
import 'package:rupee_track/features/financial_calendar/presentation/widgets/calendar_day_view.dart';
import 'package:rupee_track/features/financial_calendar/presentation/widgets/calendar_filters_sheet.dart';
import 'package:rupee_track/features/financial_calendar/presentation/widgets/calendar_month_grid.dart';
import 'package:rupee_track/features/financial_calendar/presentation/widgets/calendar_month_overview_card.dart';
import 'package:rupee_track/features/financial_calendar/presentation/widgets/calendar_week_view.dart';
import 'package:rupee_track/features/quick_add/presentation/quick_add_hub_sheet.dart';

class FinancialCalendarScreen extends ConsumerWidget {
  const FinancialCalendarScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final focused = ref.watch(calendarFocusedMonthProvider);
    final viewMode = ref.watch(calendarViewModeProvider);
    final filters = ref.watch(calendarFiltersProvider);
    final query = (year: focused.year, month: focused.month);
    final monthAsync = ref.watch(financialCalendarMonthProvider(query));
    final theme = Theme.of(context);

    return Scaffold(
      appBar: PremiumAppBar(
        title: 'Financial calendar',
        subtitle: 'Your money timeline',
        actions: [
          IconButton(
            tooltip: 'Filters',
            onPressed: () => showCalendarFiltersSheet(context, ref),
            icon: Badge(
              isLabelVisible: filters.hasActiveFilters,
              child: const Icon(Icons.filter_list_rounded),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showQuickAddSheet(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Quick add'),
      ),
      body: ResponsiveBody(
        child: monthAsync.when(
          loading: () => ListView(
            children: const [
              SkeletonCard(height: 120),
              SizedBox(height: AppSpacing.md),
              SkeletonCard(height: 320),
            ],
          ),
          error: (e, _) => ErrorState(
            message: 'We couldn\'t load your financial calendar.',
            onRetry: () => ref.invalidate(financialCalendarMonthProvider),
          ),
          data: (month) {
            return RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(financialCalendarMonthProvider);
                ref.invalidate(calendarDaySummaryProvider);
              },
              child: ListView(
                padding: const EdgeInsets.only(bottom: AppSpacing.xxxl),
                children: [
                  _ViewModeSwitcher(
                    mode: viewMode,
                    onChanged: (m) =>
                        ref.read(calendarViewModeProvider.notifier).state = m,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  _MonthNavigator(
                    year: month.year,
                    month: month.month,
                    cycleLabel: month.overview.cycleLabel,
                    onPrevious: () => _shiftMonth(ref, -1),
                    onNext: () => _shiftMonth(ref, 1),
                    onToday: () {
                      final now = DateTime.now();
                      ref.read(calendarFocusedMonthProvider.notifier).state =
                          DateTime(now.year, now.month);
                      ref.read(calendarSelectedDayProvider.notifier).state =
                          DateTime(now.year, now.month, now.day);
                    },
                  ),
                  const SizedBox(height: AppSpacing.md),
                  CalendarMonthOverviewCard(overview: month.overview),
                  const SizedBox(height: AppSpacing.md),
                  AnimatedSwitcher(
                    duration: AppDurations.normal,
                    switchInCurve: AppCurves.enter,
                    switchOutCurve: AppCurves.exit,
                    child: switch (viewMode) {
                      CalendarViewMode.month => CalendarMonthGrid(
                          key: const ValueKey('month'),
                          cells: month.days,
                          onDayTap: (day) => _onDayTap(context, ref, day),
                        ),
                      CalendarViewMode.week => CalendarWeekView(
                          key: const ValueKey('week'),
                          cells: month.days,
                          selectedDay: ref.watch(calendarSelectedDayProvider),
                          onDayTap: (day) => _onDayTap(context, ref, day),
                        ),
                      CalendarViewMode.day => CalendarDayView(
                          key: const ValueKey('day'),
                          day: ref.watch(calendarSelectedDayProvider),
                          events: month.agendaEvents,
                          onQuickAdd: () => showQuickAddSheet(context, ref),
                        ),
                      CalendarViewMode.agenda => CalendarAgendaView(
                          key: const ValueKey('agenda'),
                          events: month.agendaEvents,
                          onDayTap: (day) => _onDayTap(context, ref, day),
                        ),
                    },
                  ),
                  const SizedBox(height: AppSpacing.md),
                  _QuickLinks(theme: theme),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  void _shiftMonth(WidgetRef ref, int delta) {
    final focused = ref.read(calendarFocusedMonthProvider);
    final next = DateTime(focused.year, focused.month + delta);
    ref.read(calendarFocusedMonthProvider.notifier).state = next;
  }

  void _onDayTap(BuildContext context, WidgetRef ref, DateTime day) {
    ref.read(calendarSelectedDayProvider.notifier).state = day;
    if (day.month != ref.read(calendarFocusedMonthProvider).month ||
        day.year != ref.read(calendarFocusedMonthProvider).year) {
      ref.read(calendarFocusedMonthProvider.notifier).state =
          DateTime(day.year, day.month);
    }
    showCalendarDayDetailSheet(context, ref, day);
  }
}

class _ViewModeSwitcher extends StatelessWidget {
  const _ViewModeSwitcher({
    required this.mode,
    required this.onChanged,
  });

  final CalendarViewMode mode;
  final ValueChanged<CalendarViewMode> onChanged;

  @override
  Widget build(BuildContext context) {
    final width = AppResponsive.screenWidth(context);
    final iconOnly = width < AppBreakpoints.medium;

    return Scrollbar(
      thumbVisibility: true,
      trackVisibility: true,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: SegmentedButton<CalendarViewMode>(
          showSelectedIcon: false,
          style: SegmentedButton.styleFrom(
            visualDensity: VisualDensity.compact,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            padding: EdgeInsets.symmetric(
              horizontal: iconOnly ? AppSpacing.sm : AppSpacing.md,
              vertical: AppSpacing.sm,
            ),
          ),
          segments: [
            ButtonSegment(
              value: CalendarViewMode.month,
              label: iconOnly
                  ? null
                  : const Text(
                      'Month',
                      maxLines: 1,
                      softWrap: false,
                    ),
              icon: const Icon(Icons.calendar_month_outlined, size: 18),
              tooltip: 'Month',
            ),
            ButtonSegment(
              value: CalendarViewMode.week,
              label: iconOnly
                  ? null
                  : const Text(
                      'Week',
                      maxLines: 1,
                      softWrap: false,
                    ),
              icon: const Icon(Icons.view_week_outlined, size: 18),
              tooltip: 'Week',
            ),
            ButtonSegment(
              value: CalendarViewMode.day,
              label: iconOnly
                  ? null
                  : const Text(
                      'Day',
                      maxLines: 1,
                      softWrap: false,
                    ),
              icon: const Icon(Icons.today_outlined, size: 18),
              tooltip: 'Day',
            ),
            ButtonSegment(
              value: CalendarViewMode.agenda,
              label: iconOnly
                  ? null
                  : const Text(
                      'Agenda',
                      maxLines: 1,
                      softWrap: false,
                    ),
              icon: const Icon(Icons.list_alt_rounded, size: 18),
              tooltip: 'Agenda',
            ),
          ],
          selected: {mode},
          onSelectionChanged: (value) => onChanged(value.first),
        ),
      ),
    );
  }
}

class _MonthNavigator extends StatelessWidget {
  const _MonthNavigator({
    required this.year,
    required this.month,
    required this.cycleLabel,
    required this.onPrevious,
    required this.onNext,
    required this.onToday,
  });

  final int year;
  final int month;
  final String cycleLabel;
  final VoidCallback onPrevious;
  final VoidCallback onNext;
  final VoidCallback onToday;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final label = DateFormat.yMMMM().format(DateTime(year, month));

    return Row(
      children: [
        IconButton(onPressed: onPrevious, icon: const Icon(Icons.chevron_left)),
        Expanded(
          child: Column(
            children: [
              Text(
                label,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                cycleLabel,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        TextButton(onPressed: onToday, child: const Text('Today')),
        IconButton(onPressed: onNext, icon: const Icon(Icons.chevron_right)),
      ],
    );
  }
}

class _QuickLinks extends StatelessWidget {
  const _QuickLinks({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: AppSpacing.sm,
      runSpacing: AppSpacing.sm,
      children: [
        ActionChip(
          avatar: const Icon(Icons.subscriptions_outlined, size: 18),
          label: const Text('Subscriptions'),
          onPressed: () => context.push(AppRoutes.subscriptions),
        ),
        ActionChip(
          avatar: const Icon(Icons.replay_circle_filled_outlined, size: 18),
          label: const Text('Borrowed'),
          onPressed: () => context.push(AppRoutes.borrowed),
        ),
        ActionChip(
          avatar: const Icon(Icons.handshake_outlined, size: 18),
          label: const Text('Lent'),
          onPressed: () => context.push(AppRoutes.loans),
        ),
        ActionChip(
          avatar: const Icon(Icons.insights_outlined, size: 18),
          label: const Text('Insights'),
          onPressed: () => context.push(AppRoutes.insights),
        ),
        ActionChip(
          avatar: const Icon(Icons.description_outlined, size: 18),
          label: const Text('Monthly report'),
          onPressed: () => context.push(AppRoutes.monthlyReport),
        ),
      ],
    );
  }
}
