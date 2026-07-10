import 'package:flutter/material.dart';
import 'package:rupee_track/core/design_system/compact_label.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_card.dart';
import 'package:rupee_track/features/insights/domain/insights_feed_models.dart';
import 'package:rupee_track/features/insights/presentation/insight_navigation.dart';

class InsightFeedCard extends StatelessWidget {
  const InsightFeedCard({
    required this.item,
    super.key,
    this.onDismiss,
    this.onPin,
    this.compact = false,
    this.featured = false,
    this.isPinned = false,
  });

  final InsightFeedItem item;
  final VoidCallback? onDismiss;
  final VoidCallback? onPin;
  final bool compact;
  final bool featured;
  final bool isPinned;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final accent = _severityColor(item.severity, theme.colorScheme);
    final icon = item.icon ?? iconForInsightCategory(item.category);
    final categoryLabel = labelForInsightCategory(item.category);

    final card = PremiumCard(
      variant: featured
          ? PremiumCardVariant.elevated
          : PremiumCardVariant.standard,
      accentColor: accent,
      tintColor: featured ? accent : null,
      onTap: compact && item.actionRoute != null
          ? () => navigateToInsightAction(context, item)
          : null,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  accent.withValues(alpha: 0.2),
                  accent.withValues(alpha: 0.08),
                ],
              ),
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Icon(icon, color: accent, size: 22),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: AppSpacing.xs,
                  runSpacing: AppSpacing.xxs,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    _InsightBadge(
                      label: labelForInsightKind(item.kind),
                      color: accent,
                    ),
                    _InsightBadge(
                      label: categoryLabel,
                      color: theme.colorScheme.onSurfaceVariant,
                      filled: false,
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xs),
                Row(
                  children: [
                    Expanded(
                      child: SingleLineLabel(
                        item.title,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    if (!compact && onPin != null)
                      IconButton(
                        tooltip: isPinned ? 'Unpin' : 'Pin',
                        visualDensity: VisualDensity.compact,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(
                          minWidth: 32,
                          minHeight: 32,
                        ),
                        onPressed: onPin,
                        icon: Icon(
                          isPinned
                              ? Icons.push_pin_rounded
                              : Icons.push_pin_outlined,
                          size: 18,
                          color: isPinned
                              ? theme.colorScheme.primary
                              : theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    if (!compact && onDismiss != null)
                      IconButton(
                        tooltip: 'Dismiss',
                        visualDensity: VisualDensity.compact,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(
                          minWidth: 32,
                          minHeight: 32,
                        ),
                        onPressed: onDismiss,
                        icon: Icon(
                          Icons.close_rounded,
                          size: 18,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  item.body,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    height: 1.45,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  maxLines: compact ? 2 : null,
                  overflow: compact ? TextOverflow.ellipsis : null,
                ),
                if (!compact && item.metricValue != null) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    '${item.metricLabel ?? 'Metric'}: ${item.metricValue}',
                    style: theme.textTheme.labelLarge?.copyWith(
                      color: accent,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
                if (!compact && item.actionRoute != null) ...[
                  const SizedBox(height: AppSpacing.sm),
                  FilledButton.tonal(
                    onPressed: () => navigateToInsightAction(context, item),
                    child: Text(item.actionLabel ?? 'Take action'),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: card,
    );
  }

  Color _severityColor(InsightSeverity severity, ColorScheme scheme) =>
      switch (severity) {
        InsightSeverity.critical => scheme.error,
        InsightSeverity.warning => const Color(0xFFF59E0B),
        InsightSeverity.opportunity => scheme.tertiary,
        InsightSeverity.achievement => const Color(0xFF10B981),
        InsightSeverity.info => scheme.primary,
      };
}

class _InsightBadge extends StatelessWidget {
  const _InsightBadge({
    required this.label,
    required this.color,
    this.filled = true,
  });

  final String label;
  final Color color;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: 3,
      ),
      decoration: BoxDecoration(
        color: filled
            ? color.withValues(alpha: 0.12)
            : theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(AppRadius.pill),
        border: filled
            ? null
            : Border.all(color: theme.dividerColor.withValues(alpha: 0.6)),
      ),
      child: Text(
        label,
        style: theme.textTheme.labelSmall?.copyWith(
          color: filled ? color : theme.colorScheme.onSurfaceVariant,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class DailyTipCard extends StatelessWidget {
  const DailyTipCard({required this.tip, super.key});

  final InsightFeedItem tip;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final accent = theme.colorScheme.tertiary;

    return PremiumCard(
      variant: PremiumCardVariant.tinted,
      tintColor: accent,
      accentColor: accent,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: accent.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: Icon(
              Icons.tips_and_updates_outlined,
              color: accent,
              size: 22,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SingleLineLabel(
                  tip.title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  tip.body,
                  style: theme.textTheme.bodyMedium?.copyWith(height: 1.45),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class AchievementBanner extends StatelessWidget {
  const AchievementBanner({required this.items, super.key});

  final List<InsightFeedItem> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();

    final theme = Theme.of(context);
    const winColor = Color(0xFF10B981);

    return SizedBox(
      height: 132,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
        itemBuilder: (context, index) {
          final item = items[index];
          return SizedBox(
            width: 236,
            child: PremiumCard(
              variant: PremiumCardVariant.tinted,
              tintColor: winColor,
              accentColor: winColor,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.emoji_events_outlined,
                        size: 18,
                        color: winColor,
                      ),
                      const SizedBox(width: AppSpacing.xs),
                      Expanded(
                        child: SingleLineLabel(
                          item.title,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    item.body,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                      height: 1.35,
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
