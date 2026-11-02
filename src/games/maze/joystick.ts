import type { MazeDefinition, Point } from "./types";
export const JOYSTICK_TRAVEL = 38;
export const JOYSTICK_DEAD_ZONE = 0.2;
export function clampJoystick(x: number, y: number): Point {
  const length = Math.hypot(x, y),
    scale = length > JOYSTICK_TRAVEL ? JOYSTICK_TRAVEL / length : 1;
  return { x: (x * scale) / JOYSTICK_TRAVEL, y: (y * scale) / JOYSTICK_TRAVEL };
}
/** Select a geometric neighbor before checking walls. Never redirect into another opening. */
export function joystickTarget(
  maze: MazeDefinition,
  player: string,
  vector: Point,
): string | null {
  const length = Math.hypot(vector.x, vector.y);
  if (length < JOYSTICK_DEAD_ZONE) return null;
  const cell = maze.cells.find((c) => c.id === player);
  if (!cell) return null;
  const candidates = cell.neighbors
    .map((id) => {
      const next = maze.cells.find((c) => c.id === id)!,
        dx = next.geometry.center.x - cell.geometry.center.x,
        dy = next.geometry.center.y - cell.geometry.center.y;
      return {
        id,
        score: (vector.x * dx + vector.y * dy) / (length * Math.hypot(dx, dy)),
      };
    })
    .sort((a, b) => b.score - a.score);
  const best = candidates[0];
  if (!best) return null;
  const minScore =
    maze.shape === "hexagon"
      ? Math.cos(Math.PI / 6)
      : maze.shape === "triangle"
        ? 0.5
        : maze.shape === "circle" &&
            cell.geometry.kind === "radial" &&
            cell.geometry.ring === 0
          ? Math.cos(Math.PI / 8)
          : Math.SQRT1_2;
  if (best.score <= minScore + 1e-7) return null;
  // Neutral steering between two branches is ambiguous, even if one is walled off.
  if (candidates[1] && best.score - candidates[1].score < 0.025) return null;
  return cell.passages.includes(best.id) ? best.id : null;
}
