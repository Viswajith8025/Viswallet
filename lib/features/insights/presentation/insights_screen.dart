import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_app_bar.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/core/design_system/shell_bottom_inset.dart';
import 'package:rupee_track/core/design_system/skeleton_loader.dart';
import 'package:rupee_track/core/providers/salary_cycle_provider.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/core/widgets/error_state.dart';
import 'package:rupee_track/features/insights/data/insights_feed_repository.dart';
import 'package:rupee_track/features/insights/presentation/widgets/insights_analytics_panel.dart';
import 'package:rupee_track/features/insights/presentation/widgets/insights_feed_section.dart';
import 'package:rupee_track/features/smart_tagging/data/tagging_repository.dart';
import 'package:rupee_track/features/trends/data/spending_trends_repository.dart';

/// Single scroll: tips at top, then health + trends + categories.
class InsightsScreen extends ConsumerWidget {
  const InsightsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trendsAsync = ref.watch(spendingTrendsProvider);
    final feedAsync = ref.watch(insightsFeedProvider);

    final initialLoad =
        (feedAsync.isLoading && !feedAsync.hasValue) &&
        (trendsAsync.isLoading && !trendsAsync.hasValue);

    if (initialLoad) {
      return Scaffold(
        appBar: const PremiumAppBar(
          title: 'Insights',
          subtitle: 'Patterns, health, and tips',
        ),
        body: const DashboardSkeleton(),
      );
    }

    Future<void> refresh() async {
      ref.invalidate(spendingTrendsProvider);
      ref.invalidate(insightsFeedProvider);
      ref.invalidate(
        spendingByTagsProvider(ref.read(selectedCycleKeyProvider)),
      );
    }

    return Scaffold(
      appBar: PremiumAppBar(
        title: 'Insights',
        subtitle: 'Patterns, health, and tips',
        actions: [
          IconButton(
            tooltip: 'Search',
            onPressed: () => context.push(AppRoutes.search),
            icon: const Icon(Icons.search_rounded),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: refresh,
        child: ResponsiveBody(
          padding: EdgeInsets.zero,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: ShellBottomInset.bottomOnly(context),
            children: [
              const InsightsFeedSection(),
              const SizedBox(height: AppSpacing.md),
              trendsAsync.when(
                loading: () => const Padding(
                  padding: EdgeInsets.symmetric(vertical: AppSpacing.lg),
                  child: DashboardSkeleton(),
                ),
                error: (e, _) => Padding(
                  padding: const EdgeInsets.symmetric(
                    vertical: AppSpacing.md,
                    horizontal: AppSpacing.md,
                  ),
                  child: ErrorState(
                    message:
                        'Charts could not load. Tips above are still available.',
                    onRetry: () => ref.invalidate(spendingTrendsProvider),
                  ),
                ),
                data: (report) => InsightsAnalyticsPanel(report: report),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
