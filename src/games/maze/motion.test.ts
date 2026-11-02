import { describe, it, expect } from "vitest";
import {
  interpolateMotion,
  motionProgress,
  joystickStepDuration,
  STEP_DURATION,
  type MotionStep,
} from "./motion";
import { generateMaze } from "./engine";
import { shapes } from "./topology";
import type { CellGeometry, Point } from "./types";
const frame: MotionStep = {
  id: 1,
  mazeId: "test",
  fromCellId: "a",
  toCellId: "b",
  from: { x: 2, y: 3 },
  to: { x: 6, y: 7 },
  startedAt: 100,
  duration: STEP_DURATION,
};
function contains(g: CellGeometry, p: Point) {
  if (g.kind === "polygon") {
    const sides = g.points.map((a, i) => {
      const b = g.points[(i + 1) % g.points.length];
      return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    });
    return sides.every((v) => v >= -1e-7) || sides.every((v) => v <= 1e-7);
  }
  const radius = Math.hypot(p.x, p.y);
  if (g.ring === 0) return radius <= 1 + 1e-7;
  if (radius < g.ring - 1e-7 || radius > g.ring + 1 + 1e-7) return false;
  const center = ((g.sector + 0.5) * 2 * Math.PI) / g.count - Math.PI / 2,
    diff = Math.atan2(
      Math.sin(Math.atan2(p.y, p.x) - center),
      Math.cos(Math.atan2(p.y, p.x) - center),
    );
  return Math.abs(diff) <= Math.PI / g.count + 1e-7;
}
describe("linear movement", () => {
  it("interpolates at constant progress without ease, overshoot, or jumps", () => {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const now = frame.startedAt + frame.duration * t;
      expect(motionProgress(frame, now)).toBeCloseTo(t);
      expect(interpolateMotion(frame, now)).toEqual({
        x: 2 + 4 * t,
        y: 3 + 4 * t,
      });
    }
    expect(interpolateMotion(frame, 0)).toEqual(frame.from);
    expect(interpolateMotion(frame, 10000)).toEqual(frame.to);
  });
  it("uses a bounded, slower pace near the center of the joystick", () => {
    expect(joystickStepDuration(1)).toBe(STEP_DURATION);
    expect(joystickStepDuration(0.3)).toBeGreaterThan(STEP_DURATION);
    expect(joystickStepDuration(10)).toBe(STEP_DURATION);
    expect(joystickStepDuration(0)).toBe(STEP_DURATION * 2);
  });
  for (const shape of shapes)
    it(`${shape}: interpolated positions remain inside the two connected cells`, () => {
      const m = generateMaze(shape, "medium", "linear-walls");
      for (const c of m.cells)
        for (const id of c.passages) {
          const n = m.cells.find((c) => c.id === id)!;
          const step = {
            ...frame,
            from: c.geometry.center,
            to: n.geometry.center,
          };
          for (const t of [0.1, 0.25, 0.5, 0.75, 0.9]) {
            const p = interpolateMotion(
              step,
              frame.startedAt + t * frame.duration,
            );
            expect(
              contains(c.geometry, p) || contains(n.geometry, p),
              `${c.id} -> ${id}, t=${t}`,
            ).toBe(true);
          }
        }
    });
});
