import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/shell_bottom_inset.dart';
import 'package:rupee_track/features/quick_add/data/fab_position_store.dart';
import 'package:rupee_track/features/quick_add/presentation/quick_add_hub_sheet.dart';

/// Draggable Quick Add button — hold ~0.35s, then drag to reposition. Tap to open.
class PositionedQuickAddFab extends ConsumerStatefulWidget {
  const PositionedQuickAddFab({super.key});

  @override
  ConsumerState<PositionedQuickAddFab> createState() =>
      _PositionedQuickAddFabState();
}

class _PositionedQuickAddFabState extends ConsumerState<PositionedQuickAddFab>
    with SingleTickerProviderStateMixin {
  late Offset _offset;
  Offset _dragOrigin = Offset.zero;
  Offset? _pointerDown;
  Timer? _holdTimer;
  bool _dragging = false;
  late final AnimationController _pulse;

  @override
  void initState() {
    super.initState();
    _offset = FabPositionStore.load();
    _pulse = AnimationController(
      vsync: this,
      duration: AppMotion.durationFast,
      lowerBound: 0.94,
      upperBound: 1.0,
    )..value = 1.0;
  }

  @override
  void dispose() {
    _holdTimer?.cancel();
    _pulse.dispose();
    super.dispose();
  }

  void _clampOffset() {
    final size = MediaQuery.sizeOf(context);
    final maxDx =
        size.width - ShellBottomInset.fabSize - ShellBottomInset.fabMargin * 2;
    final maxDy = size.height * 0.6;
    _offset = Offset(
      _offset.dx.clamp(-maxDx, 0),
      _offset.dy.clamp(-maxDy, 0),
    );
  }

  Future<void> _openSheet() async {
    await _pulse.reverse();
    if (!mounted) return;
    await showQuickAddSheet(context, ref);
    if (mounted) await _pulse.forward();
  }

  void _onPointerDown(PointerDownEvent event) {
    _pointerDown = event.position;
    _dragOrigin = _offset;
    _holdTimer?.cancel();
    _holdTimer = Timer(const Duration(milliseconds: 350), () {
      if (!mounted || _pointerDown == null) return;
      setState(() => _dragging = true);
      HapticFeedback.mediumImpact();
    });
  }

  void _onPointerMove(PointerMoveEvent event) {
    if (!_dragging) {
      final down = _pointerDown;
      if (down != null && (event.position - down).distance > 14) {
        _holdTimer?.cancel();
      }
      return;
    }

    final down = _pointerDown;
    if (down == null) return;

    final delta = event.position - down;
    setState(() {
      _offset = Offset(
        _dragOrigin.dx + delta.dx,
        _dragOrigin.dy + delta.dy,
      );
      _clampOffset();
    });
  }

  Future<void> _onPointerUp(PointerUpEvent event) async {
    _holdTimer?.cancel();
    final down = _pointerDown;
    _pointerDown = null;

    if (_dragging) {
      setState(() => _dragging = false);
      await FabPositionStore.save(_offset);
      return;
    }

    if (down != null && (event.position - down).distance < 14) {
      await _openSheet();
    }
  }

  void _onPointerCancel(PointerCancelEvent event) {
    _holdTimer?.cancel();
    _pointerDown = null;
    if (_dragging) {
      setState(() => _dragging = false);
      FabPositionStore.save(_offset);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final brightness = theme.brightness;

    return Positioned(
      right: ShellBottomInset.fabMargin - _offset.dx,
      bottom: ShellBottomInset.fabBottom(context) - _offset.dy,
      child: Listener(
        behavior: HitTestBehavior.opaque,
        onPointerDown: _onPointerDown,
        onPointerMove: _onPointerMove,
        onPointerUp: _onPointerUp,
        onPointerCancel: _onPointerCancel,
        child: ScaleTransition(
          scale: _pulse,
          child: AnimatedContainer(
            duration: AppMotion.durationFast,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppRadius.fab),
              boxShadow: AppElevation.shadow(brightness, AppElevationLevel.hero),
              border: _dragging
                  ? Border.all(
                      color: theme.colorScheme.primary.withValues(alpha: 0.7),
                      width: 2,
                    )
                  : null,
            ),
            child: Material(
              color: theme.colorScheme.primary,
              elevation: 0,
              shape: const CircleBorder(),
              clipBehavior: Clip.antiAlias,
              child: SizedBox(
                width: ShellBottomInset.fabSize,
                height: ShellBottomInset.fabSize,
                child: Icon(
                  _dragging ? Icons.open_with_rounded : Icons.add_rounded,
                  size: AppIconSize.lg,
                  color: theme.colorScheme.onPrimary,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
