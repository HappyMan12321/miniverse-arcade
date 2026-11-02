import { buildTopology } from "./topology";
import type {
  Difficulty,
  Direction,
  MazeCell,
  MazeDefinition,
  MazeShape,
} from "./types";
export function random(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function solution(
  maze: MazeDefinition,
  from = maze.startCellId,
  to = maze.exitCellId,
): string[] {
  const map = new Map(maze.cells.map((c) => [c.id, c])),
    parents = new Map<string, string | null>([[from, null]]),
    queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i];
    if (id === to) break;
    for (const next of map.get(id)!.passages)
      if (!parents.has(next)) {
        parents.set(next, id);
        queue.push(next);
      }
  }
  if (!parents.has(to)) return [];
  const result: string[] = [];
  for (let p: string | null = to; p !== null; p = parents.get(p) ?? null)
    result.push(p);
  return result.reverse();
}
export function generateMaze(
  shape: MazeShape,
  difficulty: Difficulty,
  seed: string,
): MazeDefinition {
  const cells = buildTopology(shape, difficulty),
    map = new Map(cells.map((c) => [c.id, c])),
    rng = random(seed),
    start = cells[0].id;
  const visited = new Set([start]),
    stack = [start];
  while (stack.length) {
    const current = map.get(stack[stack.length - 1])!,
      candidates = current.neighbors.filter((id) => !visited.has(id));
    if (!candidates.length) {
      stack.pop();
      continue;
    }
    const next = candidates[Math.floor(rng() * candidates.length)];
    current.passages.push(next);
    map.get(next)!.passages.push(current.id);
    visited.add(next);
    stack.push(next);
  }
  const queue = [start],
    distance = new Map([[start, 0]]);
  for (let i = 0; i < queue.length; i++)
    for (const next of map.get(queue[i])!.passages)
      if (!distance.has(next)) {
        distance.set(next, distance.get(queue[i])! + 1);
        queue.push(next);
      }
  const boundary = cells.filter(
    (c) =>
      c.neighbors.length <
      (shape === "square"
        ? 4
        : shape === "triangle"
          ? 3
          : shape === "hexagon"
            ? 6
            : 4),
  );
  const exit = (
    shape === "circle"
      ? cells.filter(
          (c) =>
            c.geometry.kind === "radial" &&
            c.geometry.ring ===
              Math.max(
                ...cells.map((c) =>
                  c.geometry.kind === "radial" ? c.geometry.ring : 0,
                ),
              ),
        )
      : boundary
  ).reduce(
    (best, c) => (distance.get(c.id)! > distance.get(best.id)! ? c : best),
    cells[0],
  ).id;
  const points = cells.flatMap((c) =>
    c.geometry.kind === "polygon" ? c.geometry.points : [],
  );
  const radius =
    shape === "circle"
      ? Math.max(
          ...cells.map((c) =>
            c.geometry.kind === "radial" ? c.geometry.ring + 1 : 0,
          ),
        )
      : 0;
  const minX = radius ? -radius : Math.min(...points.map((p) => p.x)),
    maxX = radius ? radius : Math.max(...points.map((p) => p.x));
  const minY = radius ? -radius : Math.min(...points.map((p) => p.y)),
    maxY = radius ? radius : Math.max(...points.map((p) => p.y));
  return {
    id: `${shape}-${difficulty}-${seed}`,
    shape,
    difficulty,
    cells,
    startCellId: start,
    exitCellId: exit,
    seed,
    bounds: {
      x: minX - 0.25,
      y: minY - 0.25,
      width: maxX - minX + 0.5,
      height: maxY - minY + 0.5,
    },
  };
}
const vectors: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
  nw: [-Math.sqrt(3) / 2, -0.5],
  ne: [Math.sqrt(3) / 2, -0.5],
  sw: [-Math.sqrt(3) / 2, 0.5],
  se: [Math.sqrt(3) / 2, 0.5],
};
export function movementTarget(
  maze: MazeDefinition,
  id: string,
  direction: Direction,
): string | null {
  const cell = maze.cells.find((c) => c.id === id)!;
  if (cell.geometry.kind === "radial") {
    const g = cell.geometry;
    // At a split ring, only a genuinely open outward passage is eligible.
    const neighbors = maze.cells.filter((c) => cell.neighbors.includes(c.id));
    let candidates: MazeCell[] = [];
    if (direction === "up")
      candidates = neighbors.filter(
        (c) => c.geometry.kind === "radial" && c.geometry.ring < g.ring,
      );
    if (direction === "down" || direction === "sw" || direction === "se")
      candidates = neighbors
        .filter((c) => c.geometry.kind === "radial" && c.geometry.ring > g.ring)
        .sort((a, b) =>
          a.geometry.kind === "radial" && b.geometry.kind === "radial"
            ? a.geometry.sector - b.geometry.sector
            : 0,
        );
    if (direction === "right")
      candidates = neighbors.filter(
        (c) =>
          c.geometry.kind === "radial" &&
          c.geometry.ring === g.ring &&
          c.geometry.sector === (g.sector + 1) % g.count,
      );
    if (direction === "left")
      candidates = neighbors.filter(
        (c) =>
          c.geometry.kind === "radial" &&
          c.geometry.ring === g.ring &&
          c.geometry.sector === (g.sector - 1 + g.count) % g.count,
      );
    const open = candidates.filter((c) => cell.passages.includes(c.id));
    return (direction === "se" ? open.at(-1) : open[0])?.id ?? null;
  }
  if (maze.shape === "hexagon" && (direction === "up" || direction === "down"))
    return null;
  const hexVectors: Partial<Record<Direction, [number, number]>> = {
    nw: [-0.5, -Math.sqrt(3) / 2],
    ne: [0.5, -Math.sqrt(3) / 2],
    sw: [-0.5, Math.sqrt(3) / 2],
    se: [0.5, Math.sqrt(3) / 2],
  };
  const [vx, vy] =
    (maze.shape === "hexagon" ? hexVectors[direction] : undefined) ??
    vectors[direction];
  let best: string | null = null,
    bestDot = 0.7;
  for (const next of cell.neighbors) {
    const p = maze.cells.find((c) => c.id === next)!.geometry.center,
      dx = p.x - cell.geometry.center.x,
      dy = p.y - cell.geometry.center.y;
    const dot = (dx * vx + dy * vy) / Math.hypot(dx, dy);
    if (dot > bestDot) {
      bestDot = dot;
      best = next;
    }
  }
  return best && cell.passages.includes(best) ? best : null;
}
export function validateMaze(maze: MazeDefinition): string[] {
  const errors: string[] = [],
    map = new Map(maze.cells.map((c) => [c.id, c]));
  if (map.size !== maze.cells.length) errors.push("Duplicate cell IDs");
  if (!map.has(maze.startCellId) || !map.has(maze.exitCellId))
    errors.push("Missing start or exit");
  for (const cell of maze.cells) {
    for (const id of cell.neighbors)
      if (!map.get(id)?.neighbors.includes(cell.id))
        errors.push("Invalid neighbor");
    for (const id of cell.passages)
      if (
        !cell.neighbors.includes(id) ||
        !map.get(id)?.passages.includes(cell.id)
      )
        errors.push("Invalid passage");
  }
  if (!errors.length) {
    const seen = new Set([maze.startCellId]),
      queue = [maze.startCellId];
    for (let i = 0; i < queue.length; i++)
      for (const n of map.get(queue[i])!.passages)
        if (!seen.has(n)) {
          seen.add(n);
          queue.push(n);
        }
    if (seen.size !== map.size) errors.push("Disconnected maze");
  }
  return errors;
}
