import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rupee_track/core/design_system/app_scroll_behavior.dart';
import 'package:rupee_track/core/design_system/premium_chip.dart';
import 'package:rupee_track/core/providers/salary_cycle_provider.dart';
import 'package:rupee_track/core/utils/date_utils.dart';

/// Horizontal chips for switching between salary cycles.
class CycleSelector extends ConsumerWidget {
  const CycleSelector({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(selectedCycleKeyProvider);
    final salaryDay = ref.watch(salaryDayProvider);
    final cycles = recentCycleKeys(salaryDay: salaryDay, count: 6);

    return AppHorizontalChipList(
      itemCount: cycles.length,
      itemBuilder: (context, index) {
        final key = cycles[index];
        final isSelected = key == selected;
        final label = formatCycleLabelShort(key, salaryDay: salaryDay);

        return PremiumFilterChip(
          label: label,
          selected: isSelected,
          onSelected: (_) {
            ref.read(selectedCycleKeyProvider.notifier).setCycle(key);
          },
        );
      },
    );
  }
}

/// @deprecated Use [CycleSelector].
typedef MonthSelector = CycleSelector;
