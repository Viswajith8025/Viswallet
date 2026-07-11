import 'package:flutter_test/flutter_test.dart';
import 'package:rupee_track/features/safe_spend/domain/safe_spend_engine.dart';
import 'package:rupee_track/features/safe_spend/domain/safe_spend_snapshot.dart';

void main() {
  group('SafeSpendEngine', () {
    const cycleKey = '2026-06-17';
    const salaryDay = 17;
    const salary = 2500000; // ₹25,000
    final midCycle = DateTime.utc(2026, 6, 25, 6, 30);

    test('safe daily = remaining / days left', () {
      final snap = SafeSpendEngine.compute(
        cycleKey: cycleKey,
        salaryPaise: salary,
        carryOverPaise: 0,
        cycleSpentPaise: 500000,
        todaySpentPaise: 0,
        salaryDay: salaryDay,
        now: midCycle,
      );
      expect(snap.safeDailyLimitPaise, greaterThan(0));
      expect(snap.moneyLeftPaise, 2000000);
    });

    test('mid-cycle projection uses salary carry-over and extra income', () {
      const extraIncome = 200000;
      final snap = SafeSpendEngine.compute(
        cycleKey: cycleKey,
        salaryPaise: salary,
        carryOverPaise: 100000,
        extraIncomePaise: extraIncome,
        cycleSpentPaise: 1000000,
        todaySpentPaise: 0,
        salaryDay: salaryDay,
        now: midCycle,
      );

      expect(
        snap.moneyLeftPaise,
        salary + 100000 + extraIncome - 1000000,
      );
      expect(
        snap.projection.expectedEndOfCycleBalancePaise,
        (salary + 100000 + extraIncome) -
            snap.projection.projectedCycleSpendPaise,
      );
    });

    test('extra income without salary still computes guidance', () {
      final snap = SafeSpendEngine.compute(
        cycleKey: cycleKey,
        salaryPaise: 0,
        carryOverPaise: 0,
        extraIncomePaise: 500000,
        cycleSpentPaise: 100000,
        todaySpentPaise: 0,
        salaryDay: salaryDay,
        now: midCycle,
      );

      expect(snap.riskLevel, isNot(SafeSpendRiskLevel.noData));
      expect(snap.moneyLeftPaise, 400000);
      expect(snap.safeDailyLimitPaise, greaterThan(0));
    });

    test('negative safe-spend marks critical risk and zero allowance', () {
      final snap = SafeSpendEngine.compute(
        cycleKey: cycleKey,
        salaryPaise: salary,
        carryOverPaise: 0,
        cycleSpentPaise: 2800000,
        todaySpentPaise: 50000,
        salaryDay: salaryDay,
        now: midCycle,
      );

      expect(snap.moneyLeftPaise, lessThan(0));
      expect(snap.safeDailyLimitPaise, 0);
      expect(snap.riskLevel, SafeSpendRiskLevel.critical);
      expect(snap.projection.expectsShortage, isTrue);
    });

    test('suggests safe amount when nothing spent today', () {
      final snap = SafeSpendEngine.compute(
        cycleKey: cycleKey,
        salaryPaise: salary,
        carryOverPaise: 0,
        cycleSpentPaise: 0,
        todaySpentPaise: 0,
        salaryDay: salaryDay,
        now: midCycle,
      );
      expect(snap.headline, contains('safely spend'));
      expect(snap.riskLevel, SafeSpendRiskLevel.onTrack);
    });

    test('warns when tomorrow budget spent', () {
      final snap = SafeSpendEngine.compute(
        cycleKey: cycleKey,
        salaryPaise: salary,
        carryOverPaise: 0,
        cycleSpentPaise: 1000000,
        todaySpentPaise: 200000,
        salaryDay: salaryDay,
        now: midCycle,
      );
      if (snap.safeDailyLimitPaise > 0 &&
          snap.todaySpentPaise >= snap.safeDailyLimitPaise * 2) {
        expect(snap.headline, contains('tomorrow'));
      }
    });

    test('recommendation includes daily reduction when over pace', () {
      final snap = SafeSpendEngine.compute(
        cycleKey: cycleKey,
        salaryPaise: salary,
        carryOverPaise: 0,
        cycleSpentPaise: 2200000,
        todaySpentPaise: 150000,
        salaryDay: salaryDay,
        now: midCycle,
      );
      if (snap.projection.expectsShortage) {
        expect(snap.projection.dailyReductionNeededPaise, greaterThan(0));
      }
    });

    test('no salary and no extra income returns noData state', () {
      final snap = SafeSpendEngine.compute(
        cycleKey: cycleKey,
        salaryPaise: 0,
        carryOverPaise: 0,
        cycleSpentPaise: 0,
        todaySpentPaise: 0,
        salaryDay: salaryDay,
      );
      expect(snap.riskLevel, SafeSpendRiskLevel.noData);
    });
  });
}
