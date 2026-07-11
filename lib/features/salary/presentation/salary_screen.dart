import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:rupee_track/core/database/daos/salary_dao.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/money_preview_strip.dart';
import 'package:rupee_track/core/design_system/premium_app_bar.dart';
import 'package:rupee_track/core/design_system/premium_card.dart';
import 'package:rupee_track/core/design_system/premium_snackbar.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/core/widgets/money_text.dart';
import 'package:rupee_track/core/providers/database_provider.dart';
import 'package:rupee_track/core/providers/salary_cycle_provider.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/core/utils/date_utils.dart';
import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:rupee_track/features/dashboard/data/dashboard_repository.dart';
import 'package:rupee_track/features/salary/data/salary_repository.dart';
import 'package:rupee_track/features/salary/domain/salary_breakdown.dart';
import 'package:rupee_track/features/salary/presentation/add_extra_income_sheet.dart';
import 'package:rupee_track/features/salary/domain/salary_deduction_type.dart';
import 'package:rupee_track/features/cloud_backup/data/cloud_backup_coordinator.dart';

class SalaryScreen extends ConsumerStatefulWidget {
  const SalaryScreen({super.key});

  @override
  ConsumerState<SalaryScreen> createState() => _SalaryScreenState();
}

class _SalaryScreenState extends ConsumerState<SalaryScreen> {
  final _grossController = TextEditingController();
  final List<_DeductionEditor> _deductions = [];
  bool _loaded = false;
  bool _saving = false;

  @override
  void dispose() {
    _grossController.dispose();
    for (final row in _deductions) {
      row.amountController.dispose();
      row.labelController.dispose();
    }
    super.dispose();
  }

  void _loadFromBreakdown(SalaryBreakdown? breakdown) {
    if (_loaded || breakdown == null) return;
    if (breakdown.grossPaise > 0) {
      _grossController.text =
          paiseToRupees(breakdown.grossPaise).round().toString();
    }
    _deductions
      ..clear()
      ..addAll(
        breakdown.deductions.map(
          (row) => _DeductionEditor.fromRow(row),
        ),
      );
    _loaded = true;
  }

  int _grossPaise() => rupeesToPaise(_grossController.text);

  int _deductionsPaise() {
    var total = 0;
    for (final row in _deductions) {
      total += rupeesToPaise(row.amountController.text);
    }
    return total;
  }

  int _netPaise() => (_grossPaise() - _deductionsPaise()).clamp(0, 1 << 30);

  void _addDeduction([SalaryDeductionType type = SalaryDeductionType.pf]) {
    setState(() {
      _deductions.add(_DeductionEditor(type: type));
    });
  }

  void _removeDeduction(int index) {
    setState(() {
      _deductions[index].amountController.dispose();
      _deductions[index].labelController.dispose();
      _deductions.removeAt(index);
    });
  }

  Future<void> _save(String cycleKey) async {
    final gross = _grossPaise();
    if (gross <= 0) {
      showPremiumSnackBar(
        context,
        message: 'Enter your salary for this cycle',
        kind: PremiumSnackBarKind.error,
      );
      return;
    }

    final drafts = <SalaryDeductionDraft>[];
    for (final row in _deductions) {
      final amount = rupeesToPaise(row.amountController.text);
      if (amount <= 0) continue;
      drafts.add(
        SalaryDeductionDraft(
          type: row.type,
          amountPaise: amount,
          label: row.type == SalaryDeductionType.other
              ? row.labelController.text.trim()
              : null,
        ),
      );
    }

    final deductionsTotal =
        drafts.fold<int>(0, (sum, item) => sum + item.amountPaise);
    if (deductionsTotal > gross) {
      showPremiumSnackBar(
        context,
        message: 'Deductions cannot be more than salary',
        kind: PremiumSnackBarKind.error,
      );
      return;
    }

    setState(() => _saving = true);
    try {
      final dao = await ref.read(salaryDaoProvider.future);
      await dao.upsertSalary(
        monthKey: cycleKey,
        amountPaise: gross,
        receivedAt: DateTime.now().toUtc(),
      );
      await dao.replaceDeductionsForMonth(
        monthKey: cycleKey,
        deductions: drafts,
      );
      ref.invalidate(salaryBreakdownProvider(cycleKey));
      ref.invalidate(monthlySummaryProvider(cycleKey));
      ref.read(cloudBackupCoordinatorProvider).schedulePush();
      if (!mounted) return;
      context.go(AppRoutes.home);
    } catch (_) {
      if (!mounted) return;
      showPremiumSnackBar(
        context,
        message: 'Could not save salary',
        kind: PremiumSnackBarKind.error,
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _removeExtraIncome(int id, String cycleKey) async {
    final dao = await ref.read(salaryDaoProvider.future);
    await dao.removeExtraIncome(id);
    ref.invalidate(salaryBreakdownProvider(cycleKey));
    ref.invalidate(monthlySummaryProvider(cycleKey));
    ref.read(cloudBackupCoordinatorProvider).schedulePush();
  }

  @override
  Widget build(BuildContext context) {
    final cycleKey = ref.watch(selectedCycleKeyProvider);
    final salaryDay = ref.watch(salaryDayProvider);
    final breakdownAsync = ref.watch(salaryBreakdownProvider(cycleKey));
    final theme = Theme.of(context);
    final savedExtraPaise =
        breakdownAsync.valueOrNull?.extraIncomePaise ?? 0;
    final extraRows = breakdownAsync.valueOrNull?.extraIncome ?? [];

    breakdownAsync.whenData(_loadFromBreakdown);

    return Scaffold(
      appBar: PremiumAppBar(
        title: 'Salary this cycle',
        subtitle: formatCycleLabel(cycleKey, salaryDay: salaryDay),
      ),
      body: ResponsiveBody(
        child: ListView(
          padding: AppResponsive.screenPadding(
            context,
            bottom: AppSpacing.xxl,
          ),
          children: [
            Text(
              'Enter what you were paid this cycle. Amounts can change month to month.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            PremiumCard(
              child: TextField(
                controller: _grossController,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Salary amount',
                  hintText: 'e.g. 25,000',
                  prefixText: '₹ ',
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                ),
                onChanged: (_) => setState(() {}),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            PremiumCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Deductions',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xxs),
                  Text(
                    'Optional — PF, ESI, tax, or anything else taken from pay.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  if (_deductions.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.md),
                    ...List.generate(_deductions.length, (index) {
                      final row = _deductions[index];
                      return Column(
                        children: [
                          if (index > 0) ...[
                            const Divider(height: AppSpacing.lg),
                          ],
                          DropdownButtonFormField<SalaryDeductionType>(
                            value: row.type,
                            decoration: const InputDecoration(
                              labelText: 'Type',
                              isDense: true,
                            ),
                            items: SalaryDeductionType.values
                                .map(
                                  (type) => DropdownMenuItem(
                                    value: type,
                                    child: Text(type.label),
                                  ),
                                )
                                .toList(),
                            onChanged: (value) {
                              if (value == null) return;
                              setState(() => row.type = value);
                            },
                          ),
                          const SizedBox(height: AppSpacing.sm),
                          TextField(
                            controller: row.amountController,
                            keyboardType:
                                const TextInputType.numberWithOptions(
                              decimal: true,
                            ),
                            decoration: const InputDecoration(
                              labelText: 'Amount deducted',
                              prefixText: '₹ ',
                            ),
                            onChanged: (_) => setState(() {}),
                          ),
                          if (row.type == SalaryDeductionType.other) ...[
                            const SizedBox(height: AppSpacing.sm),
                            TextField(
                              controller: row.labelController,
                              decoration: const InputDecoration(
                                labelText: 'Label',
                                hintText: 'Insurance, advance recovery…',
                              ),
                            ),
                          ],
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: () => _removeDeduction(index),
                              child: const Text('Remove'),
                            ),
                          ),
                        ],
                      );
                    }),
                  ],
                  Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton.icon(
                      onPressed: () => _addDeduction(),
                      icon: const Icon(Icons.add_rounded, size: 18),
                      label: Text(
                        _deductions.isEmpty
                            ? 'Add deduction'
                            : 'Add another',
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            PremiumCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Extra income',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xxs),
                  Text(
                    'Optional — family, gifts, or cash outside your salary.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  if (extraRows.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.sm),
                    ...extraRows.map(
                      (row) => ListTile(
                        contentPadding: EdgeInsets.zero,
                        dense: true,
                        title: Text(row.label),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            MoneyText(
                              row.amountPaise,
                              compact: true,
                              color: context.semanticColors.income,
                              style: AppTypography.moneyCompact(
                                context,
                                color: context.semanticColors.income,
                              ),
                            ),
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              icon: const Icon(Icons.close_rounded, size: 20),
                              onPressed: () =>
                                  _removeExtraIncome(row.id, cycleKey),
                            ),
                          ],
                        ),
                        leading: Icon(
                          Icons.savings_outlined,
                          color: context.semanticColors.income,
                          size: AppIconSize.md,
                        ),
                      ),
                    ),
                  ],
                  Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton.icon(
                      onPressed: () => showAddExtraIncomeSheet(context, ref),
                      icon: const Icon(Icons.add_rounded, size: 18),
                      label: Text(
                        extraRows.isEmpty
                            ? 'Add extra income'
                            : 'Add another',
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            MoneyPreviewStrip(
              label: 'Available this cycle',
              chipLabel: 'Live preview',
              amountPaise: _netPaise() + savedExtraPaise,
              moneyColor: context.semanticColors.income,
              subtitle: 'Updates as you type',
              detailLines: [
                'Salary in-hand ${formatPaise(_netPaise())}'
                    '${savedExtraPaise > 0 ? ' + extra ${formatPaise(savedExtraPaise)}' : ''}',
                if (_deductionsPaise() > 0)
                  '${formatPaise(_grossPaise())} gross − '
                      '${formatPaise(_deductionsPaise())} deductions',
              ],
            ),
            const SizedBox(height: AppSpacing.xl),
            FilledButton(
              onPressed: _saving ? null : () => _save(cycleKey),
              child: Text(_saving ? 'Saving…' : 'Save salary'),
            ),
            const SizedBox(height: AppSpacing.sm),
            Center(
              child: TextButton(
                onPressed: () => context.push(AppRoutes.budgetSetup),
                child: const Text('Set up budget from this salary'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DeductionEditor {
  _DeductionEditor({
    required this.type,
    String amountText = '',
    String labelText = '',
  })  : amountController = TextEditingController(text: amountText),
        labelController = TextEditingController(text: labelText);

  factory _DeductionEditor.fromRow(SalaryDeductionRow row) {
    return _DeductionEditor(
      type: row.type,
      amountText: paiseToRupees(row.amountPaise).round().toString(),
      labelText: row.customLabel ?? '',
    );
  }

  SalaryDeductionType type;
  final TextEditingController amountController;
  final TextEditingController labelController;
}
