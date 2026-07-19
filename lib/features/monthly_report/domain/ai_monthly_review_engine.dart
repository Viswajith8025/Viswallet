import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:rupee_track/features/health_score/domain/financial_health_models.dart';
import 'package:rupee_track/features/monthly_report/domain/ai_monthly_review.dart';
import 'package:rupee_track/features/monthly_report/domain/monthly_closing_report.dart';
import 'package:rupee_track/features/trends/domain/spending_trends_report.dart';

/// Rule-based narrative engine — generates Spotify Wrapped-style monthly reviews
/// from structured financial data. Local-first; no external AI API.
abstract final class AiMonthlyReviewEngine {
  static AiMonthlyReview build({
    required MonthlyClosingReport report,
    required CycleBehaviourStats behaviourStats,
    SpendingTrendsReport? trends,
    FinancialHealthReport? health,
    List<MonthlyClosingReport> historicalReports = const [],
  }) {
    final netCashFlow = report.savingsPaise;
    final insights = _insights(
      report: report,
      trends: trends,
      behaviourStats: behaviourStats,
      historicalReports: historicalReports,
    );
    final behaviour = _behaviour(report: report, trends: trends);
    final achievements = _achievements(
      report: report,
      behaviourStats: behaviourStats,
      trends: trends,
    );
    final recommendations = _recommendations(
      report: report,
      trends: trends,
      health: health,
    );
    final savingsHighlight = _savingsHighlight(
      report,
      historicalReports: historicalReports,
    );
    final headline = _headline(report, achievements);
    final subheadline = _subheadline(report, savingsHighlight);

    return AiMonthlyReview(
      headline: headline,
      subheadline: subheadline,
      netCashFlowPaise: netCashFlow,
      insights: insights,
      behaviour: behaviour,
      achievements: achievements,
      recommendations: recommendations,
      noSpendDays: behaviourStats.noSpendDays,
      consecutiveBudgetDays: behaviourStats.consecutiveBudgetDays,
      expenseLogCount: behaviourStats.expenseLogCount,
      wishlistProgressNote:
          'Mark items as wishlist on Home (wishlist widget) to track future purchases.',
      savingsHighlight: savingsHighlight,
    );
  }

  /// Lightweight fallback when only the closing report is available (legacy cache).
  static AiMonthlyReview buildFromReportOnly(MonthlyClosingReport report) {
    return build(
      report: report,
      behaviourStats: const CycleBehaviourStats(
        noSpendDays: 0,
        consecutiveBudgetDays: 0,
        expenseLogCount: 0,
      ),
    );
  }

  static String _headline(
    MonthlyClosingReport report,
    List<MonthlyAchievement> achievements,
  ) {
    if (achievements.length >= 3) {
      return 'What a month! 🎉';
    }
    if (report.savingsRatePercent >= 25) {
      return 'You crushed it this cycle';
    }
    if (report.savingsRatePercent >= 15) {
      return 'Solid financial month';
    }
    if (report.budgetOnTrackPercent >= 70) {
      return 'You stayed on track';
    }
    return 'Your month in money';
  }

  static String _subheadline(
    MonthlyClosingReport report,
    String? savingsHighlight,
  ) {
    if (savingsHighlight != null) return savingsHighlight;
    return 'Saved ${report.savingsRatePercent.toStringAsFixed(0)}% of income · '
        '${formatPaise(report.savingsPaise)} kept';
  }

  static String? _savingsHighlight(
    MonthlyClosingReport report, {
    required List<MonthlyClosingReport> historicalReports,
  }) {
    if (report.savingsPaise <= 0) return null;
    final all = [...historicalReports, report];
    if (all.length < 2) return null;
    final maxSavings = all
        .map((r) => r.savingsPaise)
        .reduce((a, b) => a > b ? a : b);
    if (report.savingsPaise >= maxSavings) {
      return 'You saved your highest amount on record!';
    }
    return null;
  }

  static List<String> _insights({
    required MonthlyClosingReport report,
    SpendingTrendsReport? trends,
    required CycleBehaviourStats behaviourStats,
    required List<MonthlyClosingReport> historicalReports,
  }) {
    final lines = <String>[];
    final c = report.comparison;

    final expenseDelta = c.expenseChangePercent;
    if (expenseDelta != null) {
      if (expenseDelta < -5) {
        lines.add(
          'You spent ${expenseDelta.abs().toStringAsFixed(0)}% less than last month.',
        );
      } else if (expenseDelta > 5) {
        lines.add(
          'Spending was ${expenseDelta.toStringAsFixed(0)}% higher than last month — '
          'worth a quick look at your top categories.',
        );
      }
    }

    final savingsDelta = c.savingsChangePercent;
    if (savingsDelta != null && savingsDelta > 10) {
      lines.add(
        'Savings grew ${savingsDelta.toStringAsFixed(0)}% compared to last cycle.',
      );
    }

    if (report.savingsRatePercent >= 20 && report.incomePaise > 0) {
      lines.add(
        'You saved ${report.savingsRatePercent.toStringAsFixed(0)}% of your income — '
        'that is excellent discipline.',
      );
    }

    final fastest = trends?.fastestGrowingCategory;
    if (fastest != null && fastest.deltaPaise > 0) {
      lines.add(
        '${fastest.categoryName} spending increased by ${formatPaise(fastest.deltaPaise)}.',
      );
    } else if (fastest != null && fastest.deltaPaise < 0) {
      lines.add(
        '${fastest.categoryName} expenses decreased significantly.',
      );
    }

    if (behaviourStats.consecutiveBudgetDays >= 7) {
      lines.add(
        'You stayed within budget for ${behaviourStats.consecutiveBudgetDays} consecutive days.',
      );
    }

    if (behaviourStats.noSpendDays >= 3) {
      lines.add(
        'You had ${behaviourStats.noSpendDays} no-spend days — nice restraint.',
      );
    }

    if (report.healthTrendDelta > 0 && report.healthScore != null) {
      lines.add(
        'Your financial health score improved by ${report.healthTrendDelta} points.',
      );
    }

    if (report.goalsAchieved.any((g) => g.title.toLowerCase().contains('savings'))) {
      lines.add('Congratulations! You hit your savings target this cycle.');
    }

    if (report.budgetOnTrackPercent >= 80) {
      lines.add(
        '${report.budgetOnTrackPercent.toStringAsFixed(0)}% of your spending groups stayed on track.',
      );
    }

    for (final summary in report.trendSummaries) {
      if (!lines.contains(summary) && lines.length < 8) {
        lines.add(summary);
      }
    }

  if (lines.isEmpty && report.incomePaise > 0) {
      lines.add(
        'You moved ${formatPaise(report.expensesPaise)} through ${report.cycleDayCount} days '
        'and kept ${formatPaise(report.savingsPaise)}.',
      );
    }

    return lines.take(8).toList();
  }

  static SpendingBehaviourReview _behaviour({
    required MonthlyClosingReport report,
    SpendingTrendsReport? trends,
  }) {
    final impulse = trends?.impulsePurchases;
    final overspending = report.budgetBuckets
        .where((b) => !b.onTrack)
        .map((b) => b.name)
        .toList();

    String? bestSaving;
    final onTrackBuckets = report.budgetBuckets.where((b) => b.onTrack).toList();
    if (onTrackBuckets.isNotEmpty) {
      onTrackBuckets.sort((a, b) => a.percentUsed.compareTo(b.percentUsed));
      bestSaving = onTrackBuckets.first.name;
    }

    String? worstHabit;
    if (impulse != null && impulse.count >= 2) {
      worstHabit = 'Frequent impulse buys in ${impulse.examples.take(2).join(', ')}';
    } else if (overspending.isNotEmpty) {
      worstHabit = 'Overspending in ${overspending.first}';
    } else if (trends != null && trends.weekendWeekday.weekendSharePercent > 55) {
      worstHabit = 'Weekend spending spikes';
    }

    final recurring = trends?.repeatedExpenses
            .take(4)
            .map((r) => '${r.title} (${r.count}×)')
            .toList() ??
        const <String>[];

    String? merchantTrend;
    if (trends != null && trends.repeatedExpenses.isNotEmpty) {
      final top = trends.repeatedExpenses.first;
      merchantTrend =
          '${top.title} was your most repeated purchase (${top.count} times).';
    }

    return SpendingBehaviourReview(
      impulseCount: impulse?.count ?? 0,
      impulseTotalPaise: impulse?.totalPaise ?? 0,
      impulseExamples: impulse?.examples.take(3).toList() ?? const [],
      overspendingCategories: overspending,
      bestSavingCategory: bestSaving,
      worstSpendingHabit: worstHabit,
      weekendPaise: trends?.weekendWeekday.weekendPaise ?? 0,
      weekdayPaise: trends?.weekendWeekday.weekdayPaise ?? 0,
      recurringExpenses: recurring,
      merchantTrend: merchantTrend,
    );
  }

  static List<MonthlyAchievement> _achievements({
    required MonthlyClosingReport report,
    required CycleBehaviourStats behaviourStats,
    SpendingTrendsReport? trends,
  }) {
    final items = <MonthlyAchievement>[];

    if (report.budgetOnTrackPercent >= 100 && report.budgetBuckets.isNotEmpty) {
      items.add(
        const MonthlyAchievement(
          kind: AchievementKind.budgetAchieved,
          title: 'Budget champion',
          subtitle: 'Every spending group stayed on track',
        ),
      );
    } else if (report.budgetOnTrackPercent >= 70) {
      items.add(
        MonthlyAchievement(
          kind: AchievementKind.budgetAchieved,
          title: 'Mostly on budget',
          subtitle:
              '${report.budgetOnTrackPercent.toStringAsFixed(0)}% of groups on track',
        ),
      );
    }

    for (final goal in report.goalsAchieved.take(2)) {
      items.add(
        MonthlyAchievement(
          kind: AchievementKind.goalCompleted,
          title: goal.title,
          subtitle: goal.detail,
        ),
      );
    }

    if (report.savingsRatePercent >= 20) {
      items.add(
        MonthlyAchievement(
          kind: AchievementKind.savingsMilestone,
          title: 'Savings star',
          subtitle:
              '${report.savingsRatePercent.toStringAsFixed(0)}% of income saved',
        ),
      );
    }

    if (behaviourStats.noSpendDays >= 5) {
      items.add(
        MonthlyAchievement(
          kind: AchievementKind.noSpendStreak,
          title: 'No-spend hero',
          subtitle: '${behaviourStats.noSpendDays} days without spending',
        ),
      );
    }

    if (behaviourStats.expenseLogCount >= 15) {
      items.add(
        MonthlyAchievement(
          kind: AchievementKind.trackingConsistency,
          title: 'Tracking pro',
          subtitle: '${behaviourStats.expenseLogCount} expenses logged',
        ),
      );
    }

    if (report.healthTrendDelta >= 5) {
      items.add(
        MonthlyAchievement(
          kind: AchievementKind.healthImprovement,
          title: 'Health boost',
          subtitle: '+${report.healthTrendDelta} financial health points',
        ),
      );
    }

    final subShare = report.subscriptions.salarySharePercent;
    if (subShare > 0 && subShare <= 8) {
      items.add(
        const MonthlyAchievement(
          kind: AchievementKind.subscriptionControl,
          title: 'Subscription savvy',
          subtitle: 'Subscriptions stay under 8% of income',
        ),
      );
    }

    if (trends != null &&
        trends.impulsePurchases.count == 0 &&
        trends.current.totalSpentPaise > 0) {
      items.add(
        const MonthlyAchievement(
          kind: AchievementKind.noSpendStreak,
          title: 'Impulse-free',
          subtitle: 'No impulse purchases detected this cycle',
        ),
      );
    }

    return items.take(6).toList();
  }

  static List<MonthlyRecommendation> _recommendations({
    required MonthlyClosingReport report,
    SpendingTrendsReport? trends,
    FinancialHealthReport? health,
  }) {
    final items = <MonthlyRecommendation>[];

    if (report.subscriptions.salarySharePercent > 12) {
      items.add(
        MonthlyRecommendation(
          title: 'Review subscriptions',
          detail:
              'Recurring costs are ${report.subscriptions.salarySharePercent.toStringAsFixed(0)}% of income. '
              'Cancel one you rarely use.',
        ),
      );
    }

    if (report.savingsRatePercent < 15 && report.incomePaise > 0) {
      items.add(
        const MonthlyRecommendation(
          title: 'Increase savings',
          detail:
              'Try moving 5% more into your savings bucket next cycle — '
              'small shifts compound fast.',
        ),
      );
    }

    final overspent = report.budgetBuckets.where((b) => !b.onTrack).toList();
    if (overspent.isNotEmpty) {
      items.add(
        MonthlyRecommendation(
          title: 'Adjust ${overspent.first.name} budget',
          detail:
              'This group went over by ${formatPaise(overspent.first.spentPaise - overspent.first.allocatedPaise)}. '
              'A slightly higher limit or tighter daily cap can help.',
        ),
      );
    }

    if (trends != null && trends.impulsePurchases.count >= 3) {
      items.add(
        const MonthlyRecommendation(
          title: 'Delay impulse purchases',
          detail:
              'Add a 24-hour pause before non-essential buys — '
              'your future self will thank you.',
        ),
      );
    }

    if (report.loans.overdueCount > 0) {
      items.add(
        MonthlyRecommendation(
          title: 'Clear overdue loans',
          detail:
              '${report.loans.overdueCount} loan${report.loans.overdueCount == 1 ? '' : 's'} '
              'need attention. Settling them reduces stress and interest.',
        ),
      );
    }

    if (report.savingsRatePercent < 10 && report.incomePaise > 0) {
      items.add(
        const MonthlyRecommendation(
          title: 'Grow your emergency fund',
          detail:
              'Aim for one month of expenses in a dedicated savings bucket — '
              'start with whatever you can this cycle.',
        ),
      );
    }

    if (trends != null && trends.subscriptionTrend.growthPercent != null &&
        trends.subscriptionTrend.growthPercent! > 15) {
      items.add(
        const MonthlyRecommendation(
          title: 'Optimize recurring payments',
          detail:
              'Subscription spending rose sharply. Check for duplicate or unused plans.',
        ),
      );
    }

    if (health != null) {
      for (final rec in health.recommendations.take(2)) {
        items.add(
          MonthlyRecommendation(
            title: rec.category.label,
            detail: rec.message,
          ),
        );
      }
    }

    if (items.isEmpty) {
      items.add(
        const MonthlyRecommendation(
          title: 'Keep the momentum',
          detail:
              'You are building great habits. Stay consistent with logging '
              'and review your budget at the start of next cycle.',
        ),
      );
    }

    return items.take(5).toList();
  }
}
