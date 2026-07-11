import 'package:flutter/material.dart';
import 'package:rupee_track/core/design_system/premium_surfaces.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/core/design_system/tokens/app_spacing.dart';
import 'package:rupee_track/core/design_system/tokens/app_typography.dart';

/// Consistent screen app bar — token typography, hairline underline.
class PremiumAppBar extends StatelessWidget implements PreferredSizeWidget {  const PremiumAppBar({
    required this.title,
    super.key,
    this.subtitle,
    this.actions,
    this.leading,
    this.centerTitle = false,
  });

  final String title;
  final String? subtitle;
  final List<Widget>? actions;
  final Widget? leading;
  final bool centerTitle;

  static double toolbarHeightFor({required bool hasSubtitle}) =>
      hasSubtitle ? AppSpacing.s6 + AppSpacing.s2 : kToolbarHeight;

  @override
  Size get preferredSize =>
      Size.fromHeight(toolbarHeightFor(hasSubtitle: subtitle != null));

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final horizontal = AppResponsive.horizontalPadding(
      MediaQuery.sizeOf(context).width,
    );
    final appBarActions = actions;
    final titleWidget = subtitle == null
        ? Text(title, style: AppTypography.appBarTitle(brightness))
        : Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(title, style: AppTypography.appBarTitle(brightness)),
              SizedBox(height: AppSpacing.half),
              Text(subtitle!, style: AppTypography.appBarSubtitle(brightness)),
            ],
          );

    return DecoratedBox(
      decoration: PremiumSurfaces.appBarUnderline(context),
      child: AppBar(
        toolbarHeight: toolbarHeightFor(hasSubtitle: subtitle != null),
        titleSpacing: leading == null ? 0 : null,
        leading: leading,
        automaticallyImplyLeading: leading == null,
        centerTitle: centerTitle,
        actions: appBarActions,
        title: centerTitle
            ? titleWidget
            : Padding(
                padding: EdgeInsets.only(left: leading == null ? horizontal : 0),
                child: titleWidget,
              ),
      ),
    );
  }
}

/// Standard horizontal padding for scrollable screens.
class PremiumScreenBody extends StatelessWidget {
  const PremiumScreenBody({
    required this.child,
    super.key,
    this.bottomPadding = AppSpacing.s6 + AppSpacing.s4 + AppSpacing.s2,
  });

  final Widget child;
  final double bottomPadding;

  @override
  Widget build(BuildContext context) {
    return ResponsiveBody(
      child: Padding(
        padding: EdgeInsets.only(bottom: bottomPadding),
        child: child,
      ),
    );
  }
}
