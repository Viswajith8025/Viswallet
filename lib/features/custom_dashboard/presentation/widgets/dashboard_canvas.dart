import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/core/design_system/shell_bottom_inset.dart';
import 'package:rupee_track/core/providers/salary_cycle_provider.dart';
import 'package:rupee_track/features/custom_dashboard/data/dashboard_layout_repository.dart';
import 'package:rupee_track/features/custom_dashboard/domain/dashboard_layout_models.dart';
import 'package:rupee_track/features/custom_dashboard/presentation/widgets/dashboard_quick_actions_bar.dart';
import 'package:rupee_track/features/custom_dashboard/presentation/widgets/dashboard_widget_shell.dart';
import 'package:rupee_track/features/dashboard/data/dashboard_repository.dart';
import 'package:rupee_track/features/safe_spend/data/safe_spend_repository.dart';
class DashboardCanvas extends ConsumerWidget {
  const DashboardCanvas({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final layout = ref.watch(dashboardLayoutProvider);
    final editMode = ref.watch(dashboardEditModeProvider);
    final cycleKey = ref.watch(selectedCycleKeyProvider);
    final visible = layout.visibleWidgets;
    final useTwoColumn = _useTwoColumn(context, layout.layoutMode);

    if (editMode) {
      return Column(
        children: [
          const _EditModeBanner(),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => _refresh(ref, cycleKey),
              child: _ReorderableList(
                visible: visible,
                layout: layout,
                editMode: true,
                showQuickActions: layout.quickActionsPinned,
              ),
            ),
          ),
        ],
      );
    }

    return RefreshIndicator(
      onRefresh: () => _refresh(ref, cycleKey),
      child: useTwoColumn
          ? _TwoColumnBody(
              visible: visible,
              layout: layout,
              showQuickActions: layout.quickActionsPinned,
            )
          : _SingleColumnBody(
              visible: visible,
              layout: layout,
              showQuickActions: layout.quickActionsPinned,
            ),
    );
  }

  Future<void> _refresh(WidgetRef ref, String cycleKey) async {
    ref.invalidate(monthlySummaryProvider(cycleKey));
    ref.invalidate(safeSpendProvider(cycleKey));
  }

  bool _useTwoColumn(BuildContext context, DashboardLayoutMode mode) {
    if (!AppResponsive.isMediumOrWider(context)) return false;
    if (mode == DashboardLayoutMode.singleColumn) return false;
    if (mode == DashboardLayoutMode.twoColumn ||
        mode == DashboardLayoutMode.grid) {
      return true;
    }
    return true;
  }
}

EdgeInsets _dashboardListPadding(BuildContext context) {
  return const EdgeInsets.only(top: AppSpacing.sm);
}

Widget _dashboardScrollShell(BuildContext context, Widget child) {
  return ResponsiveBody(
    padding: ShellBottomInset.bottomOnly(context),
    child: child,
  );
}

class _EditModeBanner extends StatelessWidget {
  const _EditModeBanner();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(
        AppSpacing.screenHorizontal,
        AppSpacing.sm,
        AppSpacing.screenHorizontal,
        AppSpacing.sm,
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Text(
        'Hold a widget for 3 seconds, then drag to reorder · Tap ⋮⋮ to edit',
        style: theme.textTheme.labelMedium,
        textAlign: TextAlign.center,
      ),
    );
  }
}

class _SingleColumnBody extends ConsumerWidget {
  const _SingleColumnBody({
    required this.visible,
    required this.layout,
    required this.showQuickActions,
  });

  final List<DashboardWidgetInstance> visible;
  final DashboardLayoutConfig layout;
  final bool showQuickActions;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final editMode = ref.watch(dashboardEditModeProvider);

    return _dashboardScrollShell(
      context,
      ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: _dashboardListPadding(context),
        children: [
          if (showQuickActions) ...[
            const DashboardQuickActionsBar(),
            const SizedBox(height: AppSpacing.sm),
          ],
          ...visible.map(
            (w) => DashboardWidgetShell(
              key: ValueKey(w.id),
              instance: w,
              editMode: editMode,
              density: layout.density,
            ),
          ),
        ],
      ),
    );
  }
}

class _TwoColumnBody extends ConsumerWidget {
  const _TwoColumnBody({
    required this.visible,
    required this.layout,
    required this.showQuickActions,
  });

  final List<DashboardWidgetInstance> visible;
  final DashboardLayoutConfig layout;
  final bool showQuickActions;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final editMode = ref.watch(dashboardEditModeProvider);
    final rows = _chunkRows(visible);

    return _dashboardScrollShell(
      context,
      ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: _dashboardListPadding(context),
        children: [
          if (showQuickActions) ...[
            const DashboardQuickActionsBar(),
            const SizedBox(height: AppSpacing.sm),
          ],
          ...rows.map((row) {
            if (row.length == 1 || row.first.pinned) {
              return DashboardWidgetShell(
                key: ValueKey(row.first.id),
                instance: row.first,
                editMode: editMode,
                density: layout.density,
              );
            }
            return IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  for (var i = 0; i < row.length; i++)
                    Expanded(
                      child: DashboardWidgetShell(
                        key: ValueKey(row[i].id),
                        instance: row[i],
                        editMode: editMode,
                        density: layout.density,
                      ),
                    ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  List<List<DashboardWidgetInstance>> _chunkRows(
    List<DashboardWidgetInstance> items,
  ) {
    final rows = <List<DashboardWidgetInstance>>[];
    var i = 0;
    while (i < items.length) {
      final current = items[i];
      if (current.pinned || !current.isHalfWidth) {
        rows.add([current]);
        i++;
        continue;
      }
      if (i + 1 < items.length && items[i + 1].isHalfWidth) {
        rows.add([current, items[i + 1]]);
        i += 2;
      } else {
        rows.add([current]);
        i++;
      }
    }
    return rows;
  }
}

class _ReorderableList extends ConsumerWidget {
  const _ReorderableList({
    required this.visible,
    required this.layout,
    required this.editMode,
    required this.showQuickActions,
  });

  final List<DashboardWidgetInstance> visible;
  final DashboardLayoutConfig layout;
  final bool editMode;
  final bool showQuickActions;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final headerCount = showQuickActions ? 1 : 0;
    return _dashboardScrollShell(
      context,
      ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: _dashboardListPadding(context),
        itemCount: visible.length + headerCount,
        itemBuilder: (context, index) {
          if (showQuickActions && index == 0) {
            return const Column(
              children: [
                DashboardQuickActionsBar(),
                SizedBox(height: AppSpacing.sm),
              ],
            );
          }
          final widgetIndex = index - headerCount;
          final w = visible[widgetIndex];
          return _EditModeDraggableWidget(
            key: ValueKey(w.id),
            index: widgetIndex,
            onReorder: (from, to) {
              if (from == to) return;
              final newIndex = from < to ? to + 1 : to;
              ref.read(dashboardLayoutProvider.notifier).reorder(from, newIndex);
            },
            child: DashboardWidgetShell(
              instance: w,
              editMode: editMode,
              density: layout.density,
            ),
          );
        },
      ),
    );
  }
}

/// Long-press drag reorder that does not compete with list scrolling.
class _EditModeDraggableWidget extends StatefulWidget {
  const _EditModeDraggableWidget({
    required this.index,
    required this.onReorder,
    required this.child,
    super.key,
  });

  static const holdDuration = Duration(seconds: 3);

  final int index;
  final void Function(int from, int to) onReorder;
  final Widget child;

  @override
  State<_EditModeDraggableWidget> createState() =>
      _EditModeDraggableWidgetState();
}

class _EditModeDraggableWidgetState extends State<_EditModeDraggableWidget> {
  bool _isDragTarget = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final width = MediaQuery.sizeOf(context).width -
        AppSpacing.screenHorizontal * 2;

    return DragTarget<int>(
      onWillAcceptWithDetails: (details) => details.data != widget.index,
      onAcceptWithDetails: (details) {
        widget.onReorder(details.data, widget.index);
      },
      onMove: (_) {
        if (!_isDragTarget) setState(() => _isDragTarget = true);
      },
      onLeave: (_) {
        if (_isDragTarget) setState(() => _isDragTarget = false);
      },
      builder: (context, candidateData, rejectedData) {
        final highlighted = candidateData.isNotEmpty || _isDragTarget;
        return AnimatedContainer(
          duration: AppDurations.fast,
          decoration: highlighted
              ? BoxDecoration(
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  border: Border.all(
                    color: theme.colorScheme.primary.withValues(alpha: 0.65),
                    width: 2,
                  ),
                )
              : null,
          child: LongPressDraggable<int>(
            delay: _EditModeDraggableWidget.holdDuration,
            data: widget.index,
            hapticFeedbackOnStart: true,
            feedback: Material(
              elevation: 8,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              clipBehavior: Clip.antiAlias,
              child: SizedBox(width: width, child: widget.child),
            ),
            childWhenDragging: Opacity(
              opacity: 0.35,
              child: widget.child,
            ),
            child: widget.child,
          ),
        );
      },
    );
  }
}
