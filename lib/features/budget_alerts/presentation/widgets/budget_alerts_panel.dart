import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_app_bar.dart';
import 'package:rupee_track/core/design_system/premium_snackbar.dart';
import 'package:rupee_track/core/design_system/skeleton_loader.dart';
import 'package:rupee_track/core/providers/salary_cycle_provider.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/core/widgets/error_state.dart';
import 'package:rupee_track/features/budget/domain/allocation_mode.dart';
import 'package:rupee_track/features/budget_alerts/data/budget_alerts_repository.dart';
import 'package:rupee_track/features/budget_alerts/domain/budget_alert.dart';

/// Listens for new escalations and shows a single grouped in-app snackbar.
class BudgetAlertsListener extends ConsumerStatefulWidget {
  const BudgetAlertsListener({required this.child, super.key});

  final Widget child;

  @override
  ConsumerState<BudgetAlertsListener> createState() =>
      _BudgetAlertsListenerState();
}

class _BudgetAlertsListenerState extends ConsumerState<BudgetAlertsListener> {
  final _shownAlertIds = <String>{};

  @override
  Widget build(BuildContext context) {
    final cycleKey = ref.watch(selectedCycleKeyProvider);
    final prefs = ref.watch(alertPreferencesProvider);

    ref.listen(budgetAlertsProvider(cycleKey), (prev, next) {
      next.whenData((snapshot) async {
        if (!prefs.inAppEnabled) return;
        final fresh = snapshot.newEscalations
            .where((a) => !_shownAlertIds.contains(a.id))
            .toList();
        if (fresh.isEmpty) return;
        for (final a in fresh) {
          _shownAlertIds.add(a.id);
        }

        await ref
            .read(budgetAlertsRepositoryProvider)
            .deliverEscalations(snapshot, prefs);

        if (!context.mounted) return;

        final group = snapshot.groups.isNotEmpty
            ? snapshot.groups.first
            : null;
        final text = group?.summary ?? snapshot.newEscalations.first.message;

        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        showPremiumSnackBar(
          context,
          message: text,
          actionLabel: 'View',
          onAction: () => context.push(AppRoutes.budgetAlerts),
          duration: const Duration(seconds: 5),
        );
      });
    });

    return widget.child;
  }
}

class BudgetAlertsPanel extends ConsumerWidget {
  const BudgetAlertsPanel({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cycleKey = ref.watch(selectedCycleKeyProvider);
    final alertsAsync = ref.watch(budgetAlertsProvider(cycleKey));
    final theme = Theme.of(context);

    return alertsAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (snapshot) {
        if (!snapshot.hasAlerts) return const SizedBox.shrink();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (snapshot.dailySummary != null)
              _SummaryBanner(
                icon: Icons.wb_sunny_outlined,
                text: snapshot.dailySummary!,
                color: theme.colorScheme.primaryContainer,
              ),
            if (snapshot.dailySummary != null) const SizedBox(height: 8),
            ...snapshot.groups.map(
              (group) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _AlertGroupCard(group: group),
              ),
            ),
            TextButton.icon(
              onPressed: () => context.push(AppRoutes.budgetAlerts),
              icon: const Icon(Icons.notifications_outlined, size: 18),
              label: Text('All alerts (${snapshot.alertCount})'),
            ),
          ],
        );
      },
    );
  }
}

class BudgetAlertsScreen extends ConsumerWidget {
  const BudgetAlertsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cycleKey = ref.watch(selectedCycleKeyProvider);
    final alertsAsync = ref.watch(budgetAlertsProvider(cycleKey));
    final theme = Theme.of(context);

    return Scaffold(
      appBar: const PremiumAppBar(
        title: 'Budget alerts',
        subtitle: 'Spending warnings for this cycle',
      ),
      body: alertsAsync.when(
        loading: () => ListView(
          padding: const EdgeInsets.all(AppSpacing.md),
          children: const [
            SkeletonCard(height: 72),
            SizedBox(height: AppSpacing.sm),
            SkeletonCard(height: 88),
            SizedBox(height: AppSpacing.sm),
            SkeletonCard(height: 88),
          ],
        ),
        error: (e, _) => ErrorState(
          message: 'We couldn\'t load your budget alerts.',
          onRetry: () => ref.invalidate(budgetAlertsProvider(cycleKey)),
        ),
        data: (snapshot) {
          if (!snapshot.hasAlerts) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.check_circle_outline,
                    size: 48,
                    color: theme.colorScheme.primary,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'All categories on track',
                    style: theme.textTheme.titleMedium,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'We\'ll notify you gently when a budget needs attention.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              if (snapshot.weeklySummary != null) ...[
                _SummaryBanner(
                  icon: Icons.date_range,
                  text: snapshot.weeklySummary!,
                  color: theme.colorScheme.tertiaryContainer,
                ),
                const SizedBox(height: 16),
              ],
              ...snapshot.groups.expand(
                (group) => [
                  _AlertGroupCard(group: group, expanded: true),
                  const SizedBox(height: 12),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}

class _SummaryBanner extends StatelessWidget {
  const _SummaryBanner({
    required this.icon,
    required this.text,
    required this.color,
  });

  final IconData icon;
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: color.withValues(alpha: 0.5),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 20),
            const SizedBox(width: 10),
            Expanded(child: Text(text)),
          ],
        ),
      ),
    );
  }
}

class _AlertGroupCard extends StatelessWidget {
  const _AlertGroupCard({
    required this.group,
    this.expanded = false,
  });

  final BudgetAlertGroup group;
  final bool expanded;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = _colorForLevel(context, group.level);

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: color.withValues(alpha: 0.35)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(_iconForLevel(group.level), color: color, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    group.title,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              group.summary,
              style: theme.textTheme.bodyMedium,
            ),
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest
                    .withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                group.suggestion,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ),
            if (expanded && group.alerts.length > 1) ...[
              const SizedBox(height: 10),
              const Divider(height: 1),
              ...group.alerts.map(
                (a) => ListTile(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  title: Text(a.displayName),
                  subtitle: Text(a.message),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  static Color _colorForLevel(BuildContext context, BudgetAlertLevel level) {
    final semantics = context.semanticColors;
    return switch (level) {
      BudgetAlertLevel.exceeded => Theme.of(context).colorScheme.error,
      BudgetAlertLevel.critical90 => semantics.expense,
      BudgetAlertLevel.watch75 => semantics.warning,
      _ => Theme.of(context).colorScheme.primary,
    };
  }

  static IconData _iconForLevel(BudgetAlertLevel level) => switch (level) {
        BudgetAlertLevel.exceeded => Icons.info_outline,
        BudgetAlertLevel.critical90 => Icons.hourglass_bottom,
        _ => Icons.trending_up,
      };
}
