import { edgeKey } from "./topology";
import type { MazeDefinition, Point } from "./types";
export function arc(radius: number, start: number, end: number) {
  const a = { x: radius * Math.cos(start), y: radius * Math.sin(start) },
    b = { x: radius * Math.cos(end), y: radius * Math.sin(end) };
  return `M ${a.x} ${a.y} A ${radius} ${radius} 0 ${end - start > Math.PI ? 1 : 0} 1 ${b.x} ${b.y}`;
}
export function mazeWalls(maze: MazeDefinition): string {
  const paths: string[] = [];
  if (maze.shape !== "circle") {
    const edges = new Map<string, { a: Point; b: Point; ids: string[] }>();
    for (const c of maze.cells)
      if (c.geometry.kind === "polygon") {
        const points = c.geometry.points;
        points.forEach((a, i) => {
          const b = points[(i + 1) % points.length],
            key = edgeKey(a, b),
            e = edges.get(key);
          if (e) e.ids.push(c.id);
          else edges.set(key, { a, b, ids: [c.id] });
        });
      }
    const map = new Map(maze.cells.map((c) => [c.id, c]));
    for (const e of edges.values())
      if (e.ids.length === 1 || !map.get(e.ids[0])!.passages.includes(e.ids[1]))
        paths.push(`M ${e.a.x} ${e.a.y} L ${e.b.x} ${e.b.y}`);
  } else {
    const maxRing = Math.max(
      ...maze.cells.map((c) =>
        c.geometry.kind === "radial" ? c.geometry.ring : 0,
      ),
    );
    for (const c of maze.cells) {
      const g = c.geometry;
      if (g.kind !== "radial") continue;
      const outer = g.ring + 1,
        nextCount =
          g.ring === 0 ? 8 : 8 * 2 ** Math.floor(Math.log2(g.ring + 1));
      const parts = g.ring === 0 ? 8 : nextCount / g.count;
      for (let j = 0; j < parts; j++) {
        const sector = g.ring === 0 ? j : g.sector * parts + j,
          start = (sector * 2 * Math.PI) / nextCount - Math.PI / 2,
          end = ((sector + 1) * 2 * Math.PI) / nextCount - Math.PI / 2;
        if (
          g.ring === maxRing ||
          !c.passages.includes(`${g.ring + 1}:${sector}`)
        )
          paths.push(arc(outer, start, end));
      }
      if (
        g.ring > 0 &&
        !c.passages.includes(`${g.ring}:${(g.sector + 1) % g.count}`)
      ) {
        const a = ((g.sector + 1) * 2 * Math.PI) / g.count - Math.PI / 2;
        paths.push(
          `M ${g.ring * Math.cos(a)} ${g.ring * Math.sin(a)} L ${outer * Math.cos(a)} ${outer * Math.sin(a)}`,
        );
      }
    }
  }
  return paths.join(" ");
}
