import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';

enum DashboardWidgetType {
  cycleHeader,
  currentBalance,
  todaySpending,
  safeDailySpend,
  budgetProgress,
  budgetSetup,
  budgetAlerts,
  summaryGrid,
  expenseCategories,
  financialHealth,
  monthlyReport,
  calendar,
  subscriptions,
  loanSummary,
  savingsForecast,
  insightsFeed,
  quickActions,
  achievements,
  wishlist,
  recentTransactions,
}

enum DashboardWidgetSize { compact, standard, large }

enum DashboardLayoutMode {
  singleColumn,
  twoColumn,
  grid,
  adaptive,
}

enum DashboardThemePreset {
  minimal,
  professional,
  analytics,
  goalsFocused,
  budgetFocused,
  student,
  business,
  custom,
}

enum DashboardDensity { compact, comfortable }

class DashboardWidgetInstance {
  const DashboardWidgetInstance({
    required this.id,
    required this.type,
    this.size = DashboardWidgetSize.standard,
    this.pinned = false,
    this.collapsed = false,
    this.hidden = false,
    this.accentArgb,
    this.transparency = 1.0,
    this.glassEffect = false,
    this.solidCard = true,
  });

  final String id;
  final DashboardWidgetType type;
  final DashboardWidgetSize size;
  final bool pinned;
  final bool collapsed;
  final bool hidden;
  final int? accentArgb;
  final double transparency;
  final bool glassEffect;
  final bool solidCard;

  bool get isHalfWidth =>
      size == DashboardWidgetSize.compact && !pinned;

  DashboardWidgetInstance copyWith({
    String? id,
    DashboardWidgetType? type,
    DashboardWidgetSize? size,
    bool? pinned,
    bool? collapsed,
    bool? hidden,
    int? accentArgb,
    bool clearAccent = false,
    double? transparency,
    bool? glassEffect,
    bool? solidCard,
  }) {
    return DashboardWidgetInstance(
      id: id ?? this.id,
      type: type ?? this.type,
      size: size ?? this.size,
      pinned: pinned ?? this.pinned,
      collapsed: collapsed ?? this.collapsed,
      hidden: hidden ?? this.hidden,
      accentArgb: clearAccent ? null : (accentArgb ?? this.accentArgb),
      transparency: transparency ?? this.transparency,
      glassEffect: glassEffect ?? this.glassEffect,
      solidCard: solidCard ?? this.solidCard,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.name,
        'size': size.name,
        'pinned': pinned,
        'collapsed': collapsed,
        'hidden': hidden,
        'accentArgb': accentArgb,
        'transparency': transparency,
        'glassEffect': glassEffect,
        'solidCard': solidCard,
      };

  factory DashboardWidgetInstance.fromJson(Map<String, dynamic> json) {
    return DashboardWidgetInstance(
      id: json['id'] as String,
      type: DashboardWidgetType.values.byName(json['type'] as String),
      size: DashboardWidgetSize.values.byName(
        json['size'] as String? ?? 'standard',
      ),
      pinned: json['pinned'] as bool? ?? false,
      collapsed: json['collapsed'] as bool? ?? false,
      hidden: json['hidden'] as bool? ?? false,
      accentArgb: json['accentArgb'] as int?,
      transparency: (json['transparency'] as num?)?.toDouble() ?? 1.0,
      glassEffect: json['glassEffect'] as bool? ?? false,
      solidCard: json['solidCard'] as bool? ?? true,
    );
  }

  static DashboardWidgetInstance create(DashboardWidgetType type) {
    return DashboardWidgetInstance(
      id: const Uuid().v4(),
      type: type,
      size: DashboardWidgetCatalog.defaultSize(type),
    );
  }
}

class DashboardLayoutConfig {
  const DashboardLayoutConfig({
    required this.widgets,
    this.layoutMode = DashboardLayoutMode.adaptive,
    this.theme = DashboardThemePreset.professional,
    this.density = DashboardDensity.comfortable,
    this.quickActionsPinned = true,
  });

  final List<DashboardWidgetInstance> widgets;
  final DashboardLayoutMode layoutMode;
  final DashboardThemePreset theme;
  final DashboardDensity density;
  final bool quickActionsPinned;

  List<DashboardWidgetInstance> get visibleWidgets =>
      widgets.where((w) => !w.hidden).toList();

  DashboardLayoutConfig copyWith({
    List<DashboardWidgetInstance>? widgets,
    DashboardLayoutMode? layoutMode,
    DashboardThemePreset? theme,
    DashboardDensity? density,
    bool? quickActionsPinned,
  }) {
    return DashboardLayoutConfig(
      widgets: widgets ?? this.widgets,
      layoutMode: layoutMode ?? this.layoutMode,
      theme: theme ?? this.theme,
      density: density ?? this.density,
      quickActionsPinned: quickActionsPinned ?? this.quickActionsPinned,
    );
  }

  Map<String, dynamic> toJson() => {
        'widgets': widgets.map((w) => w.toJson()).toList(),
        'layoutMode': layoutMode.name,
        'theme': theme.name,
        'density': density.name,
        'quickActionsPinned': quickActionsPinned,
      };

  factory DashboardLayoutConfig.fromJson(Map<String, dynamic> json) {
    return DashboardLayoutConfig(
      widgets: (json['widgets'] as List)
          .map(
            (e) => DashboardWidgetInstance.fromJson(e as Map<String, dynamic>),
          )
          .toList(),
      layoutMode: DashboardLayoutMode.values.byName(
        json['layoutMode'] as String? ?? 'adaptive',
      ),
      theme: DashboardThemePreset.values.byName(
        json['theme'] as String? ?? 'professional',
      ),
      density: DashboardDensity.values.byName(
        json['density'] as String? ?? 'comfortable',
      ),
      quickActionsPinned: json['quickActionsPinned'] as bool? ?? true,
    );
  }
}

abstract final class DashboardWidgetCatalog {
  static String label(DashboardWidgetType type) => switch (type) {
        DashboardWidgetType.cycleHeader => 'Cycle header',
        DashboardWidgetType.currentBalance => 'Current balance',
        DashboardWidgetType.todaySpending => "Today's spending",
        DashboardWidgetType.safeDailySpend => 'Safe daily spend',
        DashboardWidgetType.budgetProgress => 'Budget progress',
        DashboardWidgetType.budgetSetup => 'Budget setup',
        DashboardWidgetType.budgetAlerts => 'Budget alerts',
        DashboardWidgetType.summaryGrid => 'Monthly summary',
        DashboardWidgetType.expenseCategories => 'Expense categories',
        DashboardWidgetType.financialHealth => 'Financial health',
        DashboardWidgetType.monthlyReport => 'AI monthly review',
        DashboardWidgetType.calendar => 'Financial calendar',
        DashboardWidgetType.subscriptions => 'Subscriptions',
        DashboardWidgetType.loanSummary => 'Borrow & lend',
        DashboardWidgetType.savingsForecast => 'Savings forecast',
        DashboardWidgetType.insightsFeed => 'Insights feed',
        DashboardWidgetType.quickActions => 'Quick actions',
        DashboardWidgetType.achievements => 'Achievements',
        DashboardWidgetType.wishlist => 'Wishlist',
        DashboardWidgetType.recentTransactions => 'Recent transactions',
      };

  static IconData icon(DashboardWidgetType type) => switch (type) {
        DashboardWidgetType.cycleHeader => Icons.calendar_month_outlined,
        DashboardWidgetType.currentBalance => Icons.account_balance_wallet_outlined,
        DashboardWidgetType.todaySpending => Icons.today_outlined,
        DashboardWidgetType.safeDailySpend => Icons.shield_outlined,
        DashboardWidgetType.budgetProgress => Icons.pie_chart_outline,
        DashboardWidgetType.budgetSetup => Icons.tune_rounded,
        DashboardWidgetType.budgetAlerts => Icons.notifications_outlined,
        DashboardWidgetType.summaryGrid => Icons.grid_view_rounded,
        DashboardWidgetType.expenseCategories => Icons.donut_large_outlined,
        DashboardWidgetType.financialHealth => Icons.favorite_outline,
        DashboardWidgetType.monthlyReport => Icons.auto_awesome_rounded,
        DashboardWidgetType.calendar => Icons.calendar_month_rounded,
        DashboardWidgetType.subscriptions => Icons.subscriptions_outlined,
        DashboardWidgetType.loanSummary => Icons.handshake_outlined,
        DashboardWidgetType.savingsForecast => Icons.trending_up_rounded,
        DashboardWidgetType.insightsFeed => Icons.insights_outlined,
        DashboardWidgetType.quickActions => Icons.bolt_rounded,
        DashboardWidgetType.achievements => Icons.emoji_events_outlined,
        DashboardWidgetType.wishlist => Icons.favorite_border,
        DashboardWidgetType.recentTransactions => Icons.receipt_long_outlined,
      };

  static DashboardWidgetSize defaultSize(DashboardWidgetType type) =>
      switch (type) {
        DashboardWidgetType.summaryGrid ||
        DashboardWidgetType.quickActions ||
        DashboardWidgetType.expenseCategories =>
          DashboardWidgetSize.large,
        DashboardWidgetType.todaySpending ||
        DashboardWidgetType.financialHealth ||
        DashboardWidgetType.achievements =>
          DashboardWidgetSize.compact,
        _ => DashboardWidgetSize.standard,
      };

  static const allTypes = DashboardWidgetType.values;
}
