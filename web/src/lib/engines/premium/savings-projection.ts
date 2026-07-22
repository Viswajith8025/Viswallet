import { addMonths, differenceInMonths, format } from "date-fns";

export type SavingsProjection = {
  monthsToTarget: number;
  projectedDate: Date;
  projectedAmountPaise: number;
  onTrack: boolean;
  monthlyNeededPaise: number;
  milestones: { month: number; amountPaise: number; label: string }[];
};

export function projectSavingsGoal(
  savedPaise: number,
  targetPaise: number,
  monthlyContributionPaise: number,
  targetDate?: Date,
): SavingsProjection {
  const remaining = Math.max(0, targetPaise - savedPaise);
  const monthsToTarget =
    monthlyContributionPaise > 0 ? Math.ceil(remaining / monthlyContributionPaise) : 999;
  const projectedDate = addMonths(new Date(), monthsToTarget);
  const projectedAmountPaise = savedPaise + monthlyContributionPaise * monthsToTarget;

  let onTrack = true;
  let monthlyNeededPaise = monthlyContributionPaise;
  if (targetDate) {
    const monthsLeft = Math.max(1, differenceInMonths(targetDate, new Date()));
    monthlyNeededPaise = Math.ceil(remaining / monthsLeft);
    onTrack = monthlyContributionPaise >= monthlyNeededPaise;
  }

  const milestones: SavingsProjection["milestones"] = [];
  for (let m = 1; m <= Math.min(monthsToTarget, 12); m++) {
    milestones.push({
      month: m,
      amountPaise: savedPaise + monthlyContributionPaise * m,
      label: format(addMonths(new Date(), m), "MMM yy"),
    });
  }

  return {
    monthsToTarget,
    projectedDate,
    projectedAmountPaise,
    onTrack,
    monthlyNeededPaise,
    milestones,
  };
}
