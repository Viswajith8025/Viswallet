import 'package:flutter/material.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/tokens/app_motion.dart';

class EmptyState extends StatefulWidget {
  const EmptyState({
    required this.title,
    super.key,
    this.message,
    this.icon = Icons.inbox_outlined,
    this.action,
    this.accentColor,
  });

  final String title;
  final String? message;
  final IconData icon;
  final Widget? action;
  final Color? accentColor;

  @override
  State<EmptyState> createState() => _EmptyStateState();
}

class _EmptyStateState extends State<EmptyState>
    with SingleTickerProviderStateMixin {
  AnimationController? _controller;
  Animation<double>? _fade;
  Animation<Offset>? _slide;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: AppMotion.durationSlow,
    );
    _fade = CurvedAnimation(parent: _controller!, curve: AppMotion.curveEnter);
    _slide = Tween<Offset>(
      begin: const Offset(0, 0.04),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller!, curve: AppMotion.curveEnter));
    _controller!.forward();
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final accent = widget.accentColor ?? theme.colorScheme.primary;
    final content = Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.xxxl,
          vertical: AppSpacing.xxl,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                color: accent.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(AppRadius.xl),
                border: Border.all(
                  color: accent.withValues(alpha: 0.12),
                ),
              ),
              child: Icon(widget.icon, size: 42, color: accent),
            ),
            const SizedBox(height: AppSpacing.xl),
            Text(
              widget.title,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
              textAlign: TextAlign.center,
            ),
            if (widget.message != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(
                widget.message!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                  height: 1.55,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (widget.action != null) ...[
              const SizedBox(height: AppSpacing.xxl),
              widget.action!,
            ],
          ],
        ),
      ),
    );

    if (AppMotion.reducedMotion(context) || _fade == null || _slide == null) {
      return content;
    }

    return FadeTransition(
      opacity: _fade!,
      child: SlideTransition(position: _slide!, child: content),
    );
  }
}

/// Branded empty states for common screens.
abstract final class EmptyStates {
  static Widget expenses({required VoidCallback onAdd}) {
    return Builder(
      builder: (context) {
        final semantics = context.semanticColors;
        return EmptyState(
          icon: Icons.receipt_long_outlined,
          title: 'No expenses yet',
          message:
              'Add the money you spend, one entry at a time.\nStart with your latest purchase.',
          accentColor: semantics.expense,
          action: FilledButton.icon(
            onPressed: onAdd,
            icon: const Icon(Icons.add_rounded, size: 20),
            label: const Text('Add expense'),
          ),
        );
      },
    );
  }

  static Widget subscriptions({VoidCallback? onAdd}) {
    return Builder(
      builder: (context) => EmptyState(
        icon: Icons.subscriptions_outlined,
        title: 'No subscriptions yet',
        message:
            'Add monthly payments like Netflix, Spotify, internet, or recharge plans.\nViswallet will track what is coming.',
        accentColor: Theme.of(context).colorScheme.primary,
        action: onAdd == null
            ? null
            : FilledButton.icon(
                onPressed: onAdd,
                icon: const Icon(Icons.add_rounded, size: 20),
                label: const Text('Add subscription'),
              ),
      ),
    );
  }

  static Widget loans({VoidCallback? onAdd}) {
    return Builder(
      builder: (context) {
        final semantics = context.semanticColors;
        return EmptyState(
          icon: Icons.handshake_outlined,
          title: 'No lent money yet',
          message:
              'Track money you lent to someone.\nYou will always know what is still pending.',
          accentColor: semantics.income,
          action: onAdd == null
              ? null
              : FilledButton.icon(
                  onPressed: onAdd,
                  icon: const Icon(Icons.add_rounded, size: 20),
                  label: const Text('Record lending'),
                ),
        );
      },
    );
  }

  static Widget goals({VoidCallback? onAdd}) {
    return Builder(
      builder: (context) {
        final semantics = context.semanticColors;
        return EmptyState(
          icon: Icons.flag_outlined,
          title: 'No savings goals yet',
          message:
              'Set a target — a trip, emergency fund, or gadget.\n'
              'Viswallet tracks your progress every cycle.',
          accentColor: semantics.income,
          action: onAdd == null
              ? null
              : FilledButton.icon(
                  onPressed: onAdd,
                  icon: const Icon(Icons.add_rounded, size: 20),
                  label: const Text('Create goal'),
                ),
        );
      },
    );
  }

  static Widget wishlist({VoidCallback? onAdd}) {
    return Builder(
      builder: (context) => EmptyState(
        icon: Icons.favorite_border_rounded,
        title: 'Your wishlist is empty',
        message:
            'Save for things you want — not just things you need.\n'
            'Add a wishlist item from Savings forecast.',
        accentColor: Theme.of(context).colorScheme.primary,
        action: onAdd == null
            ? null
            : FilledButton.icon(
                onPressed: onAdd,
                icon: const Icon(Icons.add_rounded, size: 20),
                label: const Text('Add to wishlist'),
              ),
      ),
    );
  }

  static Widget search({String? query}) {
    return Builder(
      builder: (context) => EmptyState(
        icon: Icons.search_rounded,
        title: query == null ? 'Search everything' : 'No results found',
        message: query == null
            ? 'Find expenses, subscriptions, goals, and more in one place.'
            : 'Try a different keyword or clear your filters.',
        accentColor: Theme.of(context).colorScheme.primary,
      ),
    );
  }

  static Widget reports() {
    return Builder(
      builder: (context) => EmptyState(
        icon: Icons.summarize_outlined,
        title: 'Reports unlock with data',
        message:
            'Add your salary and a few expenses.\n'
            'Your monthly closing report will appear here.',
        accentColor: Theme.of(context).colorScheme.primary,
      ),
    );
  }
}
