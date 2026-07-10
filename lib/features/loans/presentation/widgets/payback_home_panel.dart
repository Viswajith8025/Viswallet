import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:rupee_track/core/database/app_database.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_card.dart';
import 'package:rupee_track/core/design_system/premium_snackbar.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:rupee_track/features/dashboard/data/dashboard_repository.dart';
import 'package:rupee_track/features/loans/data/loans_repository.dart';
import 'package:rupee_track/features/loans/presentation/schedule_payback_sheet.dart';

/// Bottom-of-home panel for money you borrowed and must pay back.
class PaybackHomePanel extends ConsumerWidget {
  const PaybackHomePanel({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final paybacksAsync = ref.watch(activeBorrowedPaybacksProvider);
    final theme = Theme.of(context);

    return paybacksAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (items) {
        return Padding(
          padding: const EdgeInsets.only(
            top: AppSpacing.sm,
            bottom: AppSpacing.sm,
          ),
          child: PremiumCard(
            variant: PremiumCardVariant.elevated,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.replay_circle_filled_outlined,
                      color: theme.colorScheme.error,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Money to pay back',
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Text(
                            items.isEmpty
                                ? 'Track what you borrowed — separate from loans you give'
                                : '${items.length} open · ${formatPaise(items.fold<int>(0, (s, l) => s + l.balancePaise))} to return',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                    TextButton(
                      onPressed: () => showSchedulePaybackSheet(context, ref),
                      child: const Text('Add'),
                    ),
                  ],
                ),
                if (items.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.sm),
                  ...items.take(3).map((loan) => _PaybackRow(loan: loan)),
                  if (items.length > 3) ...[
                    const SizedBox(height: AppSpacing.xs),
                    TextButton(
                      onPressed: () => context.push(AppRoutes.borrowed),
                      child: Text('View all ${items.length}'),
                    ),
                  ],
                ] else ...[
                  const SizedBox(height: AppSpacing.sm),
                  OutlinedButton.icon(
                    onPressed: () => showSchedulePaybackSheet(context, ref),
                    icon: const Icon(Icons.add_rounded),
                    label: const Text('Schedule pay-back'),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}

class _PaybackRow extends ConsumerStatefulWidget {
  const _PaybackRow({required this.loan});

  final LoansTableData loan;

  @override
  ConsumerState<_PaybackRow> createState() => _PaybackRowState();
}

class _PaybackRowState extends ConsumerState<_PaybackRow> {
  bool _busy = false;

  Future<void> _markPaid() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await ref.read(loansRepositoryProvider).markPaybackComplete(
            loanId: widget.loan.id,
            debitFromSalary: true,
          );
      ref.invalidate(activeBorrowedPaybacksProvider);
      ref.invalidate(duePaybacksProvider);
      ref.invalidate(monthlySummaryProvider);
      if (!mounted) return;
      showPremiumSnackBar(
        context,
        message: 'Paid back · deducted from this month\'s salary',
        kind: PremiumSnackBarKind.success,
      );
    } catch (_) {
      if (!mounted) return;
      showPremiumSnackBar(
        context,
        message: 'Could not update',
        kind: PremiumSnackBarKind.error,
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final loan = widget.loan;
    final due = loan.expectedReturnAt;
    final now = DateTime.now().toUtc();
    final isOverdue =
        due != null && due.isBefore(now) && loan.balancePaise > 0;
    final dueLabel =
        due == null ? 'No date' : DateFormat('d MMM').format(due.toLocal());

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  loan.personName,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  'Due $dueLabel · ${formatPaise(loan.balancePaise)}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: isOverdue
                        ? theme.colorScheme.error
                        : theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'Paid?',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              Switch(
                value: false,
                onChanged: _busy ? null : (_) => _markPaid(),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
