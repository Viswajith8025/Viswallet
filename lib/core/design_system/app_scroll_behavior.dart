import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';

/// App-wide scroll: natural touch drag; scrollbars only on desktop pointer devices.
class AppScrollBehavior extends MaterialScrollBehavior {
  const AppScrollBehavior();

  @override
  Set<PointerDeviceKind> get dragDevices => {
        PointerDeviceKind.touch,
        PointerDeviceKind.mouse,
        PointerDeviceKind.stylus,
        PointerDeviceKind.trackpad,
      };

  @override
  Widget buildScrollbar(
    BuildContext context,
    Widget child,
    ScrollableDetails details,
  ) {
    // Phone scrollbars render as stray lines through chip rows — hide on mobile.
    final platform = getPlatform(context);
    if (platform == TargetPlatform.android || platform == TargetPlatform.iOS) {
      return child;
    }

    final usePointer = ScrollConfiguration.of(context)
            .getPlatform(context) ==
        TargetPlatform.windows;

    if (!usePointer) return child;

    return Scrollbar(
      controller: details.controller,
      thumbVisibility: false,
      trackVisibility: false,
      interactive: true,
      radius: const Radius.circular(8),
      thickness: 6,
      child: child,
    );
  }
}

/// Wrap nested horizontal lists so they never paint scrollbar tracks.
class AppNoScrollbar extends StatelessWidget {
  const AppNoScrollbar({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return ScrollConfiguration(
      behavior: ScrollConfiguration.of(context).copyWith(scrollbars: false),
      child: child,
    );
  }
}

/// Horizontal row — no scrollbar on phones.
class AppHorizontalScrollRow extends StatelessWidget {
  const AppHorizontalScrollRow({
    required this.children,
    super.key,
    this.padding,
    this.height,
  });

  final List<Widget> children;
  final EdgeInsetsGeometry? padding;
  final double? height;

  @override
  Widget build(BuildContext context) {
    final scrollView = SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: padding ??
          const EdgeInsets.symmetric(horizontal: AppSpacing.screenHorizontal),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: children,
      ),
    );

    final wrapped = height != null
        ? SizedBox(height: height, child: scrollView)
        : scrollView;

    return AppNoScrollbar(child: wrapped);
  }
}

/// Minimum row height for [PremiumFilterChip] (xs vertical padding + label text).
const kAppChipRowHeight = 40.0;

/// Fixed-height horizontal list without scrollbar artifacts.
class AppHorizontalChipList extends StatelessWidget {
  const AppHorizontalChipList({
    required this.itemCount,
    required this.itemBuilder,
    this.height = kAppChipRowHeight,
    this.separatorWidth = AppSpacing.xs,
    this.padding = EdgeInsets.zero,
    super.key,
  });

  final double height;
  final int itemCount;
  final IndexedWidgetBuilder itemBuilder;
  final double separatorWidth;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return AppNoScrollbar(
      child: SizedBox(
        height: height,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: padding,
          clipBehavior: Clip.none,
          itemCount: itemCount,
          separatorBuilder: (_, __) => SizedBox(width: separatorWidth),
          itemBuilder: (context, index) => Align(
            alignment: Alignment.centerLeft,
            child: itemBuilder(context, index),
          ),
        ),
      ),
    );
  }
}

