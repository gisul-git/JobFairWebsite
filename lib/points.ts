export const MAX_POINTS = 100;
export const FUNNEL_COMPLETION_STEPS = 7; // page steps completed from 1 -> 8

export function getPointsForStep(step: number): number {
  if (step <= 1) return 0;
  if (step >= 8) return MAX_POINTS;
  const completedSteps = step - 1;
  return Math.round((completedSteps / FUNNEL_COMPLETION_STEPS) * MAX_POINTS);
}

