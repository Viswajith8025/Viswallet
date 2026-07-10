import 'package:flutter/material.dart';

/// Marker returned by dashboard widgets with no visible content.
/// The shell skips decoration/margin for these slots.
class DashboardEmpty extends StatelessWidget {
  const DashboardEmpty({super.key});

  static bool matches(Widget widget) => widget is DashboardEmpty;

  @override
  Widget build(BuildContext context) => const SizedBox.shrink();
}
