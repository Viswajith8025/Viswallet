import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_list_tile.dart';
import 'package:rupee_track/core/design_system/skeleton_loader.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/core/widgets/error_state.dart';
import 'package:rupee_track/features/insights/data/insights_feed_repository.dart';
import 'package:rupee_track/features/insights/domain/insights_feed_models.dart';
import 'package:rupee_track/features/insights/presentation/widgets/insight_feed_card.dart';
import 'package:rupee_track/features/insights/presentation/widgets/insights_section_header.dart';

final dismissedInsightIdsProvider = StateProvider<Set<String>>((ref) => {});
final pinnedInsightIdsProvider = StateProvider<Set<String>>((ref) => {});

class InsightsFeedSection extends ConsumerWidget {
  const InsightsFeedSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feedAsync = ref.watch(insightsFeedProvider);
    final dismissed = ref.watch(dismissedInsightIdsProvider);
    final pinned = ref.watch(pinnedInsightIdsProvider);

    return feedAsync.when(
      loading: () => Column(
        children: List.generate(
          3,
          (_) => const Padding(
            padding: EdgeInsets.symmetric(vertical: AppSpacing.xs),
            child: SkeletonCard(height: 88),
          ),
        ),
      ),
      error: (e, _) => ErrorState(
        message: 'Could not load insights.',
        onRetry: () => ref.invalidate(insightsFeedProvider),
      ),
      data: (report) {
        final visible = report.heroItems
            .where((i) => !dismissed.contains(i.id))
            .where((i) => i.kind != InsightKind.achievement)
            .toList()
          ..sort((a, b) {
            final aPin = pinned.contains(a.id);
            final bPin = pinned.contains(b.id);
            if (aPin != bPin) return aPin ? -1 : 1;
            return b.rankScore.compareTo(a.rankScore);
          });

        final priority = visible
            .where(
              (i) =>
                  i.severity == InsightSeverity.critical ||
                  i.severity == InsightSeverity.warning,
            )
            .take(3)
            .toList();
        final priorityIds = priority.map((i) => i.id).toSet();
        final regular =
            visible.where((i) => !priorityIds.contains(i.id)).toList();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const InsightsSectionHeader(
              icon: Icons.lightbulb_outline_rounded,
              title: 'Daily insight',
              subtitle: 'One quick read to start your day',
              compactTop: true,
            ),
            DailyTipCard(tip: report.dailyTip),
            if (priority.isNotEmpty) ...[
              InsightsSectionHeader(
                icon: Icons.warning_amber_rounded,
                title: 'Needs attention',
                subtitle: 'Alerts worth acting on now',
                count: priority.length,
                accentColor: Theme.of(context).colorScheme.error,
              ),
              ...priority.map(
                (item) => InsightFeedCard(
                  item: item,
                  featured: true,
                  isPinned: pinned.contains(item.id),
                  onPin: () => _togglePin(ref, pinned, item.id),
                  onDismiss: () => _dismiss(ref, dismissed, item.id),
                ),
              ),
            ],
            if (report.achievements.isNotEmpty) ...[
              InsightsSectionHeader(
                icon: Icons.emoji_events_outlined,
                title: 'Your wins',
                subtitle: 'Progress you have already made',
                count: report.achievements.length,
                accentColor: const Color(0xFF10B981),
              ),
              AchievementBanner(items: report.achievements),
            ],
            if (regular.isNotEmpty) ...[
              InsightsSectionHeader(
                icon: Icons.auto_awesome_outlined,
                title: 'More insights',
                subtitle: 'Trends, tips, and opportunities',
                count: regular.length,
              ),
              ...regular.map(
                (item) => InsightFeedCard(
                  item: item,
                  isPinned: pinned.contains(item.id),
                  onPin: () => _togglePin(ref, pinned, item.id),
                  onDismiss: () => _dismiss(ref, dismissed, item.id),
                ),
              ),
            ],
            if (priority.isEmpty &&
                regular.isEmpty &&
                report.achievements.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: AppSpacing.md),
                child: Text(
                  'More insights will appear as you track spending this cycle.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                  textAlign: TextAlign.center,
                ),
              ),
          ],
        );
      },
    );
  }

  void _togglePin(WidgetRef ref, Set<String> pinned, String id) {
    final next = Set<String>.from(pinned);
    if (next.contains(id)) {
      next.remove(id);
    } else {
      next.add(id);
    }
    ref.read(pinnedInsightIdsProvider.notifier).state = next;
  }

  void _dismiss(WidgetRef ref, Set<String> dismissed, String id) {
    ref.read(dismissedInsightIdsProvider.notifier).state = {
      ...dismissed,
      id,
    };
  }
}

class InsightsFeedCompactSection extends ConsumerWidget {
  const InsightsFeedCompactSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feedAsync = ref.watch(insightsFeedProvider);

    return feedAsync.when(
      loading: () => const SkeletonCard(height: 120),
      error: (e, _) => ErrorState(
        message: 'Could not load insights.',
        onRetry: () => ref.invalidate(insightsFeedProvider),
      ),
      data: (report) {
        final top = report.heroItems
            .where((i) => i.kind != InsightKind.achievement)
            .take(3)
            .toList();

        return Column(
          children: [
            InsightFeedCard(item: report.dailyTip, compact: true),
            ...top.map((item) => InsightFeedCard(item: item, compact: true)),
            PremiumRowTile(
              title: 'See all insights',
              leading: const Icon(Icons.insights_outlined, size: 20),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () => context.go(AppRoutes.insights),
            ),
          ],
        );
      },
    );
  }
}
