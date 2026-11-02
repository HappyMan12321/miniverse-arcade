import { describe, it, expect } from "vitest";
import { generateMaze, movementTarget } from "./engine";
import type { Direction } from "./types";
describe("radial branch direction regressions", () => {
  it("does not substitute the clockwise branch for a walled counterclockwise branch", () => {
    const m = generateMaze("circle", "easy", "fork");
    const c = m.cells.find((c) => c.id === "1:0")!;
    c.passages = ["2:1"];
    expect(movementTarget(m, c.id, "sw")).toBeNull();
    expect(movementTarget(m, c.id, "se")).toBe("2:1");
    expect(movementTarget(m, c.id, "down")).toBe("2:1");
  });
  it("requires an explicit branch when both outward passages are open", () => {
    const m = generateMaze("circle", "easy", "fork");
    const c = m.cells.find((c) => c.id === "1:0")!;
    c.passages = ["2:0", "2:1"];
    expect(movementTarget(m, c.id, "down")).toBeNull();
    expect(movementTarget(m, c.id, "sw")).toBe("2:0");
    expect(movementTarget(m, c.id, "se")).toBe("2:1");
  });
  it("does not substitute the counterclockwise branch for a walled clockwise branch", () => {
    const m = generateMaze("circle", "easy", "fork");
    const c = m.cells.find((c) => c.id === "1:0")!;
    c.passages = ["2:0"];
    expect(movementTarget(m, c.id, "se")).toBeNull();
    expect(movementTarget(m, c.id, "sw")).toBe("2:0");
  });
});
describe("hexagon geometry", () => {
  it("maps each of the six displayed directions to its axial neighbor", () => {
    const m = generateMaze("hexagon", "easy", "six"),
      c = m.cells.find((c) => c.id === "0,0")!;
    c.passages = [...c.neighbors];
    const targets: Partial<Record<Direction, string>> = {
      left: "-1,0",
      right: "1,0",
      nw: "0,-1",
      ne: "1,-1",
      sw: "-1,1",
      se: "0,1",
    };
    for (const [d, id] of Object.entries(targets))
      expect(movementTarget(m, c.id, d as Direction)).toBe(id);
    expect(movementTarget(m, c.id, "up")).toBeNull();
    expect(movementTarget(m, c.id, "down")).toBeNull();
  });
});

import { mazeControls, directionForKey } from "./controls";
import { difficulties } from "./topology";
describe("keyboard and displayed controls stay synchronized", () => {
  it("uses Q/E, A/D, Z/C for hexagons, preserving W/X and horizontal arrows", () => {
    const m = generateMaze("hexagon", "easy", "keys");
    const expected: Record<string, Direction> = {
      q: "nw",
      e: "ne",
      w: "ne",
      a: "left",
      arrowleft: "left",
      d: "right",
      arrowright: "right",
      z: "sw",
      c: "se",
      x: "se",
    };
    for (const [key, d] of Object.entries(expected))
      expect(directionForKey(m, m.startCellId, key)).toBe(d);
    expect(directionForKey(m, m.startCellId, "ArrowUp")).toBeNull();
    expect(directionForKey(m, m.startCellId, "ArrowDown")).toBeNull();
    expect(directionForKey(m, m.startCellId, " ")).toBeUndefined();
  });
  it("keeps the circle control order and slots unchanged at forks", () => {
    const m = generateMaze("circle", "medium", "slots");
    const layout = mazeControls(m, m.startCellId).map((c) => c.direction);
    for (const cell of m.cells)
      expect(mazeControls(m, cell.id).map((c) => c.direction)).toEqual(layout);
  });
  for (const shape of ["circle", "hexagon"] as const)
    it(`${shape}: every passage can be taken by a visible control and its displayed keyboard key`, () => {
      for (const difficulty of difficulties)
        for (let seed = 0; seed < 10; seed++) {
          const m = generateMaze(shape, difficulty, `control-${seed}`);
          for (const cell of m.cells) {
            const controls = mazeControls(m, cell.id).filter((c) => c.visible);
            for (const id of cell.passages) {
              const command = controls.find((c) => c.target === id);
              expect(command, `${cell.id} -> ${id}`).toBeDefined();
              expect(directionForKey(m, cell.id, command!.keys[0])).toBe(
                command!.direction,
              );
            }
            for (const c of controls)
              if (c.target) expect(cell.passages).toContain(c.target);
          }
        }
    });
  it("keeps wraparound clockwise and counterclockwise directions consistent", () => {
    const m = generateMaze("circle", "easy", "wrap");
    const c = m.cells.find((c) => c.id === "1:7")!;
    c.passages = ["1:0", "1:6"];
    expect(movementTarget(m, c.id, "right")).toBe("1:0");
    expect(movementTarget(m, c.id, "left")).toBe("1:6");
  });
});
