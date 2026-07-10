import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

/// Quick date selection for new expenses (today, yesterday, or custom).
class ExpenseDatePickerRow extends StatelessWidget {
  const ExpenseDatePickerRow({
    required this.date,
    required this.onDateChanged,
    super.key,
  });

  final DateTime date;
  final ValueChanged<DateTime> onDateChanged;

  static DateTime dateOnly(DateTime value) =>
      DateTime(value.year, value.month, value.day);

  static String formatExpenseDate(DateTime value) {
    final local = value.toLocal();
    final picked = dateOnly(local);
    final today = dateOnly(DateTime.now());
    if (picked == today) return 'Today';
    if (picked == today.subtract(const Duration(days: 1))) return 'Yesterday';
    return DateFormat('d MMM yyyy').format(local);
  }

  Future<void> _pickDate(BuildContext context) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: date,
      firstDate: DateTime.now().subtract(const Duration(days: 365 * 5)),
      lastDate: DateTime.now(),
    );
    if (picked != null) onDateChanged(picked);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final today = dateOnly(DateTime.now());
    final yesterday = today.subtract(const Duration(days: 1));
    final picked = dateOnly(date);
    final isPreset = picked == today || picked == yesterday;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('When', style: theme.textTheme.titleSmall),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            FilterChip(
              label: const Text('Today'),
              selected: picked == today,
              onSelected: (_) => onDateChanged(today),
              showCheckmark: false,
            ),
            FilterChip(
              label: const Text('Yesterday'),
              selected: picked == yesterday,
              onSelected: (_) => onDateChanged(yesterday),
              showCheckmark: false,
            ),
            ActionChip(
              avatar: const Icon(Icons.calendar_today_outlined, size: 18),
              label: Text(isPreset ? 'Pick date' : formatExpenseDate(date)),
              onPressed: () => _pickDate(context),
            ),
          ],
        ),
      ],
    );
  }
}
