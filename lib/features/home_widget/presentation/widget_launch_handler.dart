import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:home_widget/home_widget.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/features/home_widget/data/home_widget_sync_service.dart';
import 'package:rupee_track/features/home_widget/domain/home_widget_snapshot.dart';
import 'package:rupee_track/features/quick_add/presentation/quick_add_hub_sheet.dart';

/// Listens for widget taps and syncs widget data when the shell mounts.
class WidgetLaunchHandler extends ConsumerStatefulWidget {
  const WidgetLaunchHandler({required this.child, super.key});

  final Widget child;

  @override
  ConsumerState<WidgetLaunchHandler> createState() =>
      _WidgetLaunchHandlerState();
}

class _WidgetLaunchHandlerState extends ConsumerState<WidgetLaunchHandler>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _bootstrap());
    HomeWidget.widgetClicked.listen(_handleUri);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      ref.read(homeWidgetSyncServiceProvider).sync();
    }
  }

  Future<void> _bootstrap() async {
    await ref.read(homeWidgetSyncServiceProvider).initialize();
    await ref.read(homeWidgetSyncServiceProvider).sync();
    final initial = await HomeWidget.initiallyLaunchedFromHomeWidget();
    if (initial != null) _handleUri(initial);
  }

  void _handleUri(Uri? uri) {
    if (uri == null || !mounted) return;
    final action = uri.host.isNotEmpty
        ? uri.host
        : (uri.pathSegments.isNotEmpty ? uri.pathSegments.first : '');
    switch (action) {
      case WidgetActions.addExpense:
        context.push(AppRoutes.expenseAdd);
      case WidgetActions.addIncome:
        context.push(AppRoutes.salary);
      case WidgetActions.dashboard:
        context.go(AppRoutes.home);
      case WidgetActions.calendar:
        context.go(AppRoutes.insights);
      case WidgetActions.budget:
        context.push(AppRoutes.budget);
      case WidgetActions.health:
        context.go(AppRoutes.insights);
      case WidgetActions.subscriptions:
        context.push(AppRoutes.subscriptions);
      case WidgetActions.wishlist:
        context.push(AppRoutes.more);
      case WidgetActions.markBillPaid:
        context.push(AppRoutes.expenses);
      default:
        showQuickAddSheet(context, ref);
    }
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
