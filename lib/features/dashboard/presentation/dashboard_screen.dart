import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rupee_track/core/branding/vis_wallet_logo.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_app_bar.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/features/custom_dashboard/data/dashboard_layout_repository.dart';
import 'package:rupee_track/features/custom_dashboard/presentation/sheets/dashboard_add_widget_sheet.dart';
import 'package:rupee_track/features/custom_dashboard/presentation/sheets/dashboard_widget_edit_sheet.dart';
import 'package:rupee_track/features/custom_dashboard/presentation/widgets/dashboard_canvas.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final editMode = ref.watch(dashboardEditModeProvider);
    final compact = AppResponsive.isCompact(context);

    return Scaffold(
      appBar: PremiumAppBar(
        title: '',
        leading: Padding(
          padding: const EdgeInsets.only(left: AppSpacing.sm),
          child: Center(
            child: VisWalletLogo(
              size: 38,
              showShadow: true,
              variant: Theme.of(context).brightness == Brightness.dark
                  ? VisWalletLogoVariant.dark
                  : VisWalletLogoVariant.brand,
            ),
          ),
        ),
        actions: editMode
            ? [
                if (compact)
                  PopupMenuButton<String>(
                    tooltip: 'Dashboard options',
                    icon: const Icon(Icons.more_vert_rounded),
                    onSelected: (value) {
                      switch (value) {
                        case 'done':
                          ref.read(dashboardEditModeProvider.notifier).state =
                              false;
                        case 'add':
                          showDashboardAddWidgetSheet(context, ref);
                        case 'settings':
                          showDashboardCustomizeSheet(context, ref);
                      }
                    },
                    itemBuilder: (context) => const [
                      PopupMenuItem(
                        value: 'done',
                        child: ListTile(
                          leading: Icon(Icons.check_rounded),
                          title: Text('Done editing'),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                      PopupMenuItem(
                        value: 'add',
                        child: ListTile(
                          leading: Icon(Icons.add_box_outlined),
                          title: Text('Add widget'),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                      PopupMenuItem(
                        value: 'settings',
                        child: ListTile(
                          leading: Icon(Icons.tune_rounded),
                          title: Text('Dashboard settings'),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    ],
                  )
                else ...[
                  TextButton.icon(
                    onPressed: () {
                      ref.read(dashboardEditModeProvider.notifier).state = false;
                    },
                    icon: const Icon(Icons.check_rounded, size: AppIconSize.md),
                    label: const Text('Done'),
                  ),
                  IconButton(
                    tooltip: 'Add widget',
                    icon: const Icon(Icons.add_box_outlined),
                    onPressed: () => showDashboardAddWidgetSheet(context, ref),
                  ),
                  IconButton(
                    tooltip: 'Dashboard settings',
                    icon: const Icon(Icons.tune_rounded),
                    onPressed: () => showDashboardCustomizeSheet(context, ref),
                  ),
                ],
              ]
            : null,
      ),
      body: const DashboardCanvas(),
    );
  }
}
