import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:rupee_track/core/design_system/premium_confirm_dialog.dart';
import 'package:rupee_track/core/design_system/premium_bottom_nav.dart';
import 'package:rupee_track/core/design_system/premium_side_nav.dart';
import 'package:rupee_track/features/jithu/domain/jithu_branding.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/core/design_system/shell_bottom_inset.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/features/quick_add/presentation/positioned_quick_add_fab.dart';
import 'package:rupee_track/features/quick_add/presentation/quick_add_fab.dart';

class MainShell extends ConsumerStatefulWidget {
  const MainShell({required this.child, super.key});

  final Widget child;

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> {
  static const _destinations = [
    PremiumNavDestination(
      icon: Icons.home_outlined,
      selectedIcon: Icons.home_rounded,
      label: 'Home',
    ),
    PremiumNavDestination(
      icon: Icons.receipt_long_outlined,
      selectedIcon: Icons.receipt_long_rounded,
      label: 'Expenses',
    ),
    PremiumNavDestination(
      icon: Icons.insights_outlined,
      selectedIcon: Icons.insights_rounded,
      label: 'Insights',
    ),
    PremiumNavDestination(
      icon: Icons.auto_awesome_outlined,
      selectedIcon: Icons.auto_awesome_rounded,
      label: JithuBranding.displayName,
    ),
    PremiumNavDestination(
      icon: Icons.grid_view_outlined,
      selectedIcon: Icons.grid_view_rounded,
      label: 'More',
    ),
  ];

  int _indexForLocation(String location) {
    if (location.startsWith(AppRoutes.expenses)) return 1;
    if (location.startsWith(AppRoutes.insights)) return 2;
    if (location.startsWith(AppRoutes.jithu)) return 3;
    if (location.startsWith(AppRoutes.more)) return 4;
    return 0;
  }

  void _onNavSelected(BuildContext context, int i) {
    switch (i) {
      case 0:
        context.go(AppRoutes.home);
      case 1:
        context.go(AppRoutes.expenses);
      case 2:
        context.go(AppRoutes.insights);
      case 3:
        context.go(AppRoutes.jithu);
      case 4:
        context.go(AppRoutes.more);
    }
  }

  Widget _phoneBody(BuildContext context, {required bool showFab}) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        widget.child,
        if (showFab) const PositionedQuickAddFab(),
      ],
    );
  }

  Future<void> _handleBackPress(BuildContext context, int tabIndex) async {
    if (tabIndex != 0) {
      context.go(AppRoutes.home);
      return;
    }

    final shouldExit = await showPremiumConfirmDialog(
      context: context,
      title: 'Exit Viswallet?',
      message: 'Are you sure you want to close the app?',
      confirmLabel: 'Exit',
      cancelLabel: 'Stay',
      icon: Icons.logout_rounded,
    );

    if (shouldExit == true && context.mounted) {
      SystemNavigator.pop();
    }
  }

  Widget _wrapWithExitGuard(BuildContext context, int tabIndex, Widget child) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _handleBackPress(context, tabIndex);
      },
      child: child,
    );
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    final index = _indexForLocation(location);
    final useRail = AppResponsive.isMediumOrWider(context);
    final showFab = !location.startsWith(AppRoutes.jithu);

    if (useRail) {
      return _wrapWithExitGuard(
        context,
        index,
        Scaffold(
          body: Row(
            children: [
              PremiumSideNav(
                selectedIndex: index,
                destinations: _destinations,
                onSelected: (i) => _onNavSelected(context, i),
              ),
              const VerticalDivider(width: 1, thickness: 1),
              Expanded(
                child: Padding(
                  padding: EdgeInsets.only(
                    bottom: ShellBottomInset.of(context, hasBottomNav: false),
                  ),
                  child: widget.child,
                ),
              ),
            ],
          ),
          floatingActionButton: showFab ? QuickAddFab() : null,
          floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
        ),
      );
    }

    return _wrapWithExitGuard(
      context,
      index,
      AnnotatedRegion<SystemUiOverlayStyle>(
        value: SystemUiOverlayStyle(
          systemNavigationBarColor: Colors.transparent,
          systemNavigationBarDividerColor: Colors.transparent,
          systemNavigationBarContrastEnforced: false,
          systemNavigationBarIconBrightness:
              Theme.of(context).brightness == Brightness.dark
                  ? Brightness.light
                  : Brightness.dark,
        ),
        child: Scaffold(
          extendBody: true,
          backgroundColor: Theme.of(context).scaffoldBackgroundColor,
          body: _phoneBody(context, showFab: showFab),
          bottomNavigationBar: PremiumBottomNav(
            selectedIndex: index,
            destinations: _destinations,
            onSelected: (i) => _onNavSelected(context, i),
          ),
        ),
      ),
    );
  }
}
