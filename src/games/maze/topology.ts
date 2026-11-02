import type {
  CellGeometry,
  Difficulty,
  MazeCell,
  MazeShape,
  Point,
} from "./types";
export const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert"];
export const shapes: MazeShape[] = ["square", "triangle", "hexagon", "circle"];
const root3 = Math.sqrt(3);
export const pointKey = (p: Point) =>
  `${Math.round(p.x * 1e5)},${Math.round(p.y * 1e5)}`;
export const edgeKey = (a: Point, b: Point) =>
  [pointKey(a), pointKey(b)].sort().join("|");
function cell(id: string, geometry: CellGeometry): MazeCell {
  return { id, geometry, neighbors: [], passages: [] };
}
function polygon(id: string, points: Point[], row: number, column: number) {
  return cell(id, {
    kind: "polygon",
    points,
    row,
    column,
    center: {
      x: points.reduce((s, p) => s + p.x, 0) / points.length,
      y: points.reduce((s, p) => s + p.y, 0) / points.length,
    },
  });
}
export function connect(a: MazeCell, b: MazeCell) {
  if (!a.neighbors.includes(b.id)) a.neighbors.push(b.id);
  if (!b.neighbors.includes(a.id)) b.neighbors.push(a.id);
}
export function buildTopology(
  shape: MazeShape,
  difficulty: Difficulty,
): MazeCell[] {
  const level = difficulties.indexOf(difficulty);
  const cells: MazeCell[] = [];
  if (shape === "square") {
    const n = [5, 9, 13, 18][level];
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++)
        cells.push(
          polygon(
            `${x},${y}`,
            [
              { x, y },
              { x: x + 1, y },
              { x: x + 1, y: y + 1 },
              { x, y: y + 1 },
            ],
            y,
            x,
          ),
        );
  } else if (shape === "triangle") {
    const n = [5, 9, 13, 18][level],
      h = root3 / 2;
    for (let r = 0; r < n; r++)
      for (let j = 0; j < n - r; j++) {
        const x = r / 2 + j,
          y = r * h;
        cells.push(
          polygon(
            `${r},${j},d`,
            [
              { x, y },
              { x: x + 1, y },
              { x: x + 0.5, y: y + h },
            ],
            r,
            j,
          ),
        );
        if (j < n - r - 1)
          cells.push(
            polygon(
              `${r},${j},u`,
              [
                { x: x + 1, y },
                { x: x + 1.5, y: y + h },
                { x: x + 0.5, y: y + h },
              ],
              r,
              j,
            ),
          );
      }
  } else if (shape === "hexagon") {
    const radius = [2, 4, 6, 10][level];
    for (let q = -radius; q <= radius; q++)
      for (
        let r = Math.max(-radius, -q - radius);
        r <= Math.min(radius, -q + radius);
        r++
      ) {
        const x = root3 * (q + r / 2),
          y = 1.5 * r;
        const points = Array.from({ length: 6 }, (_, i) => ({
          x: x + Math.cos(((30 + i * 60) * Math.PI) / 180),
          y: y + Math.sin(((30 + i * 60) * Math.PI) / 180),
        }));
        cells.push(polygon(`${q},${r}`, points, r, q));
      }
  } else {
    const rings = [2, 4, 6, 9][level];
    cells.push(
      cell("0:0", {
        kind: "radial",
        ring: 0,
        sector: 0,
        count: 1,
        center: { x: 0, y: 0 },
      }),
    );
    for (let ring = 1; ring <= rings; ring++) {
      const count = 8 * 2 ** Math.floor(Math.log2(ring));
      for (let sector = 0; sector < count; sector++) {
        const angle = ((sector + 0.5) * Math.PI * 2) / count - Math.PI / 2;
        cells.push(
          cell(`${ring}:${sector}`, {
            kind: "radial",
            ring,
            sector,
            count,
            center: {
              x: (ring + 0.5) * Math.cos(angle),
              y: (ring + 0.5) * Math.sin(angle),
            },
          }),
        );
      }
    }
    const map = new Map(cells.map((c) => [c.id, c]));
    for (const c of cells) {
      const g = c.geometry;
      if (g.kind !== "radial" || g.ring === 0) continue;
      connect(c, map.get(`${g.ring}:${(g.sector + 1) % g.count}`)!);
      const parentCount =
        g.ring === 1 ? 1 : 8 * 2 ** Math.floor(Math.log2(g.ring - 1));
      connect(
        c,
        map.get(
          `${g.ring - 1}:${Math.floor((g.sector * parentCount) / g.count)}`,
        )!,
      );
    }
    return cells;
  }
  const edges = new Map<string, MazeCell>();
  for (const c of cells)
    if (c.geometry.kind === "polygon")
      c.geometry.points.forEach((p, i) => {
        const key = edgeKey(
          p,
          c.geometry.kind === "polygon"
            ? c.geometry.points[(i + 1) % c.geometry.points.length]
            : p,
        );
        const other = edges.get(key);
        if (other) connect(c, other);
        else edges.set(key, c);
      });
  return cells;
}
