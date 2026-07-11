import 'package:flutter/material.dart';
import 'package:rupee_track/core/design_system/tokens/app_motion.dart';

/// Subtle scale feedback for premium micro-interactions.
class PressableScale extends StatefulWidget {
  const PressableScale({
    required this.child,
    super.key,
    this.onTap,
    this.scale = AppMotion.pressScale,
    this.semanticLabel,
    this.enabled = true,
  });

  final Widget child;
  final VoidCallback? onTap;
  final double scale;
  final String? semanticLabel;
  final bool enabled;

  @override
  State<PressableScale> createState() => _PressableScaleState();
}

class _PressableScaleState extends State<PressableScale> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final interactive = widget.enabled && widget.onTap != null;
    final duration = AppMotion.resolve(context, AppMotion.durationFast);

    Widget content = AnimatedScale(
      scale: _pressed && interactive ? widget.scale : 1,
      duration: duration,
      curve: AppMotion.curveStandard,
      child: widget.child,
    );

    if (widget.semanticLabel != null) {
      content = Semantics(
        button: true,
        enabled: interactive,
        label: widget.semanticLabel,
        child: content,
      );
    }

    return GestureDetector(
      onTapDown: interactive ? (_) => setState(() => _pressed = true) : null,
      onTapUp: interactive ? (_) => setState(() => _pressed = false) : null,
      onTapCancel: interactive ? () => setState(() => _pressed = false) : null,
      onTap: interactive ? widget.onTap : null,
      child: content,
    );
  }
}
