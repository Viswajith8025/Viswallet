import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/tokens/app_motion.dart';
import 'package:rupee_track/features/quick_add/presentation/quick_add_hub_sheet.dart';

class QuickAddFab extends ConsumerStatefulWidget {
  const QuickAddFab({super.key});

  @override
  ConsumerState<QuickAddFab> createState() => _QuickAddFabState();
}

class _QuickAddFabState extends ConsumerState<QuickAddFab>
    with SingleTickerProviderStateMixin {
  AnimationController? _press;

  @override
  void initState() {
    super.initState();
    _press = AnimationController(
      vsync: this,
      duration: AppMotion.durationFast,
      lowerBound: AppMotion.pressScale,
      upperBound: 1.0,
    )..value = 1.0;
  }

  @override
  void dispose() {
    _press?.dispose();
    super.dispose();
  }

  Future<void> _open() async {
    if (AppMotion.reducedMotion(context)) {
      await showQuickAddSheet(context, ref);
      return;
    }

    await _press?.reverse();
    if (!mounted) return;
    await showQuickAddSheet(context, ref);
    if (mounted) await _press?.forward();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final brightness = theme.brightness;
    final fab = DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppRadius.fab),
        boxShadow: AppElevation.shadow(brightness, AppElevationLevel.hero),
      ),
      child: FloatingActionButton.large(
        elevation: 0,
        highlightElevation: 0,
        onPressed: _open,
        tooltip: 'Quick add',
        child: const Icon(Icons.add_rounded, size: AppIconSize.lg),
      ),
    );

    if (_press == null || AppMotion.reducedMotion(context)) {
      return fab;
    }

    return ScaleTransition(scale: _press!, child: fab);
  }
}
