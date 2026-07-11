import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:rupee_track/features/trends/domain/spending_trends_report.dart';

/// Short x-axis label — keeps day for cycle ranges (e.g. "Jun 25–Jul 24" → "Jun 25").
String _chartAxisLabel(String label) {
  final match = RegExp(r'^(\w+)\s+(\d+)').firstMatch(label);
  if (match != null) {
    return '${match.group(1)} ${match.group(2)}';
  }
  return label.split(' ').first;
}

class TrendsLineChart extends StatelessWidget {
  const TrendsLineChart({required this.points, super.key});

  final List<TimeSeriesPoint> points;

  @override
  Widget build(BuildContext context) {
    if (points.isEmpty) return const SizedBox.shrink();
    final theme = Theme.of(context);
    final maxY = points.map((p) => p.spentPaise).reduce((a, b) => a > b ? a : b);

    return SizedBox(
      height: 200,
      child: LineChart(
        LineChartData(
          minY: 0,
          maxY: maxY * 1.15,
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            getDrawingHorizontalLine: (_) => FlLine(
              color: theme.colorScheme.outlineVariant.withValues(alpha: 0.4),
              strokeWidth: 1,
            ),
          ),
          titlesData: FlTitlesData(
            topTitles: const AxisTitles(),
            rightTitles: const AxisTitles(),
            leftTitles: const AxisTitles(),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 28,
                interval: points.length > 4
                    ? (points.length / 4).ceilToDouble().clamp(1, points.length.toDouble())
                    : 1,
                getTitlesWidget: (value, meta) {
                  final i = value.toInt();
                  if (i < 0 || i >= points.length) return const SizedBox.shrink();
                  return Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(
                      _chartAxisLabel(points[i].label),
                      style: theme.textTheme.labelSmall,
                    ),
                  );
                },
              ),
            ),
          ),
          borderData: FlBorderData(show: false),
          lineBarsData: [
            LineChartBarData(
              spots: points
                  .asMap()
                  .entries
                  .map((e) => FlSpot(e.key.toDouble(), e.value.spentPaise.toDouble()))
                  .toList(),
              isCurved: true,
              color: theme.colorScheme.primary,
              barWidth: 3,
              dotData: const FlDotData(show: true),
              belowBarData: BarAreaData(
                show: true,
                color: theme.colorScheme.primary.withValues(alpha: 0.12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class TrendsBarChart extends StatelessWidget {
  const TrendsBarChart({required this.categories, super.key});

  final List<CategoryTrendPoint> categories;

  @override
  Widget build(BuildContext context) {
    final top = categories.take(5).toList();
    if (top.isEmpty) return const SizedBox.shrink();

    final maxY = top
        .map((c) => c.currentPaise > c.previousPaise ? c.currentPaise : c.previousPaise)
        .reduce((a, b) => a > b ? a : b);

    return SizedBox(
      height: 220,
      child: BarChart(
        BarChartData(
          alignment: BarChartAlignment.spaceAround,
          maxY: maxY * 1.2,
          groupsSpace: 12,
          barTouchData: BarTouchData(
            enabled: true,
            touchTooltipData: BarTouchTooltipData(
              getTooltipColor: (_) =>
                  Theme.of(context).colorScheme.inverseSurface,
              getTooltipItem: (group, groupIndex, rod, rodIndex) {
                final label = rodIndex == 0 ? 'Previous' : 'Current';
                return BarTooltipItem(
                  '$label\n${formatPaise(rod.toY.round())}',
                  TextStyle(
                    color: Theme.of(context).colorScheme.onInverseSurface,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                );
              },
            ),
          ),
          gridData: const FlGridData(show: false),
          borderData: FlBorderData(show: false),
          titlesData: FlTitlesData(
            topTitles: const AxisTitles(),
            rightTitles: const AxisTitles(),
            leftTitles: const AxisTitles(),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (value, meta) {
                  final i = value.toInt();
                  if (i < 0 || i >= top.length) return const SizedBox.shrink();
                  return Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(
                      top[i].categoryName.length > 6
                          ? top[i].categoryName.substring(0, 5)
                          : top[i].categoryName,
                      style: Theme.of(context).textTheme.labelSmall,
                    ),
                  );
                },
              ),
            ),
          ),
          barGroups: top.asMap().entries.map((entry) {
            final cat = entry.value;
            return BarChartGroupData(
              x: entry.key,
              barRods: [
                BarChartRodData(
                  toY: cat.previousPaise.toDouble(),
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  width: 10,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
                ),
                BarChartRodData(
                  toY: cat.currentPaise.toDouble(),
                  color: Color(cat.colorValue),
                  width: 12,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
                ),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }
}

class TrendsPieChart extends StatelessWidget {
  const TrendsPieChart({required this.categories, super.key});

  final List<CategoryTrendPoint> categories;

  @override
  Widget build(BuildContext context) {
    final top = categories.take(6).toList();
    if (top.isEmpty) return const SizedBox.shrink();
    final total = top.fold<int>(0, (s, c) => s + c.currentPaise);

    return SizedBox(
      height: 200,
      child: PieChart(
        PieChartData(
          sectionsSpace: 2,
          centerSpaceRadius: 36,
          sections: top.map((cat) {
            final pct = total > 0 ? (cat.currentPaise / total) * 100 : 0.0;
            return PieChartSectionData(
              value: cat.currentPaise.toDouble(),
              color: Color(cat.colorValue),
              title: '${pct.round()}%',
              radius: 52,
              titleStyle: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class TrendsHeatMap extends StatelessWidget {
  const TrendsHeatMap({required this.cells, super.key});

  final List<HeatMapCell> cells;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: cells.map((cell) {
        final color = Color.lerp(
          theme.colorScheme.surfaceContainerHighest,
          theme.colorScheme.primary,
          cell.intensity,
        )!;
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2),
            child: Column(
              children: [
                Container(
                  height: 48,
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    cell.spentPaise > 0
                        ? formatPaise(cell.spentPaise).replaceAll('₹', '')
                        : '·',
                    style: theme.textTheme.labelSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      fontSize: 9,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 4),
                Text(cell.label, style: theme.textTheme.labelSmall),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}
