import 'package:flutter/material.dart';
import 'package:rupee_track/core/utils/category_icon_utils.dart';

/// Retains Material icon glyphs for release builds.
///
/// Flutter tree-shakes [MaterialIcons] in release mode. Icons referenced only
/// through DB strings (categories) or spread across many widgets can be stripped,
/// which renders empty boxes. This manifest links every app icon at compile time.
abstract final class MaterialIconManifest {
  static const _shellGlyphs = <IconData>[
    Icons.home_outlined,
    Icons.home_rounded,
    Icons.receipt_long_outlined,
    Icons.receipt_long_rounded,
    Icons.insights_outlined,
    Icons.insights_rounded,
    Icons.auto_awesome_outlined,
    Icons.auto_awesome_rounded,
    Icons.grid_view_outlined,
    Icons.grid_view_rounded,
    Icons.add_rounded,
    Icons.open_with_rounded,
    Icons.logout_rounded,
  ];

  static const _moreGlyphs = <IconData>[
    Icons.explore_outlined,
    Icons.search_rounded,
    Icons.auto_awesome_rounded,
    Icons.subscriptions_outlined,
    Icons.notifications_active_outlined,
    Icons.replay_circle_filled_outlined,
    Icons.handshake_outlined,
    Icons.pie_chart_outline,
    Icons.trending_up_rounded,
    Icons.history_rounded,
    Icons.delete_sweep_outlined,
    Icons.help_outline_rounded,
    Icons.settings_outlined,
    Icons.chevron_right_rounded,
  ];

  static const _dashboardGlyphs = <IconData>[
    Icons.calendar_month_outlined,
    Icons.account_balance_wallet_outlined,
    Icons.today_outlined,
    Icons.shield_outlined,
    Icons.pie_chart_outline,
    Icons.tune_rounded,
    Icons.notifications_outlined,
    Icons.grid_view_rounded,
    Icons.donut_large_outlined,
    Icons.favorite_outline,
    Icons.auto_awesome_rounded,
    Icons.calendar_month_rounded,
    Icons.subscriptions_outlined,
    Icons.handshake_outlined,
    Icons.trending_up_rounded,
    Icons.insights_outlined,
    Icons.bolt_rounded,
    Icons.emoji_events_outlined,
    Icons.favorite_border,
    Icons.receipt_long_outlined,
    Icons.add,
    Icons.payments_outlined,
    Icons.event_outlined,
    Icons.favorite_rounded,
    Icons.check_circle_outline,
    Icons.drag_indicator,
    Icons.expand_more,
  ];

  static const _commonGlyphs = <IconData>[
    Icons.lock_rounded,
    Icons.lock_open_rounded,
    Icons.swipe_left_rounded,
    Icons.delete_outline_rounded,
    Icons.check_circle_rounded,
    Icons.star,
    Icons.auto_awesome,
    Icons.open_in_full,
    Icons.refresh_rounded,
    Icons.help_outline,
    Icons.keyboard_hide,
    Icons.calculate,
    Icons.close_rounded,
    Icons.brightness_auto_rounded,
    Icons.light_mode_rounded,
    Icons.dark_mode_rounded,
    Icons.more_vert_rounded,
    Icons.check_rounded,
    Icons.add_box_outlined,
    Icons.error_outline,
    Icons.warning_amber_outlined,
    Icons.info_outline,
    Icons.check_circle_outline,
    Icons.circle,
    Icons.label_outline_rounded,
  ];

  static final List<IconData> all = [
    ...kCategoryIconGlyphs,
    ..._shellGlyphs,
    ..._moreGlyphs,
    ..._dashboardGlyphs,
    ..._commonGlyphs,
  ];

  /// Invoke once at cold start so the manifest stays linked in release builds.
  static void ensureBundled() {
    assert(all.isNotEmpty);
  }
}
