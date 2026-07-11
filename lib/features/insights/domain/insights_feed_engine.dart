import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:rupee_track/features/budget/domain/allocation_mode.dart';
import 'package:rupee_track/features/insights/domain/insights_feed_models.dart';
import 'package:rupee_track/features/safe_spend/domain/safe_spend_snapshot.dart';

/// Aggregates and ranks financial intelligence from existing engines.
abstract final class InsightsFeedEngine {
  static const _maxFeedItems = 14;
  static const _maxPerCategory = 2;

  static InsightsFeedReport build(InsightsFeedInput input) {
    final raw = <InsightFeedItem>[
      ..._fromTrends(input),
      ..._fromSafeSpend(input),
      ..._fromHealth(input),
      ..._fromBudget(input),
      ..._fromSubscriptions(input),
      ..._fromForecast(input),
      ..._fromGoals(input),
      ..._fromLoans(input),
      ..._fromMerchants(input),
      ..._fromCategories(input),
      ..._fromBehavioral(input),
      ..._fromSalaryCycle(input),
    ];

    final achievements = _achievements(input, raw);
    final dailyTip = _dailyTip(input);

    final ranked = _rankAndFilter([
      ...raw,
      ...achievements,
    ]);

    return InsightsFeedReport(
      cycleKey: input.cycleKey,
      items: ranked,
      dailyTip: dailyTip,
      achievements: achievements,
      generatedAt: DateTime.now().toUtc(),
    );
  }

  static List<InsightFeedItem> _fromTrends(InsightsFeedInput input) {
    final t = input.trends;
    final items = <InsightFeedItem>[];

    for (var i = 0; i < t.summaries.length; i++) {
      items.add(
        InsightFeedItem(
          id: 'trends-summary-$i',
          category: InsightCategory.spending,
          kind: InsightKind.insight,
          severity: InsightSeverity.info,
          title: 'Spending pattern',
          body: t.summaries[i],
          icon: iconForInsightCategory(InsightCategory.spending),
          rankScore: 55,
          source: 'trends',
        ),
      );
    }

    if (t.comparison != null) {
      final delta = t.current.totalSpentPaise - t.comparison!.totalSpentPaise;
      if (delta.abs() >= 50000) {
        final less = delta < 0;
        items.add(
          InsightFeedItem(
            id: 'trends-cycle-delta',
            category: InsightCategory.spending,
            kind: InsightKind.trend,
            severity: less ? InsightSeverity.opportunity : InsightSeverity.warning,
            title: less ? 'Spending down' : 'Spending up',
            body: less
                ? 'You spent ${formatPaise(-delta)} less than last cycle.'
                : 'You spent ${formatPaise(delta)} more than last cycle.',
            metricValue: formatPaise(t.current.totalSpentPaise),
            actionRoute: null,
            rankScore: less ? 72 : 78,
            source: 'trends',
          ),
        );
      }
    }

    final weekend = t.weekendWeekday;
    if (weekend.total > 0 && weekend.weekendSharePercent >= 35) {
      items.add(
        InsightFeedItem(
          id: 'trends-weekend',
          category: InsightCategory.behavioral,
          kind: InsightKind.trend,
          severity: InsightSeverity.info,
          title: 'Weekend habits',
          body:
              'Weekend spending is ${weekend.weekendSharePercent.round()}% of this period — ${formatPaise(weekend.weekendPaise)} on Sat–Sun.',
          icon: iconForInsightCategory(InsightCategory.behavioral),
          rankScore: 58,
          source: 'trends',
        ),
      );
    }

    if (t.impulsePurchases.count > 0) {
      items.add(
        InsightFeedItem(
          id: 'trends-impulse',
          category: InsightCategory.behavioral,
          kind: InsightKind.warning,
          severity: InsightSeverity.warning,
          title: 'Impulse spending',
          body:
              '${t.impulsePurchases.count} larger discretionary purchases totalling ${formatPaise(t.impulsePurchases.totalPaise)}.',
          rankScore: 76,
          source: 'trends',
        ),
      );
    }

    final peakDay = t.heatMap.isEmpty
        ? null
        : t.heatMap.reduce((a, b) => a.spentPaise >= b.spentPaise ? a : b);
    if (peakDay != null && peakDay.spentPaise > 0) {
      items.add(
        InsightFeedItem(
          id: 'trends-peak-day',
          category: InsightCategory.spending,
          kind: InsightKind.insight,
          severity: InsightSeverity.info,
          title: 'Peak spending day',
          body:
              'You usually spend the most on ${peakDay.label}s — ${formatPaise(peakDay.spentPaise)} this cycle.',
          rankScore: 52,
          source: 'trends',
        ),
      );
    }

    return items;
  }

  static List<InsightFeedItem> _fromSafeSpend(InsightsFeedInput input) {
    final s = input.safeSpend;
    if (s == null || s.riskLevel == SafeSpendRiskLevel.noData) {
      return const [];
    }

    final items = <InsightFeedItem>[
      InsightFeedItem(
        id: 'safe-spend-today',
        category: InsightCategory.safeSpend,
        kind: InsightKind.recommendation,
        severity: _safeSpendSeverity(s.riskLevel),
        title: s.headline,
        body: s.recommendation ??
            'You can safely spend ${formatPaise(s.remainingSafeSpendTodayPaise.clamp(0, 999999999))} today.',
        metricLabel: 'Safe today',
        metricValue: formatPaise(s.safeDailyLimitPaise),
        actionRoute: AppRoutes.home,
        rankScore: s.riskLevel == SafeSpendRiskLevel.critical ? 95 : 82,
        source: 'safe_spend',
      ),
    ];

    if (s.projection.expectsShortage) {
      items.add(
        InsightFeedItem(
          id: 'safe-spend-projection',
          category: InsightCategory.safeSpend,
          kind: InsightKind.warning,
          severity: InsightSeverity.critical,
          title: 'Overspending risk',
          body:
              'At this pace you may exceed budget before cycle end. Reduce daily spending by ${formatPaise(s.projection.dailyReductionNeededPaise)}.',
          rankScore: 92,
          source: 'safe_spend',
        ),
      );
    } else if (s.projection.moneyLastsUntilIst != null &&
        s.daysRemainingInCycle > 3) {
      items.add(
        InsightFeedItem(
          id: 'safe-spend-lasts',
          category: InsightCategory.forecast,
          kind: InsightKind.insight,
          severity: InsightSeverity.info,
          title: 'End-of-cycle outlook',
          body:
              'Current spending pace leaves ${formatPaise(s.projection.expectedEndOfCycleBalancePaise)} by cycle end.',
          rankScore: 64,
          source: 'safe_spend',
        ),
      );
    }

    return items;
  }

  static List<InsightFeedItem> _fromHealth(InsightsFeedInput input) {
    final h = input.health;
    if (h == null || !h.hasEnoughData) return const [];

    final items = <InsightFeedItem>[
      InsightFeedItem(
        id: 'health-score',
        category: InsightCategory.health,
        kind: InsightKind.insight,
        severity: h.overallScore >= 75
            ? InsightSeverity.achievement
            : InsightSeverity.info,
        title: 'Financial health',
        body: h.motivationLabel,
        metricLabel: 'Score',
        metricValue: '${h.overallScore}',
        actionRoute: AppRoutes.insights,
        actionLabel: 'View insights',
        rankScore: 70,
        source: 'health',
      ),
    ];

    for (var i = 0; i < h.recommendations.length && i < 2; i++) {
      final rec = h.recommendations[i];
      items.add(
        InsightFeedItem(
          id: 'health-rec-$i',
          category: InsightCategory.health,
          kind: InsightKind.recommendation,
          severity: rec.potentialGain >= 8
              ? InsightSeverity.opportunity
              : InsightSeverity.info,
          title: 'Health recommendation',
          body: rec.message,
          actionRoute: AppRoutes.insights,
          rankScore: 60 + rec.potentialGain,
          source: 'health',
        ),
      );
    }

    return items;
  }

  static List<InsightFeedItem> _fromBudget(InsightsFeedInput input) {
    final plan = input.budget;
    if (plan == null || plan.buckets.isEmpty) return const [];

    final items = <InsightFeedItem>[];

    for (var i = 0; i < plan.insights.length && i < 3; i++) {
      final insight = plan.insights[i];
      items.add(
        InsightFeedItem(
          id: 'budget-insight-$i',
          category: InsightCategory.budget,
          kind: insight.severity == BudgetAlertLevel.exceeded
              ? InsightKind.warning
              : InsightKind.insight,
          severity: insight.severity == BudgetAlertLevel.exceeded
              ? InsightSeverity.warning
              : InsightSeverity.info,
          title: insight.title,
          body: insight.message,
          actionRoute: AppRoutes.budget,
          rankScore: insight.severity == BudgetAlertLevel.exceeded ? 85 : 62,
          source: 'budget',
        ),
      );
    }

    final over = plan.alertBuckets;
    if (over.isEmpty && plan.spendingBuckets.isNotEmpty) {
      items.add(
        const InsightFeedItem(
          id: 'budget-all-clear',
          category: InsightCategory.budget,
          kind: InsightKind.achievement,
          severity: InsightSeverity.achievement,
          title: 'Budget champion',
          body: 'You stayed within budget for every category this cycle.',
          actionRoute: AppRoutes.budget,
          rankScore: 68,
          source: 'budget',
        ),
      );
    }

    final withRoom = plan.spendingBuckets
        .where((b) => b.remainingPaise > 50000)
        .toList()
      ..sort((a, b) => b.remainingPaise.compareTo(a.remainingPaise));

    if (withRoom.isNotEmpty) {
      final top = withRoom.first;
      items.add(
        InsightFeedItem(
          id: 'budget-room',
          category: InsightCategory.budget,
          kind: InsightKind.opportunity,
          severity: InsightSeverity.opportunity,
          title: 'Budget headroom',
          body:
              'You still have ${formatPaise(top.remainingPaise)} available for ${top.displayName}.',
          actionRoute: AppRoutes.budget,
          rankScore: 58,
          source: 'budget',
        ),
      );
    }

    return items;
  }

  static List<InsightFeedItem> _fromSubscriptions(InsightsFeedInput input) {
    final sub = input.subscriptions;
    if (sub == null) return const [];

    final items = <InsightFeedItem>[];

    if (sub.incomeSharePercent >= 8) {
      items.add(
        InsightFeedItem(
          id: 'sub-salary-share',
          category: InsightCategory.subscription,
          kind: InsightKind.insight,
          severity: sub.incomeSharePercent >= 15
              ? InsightSeverity.warning
              : InsightSeverity.info,
          title: 'Subscription burden',
          body:
              'Subscriptions consume ${sub.incomeSharePercent.toStringAsFixed(0)}% of your monthly salary.',
          actionRoute: AppRoutes.subscriptions,
          rankScore: sub.incomeSharePercent >= 15 ? 80 : 60,
          source: 'subscriptions',
        ),
      );
    }

    for (var i = 0; i < sub.insights.length && i < 2; i++) {
      final insight = sub.insights[i];
      items.add(
        InsightFeedItem(
          id: 'sub-insight-$i',
          category: InsightCategory.subscription,
          kind: InsightKind.insight,
          severity: insight.severity == 'warning'
              ? InsightSeverity.warning
              : InsightSeverity.info,
          title: 'Subscription insight',
          body: insight.message,
          actionRoute: AppRoutes.subscriptions,
          rankScore: insight.severity == 'warning' ? 74 : 56,
          source: 'subscriptions',
        ),
      );
    }

    final renewals = sub.overview.upcomingRenewalCount;
    if (renewals > 0) {
      items.add(
        InsightFeedItem(
          id: 'sub-renewals',
          category: InsightCategory.subscription,
          kind: InsightKind.warning,
          severity: InsightSeverity.warning,
          title: 'Upcoming renewals',
          body:
              '$renewals subscription${renewals == 1 ? '' : 's'} renew soon — review before they charge.',
          actionRoute: AppRoutes.subscriptions,
          rankScore: 77,
          source: 'subscriptions',
        ),
      );
    }

    for (var i = 0; i < sub.suggestions.length && i < 1; i++) {
      final s = sub.suggestions[i];
      if (s.annualSavingsPaise != null && s.annualSavingsPaise! > 0) {
        items.add(
          InsightFeedItem(
            id: 'sub-suggestion-$i',
            category: InsightCategory.subscription,
            kind: InsightKind.opportunity,
            severity: InsightSeverity.opportunity,
            title: s.title,
            body:
                '${s.detail} Saves ${formatPaise(s.annualSavingsPaise!)} per year.',
            actionRoute: AppRoutes.subscriptions,
            rankScore: 71,
            source: 'subscriptions',
          ),
        );
      }
    }

    return items;
  }

  static List<InsightFeedItem> _fromForecast(InsightsFeedInput input) {
    final f = input.forecast;
    if (f == null) return const [];

    final items = <InsightFeedItem>[];

    final rate = input.savingsRatePercent;
    if (rate > 0) {
      items.add(
        InsightFeedItem(
          id: 'forecast-savings-rate',
          category: InsightCategory.savings,
          kind: InsightKind.insight,
          severity: rate >= 20 ? InsightSeverity.achievement : InsightSeverity.info,
          title: 'Savings rate',
          body: "You're saving ${rate.toStringAsFixed(0)}% of your income.",
          metricValue: '${rate.round()}%',
          actionRoute: AppRoutes.insights,
          rankScore: rate >= 20 ? 66 : 54,
          source: 'forecast',
        ),
      );
    }

    final yearly = f.periodSummary.projectedSavingsPaise;
    if (yearly > 0) {
      items.add(
        InsightFeedItem(
          id: 'forecast-yearly',
          category: InsightCategory.forecast,
          kind: InsightKind.trend,
          severity: InsightSeverity.info,
          title: 'Yearly savings outlook',
          body:
              "At this pace you'll save ${formatPaise(yearly)} over the next year.",
          actionRoute: AppRoutes.insights,
          rankScore: 63,
          source: 'forecast',
        ),
      );
    }

    for (var i = 0; i < f.insights.length && i < 2; i++) {
      final insight = f.insights[i];
      items.add(
        InsightFeedItem(
          id: 'forecast-insight-$i',
          category: InsightCategory.forecast,
          kind: InsightKind.recommendation,
          severity: insight.severity == 'warning'
              ? InsightSeverity.warning
              : InsightSeverity.info,
          title: 'Forecast insight',
          body: insight.message,
          actionRoute: AppRoutes.insights,
          rankScore: insight.severity == 'warning' ? 70 : 55,
          source: 'forecast',
        ),
      );
    }

    return items;
  }

  static List<InsightFeedItem> _fromGoals(InsightsFeedInput input) {
    final items = <InsightFeedItem>[];

    for (final goal in input.goals) {
      final progress = goal.targetPaise > 0
          ? (goal.savedPaise / goal.targetPaise * 100).round()
          : 0;
      final module =
          goal.isWishlist ? InsightCategory.wishlist : InsightCategory.goal;

      if (goal.savedPaise >= goal.targetPaise) {
        items.add(
          InsightFeedItem(
            id: 'goal-done-${goal.id}',
            category: module,
            kind: InsightKind.achievement,
            severity: InsightSeverity.achievement,
            title: 'Goal completed',
            body: '${goal.name} is fully funded!',
            actionRoute: AppRoutes.insights,
            rankScore: 75,
            source: 'goals',
          ),
        );
      } else if (progress >= 50) {
        items.add(
          InsightFeedItem(
            id: 'goal-progress-${goal.id}',
            category: module,
            kind: InsightKind.insight,
            severity: InsightSeverity.info,
            title: goal.isWishlist ? 'Wishlist progress' : 'Goal progress',
            body: '${goal.name} is $progress% complete.',
            metricValue: '$progress%',
            actionRoute: AppRoutes.insights,
            rankScore: 57,
            source: 'goals',
          ),
        );
      }

      if (goal.monthlyContributionPaise >= 100000 && goal.remainingPaise > 0) {
        final months = (goal.remainingPaise / goal.monthlyContributionPaise)
            .ceil()
            .clamp(1, 120);
        items.add(
          InsightFeedItem(
            id: 'goal-contrib-${goal.id}',
            category: module,
            kind: InsightKind.recommendation,
            severity: InsightSeverity.opportunity,
            title: 'Accelerate your goal',
            body:
                'Adding ${formatPaise(goal.monthlyContributionPaise)} monthly finishes ${goal.name} in about $months months.',
            actionRoute: AppRoutes.insights,
            rankScore: 53,
            source: 'goals',
          ),
        );
      }
    }

    return items.take(4).toList();
  }

  static List<InsightFeedItem> _fromLoans(InsightsFeedInput input) {
    final items = <InsightFeedItem>[];

    for (final loan in input.overdueLoans) {
      if (loan.isOverdue) {
        items.add(
          InsightFeedItem(
            id: 'loan-overdue-${loan.personName}',
            category: InsightCategory.loan,
            kind: InsightKind.warning,
            severity: InsightSeverity.critical,
            title: 'Overdue loan',
            body:
                'Borrowed money from ${loan.personName} is overdue by ${loan.daysOverdue} day${loan.daysOverdue == 1 ? '' : 's'}.',
            actionRoute: AppRoutes.loans,
            rankScore: 98,
            source: 'loans',
          ),
        );
      } else if (loan.daysUntilDue != null && loan.daysUntilDue! <= 7) {
        items.add(
          InsightFeedItem(
            id: 'loan-due-${loan.personName}',
            category: InsightCategory.loan,
            kind: InsightKind.warning,
            severity: InsightSeverity.warning,
            title: 'Loan repayment due',
            body:
                'Repayment to ${loan.personName} due in ${loan.daysUntilDue} day${loan.daysUntilDue == 1 ? '' : 's'}.',
            actionRoute: AppRoutes.loans,
            rankScore: 88,
            source: 'loans',
          ),
        );
      }
    }

    return items;
  }

  static List<InsightFeedItem> _fromMerchants(InsightsFeedInput input) {
    if (input.topMerchant == null || input.topMerchantPaise <= 0) {
      return const [];
    }

    return [
      InsightFeedItem(
        id: 'merchant-top',
        category: InsightCategory.merchant,
        kind: InsightKind.insight,
        severity: InsightSeverity.info,
        title: 'Top merchant',
        body:
            'You spent ${formatPaise(input.topMerchantPaise)} at ${input.topMerchant} this cycle.',
        actionRoute: AppRoutes.search,
        actionLabel: 'Search merchant',
        actionQuery: input.topMerchant,
        rankScore: 54,
        source: 'merchants',
      ),
    ];
  }

  static List<InsightFeedItem> _fromCategories(InsightsFeedInput input) {
    final items = <InsightFeedItem>[];
    final comparisons = input.trends.categoryComparisons;

    if (comparisons.isNotEmpty && input.trends.current.totalSpentPaise > 0) {
      final top = comparisons.reduce(
        (a, b) => a.currentPaise >= b.currentPaise ? a : b,
      );
      final share = (top.currentPaise / input.trends.current.totalSpentPaise) *
          100;
      items.add(
        InsightFeedItem(
          id: 'category-share-top',
          category: InsightCategory.category,
          kind: InsightKind.insight,
          severity: InsightSeverity.info,
          title: 'Category breakdown',
          body:
              '${top.categoryName} represents ${share.round()}% of total spending.',
          colorValue: top.colorValue,
          rankScore: 56,
          source: 'categories',
        ),
      );
    }

    final fastest = input.trends.fastestGrowingCategory;
    if (fastest != null &&
        fastest.changePercent != null &&
        fastest.changePercent! >= 15) {
      items.add(
        InsightFeedItem(
          id: 'category-growing',
          category: InsightCategory.category,
          kind: InsightKind.trend,
          severity: InsightSeverity.warning,
          title: 'Fastest growing category',
          body:
              '${fastest.categoryName} spending increased ${fastest.changePercent!.round()}%.',
          colorValue: fastest.colorValue,
          rankScore: 65,
          source: 'categories',
        ),
      );
    }

    for (final entry in input.categoryNoSpendDays.entries) {
      if (entry.value >= 14) {
        items.add(
          InsightFeedItem(
            id: 'no-spend-${entry.key}',
            category: InsightCategory.noSpend,
            kind: InsightKind.insight,
            severity: InsightSeverity.opportunity,
            title: 'Spending pause',
            body:
                "You haven't spent on ${entry.key} for ${entry.value} days.",
            rankScore: 50,
            source: 'no_spend',
          ),
        );
        break;
      }
    }

    return items;
  }

  static List<InsightFeedItem> _fromBehavioral(InsightsFeedInput input) {
    final items = <InsightFeedItem>[];

    if (input.trends.repeatedExpenses.isNotEmpty) {
      final top = input.trends.repeatedExpenses.first;
      items.add(
        InsightFeedItem(
          id: 'repeated-expense',
          category: InsightCategory.behavioral,
          kind: InsightKind.insight,
          severity: InsightSeverity.info,
          title: 'Recurring spend',
          body:
              '${top.title} appears ${top.count} times — ${formatPaise(top.totalPaise)} total.',
          rankScore: 51,
          source: 'behavioral',
        ),
      );
    }

    return items;
  }

  static List<InsightFeedItem> _fromSalaryCycle(InsightsFeedInput input) {
    final days = input.daysUntilSalary;
    if (days == null) return const [];

    if (days <= 3 && days >= 0) {
      return [
        InsightFeedItem(
          id: 'salary-soon',
          category: InsightCategory.salaryCycle,
          kind: InsightKind.insight,
          severity: InsightSeverity.info,
          title: 'Salary incoming',
          body: days == 0
              ? 'Salary day is today — plan your cycle rollover.'
              : 'Salary arrives in $days day${days == 1 ? '' : 's'}.',
          actionRoute: AppRoutes.salary,
          rankScore: 61,
          source: 'salary_cycle',
        ),
      ];
    }
    return const [];
  }

  static List<InsightFeedItem> _achievements(
    InsightsFeedInput input,
    List<InsightFeedItem> existing,
  ) {
    final achievements = <InsightFeedItem>[];

    if (existing.any((i) => i.id == 'budget-all-clear')) {
      achievements.add(
        const InsightFeedItem(
          id: 'achievement-budget',
          category: InsightCategory.achievement,
          kind: InsightKind.achievement,
          severity: InsightSeverity.achievement,
          title: 'Budget Champion',
          body: 'Every spending category stayed on track this cycle.',
          rankScore: 72,
          source: 'achievements',
        ),
      );
    }

    final rate = input.savingsRatePercent;
    if (rate >= 20) {
      achievements.add(
        InsightFeedItem(
          id: 'achievement-savings',
          category: InsightCategory.achievement,
          kind: InsightKind.achievement,
          severity: InsightSeverity.achievement,
          title: 'Savings Master',
          body: "You're saving ${rate.round()}% of income — excellent habit.",
          rankScore: 74,
          source: 'achievements',
        ),
      );
    }

    if (input.expenseTrackingStreakDays >= 7 &&
        input.expenseTrackingStreakDays < 30) {
      achievements.add(
        InsightFeedItem(
          id: 'achievement-streak-7',
          category: InsightCategory.achievement,
          kind: InsightKind.achievement,
          severity: InsightSeverity.achievement,
          title: '7-Day Tracking Streak',
          body:
              'You logged expenses ${input.expenseTrackingStreakDays} days in a row — keep it up.',
          rankScore: 68,
          source: 'achievements',
        ),
      );
    }

    if (input.expenseTrackingStreakDays >= 30) {
      achievements.add(
        InsightFeedItem(
          id: 'achievement-streak-30',
          category: InsightCategory.achievement,
          kind: InsightKind.achievement,
          severity: InsightSeverity.achievement,
          title: '30-Day Tracking Streak',
          body: 'A full month of consistent expense tracking.',
          rankScore: 76,
          source: 'achievements',
        ),
      );
    }

    final completedGoals =
        input.goals.where((g) => g.savedPaise >= g.targetPaise).length;
    if (completedGoals >= 1) {
      achievements.add(
        InsightFeedItem(
          id: 'achievement-goals',
          category: InsightCategory.achievement,
          kind: InsightKind.achievement,
          severity: InsightSeverity.achievement,
          title: 'Goal Achieved',
          body: completedGoals == 1
              ? 'You completed a savings goal this cycle.'
              : 'You completed $completedGoals goals — outstanding progress.',
          rankScore: 78,
          source: 'achievements',
        ),
      );
    }

    if (input.overdueLoans.isEmpty &&
        input.trends.current.totalSpentPaise > 0) {
      final health = input.health?.overallScore ?? 0;
      if (health >= 80) {
        achievements.add(
          const InsightFeedItem(
            id: 'achievement-health',
            category: InsightCategory.achievement,
            kind: InsightKind.achievement,
            severity: InsightSeverity.achievement,
            title: 'Financial Wellness',
            body: 'Your health score is in the excellent range.',
            rankScore: 70,
            source: 'achievements',
          ),
        );
      }
    }

    return achievements.take(3).toList();
  }

  static InsightFeedItem _dailyTip(InsightsFeedInput input) {
    final tips = _personalizedTips(input);
    final day = DateTime.now().toUtc().day;
    final month = DateTime.now().toUtc().month;
    final topCat = input.trends.highestCategory?.categoryName ?? 'general';
    final index = (day * 31 + month + topCat.hashCode).abs() % tips.length;

    return InsightFeedItem(
      id: 'daily-tip',
      category: InsightCategory.tip,
      kind: InsightKind.tip,
      severity: InsightSeverity.info,
      title: 'Tip of the day',
      body: tips[index],
      icon: iconForInsightCategory(InsightCategory.tip),
      rankScore: 100,
      source: 'tips',
    );
  }

  static List<String> _personalizedTips(InsightsFeedInput input) {
    final top = input.trends.highestCategory?.categoryName.toLowerCase() ?? '';
    final base = [
      'Skipping one food delivery saves ₹12,000 annually.',
      'Paying subscriptions yearly could reduce costs by 10–15%.',
      'Maintaining an emergency fund equal to three months\' expenses improves financial resilience.',
      'Review recurring charges every salary cycle — small leaks add up.',
      'Set a "wait 24 hours" rule for purchases above your major expense threshold.',
      'Automate savings on salary day before discretionary spending begins.',
    ];

    if (top.contains('food')) {
      base.add('Meal planning one week ahead often cuts food delivery spend by 20%.');
    }
    if (top.contains('travel') || top.contains('transport')) {
      base.add('Booking travel early and tracking fuel spend helps avoid month-end surprises.');
    }
    if ((input.savingsRatePercent) >= 15) {
      base.add('Consider directing part of your strong savings rate toward a specific goal.');
    }
    if (input.subscriptions != null &&
        input.subscriptions!.incomeSharePercent >= 10) {
      base.add('Audit subscriptions quarterly — unused services are silent budget drains.');
    }

    return base;
  }

  static List<InsightFeedItem> _rankAndFilter(List<InsightFeedItem> items) {
    final seen = <String>{};
    final categoryCount = <InsightCategory, int>{};

    final sorted = [...items]
      ..sort((a, b) => b.rankScore.compareTo(a.rankScore));

    final result = <InsightFeedItem>[];
    for (final item in sorted) {
      if (item.kind == InsightKind.achievement) continue;
      if (item.kind == InsightKind.tip) continue;
      if (seen.contains(item.id)) continue;

      final catCount = categoryCount[item.category] ?? 0;
      if (catCount >= _maxPerCategory) continue;

      seen.add(item.id);
      categoryCount[item.category] = catCount + 1;
      result.add(item);
      if (result.length >= _maxFeedItems) break;
    }

    return result;
  }

  static InsightSeverity _safeSpendSeverity(SafeSpendRiskLevel risk) =>
      switch (risk) {
        SafeSpendRiskLevel.critical => InsightSeverity.critical,
        SafeSpendRiskLevel.elevated => InsightSeverity.warning,
        SafeSpendRiskLevel.watch => InsightSeverity.warning,
        SafeSpendRiskLevel.comfortable => InsightSeverity.opportunity,
        SafeSpendRiskLevel.onTrack => InsightSeverity.info,
        SafeSpendRiskLevel.noData => InsightSeverity.info,
      };
}
