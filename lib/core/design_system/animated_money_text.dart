import 'package:flutter/material.dart';
import 'package:rupee_track/core/design_system/tokens/app_motion.dart';
import 'package:rupee_track/core/design_system/tokens/app_typography.dart';
import 'package:rupee_track/core/utils/money_utils.dart';

/// Calm count-up for balances — tabular figures, ease-out, reduced-motion safe.
class AnimatedMoneyText extends StatefulWidget {
  const AnimatedMoneyText(
    this.paise, {
    super.key,
    this.style,
    this.color,
    this.showPaise = false,
    this.duration = AppMotion.durationMoneyCount,
  });

  final int paise;
  final TextStyle? style;
  final Color? color;
  final bool showPaise;
  final Duration duration;

  @override
  State<AnimatedMoneyText> createState() => _AnimatedMoneyTextState();
}

class _AnimatedMoneyTextState extends State<AnimatedMoneyText> {
  late int _fromPaise;
  late int _toPaise;

  @override
  void initState() {
    super.initState();
    _fromPaise = widget.paise;
    _toPaise = widget.paise;
  }

  @override
  void didUpdateWidget(covariant AnimatedMoneyText oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.paise != widget.paise) {
      _fromPaise = oldWidget.paise;
      _toPaise = widget.paise;
    }
  }

  @override
  Widget build(BuildContext context) {
    final textStyle =
        widget.style ?? AppTypography.money(context, color: widget.color);
    final resolvedDuration = AppMotion.resolve(context, widget.duration);

    if (resolvedDuration == Duration.zero) {
      return Text(
        formatPaise(widget.paise, showPaise: widget.showPaise),
        style: textStyle,
      );
    }

    return TweenAnimationBuilder<int>(
      key: ValueKey<int>(_toPaise),
      tween: IntTween(begin: _fromPaise, end: _toPaise),
      duration: resolvedDuration,
      curve: AppMotion.curveStandard,
      builder: (context, value, _) {
        return Text(
          formatPaise(value, showPaise: widget.showPaise),
          style: textStyle,
        );
      },
    );
  }
}
