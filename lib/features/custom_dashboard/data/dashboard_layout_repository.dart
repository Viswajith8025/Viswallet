import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rupee_track/features/cloud_backup/data/cloud_backup_coordinator.dart';
import 'package:rupee_track/features/custom_dashboard/data/dashboard_layout_store.dart';
import 'package:rupee_track/features/custom_dashboard/domain/dashboard_layout_models.dart';
import 'package:rupee_track/features/custom_dashboard/domain/dashboard_templates.dart';

final dashboardLayoutStoreProvider =
    Provider<DashboardLayoutStore>((ref) => DashboardLayoutStore());

final dashboardEditModeProvider = StateProvider<bool>((ref) => false);

final dashboardLayoutProvider =
    StateNotifierProvider<DashboardLayoutNotifier, DashboardLayoutConfig>((ref) {
  return DashboardLayoutNotifier(ref);
});

class DashboardLayoutNotifier extends StateNotifier<DashboardLayoutConfig> {
  DashboardLayoutNotifier(this._ref)
      : super(DashboardTemplates.defaults()) {
    _load();
  }

  final Ref _ref;

  Future<void> _load() async {
    var stored = await _ref.read(dashboardLayoutStoreProvider).load();
    if (stored != null && DashboardTemplates.shouldUpgradeFromSlimHome(stored)) {
      stored = DashboardTemplates.defaults();
      await _ref.read(dashboardLayoutStoreProvider).save(stored);
    }
    if (stored != null && DashboardTemplates.shouldUpgradeFromBloatedDefault(stored)) {
      stored = DashboardTemplates.defaults();
      await _ref.read(dashboardLayoutStoreProvider).save(stored);
    }
    if (stored != null &&
        DashboardTemplates.shouldUpgradeFromPriorEightWidgetDefault(stored)) {
      stored = DashboardTemplates.defaults();
      await _ref.read(dashboardLayoutStoreProvider).save(stored);
    }
    if (stored != null && mounted) state = stored;
  }

  Future<void> _persist() async {
    await _ref.read(dashboardLayoutStoreProvider).save(state);
    _ref.read(cloudBackupCoordinatorProvider).schedulePush();
  }

  void setLayoutMode(DashboardLayoutMode mode) {
    state = state.copyWith(layoutMode: mode);
    _persist();
  }

  void setTheme(DashboardThemePreset theme) {
    state = state.copyWith(theme: theme);
    _persist();
  }

  void setDensity(DashboardDensity density) {
    state = state.copyWith(density: density);
    _persist();
  }

  void applyTemplate(DashboardLayoutConfig template) {
    state = template;
    _persist();
  }

  void restoreDefaults() {
    state = DashboardTemplates.defaults();
    _persist();
  }

  void addWidget(DashboardWidgetType type) {
    state = state.copyWith(
      widgets: [...state.widgets, DashboardWidgetInstance.create(type)],
    );
    _persist();
  }

  void removeWidget(String id) {
    state = state.copyWith(
      widgets: state.widgets.where((w) => w.id != id).toList(),
    );
    _persist();
  }

  void hideWidget(String id) {
    _update(id, (w) => w.copyWith(hidden: true));
  }

  void showWidget(String id) {
    _update(id, (w) => w.copyWith(hidden: false));
  }

  void duplicateWidget(String id) {
    final source = state.widgets.firstWhere((w) => w.id == id);
    final copy = source.copyWith(id: DashboardWidgetInstance.create(source.type).id);
    final index = state.widgets.indexWhere((w) => w.id == id);
    final next = [...state.widgets];
    next.insert(index + 1, copy);
    state = state.copyWith(widgets: next);
    _persist();
  }

  void updateWidget(DashboardWidgetInstance updated) {
    _update(updated.id, (_) => updated);
  }

  void toggleCollapsed(String id) {
    _update(id, (w) => w.copyWith(collapsed: !w.collapsed));
  }

  void togglePinned(String id) {
    _update(id, (w) => w.copyWith(pinned: !w.pinned));
  }

  void reorder(int oldIndex, int newIndex) {
    final visible = state.visibleWidgets;
    if (oldIndex < newIndex) newIndex -= 1;
    final item = visible.removeAt(oldIndex);
    visible.insert(newIndex, item);
    final hidden = state.widgets.where((w) => w.hidden).toList();
    state = state.copyWith(widgets: [...visible, ...hidden]);
    _persist();
  }

  void _update(
    String id,
    DashboardWidgetInstance Function(DashboardWidgetInstance) transform,
  ) {
    state = state.copyWith(
      widgets: state.widgets
          .map((w) => w.id == id ? transform(w) : w)
          .toList(),
    );
    _persist();
  }
}
