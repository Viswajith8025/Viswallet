import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_app_bar.dart';
import 'package:rupee_track/core/design_system/premium_card.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/core/design_system/skeleton_loader.dart';
import 'package:rupee_track/core/providers/salary_cycle_provider.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/core/utils/date_utils.dart';
import 'package:rupee_track/core/widgets/empty_state.dart';
import 'package:rupee_track/core/widgets/error_state.dart';
import 'package:rupee_track/core/widgets/money_text.dart';
import 'package:rupee_track/features/budget/data/budget_repository.dart';
import 'package:rupee_track/features/budget/domain/allocation_mode.dart';
import 'package:rupee_track/features/budget/presentation/widgets/budget_bucket_card.dart';

class BudgetPlannerScreen extends ConsumerWidget {
  const BudgetPlannerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cycleKey = ref.watch(selectedCycleKeyProvider);
    final salaryDay = ref.watch(salaryDayProvider);
    final planAsync = ref.watch(budgetPlanStatusProvider(cycleKey));
    final theme = Theme.of(context);
    final semantics = context.semanticColors;

    return Scaffold(
      appBar: PremiumAppBar(
        title: 'Budget',
        subtitle: formatCycleLabel(cycleKey, salaryDay: salaryDay),
        actions: [
          IconButton(
            icon: const Icon(Icons.tune_rounded),
            tooltip: 'Edit budget plan',
            onPressed: () => context.push(AppRoutes.budgetSetup),
          ),
        ],
      ),
      body: ResponsiveBody(
        padding: EdgeInsets.zero,
        child: planAsync.when(
          loading: () => ListView(
            padding: const EdgeInsets.all(AppSpacing.md),
            children: const [
              SkeletonCard(height: 120),
              SizedBox(height: AppSpacing.sm),
              SkeletonCard(height: 88),
              SizedBox(height: AppSpacing.sm),
              SkeletonCard(height: 88),
            ],
          ),
          error: (e, _) => ErrorState(
            message: 'We couldn\'t load your budget plan.',
            onRetry: () => ref.invalidate(budgetPlanStatusProvider(cycleKey)),
          ),
          data: (plan) {
            if (plan == null) {
              return EmptyState(
                title: 'No budget plan yet',
                message:
                    'Split your in-hand salary into spending groups — percentage, per category, or suggested.',
                icon: Icons.pie_chart_outline_rounded,
                action: FilledButton.icon(
                  onPressed: () => context.push(AppRoutes.budgetSetup),
                  icon: const Icon(Icons.tune_rounded),
                  label: const Text('Set up budget'),
                ),
              );
            }

            return RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(budgetPlanStatusProvider(cycleKey));
              },
              child: ListView(
                padding: EdgeInsets.fromLTRB(
                  AppResponsive.horizontalPadding(
                    MediaQuery.sizeOf(context).width,
                  ),
                  AppSpacing.sm,
                  AppResponsive.horizontalPadding(
                    MediaQuery.sizeOf(context).width,
                  ),
                  AppSpacing.xxl,
                ),
                children: [
                  PremiumCard(
                    variant: PremiumCardVariant.tinted,
                    tintColor: semantics.income,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Cycle income',
                          style: theme.textTheme.labelMedium?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xxs),
                        MoneyText(
                          plan.salaryPaise,
                          color: semantics.income,
                          style: AppTypography.moneyLarge(
                            context,
                            color: semantics.income,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          '${plan.allocationMode.label}'
                          '${plan.rolloverEnabled ? ' · leftover carries forward' : ''}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (plan.insights.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.lg),
                    Text(
                      'Things to notice',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    ...plan.insights.map(
                      (insight) => Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                        child: PremiumCard(
                          accentColor: _insightColor(context, insight.severity),
                          child: ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: Icon(
                              _insightIcon(insight.severity),
                              color: _insightColor(context, insight.severity),
                            ),
                            title: Text(insight.title),
                            subtitle: Text(insight.message),
                          ),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: AppSpacing.lg),
                  Text(
                    plan.allocationMode == AllocationMode.perCategory
                        ? 'Category budgets'
                        : 'Spending groups',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  ...plan.buckets.map(
                    (b) => Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                      child: BudgetBucketCard(bucket: b),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  IconData _insightIcon(BudgetAlertLevel level) => switch (level) {
        BudgetAlertLevel.exceeded => Icons.error_outline,
        BudgetAlertLevel.critical90 => Icons.warning_amber_outlined,
        BudgetAlertLevel.watch75 => Icons.info_outline,
        _ => Icons.check_circle_outline,
      };

  Color _insightColor(BuildContext context, BudgetAlertLevel level) {
    final semantics = context.semanticColors;
    final scheme = Theme.of(context).colorScheme;
    return switch (level) {
      BudgetAlertLevel.exceeded => semantics.expense,
      BudgetAlertLevel.critical90 => semantics.warning,
      BudgetAlertLevel.watch75 => semantics.warning,
      _ => scheme.primary,
    };
  }
}
