import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:rupee_track/core/branding/brand_typography.dart';
import 'package:rupee_track/core/database/daos/expenses_dao.dart';
import 'package:rupee_track/core/design_system/compact_label.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/core/utils/category_icon_utils.dart';
import 'package:rupee_track/core/utils/money_utils.dart';

/// Donut chart + category legend for the home expense breakdown widget.
class ExpenseBreakdownChart extends StatelessWidget {
  const ExpenseBreakdownChart({
    required this.categories,
    super.key,
  });

  final List<CategorySpendRow> categories;

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) return const SizedBox.shrink();

    final theme = Theme.of(context);
    final slices = categories.take(6).toList();
    final totalSpent = categories.fold<int>(0, (sum, row) => sum + row.totalPaise);

    return Column(
      children: [
        LayoutBuilder(
          builder: (context, constraints) {
            final chartHeight = AppResponsive.chartHeight(constraints.maxWidth);
            // Keep outer rim inside the box — avoids clipping slice labels.
            final centerRadius = (chartHeight * 0.26).clamp(38.0, 54.0);
            final sectionRadius =
                (chartHeight * 0.5 - centerRadius - 8).clamp(26.0, 46.0);

            return SizedBox(
              height: chartHeight,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    PieChart(
                      PieChartData(
                        sectionsSpace: 2,
                        centerSpaceRadius: centerRadius,
                        startDegreeOffset: -90,
                        sections: slices.map((row) {
                          final share = totalSpent > 0
                              ? (row.totalPaise / totalSpent) * 100
                              : 0.0;
                          return PieChartSectionData(
                            value: row.totalPaise.toDouble(),
                            color: Color(row.colorValue),
                            radius: sectionRadius,
                            title: share >= 12 ? '${share.round()}%' : '',
                            titleStyle: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: _sectionLabelColor(row.colorValue),
                              height: 1.1,
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Expenses',
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.2,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 2),
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              formatPaise(totalSpent),
                              style: BrandTypography.money(
                                context,
                                fontSize: 17,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
        const SizedBox(height: AppSpacing.sm),
        ...categories.take(5).map((row) {
          final share = totalSpent > 0
              ? (row.totalPaise / totalSpent) * 100
              : 0.0;
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.xxs),
            child: Row(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: Color(row.colorValue).withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(AppRadius.xs),
                  ),
                  child: Icon(
                    categoryIconFromName(row.iconName),
                    size: 16,
                    color: Color(row.colorValue),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      FittingLabel(
                        row.categoryName,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      FittingLabel(
                        '${share.toStringAsFixed(0)}% of spending',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: AppSpacing.xs),
                Flexible(
                  child: FittingLabel(
                    formatPaise(row.totalPaise),
                    alignment: Alignment.centerRight,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  static Color _sectionLabelColor(int colorValue) {
    final color = Color(colorValue);
    return color.computeLuminance() > 0.55 ? Colors.black87 : Colors.white;
  }
}
