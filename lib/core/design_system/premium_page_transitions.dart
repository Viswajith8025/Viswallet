import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:rupee_track/core/design_system/tokens/app_motion.dart';

/// Calm push transition — subtle fade + 2% vertical slide, no bounce.
CustomTransitionPage<T> calmPushPage<T>({
  required Widget child,
  LocalKey? key,
}) {
  return CustomTransitionPage<T>(
    key: key,
    child: child,
    transitionDuration: AppMotion.durationNormal,
    reverseTransitionDuration: AppMotion.durationFast,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final curved = CurvedAnimation(
        parent: animation,
        curve: AppMotion.curveEnter,
        reverseCurve: AppMotion.curveExit,
      );

      if (AppMotion.reducedMotion(context)) {
        return FadeTransition(opacity: curved, child: child);
      }

      return FadeTransition(
        opacity: curved,
        child: SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0, 0.02),
            end: Offset.zero,
          ).animate(curved),
          child: child,
        ),
      );
    },
  );
}
