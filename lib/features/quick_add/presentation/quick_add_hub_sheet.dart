import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:rupee_track/core/database/app_database.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/core/utils/category_icon_utils.dart';
import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:rupee_track/features/expenses/data/expense_repository.dart';
import 'package:rupee_track/features/expenses/domain/expense_save_result.dart';
import 'package:rupee_track/features/expenses/presentation/widgets/expense_date_picker_row.dart';
import 'package:rupee_track/features/quick_add/data/quick_add_repository.dart';
import 'package:rupee_track/features/quick_add/domain/quick_add_models.dart';
import 'package:rupee_track/features/quick_add/presentation/widgets/quick_add_calculator_pad.dart';
import 'package:rupee_track/features/quick_add/presentation/widgets/quick_add_voice_input.dart';
import 'package:rupee_track/features/smart_tagging/presentation/widgets/smart_tagging_widgets.dart';
import 'package:rupee_track/features/smart_tagging/data/tagging_repository.dart';
import 'package:rupee_track/core/design_system/money_preview_strip.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_bottom_sheet.dart';
import 'package:rupee_track/core/design_system/premium_snackbar.dart';
import 'package:rupee_track/core/design_system/premium_text_field.dart';
import 'package:rupee_track/core/design_system/skeleton_loader.dart';
import 'package:rupee_track/core/design_system/app_scroll_behavior.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/core/design_system/shell_bottom_inset.dart';

Future<void> showQuickAddSheet(BuildContext context, WidgetRef ref) {
  return showPremiumBottomSheet<void>(
    context: context,
    child: const QuickAddHubSheet(),
  );
}

class QuickAddHubSheet extends ConsumerStatefulWidget {
  const QuickAddHubSheet({super.key});

  @override
  ConsumerState<QuickAddHubSheet> createState() => _QuickAddHubSheetState();
}

class _QuickAddHubSheetState extends ConsumerState<QuickAddHubSheet> {
  String _amountDigits = '';
  int? _selectedCategoryId;
  final _labelController = TextEditingController();
  String? _note;
  DateTime _expenseDate = DateTime.now();
  bool _showCalculator = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _labelController.addListener(() {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _labelController.dispose();
    super.dispose();
  }

  int get _amountPaise {
    if (_amountDigits.isEmpty) return 0;
    return int.parse(_amountDigits) * 100;
  }

  void _appendDigit(String digit) {
    if (_amountDigits.length >= 7) return;
    setState(() => _amountDigits += digit);
  }

  void _backspace() {
    if (_amountDigits.isEmpty) return;
    setState(() => _amountDigits = _amountDigits.substring(0, _amountDigits.length - 1));
  }

  void _clearAmount() => setState(() => _amountDigits = '');

  void _setAmountPaise(int paise) {
    final rupees = (paise / 100).round();
    setState(() => _amountDigits = rupees > 0 ? '$rupees' : '');
  }

  void _showSavedSnackBar(BuildContext context, ExpenseSaveResult result) {
    showSaveConfirmation(
      context,
      message: '${formatPaise(result.amountPaise)} saved · ${result.snackbarLine}',
    );
  }

  Future<void> _saveSelectedExpense(CategoriesTableData category) async {
    if (_amountPaise <= 0 || _saving) return;
    setState(() => _saving = true);
    HapticFeedback.mediumImpact();

    final repo = ref.read(quickAddRepositoryProvider);
    final label = _labelController.text.trim();
    final title = repo.titleForCategory(
      category.name,
      merchant: label.isEmpty ? null : label,
    );

    try {
      final result = await repo.quickSaveExpense(
        amountPaise: _amountPaise,
        categoryId: category.id,
        title: title,
        notes: _note,
        rememberLabel: label.isNotEmpty,
        occurredAt: _expenseDate,
      );
      ref.invalidate(quickAddContextProvider);
      if (!mounted) return;
      Navigator.pop(context);
      _showSavedSnackBar(context, result);
    } catch (e) {
      if (!mounted) return;
      showPremiumSnackBar(
        context,
        message: 'Could not save this expense. Please try again.',
        kind: PremiumSnackBarKind.error,
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }


  Future<void> _repeat(RepeatExpenseTemplate template) async {
    if (_saving) return;
    setState(() => _saving = true);
    HapticFeedback.mediumImpact();
    try {
      final result =
          await ref.read(quickAddRepositoryProvider).repeatExpense(template);
      ref.invalidate(quickAddContextProvider);
      if (!mounted) return;
      Navigator.pop(context);
      _showSavedSnackBar(context, result);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _showSupport() {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Quick Add tips'),
        content: const Text(
          'Fastest way: enter an amount, add an optional label, then tap a category.\n\n'
          '• Long-press a category to keep it near the top\n'
          '• Repeat chips save common expenses in one tap\n'
          '• Use the mic to fill amount and label\n'
          '• Tap expand for payment method and more details',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Got it'),
          ),
        ],
      ),
    );
  }

  List<CategoriesTableData> _orderedCategories(
    List<CategoriesTableData> all,
    QuickAddContext ctx, {
    int? suggestedCategoryId,
  }) {
    final byId = {for (final c in all) c.id: c};
    final ordered = <CategoriesTableData>[];
    final seen = <int>{};

    if (suggestedCategoryId != null) {
      final cat = byId[suggestedCategoryId];
      if (cat != null && seen.add(suggestedCategoryId)) ordered.add(cat);
    }

    for (final id in ctx.favoriteCategoryIds) {
      final cat = byId[id];
      if (cat != null && seen.add(id)) ordered.add(cat);
    }
    for (final id in ctx.recentCategoryIds) {
      final cat = byId[id];
      if (cat != null && seen.add(id)) ordered.add(cat);
    }
    for (final cat in all) {
      if (seen.add(cat.id)) ordered.add(cat);
    }
    return ordered;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final contextAsync = ref.watch(quickAddContextProvider);
    final categoriesAsync = ref.watch(categoriesProvider);

    return Material(
      color: theme.scaffoldBackgroundColor,
      child: ListView(
        padding: AppResponsive.screenPadding(
          context,
          bottom: ShellBottomInset.scrollBottom(context) + AppSpacing.lg,
        ),
        children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Add an expense',
                            style: theme.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          Text(
                            'Tap a category to save',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      tooltip: 'Add details (full form)',
                      icon: const Icon(Icons.open_in_full, size: 20),
                      onPressed: () {
                        Navigator.pop(context);
                        context.push(AppRoutes.expenseAdd);
                      },
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xs),
                _AmountHeader(
                  amountPaise: _amountPaise,
                  labelPreview: _labelController.text.trim().isEmpty
                      ? null
                      : _labelController.text.trim(),
                  onToggleCalculator: () =>
                      setState(() => _showCalculator = !_showCalculator),
                  showCalculator: _showCalculator,
                ),
                const SizedBox(height: AppSpacing.sm),
                ExpenseDatePickerRow(
                  date: _expenseDate,
                  onDateChanged: (d) => setState(() => _expenseDate = d),
                ),
                const SizedBox(height: AppSpacing.sm),
                const _SectionLabel('Label (optional)'),
                const SizedBox(height: AppSpacing.xs),
                PremiumTextField(
                  controller: _labelController,
                  hint: 'e.g. Swiggy, Netflix, Petrol',
                  prefixIcon: Icons.label_outline_rounded,
                  textCapitalization: TextCapitalization.sentences,
                  textInputAction: TextInputAction.done,
                ),
                if (_labelController.text.trim().isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.xs),
                  ClassificationSuggestionBanner(
                    title: _labelController.text.trim(),
                  ),
                ],
                contextAsync.when(
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                  data: (ctx) {
                    if (ctx.recentMerchants.isEmpty) {
                      return const SizedBox.shrink();
                    }
                    return Padding(
                      padding: const EdgeInsets.only(top: AppSpacing.sm),
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: ctx.recentMerchants.map((m) {
                          final selected =
                              _labelController.text.trim() == m;
                          return FilterChip(
                            label: Text(m),
                            selected: selected,
                            onSelected: (_) {
                              setState(() {
                                _labelController.text = selected ? '' : m;
                              });
                            },
                          );
                        }).toList(),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 12),
                contextAsync.when(
                  loading: () => const SizedBox(
                    height: 36,
                    child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                  ),
                  error: (_, __) => const SizedBox.shrink(),
                  data: (ctx) => _AmountSuggestions(
                    suggestions: ctx.amountSuggestionsPaise,
                    selectedPaise: _amountPaise,
                    onTap: _setAmountPaise,
                  ),
                ),
                if (_showCalculator) ...[
                  const SizedBox(height: 12),
                  QuickAddCalculatorPad(
                    onDigit: _appendDigit,
                    onBackspace: _backspace,
                    onClear: _clearAmount,
                  ),
                ],
                const SizedBox(height: 16),
                contextAsync.when(
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                  data: (ctx) {
                    if (ctx.repeatTemplates.isEmpty) {
                      return const SizedBox.shrink();
                    }
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _SectionLabel('Repeat a recent expense'),
                        const SizedBox(height: 8),
                        AppHorizontalChipList(
                          height: 44,
                          separatorWidth: 8,
                          itemCount: ctx.repeatTemplates.length,
                          itemBuilder: (context, i) {
                            final t = ctx.repeatTemplates[i];
                            return ActionChip(
                              avatar: CircleAvatar(
                                radius: 10,
                                backgroundColor:
                                    Color(t.colorValue).withValues(alpha: 0.2),
                                child: Icon(
                                  Icons.replay,
                                  size: 12,
                                  color: Color(t.colorValue),
                                ),
                              ),
                              label: Text(
                                '${t.title} · ${formatPaise(t.amountPaise)}',
                              ),
                              onPressed: _saving ? null : () => _repeat(t),
                            );
                          },
                        ),
                        const SizedBox(height: 16),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 16),
                categoriesAsync.when(
                  loading: () => const Column(
                    children: [
                      SkeletonCard(height: 56),
                      SizedBox(height: AppSpacing.sm),
                      SkeletonCard(height: 56),
                      SizedBox(height: AppSpacing.sm),
                      SkeletonCard(height: 56),
                    ],
                  ),
                  error: (e, _) => Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Could not load categories.',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.error,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      OutlinedButton.icon(
                        onPressed: () => ref.invalidate(categoriesProvider),
                        icon: const Icon(Icons.refresh_rounded, size: 18),
                        label: const Text('Try again'),
                      ),
                    ],
                  ),
                  data: (categories) {
                    final ctx = contextAsync.valueOrNull;
                    final classifyTitle = _labelController.text.trim();
                    final classificationAsync = classifyTitle.isNotEmpty
                        ? ref.watch(
                            transactionClassificationProvider(classifyTitle),
                          )
                        : null;
                    final suggestedId =
                        classificationAsync?.valueOrNull?.categoryId;

                    final ordered = ctx != null
                        ? _orderedCategories(
                            categories,
                            ctx,
                            suggestedCategoryId: suggestedId,
                          )
                        : categories;

                    final favorites = ctx?.favoriteCategoryIds.toSet() ?? {};

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _SectionLabel('Tap category to save'),
                        const SizedBox(height: AppSpacing.xs),
                        LayoutBuilder(
                          builder: (context, constraints) {
                            final tileExtent =
                                AppResponsive.categoryTileExtent(
                              constraints.maxWidth,
                              subtractHorizontalPadding: false,
                            );
                            return Wrap(
                              spacing: 10,
                              runSpacing: 10,
                              children: ordered.map((cat) {
                                final isFavorite = favorites.contains(cat.id);
                                final isSuggested = suggestedId == cat.id;
                                final isSavingThis =
                                    _saving && _selectedCategoryId == cat.id;
                                return SizedBox(
                                  width: tileExtent,
                                  height: tileExtent,
                                  child: _CategoryTile(
                                    category: cat,
                                    isFavorite: isFavorite,
                                    isSuggested: isSuggested,
                                    isSelected: isSavingThis,
                                    enabled: _amountPaise > 0 && !_saving,
                                    onTap: _amountPaise > 0 && !_saving
                                        ? () {
                                            setState(
                                              () => _selectedCategoryId = cat.id,
                                            );
                                            _saveSelectedExpense(cat);
                                          }
                                        : () {
                                            HapticFeedback.lightImpact();
                                            showPremiumSnackBar(
                                              context,
                                              message: 'Enter an amount first',
                                              duration: const Duration(seconds: 2),
                                            );
                                          },
                                    onLongPress: () async {
                                      await ref
                                          .read(quickAddStoreProvider)
                                          .toggleFavorite(cat.id);
                                      ref.invalidate(quickAddContextProvider);
                                      if (!context.mounted) return;
                                      showPremiumSnackBar(
                                        context,
                                        message: isFavorite
                                            ? 'Removed ${cat.name} from favorites'
                                            : 'Favorited ${cat.name}',
                                        duration: const Duration(seconds: 2),
                                      );
                                    },
                                  ),
                                );
                              }).toList(),
                            );
                          },
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: TextButton.icon(
                            onPressed: () {
                              Navigator.pop(context);
                              context.push(AppRoutes.expenseAdd);
                            },
                            icon: const Icon(Icons.tune_rounded, size: 18),
                            label: const Text('Add details (full form)'),
                          ),
                        ),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 16),
                contextAsync.when(
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                  data: (ctx) {
                    if (ctx.recentNotes.isEmpty) return const SizedBox.shrink();
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _SectionLabel('Recent notes'),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: ctx.recentNotes.map((n) {
                            final selected = _note == n;
                            return FilterChip(
                              label: Text(n),
                              selected: selected,
                              onSelected: (_) =>
                                  setState(() => _note = selected ? null : n),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 16),
                      ],
                    );
                  },
                ),
                Row(
                  children: [
                    QuickAddVoiceButton(
                      onResult: (amountPaise, merchant) {
                        setState(() {
                          if (amountPaise > 0) {
                            _amountDigits = '${(amountPaise / 100).round()}';
                          }
                          if (merchant != null && merchant.isNotEmpty) {
                            _labelController.text = merchant;
                          }
                        });
                      },
                    ),
                    const SizedBox(width: 8),
                    OutlinedButton.icon(
                      onPressed: _showSupport,
                      icon: const Icon(Icons.help_outline, size: 18),
                      label: const Text('Help'),
                    ),
                  ],
                ),
        ],
      ),
    );
  }
}

class _AmountHeader extends StatelessWidget {
  const _AmountHeader({
    required this.amountPaise,
    required this.labelPreview,
    required this.onToggleCalculator,
    required this.showCalculator,
  });

  final int amountPaise;
  final String? labelPreview;
  final VoidCallback onToggleCalculator;
  final bool showCalculator;

  @override
  Widget build(BuildContext context) {
    final expenseColor = context.semanticColors.expense;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: MoneyPreviewStrip(
            label: 'Expense amount',
            chipLabel: 'Not saved yet',
            amountPaise: amountPaise,
            moneyColor: amountPaise > 0 ? expenseColor : null,
            subtitle: labelPreview,
            detailLines: amountPaise <= 0
                ? const ['Enter an amount, then tap a category to save']
                : const [],
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        IconButton.filledTonal(
          tooltip: showCalculator ? 'Hide calculator' : 'Calculator',
          onPressed: onToggleCalculator,
          icon: Icon(showCalculator ? Icons.keyboard_hide : Icons.calculate),
          style: IconButton.styleFrom(
            visualDensity: VisualDensity.compact,
          ),
        ),
      ],
    );
  }
}

class _AmountSuggestions extends StatelessWidget {
  const _AmountSuggestions({
    required this.suggestions,
    required this.selectedPaise,
    required this.onTap,
  });

  final List<int> suggestions;
  final int selectedPaise;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    return AppHorizontalChipList(
      height: 40,
      itemCount: suggestions.length,
      separatorWidth: 8,
      itemBuilder: (context, i) {
        final paise = suggestions[i];
        final selected = paise == selectedPaise;
        return ChoiceChip(
          label: Text(
            formatPaise(paise),
            style: AppTypography.moneyCompact(context, color: null),
          ),
          selected: selected,
          onSelected: (_) {
            HapticFeedback.selectionClick();
            onTap(paise);
          },
        );
      },
    );
  }
}

class _CategoryTile extends StatelessWidget {
  const _CategoryTile({
    required this.category,
    required this.isFavorite,
    required this.isSuggested,
    required this.isSelected,
    required this.enabled,
    required this.onTap,
    required this.onLongPress,
  });

  final CategoriesTableData category;
  final bool isFavorite;
  final bool isSuggested;
  final bool isSelected;
  final bool enabled;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  @override
  Widget build(BuildContext context) {
    final color = Color(category.colorValue);
    return Material(
      color: isSelected
          ? color.withValues(alpha: 0.28)
          : color.withValues(alpha: enabled ? 0.14 : 0.06),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        onLongPress: onLongPress,
        child: SizedBox.expand(
          child: Stack(
            children: [
              Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      categoryIconFromName(category.iconName),
                      color: color,
                      size: 26,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      category.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ],
                ),
              ),
              if (isSelected)
                Positioned(
                  top: 6,
                  right: 6,
                  child: Icon(
                    Icons.check_circle_rounded,
                    size: 18,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
              if (isFavorite)
                const Positioned(
                  top: 6,
                  right: 6,
                  child: Icon(Icons.star, size: 14, color: Colors.amber),
                ),
              if (isSuggested)
                Positioned(
                  top: 6,
                  left: 6,
                  child: Icon(
                    Icons.auto_awesome,
                    size: 14,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: Theme.of(context).textTheme.labelLarge?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
            fontWeight: FontWeight.w600,
          ),
    );
  }
}
