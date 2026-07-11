import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rupee_track/core/database/app_database.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_app_bar.dart';
import 'package:rupee_track/core/design_system/premium_card.dart';
import 'package:rupee_track/core/design_system/premium_snackbar.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/core/design_system/skeleton_loader.dart';
import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:rupee_track/core/widgets/empty_state.dart';
import 'package:rupee_track/core/widgets/error_state.dart';
import 'package:rupee_track/features/dashboard/data/dashboard_repository.dart';
import 'package:rupee_track/features/loans/data/loans_repository.dart';
import 'package:rupee_track/features/loans/presentation/schedule_payback_sheet.dart';

/// Money you borrowed and must return — not loans you gave to others.
class BorrowedScreen extends ConsumerWidget {
  const BorrowedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final paybacksAsync = ref.watch(activeBorrowedPaybacksProvider);
    final theme = Theme.of(context);
    final showFab = paybacksAsync.valueOrNull?.isNotEmpty ?? false;

    return Scaffold(
      appBar: const PremiumAppBar(
        title: 'Borrowed money',
        subtitle: 'What you owe and when to pay back',
      ),
      floatingActionButton: showFab
          ? FloatingActionButton.extended(
              onPressed: () => showSchedulePaybackSheet(context, ref),
              icon: const Icon(Icons.add),
              label: const Text('Schedule pay-back'),
            )
          : null,
      body: ResponsiveBody(
        child: paybacksAsync.when(
          loading: () => ListView.separated(
            padding: const EdgeInsets.only(
              top: AppSpacing.md,
              bottom: AppSpacing.xxl,
            ),
            itemCount: 5,
            separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.xs),
            itemBuilder: (_, __) => const SkeletonCard(height: 88),
          ),
          error: (e, _) => ErrorState(
            message: 'We couldn\'t load your pay-backs.',
            onRetry: () => ref.invalidate(activeBorrowedPaybacksProvider),
          ),
          data: (items) {
            if (items.isEmpty) {
              return EmptyState(
                icon: Icons.replay_circle_filled_outlined,
                title: 'Nothing to pay back',
                message:
                    'When you borrow money from someone, schedule the amount and return date here.\nThis is separate from loans you give to others.',
                action: FilledButton.icon(
                  onPressed: () => showSchedulePaybackSheet(context, ref),
                  icon: const Icon(Icons.add_rounded, size: 20),
                  label: const Text('Schedule pay-back'),
                ),
              );
            }

            final now = DateTime.now().toUtc();

            return ListView.separated(
              padding: const EdgeInsets.only(
                top: AppSpacing.md,
                bottom: AppSpacing.xxl,
              ),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.xs),
              itemBuilder: (context, index) {
                final item = items[index];
                return _PaybackCard(
                  loan: item,
                  isOverdue: item.expectedReturnAt != null &&
                      item.expectedReturnAt!.isBefore(now) &&
                      item.balancePaise > 0,
                  theme: theme,
                );
              },
            );
          },
        ),
      ),
    );
  }
}

class _PaybackCard extends ConsumerStatefulWidget {
  const _PaybackCard({
    required this.loan,
    required this.isOverdue,
    required this.theme,
  });

  final LoansTableData loan;
  final bool isOverdue;
  final ThemeData theme;

  @override
  ConsumerState<_PaybackCard> createState() => _PaybackCardState();
}

class _PaybackCardState extends ConsumerState<_PaybackCard> {
  bool _busy = false;

  Future<void> _markPaid(bool value) async {
    if (!value || _busy) return;
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
        message: 'Could not mark as paid',
        kind: PremiumSnackBarKind.error,
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final loan = widget.loan;
    final due = loan.expectedReturnAt;

    return PremiumCard(
      accentColor:
          widget.isOverdue ? widget.theme.colorScheme.error : null,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  loan.personName,
                  style: widget.theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  loan.reason ?? 'Borrowed money',
                  style: widget.theme.textTheme.bodySmall?.copyWith(
                    color: widget.theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                if (due != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Pay back by ${due.toLocal().toString().split(' ').first}',
                    style: widget.theme.textTheme.labelSmall?.copyWith(
                      color: widget.isOverdue
                          ? widget.theme.colorScheme.error
                          : widget.theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
                const SizedBox(height: 4),
                Text(
                  formatPaise(loan.balancePaise),
                  style: widget.theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          Column(
            children: [
              Text('Paid back', style: widget.theme.textTheme.labelSmall),
              Switch(
                value: false,
                onChanged: _busy ? null : _markPaid,
              ),
              Text(
                '− salary',
                style: widget.theme.textTheme.labelSmall?.copyWith(
                  color: widget.theme.colorScheme.onSurfaceVariant,
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
