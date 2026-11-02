import { describe, it, expect } from "vitest";
import { generateMaze, movementTarget, solution, validateMaze } from "./engine";
import { difficulties, shapes, edgeKey } from "./topology";
import type { Direction } from "./types";
describe("Square foundation", () => {
  it("has a deterministic connected spanning tree and respects every wall", () => {
    const maze = generateMaze("square", "easy", "foundation");
    expect(validateMaze(maze)).toEqual([]);
    expect(maze.cells).toHaveLength(25);
    expect(generateMaze("square", "easy", "foundation")).toEqual(maze);
    for (const c of maze.cells)
      for (const direction of ["up", "down", "left", "right"] as Direction[]) {
        const target = movementTarget(maze, c.id, direction);
        if (target) expect(c.passages).toContain(target);
      }
  });
});
describe.each(shapes)("%s topology", (shape) => {
  for (const difficulty of difficulties)
    it(`${difficulty}: 20 seeded mazes are valid and navigable`, () => {
      for (let seed = 0; seed < 20; seed++) {
        const maze = generateMaze(shape, difficulty, `test-${seed}`);
        expect(validateMaze(maze)).toEqual([]);
        expect(maze.cells.reduce((n, c) => n + c.passages.length, 0)).toBe(
          2 * (maze.cells.length - 1),
        );
        const path = solution(maze);
        expect(path[0]).toBe(maze.startCellId);
        expect(path.at(-1)).toBe(maze.exitCellId);
        const dirs: Direction[] = [
          "up",
          "down",
          "left",
          "right",
          "nw",
          "ne",
          "sw",
          "se",
        ];
        for (const cell of maze.cells) {
          expect(new Set(cell.neighbors).size).toBe(cell.neighbors.length);
          for (const next of cell.passages)
            expect(
              dirs.some((d) => movementTarget(maze, cell.id, d) === next),
            ).toBe(true);
          if (cell.geometry.kind === "polygon")
            for (const neighbor of cell.neighbors) {
              const g = maze.cells.find((c) => c.id === neighbor)!.geometry;
              if (g.kind !== "polygon") throw Error("Wrong geometry");
              const edges = cell.geometry.points.map((p, i) =>
                edgeKey(
                  p,
                  cell.geometry.kind === "polygon"
                    ? cell.geometry.points[
                        (i + 1) % cell.geometry.points.length
                      ]
                    : p,
                ),
              );
              expect(
                g.points.some((p, i) =>
                  edges.includes(
                    edgeKey(p, g.points[(i + 1) % g.points.length]),
                  ),
                ),
              ).toBe(true);
            }
        }
      }
    });
});
it("detects invalid graph references", () => {
  const m = generateMaze("square", "easy", "bad");
  m.cells[0].passages.push("missing");
  expect(validateMaze(m)).toContain("Invalid passage");
});
