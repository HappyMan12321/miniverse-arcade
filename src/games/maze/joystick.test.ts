import { describe, it, expect } from "vitest";
import { generateMaze } from "./engine";
import { clampJoystick, joystickTarget, JOYSTICK_TRAVEL } from "./joystick";
import { difficulties, shapes } from "./topology";
describe("joystick steering", () => {
  it("clamps the handle to the base and has a neutral dead zone", () => {
    expect(clampJoystick(0, 0)).toEqual({ x: 0, y: 0 });
    expect(clampJoystick(JOYSTICK_TRAVEL, 0)).toEqual({ x: 1, y: 0 });
    expect(Math.hypot(...Object.values(clampJoystick(100, 100)))).toBeCloseTo(
      1,
    );
    const m = generateMaze("square", "easy", "neutral");
    expect(joystickTarget(m, m.startCellId, { x: 0.1, y: 0 })).toBeNull();
  });
  for (const shape of shapes)
    it(`${shape}: points toward actual on-screen neighbors and never redirects around walls`, () => {
      for (const difficulty of difficulties) {
        const m = generateMaze(shape, difficulty, "joystick-neighbors");
        for (const cell of m.cells)
          for (const id of cell.neighbors) {
            const p = m.cells.find((c) => c.id === id)!.geometry.center,
              dx = p.x - cell.geometry.center.x,
              dy = p.y - cell.geometry.center.y,
              length = Math.hypot(dx, dy);
            expect(
              joystickTarget(m, cell.id, { x: dx / length, y: dy / length }),
            ).toBe(cell.passages.includes(id) ? id : null);
          }
      }
    });
  it("does not slide along an outside wall when pushed out of the board", () => {
    const m = generateMaze("square", "easy", "boundary");
    const c = m.cells.find((c) => c.id === "0,0")!;
    c.passages = ["1,0"];
    expect(joystickTarget(m, c.id, { x: 0, y: -1 })).toBeNull();
    expect(joystickTarget(m, c.id, { x: 1, y: -1 })).toBeNull();
    expect(joystickTarget(m, c.id, { x: 1, y: 0 })).toBe("1,0");
  });
  it("requires deliberate steering at radial forks, including a walled branch", () => {
    const m = generateMaze("circle", "easy", "fork"),
      c = m.cells.find((c) => c.id === "1:0")!,
      p = c.geometry.center;
    const out = {
      x: p.x / Math.hypot(p.x, p.y),
      y: p.y / Math.hypot(p.x, p.y),
    };
    c.passages = ["2:0", "2:1"];
    expect(joystickTarget(m, c.id, out)).toBeNull();
    for (const target of c.passages) {
      const n = m.cells.find((c) => c.id === target)!,
        dx = n.geometry.center.x - p.x,
        dy = n.geometry.center.y - p.y;
      expect(joystickTarget(m, c.id, { x: dx, y: dy })).toBe(target);
    }
    c.passages = ["2:1"];
    const blocked = m.cells.find((c) => c.id === "2:0")!;
    expect(
      joystickTarget(m, c.id, {
        x: blocked.geometry.center.x - p.x,
        y: blocked.geometry.center.y - p.y,
      }),
    ).toBeNull();
    expect(joystickTarget(m, c.id, out)).toBeNull();
  });
});
