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
import 'package:rupee_track/features/loans/presentation/add_loan_sheet.dart';

/// Money you lent to others — not what you borrowed.
class LoansScreen extends ConsumerWidget {
  const LoansScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loansAsync = ref.watch(activeLentLoansProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: const PremiumAppBar(
        title: 'Lent money',
        subtitle: 'Money you gave to others',
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showAddLoanSheet(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Record lending'),
      ),
      body: ResponsiveBody(
        child: loansAsync.when(
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
            message: 'We couldn\'t load your lent money.',
            onRetry: () => ref.invalidate(activeLentLoansProvider),
          ),
          data: (loans) {
            if (loans.isEmpty) {
              return EmptyStates.loans(
                onAdd: () => showAddLoanSheet(context, ref),
              );
            }

            final now = DateTime.now().toUtc();

            return ListView.separated(
              padding: const EdgeInsets.only(
                top: AppSpacing.md,
                bottom: AppSpacing.xxl,
              ),
              itemCount: loans.length,
              separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.xs),
              itemBuilder: (context, index) {
                final loan = loans[index];
                final isOverdue = loan.expectedReturnAt != null &&
                    loan.expectedReturnAt!.isBefore(now) &&
                    loan.balancePaise > 0;

                return _LentLoanCard(loan: loan, isOverdue: isOverdue, theme: theme);
              },
            );
          },
        ),
      ),
    );
  }
}

class _LentLoanCard extends ConsumerStatefulWidget {
  const _LentLoanCard({
    required this.loan,
    required this.isOverdue,
    required this.theme,
  });

  final LoansTableData loan;
  final bool isOverdue;
  final ThemeData theme;

  @override
  ConsumerState<_LentLoanCard> createState() => _LentLoanCardState();
}

class _LentLoanCardState extends ConsumerState<_LentLoanCard> {
  bool _busy = false;

  Future<void> _markReturned(bool value) async {
    if (!value || _busy) return;
    setState(() => _busy = true);
    try {
      await ref.read(loansRepositoryProvider).markLoanReturned(
            loanId: widget.loan.id,
            creditToSalary: true,
          );
      ref.invalidate(activeLentLoansProvider);
      ref.invalidate(monthlySummaryProvider);
      if (!mounted) return;
      showPremiumSnackBar(
        context,
        message: 'Loan returned · added to this month\'s salary',
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
    final loan = widget.loan;
    final due = loan.expectedReturnAt;

    return PremiumCard(
      accentColor:
          widget.isOverdue ? widget.theme.colorScheme.error : widget.theme.colorScheme.tertiary,
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
                  loan.reason ?? 'Loan',
                  style: widget.theme.textTheme.bodySmall?.copyWith(
                    color: widget.theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                if (due != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Expected back ${due.toLocal().toString().split(' ').first}',
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
              Text('Returned?', style: widget.theme.textTheme.labelSmall),
              Switch(
                value: false,
                onChanged: _busy ? null : _markReturned,
              ),
              Text(
                '+ salary',
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
