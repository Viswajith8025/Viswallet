import 'dart:math' as math;

import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:rupee_track/features/health_score/domain/financial_health_models.dart';

/// Financial wellness scoring — motivating, never judgmental.
abstract final class FinancialHealthEngine {
  static const categoryWeights = {
    HealthCategory.saving: 0.22,
    HealthCategory.budgeting: 0.24,
    HealthCategory.debt: 0.16,
    HealthCategory.subscriptions: 0.14,
    HealthCategory.stability: 0.24,
  };

  static FinancialHealthReport compute({
    required FinancialHealthInput input,
    List<HistoricalScorePoint> history = const [],
  }) {
    if (!input.hasSalary) {
      return FinancialHealthReport(
        cycleKey: input.cycleKey,
        overallScore: 0,
        trendDelta: 0,
        motivationLabel: 'Set your salary to unlock your health score',
        categories: const [],
        recommendations: const [
          HealthRecommendation(
            message:
                'Enter your monthly salary and set up a budget to see your wellness score.',
            potentialGain: 0,
            category: HealthCategory.saving,
          ),
        ],
        history: history,
        hasEnoughData: false,
      );
    }

    final categories = [
      _savingScore(input),
      _budgetingScore(input),
      _debtScore(input),
      _subscriptionScore(input),
      _stabilityScore(input),
    ];

    final overall = _weightedOverall(categories);
    final trendDelta = input.previousCycleScore != null
        ? overall - input.previousCycleScore!
        : 0;

    final recommendations = _recommendations(
      input: input,
      categories: categories,
      overallScore: overall,
    );

    return FinancialHealthReport(
      cycleKey: input.cycleKey,
      overallScore: overall,
      trendDelta: trendDelta,
      motivationLabel: _motivationLabel(overall, trendDelta),
      categories: categories,
      recommendations: recommendations,
      history: history,
      hasEnoughData: true,
    );
  }

  static int _weightedOverall(List<CategoryScore> categories) {
    var total = 0.0;
    for (final cat in categories) {
      total += cat.score * (categoryWeights[cat.category] ?? 0.2);
    }
    return total.round().clamp(0, 100);
  }

  static CategoryScore _savingScore(FinancialHealthInput input) {
    final rateScore = (input.savingsRate * 100).clamp(0, 100).round();
    final emergencyScore =
        input.emergencyFundRemainingPercent.clamp(0, 100).round();
    var score = (rateScore * 0.65 + emergencyScore * 0.35).round();
    if (input.savingsBucketTouched) score = (score * 0.85).round();

    final summary = input.savingsRate >= 0.2
        ? 'Strong savings habit this month'
        : input.savingsRate >= 0.1
            ? 'Room to grow your savings rate'
            : 'Small steps toward saving add up';

    return CategoryScore(
      category: HealthCategory.saving,
      score: score.clamp(0, 100),
      summary: summary,
    );
  }

  static CategoryScore _budgetingScore(FinancialHealthInput input) {
    if (input.totalSpendingBuckets == 0) {
      return const CategoryScore(
        category: HealthCategory.budgeting,
        score: 35,
        summary: 'Set a budget to track spending against your plan',
      );
    }

    var score = (input.budgetDiscipline * 100).round();
    score -= input.bucketsOverBudget * 12;

    return CategoryScore(
      category: HealthCategory.budgeting,
      score: score.clamp(0, 100),
      summary: input.bucketsOverBudget == 0
          ? 'Spending groups are on track'
          : '${input.bucketsOverBudget} spending group${input.bucketsOverBudget == 1 ? '' : 's'} need attention',
    );
  }

  static CategoryScore _debtScore(FinancialHealthInput input) {
    if (input.pendingBorrowedPaise == 0 && input.overdueLoansCount == 0) {
      return const CategoryScore(
        category: HealthCategory.debt,
        score: 95,
        summary: 'No active debt pressure',
      );
    }

    var score = 100 - (input.debtRatio * 180).round();
    score -= input.overdueLoansCount * 12;

    return CategoryScore(
      category: HealthCategory.debt,
      score: score.clamp(0, 100),
      summary: input.overdueLoansCount > 0
          ? 'A few loan follow-ups could ease this score'
          : 'Debt is manageable — keep chipping away',
    );
  }

  static CategoryScore _subscriptionScore(FinancialHealthInput input) {
    final burden = input.subscriptionBurden;
    final score = (100 - burden * 280).round().clamp(0, 100);

    return CategoryScore(
      category: HealthCategory.subscriptions,
      score: score,
      summary: burden <= 0.05
          ? 'Subscriptions are a small slice of income'
          : burden <= 0.1
              ? 'Subscriptions are noticeable — worth a quick audit'
              : 'Trimming recurring costs would free up breathing room',
    );
  }

  static CategoryScore _stabilityScore(FinancialHealthInput input) {
    final consistency = _consistencyScore(input.dailySpendsPaise);
    final impulsePenalty = input.salaryPaise > 0
        ? ((input.impulsePurchasePaise / input.salaryPaise) * 120).round()
        : 0;
    var improvement = 0;
    if (input.previousCycleScore != null) {
      final savingsDelta = input.savingsPaise - input.previousCycleSavingsPaise;
      if (savingsDelta > 0) improvement = 8;
      if (savingsDelta < 0) improvement = -6;
    }

    final score =
        (consistency * 0.55 + (100 - impulsePenalty) * 0.45 + improvement)
            .round();

    return CategoryScore(
      category: HealthCategory.stability,
      score: score.clamp(0, 100),
      summary: input.impulsePurchaseCount == 0
          ? 'Spending pace looks steady'
          : 'A calmer few days can smooth things out',
    );
  }

  static double _consistencyScore(List<int> dailySpends) {
    if (dailySpends.length < 3) return 75;
    final mean = dailySpends.reduce((a, b) => a + b) / dailySpends.length;
    if (mean <= 0) return 85;
    final variance = dailySpends
            .map((v) => (v - mean) * (v - mean))
            .reduce((a, b) => a + b) /
        dailySpends.length;
    final cv = math.sqrt(variance) / mean;
    return (100 - cv * 80).clamp(40, 100);
  }

  static String _motivationLabel(int score, int trendDelta) {
    if (score >= 85) {
      return trendDelta >= 0
          ? 'You\'re in great financial shape — keep it up'
          : 'Still strong — small tweaks bring you back up';
    }
    if (score >= 70) {
      return 'Solid foundation — a few wins away from excellent';
    }
    if (score >= 50) {
      return 'You\'re building momentum — every month counts';
    }
    return 'Fresh start energy — small changes make a real difference';
  }

  static List<HealthRecommendation> _recommendations({
    required FinancialHealthInput input,
    required List<CategoryScore> categories,
    required int overallScore,
  }) {
    final recs = <HealthRecommendation>[];

    final subScore = categories
        .firstWhere((c) => c.category == HealthCategory.subscriptions);
    if (subScore.score < 80 && input.subscriptionMonthlyPaise > 0) {
      final gain = _simulateSubscriptionCut(input, overallScore);
      if (gain > 0) {
        recs.add(
          HealthRecommendation(
            message:
                'Reducing subscriptions could improve your score by $gain.',
            potentialGain: gain,
            category: HealthCategory.subscriptions,
          ),
        );
      }
    }

    final savingGap = (input.salaryPaise * 0.2).round() - input.savingsPaise;
    if (savingGap > 0) {
      final targetExtra = savingGap > 200000 ? 200000 : savingGap;
      final projected = _simulateExtraSavings(input, overallScore, targetExtra);
      if (projected > overallScore) {
        recs.add(
          HealthRecommendation(
            message:
                'Saving ${formatPaise(targetExtra)} more this month could bring your score to $projected.',
            potentialGain: projected - overallScore,
            category: HealthCategory.saving,
          ),
        );
      }
    }

    final budget = categories
        .firstWhere((c) => c.category == HealthCategory.budgeting);
    if (input.totalSpendingBuckets == 0) {
      recs.add(
        const HealthRecommendation(
          message:
              'Set a budget so Viswallet can score how well you stay on plan.',
          potentialGain: 8,
          category: HealthCategory.budgeting,
        ),
      );
    } else if (budget.score < 75 && input.bucketsOverBudget > 0) {
      recs.add(
        HealthRecommendation(
          message:
              'Staying within your plan on ${input.bucketsOverBudget} spending group${input.bucketsOverBudget == 1 ? '' : 's'} would improve this score.',
          potentialGain: 4,
          category: HealthCategory.budgeting,
        ),
      );
    }

    if (input.impulsePurchaseCount >= 2) {
      recs.add(
        const HealthRecommendation(
          message:
              'Spacing out larger discretionary buys helps stability — no need to cut joy, just pace it.',
          potentialGain: 3,
          category: HealthCategory.stability,
        ),
      );
    }

    if (recs.isEmpty) {
      recs.add(
        const HealthRecommendation(
          message:
              'You\'re doing well — maintaining your current habits keeps the score strong.',
          potentialGain: 0,
          category: HealthCategory.saving,
        ),
      );
    }

    return recs.take(4).toList();
  }

  static int _simulateSubscriptionCut(
    FinancialHealthInput input,
    int currentOverall,
  ) {
    final reduced = FinancialHealthInput(
      cycleKey: input.cycleKey,
      salaryPaise: input.salaryPaise,
      spentPaise: input.spentPaise,
      carryOverPaise: input.carryOverPaise,
      subscriptionMonthlyPaise: (input.subscriptionMonthlyPaise * 0.85).round(),
      pendingBorrowedPaise: input.pendingBorrowedPaise,
      overdueLoansCount: input.overdueLoansCount,
      impulsePurchasePaise: input.impulsePurchasePaise,
      impulsePurchaseCount: input.impulsePurchaseCount,
      dailySpendsPaise: input.dailySpendsPaise,
      bucketsOverBudget: input.bucketsOverBudget,
      bucketsOnTrack: input.bucketsOnTrack,
      totalSpendingBuckets: input.totalSpendingBuckets,
      emergencyFundRemainingPercent: input.emergencyFundRemainingPercent,
      savingsBucketTouched: input.savingsBucketTouched,
      previousCycleScore: input.previousCycleScore,
      previousCycleSavingsPaise: input.previousCycleSavingsPaise,
    );
    final newOverall = compute(input: reduced).overallScore;
    return (newOverall - currentOverall).clamp(0, 15);
  }

  static int _simulateExtraSavings(
    FinancialHealthInput input,
    int currentOverall,
    int extraPaise,
  ) {
    final adjusted = FinancialHealthInput(
      cycleKey: input.cycleKey,
      salaryPaise: input.salaryPaise,
      spentPaise: (input.spentPaise - extraPaise).clamp(0, input.spentPaise),
      carryOverPaise: input.carryOverPaise,
      subscriptionMonthlyPaise: input.subscriptionMonthlyPaise,
      pendingBorrowedPaise: input.pendingBorrowedPaise,
      overdueLoansCount: input.overdueLoansCount,
      impulsePurchasePaise: input.impulsePurchasePaise,
      impulsePurchaseCount: input.impulsePurchaseCount,
      dailySpendsPaise: input.dailySpendsPaise,
      bucketsOverBudget: input.bucketsOverBudget,
      bucketsOnTrack: input.bucketsOnTrack,
      totalSpendingBuckets: input.totalSpendingBuckets,
      emergencyFundRemainingPercent: input.emergencyFundRemainingPercent,
      savingsBucketTouched: input.savingsBucketTouched,
      previousCycleScore: input.previousCycleScore,
      previousCycleSavingsPaise: input.previousCycleSavingsPaise,
    );
    return compute(input: adjusted).overallScore;
  }
}
