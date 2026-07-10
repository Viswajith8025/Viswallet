import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_bottom_sheet.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:rupee_track/features/loans/data/loans_repository.dart';

Future<void> showAddLoanSheet(BuildContext context, WidgetRef ref) {
  return showPremiumBottomSheet<void>(
    context: context,
    initialSize: 0.72,
    child: const _AddLoanSheet(),
  );
}

class _AddLoanSheet extends ConsumerStatefulWidget {
  const _AddLoanSheet();

  @override
  ConsumerState<_AddLoanSheet> createState() => _AddLoanSheetState();
}

class _AddLoanSheetState extends ConsumerState<_AddLoanSheet> {
  final _personController = TextEditingController();
  final _amountController = TextEditingController();
  final _reasonController = TextEditingController();
  DateTime? _dueDate;
  bool _saving = false;

  @override
  void dispose() {
    _personController.dispose();
    _amountController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _pickDueDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _dueDate ?? DateTime.now().add(const Duration(days: 30)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
    );
    if (picked != null) setState(() => _dueDate = picked);
  }

  Future<void> _save() async {
    final person = _personController.text.trim();
    final amount = rupeesToPaise(_amountController.text);
    if (person.isEmpty) {
      _showError('Enter who you lent money to');
      return;
    }
    if (amount <= 0) {
      _showError('Enter a valid amount');
      return;
    }

    setState(() => _saving = true);
    try {
      await ref.read(loansRepositoryProvider).addLoan(
            personName: person,
            amountPaise: amount,
            reason: _reasonController.text.trim().isEmpty
                ? null
                : _reasonController.text.trim(),
            expectedReturnAt: _dueDate?.toUtc(),
          );
      ref.invalidate(activeLentLoansProvider);
      ref.invalidate(activeLoansProvider);
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lent money recorded · ${formatPaise(amount)}')),
      );
    } catch (e) {
      _showError('Could not save this lending. Please try again.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListView(
      padding: AppResponsive.screenPadding(context, bottom: AppSpacing.xl),
      children: [
        Text(
          'Record lent money',
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          'Money you gave to someone else. Track when they should return it.',
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        TextField(
          controller: _personController,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(
            labelText: 'Lent to',
            hintText: 'Friend, family, colleague…',
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        TextField(
          controller: _amountController,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: const InputDecoration(
            labelText: 'Amount',
            prefixText: '₹ ',
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        TextField(
          controller: _reasonController,
          textCapitalization: TextCapitalization.sentences,
          decoration: const InputDecoration(
            labelText: 'Reason (optional)',
            hintText: 'Helped with rent, emergency…',
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        OutlinedButton.icon(
          onPressed: _pickDueDate,
          icon: const Icon(Icons.event_outlined),
          label: Text(
            _dueDate == null
                ? 'Expected return date (optional)'
                : 'Return by ${_dueDate!.day}/${_dueDate!.month}/${_dueDate!.year}',
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
        FilledButton(
          onPressed: _saving ? null : _save,
          child: Text(_saving ? 'Saving…' : 'Save loan'),
        ),
      ],
    );
  }
}
