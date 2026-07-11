import 'package:flutter/material.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/tokens/app_motion.dart';

/// Shimmer skeleton placeholder — avoids spinners for premium loading feel.
class SkeletonBox extends StatefulWidget {
  const SkeletonBox({
    super.key,
    this.width,
    this.height = 16,
    this.borderRadius = AppRadius.sm,
  });

  final double? width;
  final double height;
  final double borderRadius;

  @override
  State<SkeletonBox> createState() => _SkeletonBoxState();
}

class _SkeletonBoxState extends State<SkeletonBox>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final base = theme.colorScheme.surfaceContainerHighest;

    if (AppMotion.reducedMotion(context)) {
      return Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(widget.borderRadius),
          color: base,
        ),
      );
    }

    final highlight = theme.brightness == Brightness.dark
        ? base.withValues(alpha: 0.9)
        : Colors.white.withValues(alpha: 0.7);

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: LinearGradient(
              begin: Alignment(-1 + 2 * _controller.value, 0),
              end: Alignment(1 + 2 * _controller.value, 0),
              colors: [base, highlight, base],
            ),
          ),
        );
      },
    );
  }
}

class SkeletonCard extends StatelessWidget {
  const SkeletonCard({super.key, this.height = 120});

  final double height;

  @override
  Widget build(BuildContext context) {
    return SkeletonBox(
      height: height,
      borderRadius: AppRadius.card,
    );
  }
}

class DashboardSkeleton extends StatelessWidget {
  const DashboardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.screenHorizontal,
        0,
        AppSpacing.screenHorizontal,
        100,
      ),
      children: const [
        SkeletonBox(height: 28, width: 200, borderRadius: AppRadius.sm),
        SizedBox(height: AppSpacing.sm),
        SkeletonBox(height: 14, width: 160),
        SizedBox(height: AppSpacing.xl),
        SkeletonCard(height: 168),
        SizedBox(height: AppSpacing.md),
        SkeletonCard(height: 100),
        SizedBox(height: AppSpacing.md),
        SkeletonCard(height: 100),
        SizedBox(height: AppSpacing.xl),
        Row(
          children: [
            Expanded(child: SkeletonCard(height: 110)),
            SizedBox(width: AppSpacing.sm),
            Expanded(child: SkeletonCard(height: 110)),
          ],
        ),
      ],
    );
  }
}
