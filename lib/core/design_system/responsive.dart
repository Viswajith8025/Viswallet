import 'package:flutter/material.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';

/// Width breakpoints for phone, tablet, and wide layouts.
abstract final class AppBreakpoints {
  static const compact = 360.0;
  static const medium = 600.0;
  static const expanded = 840.0;
  static const maxContentWidth = 720.0;
}

abstract final class AppResponsive {
  static double screenWidth(BuildContext context) =>
      MediaQuery.sizeOf(context).width;

  static double screenHeight(BuildContext context) =>
      MediaQuery.sizeOf(context).height;

  static bool isCompact(BuildContext context) =>
      screenWidth(context) < AppBreakpoints.compact;

  static bool isMediumOrWider(BuildContext context) =>
      screenWidth(context) >= AppBreakpoints.medium;

  static bool isExpanded(BuildContext context) =>
      screenWidth(context) >= AppBreakpoints.expanded;

  static bool isShortScreen(BuildContext context) =>
      screenHeight(context) < 640;

  static bool useCompactNav(BuildContext context) {
    final width = screenWidth(context);
    final textScale = MediaQuery.textScalerOf(context).scale(1);
    return width < AppBreakpoints.compact || textScale > 1.15;
  }

  static int gridColumns(
    double width, {
    int compact = 2,
    int medium = 3,
    int expanded = 4,
  }) {
    if (width >= AppBreakpoints.expanded) return expanded;
    if (width >= AppBreakpoints.medium) return medium;
    return compact;
  }

  static double contentMaxWidth(double width) {
    if (width >= AppBreakpoints.medium) {
      return AppBreakpoints.maxContentWidth;
    }
    return width;
  }

  static double horizontalPadding(double width) {
    if (width >= AppBreakpoints.expanded) return AppSpacing.xxl;
    if (width >= AppBreakpoints.medium) return AppSpacing.xl;
    return AppSpacing.screenHorizontal;
  }

  static EdgeInsets screenPadding(BuildContext context, {double bottom = 0}) {
    final width = screenWidth(context);
    final horizontal = horizontalPadding(width);
    return EdgeInsets.fromLTRB(horizontal, 0, horizontal, bottom);
  }

  static double categoryTileExtent(
    double width, {
    bool subtractHorizontalPadding = true,
  }) {
    final columns = gridColumns(width, compact: 3, medium: 4, expanded: 5);
    const spacing = 10.0;
    final effectiveWidth = subtractHorizontalPadding
        ? contentMaxWidth(width).clamp(0, width) - horizontalPadding(width) * 2
        : width;
    return (effectiveWidth - spacing * (columns - 1)) / columns;
  }

  static double gridChildAspectRatio(double width) =>
      width >= AppBreakpoints.medium ? 1.5 : 1.35;

  static double chartHeight(double width, {double fraction = 0.52}) =>
      (width * fraction).clamp(160.0, 260.0);
}

/// Centers content and caps width on tablets while applying responsive padding.
class ResponsiveBody extends StatelessWidget {
  const ResponsiveBody({
    required this.child,
    super.key,
    this.padding,
  });

  final Widget child;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final maxWidth = AppResponsive.contentMaxWidth(width);
        final horizontal = AppResponsive.horizontalPadding(width);
        final extra = padding?.resolve(Directionality.of(context)) ?? EdgeInsets.zero;
        final effectivePadding = EdgeInsets.fromLTRB(
          horizontal + extra.left,
          extra.top,
          horizontal + extra.right,
          extra.bottom,
        );

        return Align(
          alignment: Alignment.topCenter,
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: maxWidth),
            child: Padding(
              padding: effectivePadding,
              child: child,
            ),
          ),
        );
      },
    );
  }
}

/// Adaptive metric/summary card grid used across dashboard and insights.
class ResponsiveSummaryGrid extends StatelessWidget {
  const ResponsiveSummaryGrid({
    required this.children,
    super.key,
    this.compactColumns = 2,
    this.mediumColumns = 3,
    this.expandedColumns = 4,
    this.childAspectRatio,
    this.hugContent = false,
  });

  final List<Widget> children;
  final int compactColumns;
  final int mediumColumns;
  final int expandedColumns;
  final double? childAspectRatio;
  /// When true, tiles size to their content instead of a fixed aspect ratio.
  final bool hugContent;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final columns = AppResponsive.gridColumns(
          width,
          compact: compactColumns,
          medium: mediumColumns,
          expanded: expandedColumns,
        );

        if (hugContent) {
          final spacing = AppSpacing.sm;
          final itemWidth =
              (width - spacing * (columns - 1)) / columns;
          return Wrap(
            spacing: spacing,
            runSpacing: spacing,
            children: [
              for (final child in children)
                SizedBox(width: itemWidth, child: child),
            ],
          );
        }

        final aspectRatio =
            childAspectRatio ?? AppResponsive.gridChildAspectRatio(width);

        return GridView.count(
          crossAxisCount: columns,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: AppSpacing.sm,
          crossAxisSpacing: AppSpacing.sm,
          childAspectRatio: aspectRatio,
          children: children,
        );
      },
    );
  }
}
