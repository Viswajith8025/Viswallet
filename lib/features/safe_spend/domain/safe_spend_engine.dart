import 'package:rupee_track/core/salary_cycle/salary_cycle_engine.dart';
import 'package:rupee_track/core/utils/money_utils.dart';
import 'package:rupee_track/features/safe_spend/domain/safe_spend_snapshot.dart';

/// Intelligent daily spending recommendations — pure logic, no UI.
abstract final class SafeSpendEngine {
  static SafeSpendSnapshot compute({
    required String cycleKey,
    required int salaryPaise,
    required int carryOverPaise,
    required int cycleSpentPaise,
    required int todaySpentPaise,
    required int salaryDay,
    int extraIncomePaise = 0,
    DateTime? now,
  }) {
    final reference = now ?? DateTime.now();
    final bounds = SalaryCycleEngine.cycleBounds(cycleKey, salaryDay: salaryDay);
    final today = SalaryCycleEngine.istDateOnly(reference);
    final daysRemaining = bounds.containsIstDate(today)
        ? bounds.endIst.difference(today).inDays + 1
        : 0;
    final daysElapsed = bounds.containsIstDate(today)
        ? today.difference(bounds.startIst).inDays + 1
        : bounds.totalDays;

    final moneyLeft = SalaryCycleEngine.effectiveMoneyLeft(
      salaryPaise: salaryPaise,
      spentPaise: cycleSpentPaise,
      carryOverPaise: carryOverPaise,
      extraIncomePaise: extraIncomePaise,
    );

    if (salaryPaise <= 0 && extraIncomePaise <= 0) {
      return _noDataSnapshot(
        cycleKey: cycleKey,
        daysRemaining: daysRemaining,
        daysElapsed: daysElapsed,
      );
    }

    final safeDaily = SalaryCycleEngine.dailySpendingAllowance(
      moneyLeftPaise: moneyLeft,
      daysRemaining: daysRemaining,
    );
    final remainingToday = safeDaily - todaySpentPaise;
    final usagePercent =
        safeDaily > 0 ? (todaySpentPaise / safeDaily) * 100 : 0.0;

    final projection = _project(
      moneyLeftPaise: moneyLeft,
      cycleSpentPaise: cycleSpentPaise,
      daysElapsed: daysElapsed,
      daysRemaining: daysRemaining,
      totalCycleDays: bounds.totalDays,
      cycleEndIst: bounds.endIst,
      today: today,
      salaryPaise: salaryPaise,
      carryOverPaise: carryOverPaise,
      extraIncomePaise: extraIncomePaise,
    );

    final risk = _riskLevel(
      moneyLeftPaise: moneyLeft,
      safeDailyLimitPaise: safeDaily,
      todaySpentPaise: todaySpentPaise,
      usagePercent: usagePercent,
      projection: projection,
    );

    final messages = _messages(
      risk: risk,
      safeDaily: safeDaily,
      todaySpent: todaySpentPaise,
      remainingToday: remainingToday,
      moneyLeft: moneyLeft,
      projection: projection,
      daysRemaining: daysRemaining,
    );

    return SafeSpendSnapshot(
      cycleKey: cycleKey,
      moneyLeftPaise: moneyLeft,
      daysRemainingInCycle: daysRemaining,
      daysElapsedInCycle: daysElapsed,
      safeDailyLimitPaise: safeDaily,
      todaySpentPaise: todaySpentPaise,
      remainingSafeSpendTodayPaise: remainingToday,
      todayUsagePercent: usagePercent,
      riskLevel: risk,
      headline: messages.$1,
      recommendation: messages.$2,
      projection: projection,
    );
  }

  static SafeSpendProjection _project({
    required int moneyLeftPaise,
    required int cycleSpentPaise,
    required int daysElapsed,
    required int daysRemaining,
    required int totalCycleDays,
    required DateTime cycleEndIst,
    required DateTime today,
    required int salaryPaise,
    required int carryOverPaise,
    required int extraIncomePaise,
  }) {
    final elapsed = daysElapsed.clamp(1, totalCycleDays);
    final avgDaily = (cycleSpentPaise / elapsed).round();
    final projectedSpend = (avgDaily * totalCycleDays).round();
    final totalBudget = salaryPaise + carryOverPaise + extraIncomePaise;
    final expectedBalance = totalBudget - projectedSpend;

    DateTime? lastsUntil;
    if (avgDaily <= 0) {
      lastsUntil = cycleEndIst;
    } else if (moneyLeftPaise <= 0) {
      lastsUntil = today;
    } else {
      final daysUntilEmpty = (moneyLeftPaise / avgDaily).ceil();
      lastsUntil = today.add(Duration(days: daysUntilEmpty - 1));
      if (lastsUntil.isAfter(cycleEndIst)) {
        lastsUntil = cycleEndIst;
      }
    }

    final reductionNeeded = expectedBalance < 0 && daysRemaining > 0
        ? ((-expectedBalance) / daysRemaining).ceil()
        : 0;

    return SafeSpendProjection(
      averageDailySpendPaise: avgDaily,
      moneyLastsUntilIst: lastsUntil,
      expectedEndOfCycleBalancePaise: expectedBalance,
      dailyReductionNeededPaise: reductionNeeded,
      projectedCycleSpendPaise: projectedSpend,
    );
  }

  static SafeSpendRiskLevel _riskLevel({
    required int moneyLeftPaise,
    required int safeDailyLimitPaise,
    required int todaySpentPaise,
    required double usagePercent,
    required SafeSpendProjection projection,
  }) {
    if (moneyLeftPaise < 0 || projection.expectsShortage) {
      return SafeSpendRiskLevel.critical;
    }
    if (safeDailyLimitPaise <= 0 && moneyLeftPaise <= 0) {
      return SafeSpendRiskLevel.critical;
    }
    if (usagePercent >= 200) return SafeSpendRiskLevel.critical;
    if (usagePercent >= 150) return SafeSpendRiskLevel.elevated;
    if (usagePercent >= 100) return SafeSpendRiskLevel.watch;
    if (usagePercent >= 75) return SafeSpendRiskLevel.comfortable;
    return SafeSpendRiskLevel.onTrack;
  }

  static (String, String?) _messages({
    required SafeSpendRiskLevel risk,
    required int safeDaily,
    required int todaySpent,
    required int remainingToday,
    required int moneyLeft,
    required SafeSpendProjection projection,
    required int daysRemaining,
  }) {
    if (safeDaily <= 0 && moneyLeft <= 0) {
      return (
        'Your cycle balance is tight right now.',
        'A lighter spending day would help things feel more comfortable.',
      );
    }

    if (todaySpent == 0 && safeDaily > 0) {
      return (
        'You can safely spend ${formatPaise(safeDaily)} today.',
        _projectionHint(projection, daysRemaining),
      );
    }

    if (remainingToday > 0 && risk == SafeSpendRiskLevel.onTrack) {
      return (
        'You can safely spend ${formatPaise(remainingToday)} more today.',
        _projectionHint(projection, daysRemaining),
      );
    }

    if (remainingToday > 0 && risk == SafeSpendRiskLevel.comfortable) {
      return (
        'You\'re on track — ${formatPaise(remainingToday)} left of today\'s ${formatPaise(safeDaily)} guide.',
        _projectionHint(projection, daysRemaining),
      );
    }

    if (todaySpent >= safeDaily * 2 && safeDaily > 0) {
      return (
        'You have spent tomorrow\'s budget.',
        projection.dailyReductionNeededPaise > 0
            ? 'Pacing ${formatPaise(projection.dailyReductionNeededPaise)} lighter per day for the next $daysRemaining days keeps you balanced.'
            : 'Tomorrow is a fresh start — a calmer day brings things back in range.',
      );
    }

    if (todaySpent > safeDaily && safeDaily > 0) {
      return (
        'Today\'s spending is above your ${formatPaise(safeDaily)} guide.',
        projection.dailyReductionNeededPaise > 0
            ? 'You need to reduce daily spending by ${formatPaise(projection.dailyReductionNeededPaise)}.'
            : 'A slightly lighter day tomorrow keeps your cycle on track.',
      );
    }

    return (
      'You can safely spend ${formatPaise(safeDaily)} today.',
      _projectionHint(projection, daysRemaining),
    );
  }

  static String? _projectionHint(
    SafeSpendProjection projection,
    int daysRemaining,
  ) {
    if (projection.averageDailySpendPaise <= 0) {
      return 'Steady pace so far — you\'re building room to save.';
    }
    if (projection.expectsSavings) {
      return 'At this pace, you could save about ${formatPaise(projection.expectedEndOfCycleBalancePaise)} by cycle end.';
    }
    if (projection.expectsShortage && daysRemaining > 0) {
      return 'At this pace, adjust by ${formatPaise(projection.dailyReductionNeededPaise)}/day to finish the cycle comfortably.';
    }
    return null;
  }

  static SafeSpendSnapshot _noDataSnapshot({
    required String cycleKey,
    required int daysRemaining,
    required int daysElapsed,
  }) {
    const emptyProjection = SafeSpendProjection(
      averageDailySpendPaise: 0,
      expectedEndOfCycleBalancePaise: 0,
      dailyReductionNeededPaise: 0,
      projectedCycleSpendPaise: 0,
    );
    return SafeSpendSnapshot(
      cycleKey: cycleKey,
      moneyLeftPaise: 0,
      daysRemainingInCycle: daysRemaining,
      daysElapsedInCycle: daysElapsed,
      safeDailyLimitPaise: 0,
      todaySpentPaise: 0,
      remainingSafeSpendTodayPaise: 0,
      todayUsagePercent: 0,
      riskLevel: SafeSpendRiskLevel.noData,
      headline: 'Set your salary to unlock safe spending guidance.',
      recommendation: null,
      projection: emptyProjection,
    );
  }
}
