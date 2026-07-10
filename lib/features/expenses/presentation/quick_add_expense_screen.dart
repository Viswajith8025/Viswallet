import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:rupee_track/core/constants/category_defaults.dart';
import 'package:rupee_track/core/database/app_database.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:rupee_track/core/widgets/error_state.dart';
import 'package:rupee_track/core/widgets/theme_toggle_button.dart';
import 'package:rupee_track/features/expenses/data/expense_repository.dart';
import 'package:rupee_track/features/expenses/presentation/widgets/expense_date_picker_row.dart';
import 'package:rupee_track/features/smart_tagging/data/tagging_repository.dart';
import 'package:rupee_track/features/smart_tagging/presentation/widgets/smart_tagging_widgets.dart';

class QuickAddExpenseScreen extends HookConsumerWidget {
  const QuickAddExpenseScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final amountController = useTextEditingController();
    final labelController = useTextEditingController();
    final selectedCategoryId = useState<int?>(null);
    final paymentMethod = useState(paymentMethods.first);
    final isSaving = useState(false);
    final showDetails = useState(false);
    final expenseDate = useState(DateTime.now());
    final labelSectionKey = useMemoized(() => GlobalKey());
    final labelFocusNode = useFocusNode();

    final categoriesAsync = ref.watch(categoriesProvider);
    useListenable(labelController);
    final label = labelController.text.trim();
    final classificationAsync = label.isNotEmpty
        ? ref.watch(transactionClassificationProvider(label))
        : null;

    useEffect(() {
      final c = classificationAsync?.valueOrNull;
      if (c?.categoryId != null && selectedCategoryId.value == null) {
        selectedCategoryId.value = c!.categoryId;
      }
      return null;
    }, [classificationAsync?.valueOrNull?.categoryId, label]);

    void scrollToLabel() {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final target = labelSectionKey.currentContext;
        if (target == null) return;
        Scrollable.ensureVisible(
          target,
          duration: const Duration(milliseconds: 320),
          curve: Curves.easeOutCubic,
          alignment: 0.12,
        );
        labelFocusNode.requestFocus();
      });
    }

    void selectCategory(int categoryId) {
      selectedCategoryId.value = categoryId;
      scrollToLabel();
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Add expense'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
        actions: const [ThemeToggleButton()],
      ),
      body: categoriesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ErrorState(
          message: 'We couldn\'t load your categories.',
          onRetry: () => ref.invalidate(categoriesProvider),
        ),
        data: (categories) {
          selectedCategoryId.value ??=
              categories.isNotEmpty ? categories.first.id : null;

          return ResponsiveBody(
            child: ListView(
              padding: const EdgeInsets.only(bottom: AppSpacing.xl),
              children: [
                TextField(
                  controller: amountController,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  autofocus: true,
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                  decoration: const InputDecoration(
                    prefixText: '₹ ',
                    hintText: '0',
                    border: InputBorder.none,
                  ),
                ),
                const SizedBox(height: 16),
                ExpenseDatePickerRow(
                  date: expenseDate.value,
                  onDateChanged: (d) => expenseDate.value = d,
                ),
                const SizedBox(height: 16),
                Text(
                  '1 · Category',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: categories.map((cat) {
                    final selected = selectedCategoryId.value == cat.id;
                    return FilterChip(
                      label: Text(cat.name),
                      selected: selected,
                      onSelected: (_) => selectCategory(cat.id),
                      showCheckmark: false,
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),
                KeyedSubtree(
                  key: labelSectionKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '2 · Label (optional)',
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: labelController,
                        focusNode: labelFocusNode,
                        textCapitalization: TextCapitalization.sentences,
                        decoration: InputDecoration(
                          hintText:
                              _labelHint(categories, selectedCategoryId.value),
                          border: const OutlineInputBorder(),
                        ),
                      ),
                      if (label.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        ClassificationSuggestionBanner(title: label),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                ExpansionTile(
                  title: const Text('More details'),
                  initiallyExpanded: showDetails.value,
                  onExpansionChanged: (v) => showDetails.value = v,
                  children: [
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: paymentMethod.value,
                      decoration:
                          const InputDecoration(labelText: 'Payment method'),
                      items: paymentMethods
                          .map(
                            (m) => DropdownMenuItem(value: m, child: Text(m)),
                          )
                          .toList(),
                      onChanged: (v) {
                        if (v != null) paymentMethod.value = v;
                      },
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: isSaving.value
                      ? null
                      : () async {
                          final amount = rupeesToPaise(amountController.text);
                          final categoryId = selectedCategoryId.value;
                          final category = categories.firstWhere(
                            (c) => c.id == categoryId,
                          );
                          final expenseTitle =
                              label.isNotEmpty ? label : category.name;

                          if (amount <= 0) {
                            _showError(context, 'Enter a valid amount');
                            return;
                          }
                          if (categoryId == null) {
                            _showError(context, 'Select a category');
                            return;
                          }

                          isSaving.value = true;
                          try {
                            final result = await ref
                                .read(expenseRepositoryProvider)
                                .addExpense(
                                  amountPaise: amount,
                                  categoryId: categoryId,
                                  title: expenseTitle,
                                  paymentMethod: paymentMethod.value,
                                  tags: const [],
                                  occurredAt: expenseDate.value,
                                );
                            if (context.mounted) {
                              context.pop();
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Saved · ${result.snackbarLine}',
                                  ),
                                  behavior: SnackBarBehavior.floating,
                                  duration: const Duration(seconds: 3),
                                ),
                              );
                            }
                          } catch (e) {
                            if (context.mounted) {
                              _showError(context, e.toString());
                            }
                          } finally {
                            isSaving.value = false;
                          }
                        },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Text(isSaving.value ? 'Saving...' : 'Save expense'),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showError(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  String _labelHint(List<CategoriesTableData> categories, int? categoryId) {
    if (categoryId == null) return 'e.g. Netflix, Swiggy (optional)';
    final category = categories.firstWhere((c) => c.id == categoryId);
    final name = category.name.toLowerCase();
    if (name.contains('subscription')) {
      return 'Which subscription? e.g. Netflix (optional)';
    }
    return 'Label or shop name (optional)';
  }
}
