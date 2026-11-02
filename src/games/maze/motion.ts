import type { Point } from "./types";
export const STEP_DURATION = 140;
export interface MotionStep {
  id: number;
  mazeId: string;
  fromCellId: string;
  toCellId: string;
  from: Point;
  to: Point;
  startedAt: number;
  duration: number;
}
export function motionProgress(step: MotionStep, now: number) {
  return Math.max(
    0,
    Math.min(1, (now - step.startedAt) / Math.max(1, step.duration)),
  );
}
export function interpolateMotion(step: MotionStep, now: number): Point {
  const t = motionProgress(step, now);
  return {
    x: step.from.x + (step.to.x - step.from.x) * t,
    y: step.from.y + (step.to.y - step.from.y) * t,
  };
}
/** Deflection changes the next step's speed; each individual segment stays linear. */
export function joystickStepDuration(strength: number) {
  return STEP_DURATION / (0.5 + 0.5 * Math.max(0, Math.min(1, strength)));
}
