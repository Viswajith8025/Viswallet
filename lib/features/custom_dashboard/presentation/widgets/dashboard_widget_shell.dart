import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/features/custom_dashboard/data/dashboard_layout_repository.dart';
import 'package:rupee_track/features/custom_dashboard/domain/dashboard_layout_models.dart';
import 'package:rupee_track/features/custom_dashboard/presentation/sheets/dashboard_widget_edit_sheet.dart';
import 'package:rupee_track/features/custom_dashboard/presentation/widgets/dashboard_widget_registry.dart';

class DashboardWidgetShell extends ConsumerWidget {
  const DashboardWidgetShell({
    required this.instance,
    required this.editMode,
    required this.density,
    super.key,
  });

  final DashboardWidgetInstance instance;
  final bool editMode;
  final DashboardDensity density;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final padding = density == DashboardDensity.compact
        ? AppSpacing.xs
        : AppSpacing.sm;

    var child = DashboardWidgetRegistry.build(context, ref, instance);

    if (instance.collapsed) {
      child = ListTile(
        leading: Icon(DashboardWidgetCatalog.icon(instance.type)),
        title: Text(DashboardWidgetCatalog.label(instance.type)),
        trailing: const Icon(Icons.expand_more),
        onTap: editMode
            ? null
            : () => ref
                .read(dashboardLayoutProvider.notifier)
                .toggleCollapsed(instance.id),
      );
    }

    final accent = instance.accentArgb != null
        ? Color(instance.accentArgb!)
        : null;

    final decorated = AnimatedContainer(
      duration: AppDurations.fast,
      curve: AppCurves.standard,
      margin: EdgeInsets.only(bottom: padding),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        gradient: instance.glassEffect && !editMode
            ? LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  theme.colorScheme.surface.withValues(alpha: 0.92),
                  theme.colorScheme.surfaceContainerHighest
                      .withValues(alpha: 0.72),
                ],
              )
            : null,
        border: editMode
            ? Border.all(
                color: theme.colorScheme.primary.withValues(alpha: 0.45),
                width: 1.5,
              )
            : instance.glassEffect
                ? Border.all(
                    color: theme.colorScheme.primary.withValues(alpha: 0.35),
                    width: 1.5,
                  )
                : (accent != null
                    ? Border.all(color: accent.withValues(alpha: 0.35))
                    : null),
        boxShadow: instance.glassEffect
            ? [
                BoxShadow(
                  color: theme.colorScheme.primary.withValues(alpha: 0.16),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ]
            : null,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: instance.glassEffect && !editMode
            ? BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Opacity(
                  opacity: instance.transparency.clamp(0.5, 1.0),
                  child: child,
                ),
              )
            : Opacity(
                opacity: instance.transparency.clamp(0.5, 1.0),
                child: child,
              ),
      ),
    );

    if (!editMode) {
      return RepaintBoundary(child: decorated);
    }

    return Stack(
      clipBehavior: Clip.none,
      children: [
        decorated,
        Positioned(
          top: 4,
          right: 4,
          child: Material(
            color: theme.colorScheme.primaryContainer,
            borderRadius: BorderRadius.circular(20),
            child: InkWell(
              onTap: () =>
                  showDashboardWidgetEditSheet(context, ref, instance),
              borderRadius: BorderRadius.circular(20),
              child: const Padding(
                padding: EdgeInsets.all(6),
                child: Icon(Icons.drag_indicator, size: 18),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
