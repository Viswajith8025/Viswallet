import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/money_preview_strip.dart';
import 'package:rupee_track/core/design_system/premium_app_bar.dart';
import 'package:rupee_track/core/design_system/premium_card.dart';
import 'package:rupee_track/core/design_system/premium_snackbar.dart';
import 'package:rupee_track/core/design_system/skeleton_loader.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/core/providers/database_provider.dart';
import 'package:rupee_track/core/providers/salary_cycle_provider.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/core/utils/date_utils.dart';
import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:rupee_track/core/widgets/money_text.dart';
import 'package:rupee_track/features/budget/domain/budget_templates.dart';
import 'package:rupee_track/features/budget/data/budget_repository.dart';
import 'package:rupee_track/features/budget/domain/allocation_mode.dart';
import 'package:rupee_track/features/dashboard/data/dashboard_repository.dart';

class BudgetSetupScreen extends HookConsumerWidget {
  const BudgetSetupScreen({super.key, this.initialSalaryPaise});

  final int? initialSalaryPaise;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cycleKey = ref.watch(selectedCycleKeyProvider);
    final salaryDay = ref.watch(salaryDayProvider);
    final step = useState(0);
    final mode = useState(AllocationMode.percentage);
    final rollover = useState(true);
    final isSaving = useState(false);
    final salaryController = useTextEditingController(
      text: initialSalaryPaise != null
          ? paiseToRupees(initialSalaryPaise!).round().toString()
          : '',
    );
    final allocations = useState<List<BucketAllocationInput>>([]);
    final isLoadingAlloc = useState(false);
    final semantics = context.semanticColors;

    useListenable(salaryController);

    useEffect(() {
      if (initialSalaryPaise != null) return null;
      Future<void> prefillSalary() async {
        if (salaryController.text.trim().isNotEmpty) return;
        final dao = await ref.read(salaryDaoProvider.future);
        final inflow = await dao.getTotalCycleInflowPaise(cycleKey);
        if (inflow > 0) {
          salaryController.text = paiseToRupees(inflow).round().toString();
        }
      }

      prefillSalary();
      return null;
    }, [cycleKey]);

    Future<void> loadAllocations() async {
      final salary = rupeesToPaise(salaryController.text);
      if (salary <= 0) return;
      isLoadingAlloc.value = true;
      try {
        final list = await ref.read(budgetRepositoryProvider).buildAllocationsForMode(
              mode: mode.value,
              salaryPaise: salary,
              monthKey: cycleKey,
              rolloverEnabled: rollover.value,
              manualInputs: allocations.value.isNotEmpty ? allocations.value : null,
            );
        allocations.value = list;
      } finally {
        isLoadingAlloc.value = false;
      }
    }

    final salaryPaise = rupeesToPaise(salaryController.text);
    final allocatedPaise = allocations.value.fold<int>(
      0,
      (int sum, BucketAllocationInput bucket) =>
          sum + bucket.allocatedPaise + bucket.rolloverPaise,
    );

    return Scaffold(
      appBar: PremiumAppBar(
        title: 'Set up budget',
        subtitle: formatCycleLabel(cycleKey, salaryDay: salaryDay),
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      body: ResponsiveBody(
        child: ListView(
          padding: AppResponsive.screenPadding(
            context,
            bottom: AppSpacing.xxl,
          ),
          children: [
            Text(
              'Divide your salary into spending groups. Expenses will track against the right bucket.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
            const SizedBox(height: AppSpacing.lg),
            if (step.value == 0) ...[
              TextField(
                controller: salaryController,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'In-hand salary this cycle',
                  prefixText: '₹ ',
                ),
                onChanged: (_) {},
              ),
              if (salaryPaise > 0) ...[
                const SizedBox(height: AppSpacing.md),
                MoneyPreviewStrip(
                  label: 'Budget base',
                  chipLabel: 'Live preview',
                  amountPaise: salaryPaise,
                  moneyColor: semantics.income,
                  subtitle: 'This is the pool you will split across groups',
                ),
              ],
              const SizedBox(height: AppSpacing.lg),
              Text(
                'How should we split it?',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: AppSpacing.sm),
              ...AllocationMode.values.map(
                (m) => Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: _ModeCard(
                    mode: m,
                    selected: mode.value == m,
                    onTap: () => mode.value = m,
                  ),
                ),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Carry forward money left over'),
                subtitle: const Text(
                  'Unspent group balance adds to next cycle.',
                ),
                value: rollover.value,
                onChanged: (v) => rollover.value = v,
              ),
              const SizedBox(height: AppSpacing.md),
              FilledButton(
                onPressed: () async {
                  if (salaryPaise <= 0) {
                    showPremiumSnackBar(
                      context,
                      message: 'Enter a valid salary',
                      kind: PremiumSnackBarKind.error,
                    );
                    return;
                  }
                  await loadAllocations();
                  step.value = 1;
                },
                child: const Text('Continue'),
              ),
            ] else ...[
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Review your split',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ),
                  if (mode.value == AllocationMode.aiSuggested)
                    TextButton(
                      onPressed: isLoadingAlloc.value ? null : loadAllocations,
                      child: const Text('Suggest again'),
                    ),
                ],
              ),
              const SizedBox(height: AppSpacing.sm),
              MoneyPreviewStrip(
                label: 'Total planned',
                chipLabel: 'Not saved yet',
                amountPaise: allocatedPaise,
                moneyColor: allocatedPaise > salaryPaise
                    ? semantics.expense
                    : semantics.income,
                subtitle:
                    '${formatPaise(allocatedPaise)} of ${formatPaise(salaryPaise)} allocated',
                detailLines: allocatedPaise > salaryPaise
                    ? const ['Reduce a group — planned total exceeds salary']
                    : [
                        if (salaryPaise - allocatedPaise > 0)
                          '${formatPaise(salaryPaise - allocatedPaise)} unassigned',
                      ],
              ),
              const SizedBox(height: AppSpacing.lg),
              if (isLoadingAlloc.value)
                const SkeletonCard(height: 200)
              else
                ...allocations.value.map(
                  (a) => _AllocationTile(
                    allocation: a,
                    salaryPaise: salaryPaise,
                    editable: mode.value != AllocationMode.aiSuggested,
                    onChanged: (updated) {
                      final list = [...allocations.value];
                      final i =
                          list.indexWhere((b) => b.bucketKey == a.bucketKey);
                      if (i >= 0) list[i] = updated;
                      allocations.value = list;
                    },
                  ),
                ),
              const SizedBox(height: AppSpacing.lg),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => step.value = 0,
                      child: const Text('Back'),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    flex: 2,
                    child: FilledButton(
                      onPressed: isSaving.value
                          ? null
                          : () async {
                              if (salaryPaise <= 0) return;
                              if (allocatedPaise > salaryPaise) {
                                if (context.mounted) {
                                  showPremiumSnackBar(
                                    context,
                                    message:
                                        'Planned amounts cannot exceed your salary',
                                    kind: PremiumSnackBarKind.error,
                                  );
                                }
                                return;
                              }
                              isSaving.value = true;
                              try {
                                final aiNotes =
                                    mode.value == AllocationMode.aiSuggested
                                        ? await ref
                                            .read(budgetRepositoryProvider)
                                            .buildAiNotes()
                                        : null;
                                await ref
                                    .read(budgetRepositoryProvider)
                                    .saveBudgetPlan(
                                      monthKey: cycleKey,
                                      salaryPaise: salaryPaise,
                                      mode: mode.value,
                                      rolloverEnabled: rollover.value,
                                      allocations: allocations.value,
                                      aiNotes: aiNotes,
                                    );
                                ref.invalidate(
                                  budgetPlanStatusProvider(cycleKey),
                                );
                                ref.invalidate(monthlySummaryProvider(cycleKey));
                                if (context.mounted) {
                                  context.go(AppRoutes.budget);
                                  showSaveConfirmation(
                                    context,
                                    message: 'Budget plan saved',
                                  );
                                }
                              } finally {
                                isSaving.value = false;
                              }
                            },
                      child: Text(
                        isSaving.value ? 'Saving…' : 'Save budget',
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ModeCard extends StatelessWidget {
  const _ModeCard({
    required this.mode,
    required this.selected,
    required this.onTap,
  });

  final AllocationMode mode;
  final bool selected;
  final VoidCallback onTap;

  String get _subtitle => switch (mode) {
        AllocationMode.manual => 'You choose the exact rupee amount for each group.',
        AllocationMode.percentage =>
          'Beginner-friendly: divide salary using simple percentages.',
        AllocationMode.perCategory =>
          'Set a separate monthly limit for each category.',
        AllocationMode.aiSuggested =>
          'Viswallet suggests a split from your spending habits.',
      };

  IconData get _icon => switch (mode) {
        AllocationMode.manual => Icons.edit_outlined,
        AllocationMode.percentage => Icons.pie_chart_outline,
        AllocationMode.perCategory => Icons.category_outlined,
        AllocationMode.aiSuggested => Icons.auto_awesome,
      };

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return PremiumCard(
      onTap: onTap,
      accentColor: selected ? scheme.primary : null,
      child: ListTile(
        contentPadding: EdgeInsets.zero,
        leading: Icon(_icon, color: selected ? scheme.primary : null),
        title: Text(mode.label),
        subtitle: Text(_subtitle),
        trailing:
            selected ? Icon(Icons.check_circle, color: scheme.primary) : null,
      ),
    );
  }
}

class _AllocationTile extends StatelessWidget {
  const _AllocationTile({
    required this.allocation,
    required this.salaryPaise,
    required this.editable,
    required this.onChanged,
  });

  final BucketAllocationInput allocation;
  final int salaryPaise;
  final bool editable;
  final ValueChanged<BucketAllocationInput> onChanged;

  @override
  Widget build(BuildContext context) {
    final percent = salaryPaise > 0
        ? (allocation.allocatedPaise / salaryPaise * 100).toStringAsFixed(1)
        : '0';
    final semantics = context.semanticColors;

    return PremiumCard(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  allocation.displayName,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                Text(
                  '$percent%${allocation.rolloverPaise > 0 ? ' · +${formatPaise(allocation.rolloverPaise)} carried' : ''}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                ),
              ],
            ),
          ),
          if (editable)
            SizedBox(
              width: 120,
              child: TextFormField(
                initialValue:
                    paiseToRupees(allocation.allocatedPaise).round().toString(),
                keyboardType: TextInputType.number,
                style: AppTypography.moneyCompact(context),
                decoration: const InputDecoration(
                  prefixText: '₹',
                  isDense: true,
                ),
                onChanged: (v) {
                  onChanged(
                    BucketAllocationInput(
                      bucketKey: allocation.bucketKey,
                      displayName: allocation.displayName,
                      categoryId: allocation.categoryId,
                      bucketType: allocation.bucketType,
                      allocatedPaise: rupeesToPaise(v),
                      allocatedPercent: allocation.allocatedPercent,
                      rolloverPaise: allocation.rolloverPaise,
                      sortOrder: allocation.sortOrder,
                    ),
                  );
                },
              ),
            )
          else
            MoneyText(
              allocation.allocatedPaise,
              compact: true,
              color: semantics.income,
              style: AppTypography.moneyCompact(
                context,
                color: semantics.income,
              ),
            ),
        ],
      ),
    );
  }
}
