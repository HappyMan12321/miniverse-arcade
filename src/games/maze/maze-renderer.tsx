"use client";
import { memo, useMemo, type CSSProperties } from "react";
import { mazeWalls } from "./rendering";
import type { MazeDefinition } from "./types";
export const MazeRenderer = memo(function MazeRenderer({
  maze,
  player,
  trail = [],
  hint = [],
  decorative = false,
}: {
  maze: MazeDefinition;
  player: string;
  trail?: string[];
  hint?: string[];
  decorative?: boolean;
}) {
  const walls = useMemo(() => mazeWalls(maze), [maze]);
  const map = useMemo(() => new Map(maze.cells.map((c) => [c.id, c])), [maze]);
  const start = map.get(maze.startCellId)!.geometry.center,
    end = map.get(maze.exitCellId)!.geometry.center,
    position = map.get(player)!.geometry.center;
  const previous = map.get(trail.at(-2) ?? player)!.geometry.center;
  const { x, y, width, height } = maze.bounds;
  const pointPath = (ids: string[]) =>
    ids
      .map((id, i) => {
        const p = map.get(id)!.geometry.center;
        return `${i ? "L" : "M"} ${p.x} ${p.y}`;
      })
      .join(" ");
  return (
    <svg
      className="maze-svg"
      viewBox={`${x} ${y} ${width} ${height}`}
      role={decorative ? "presentation" : "img"}
      aria-label={
        decorative
          ? undefined
          : `${maze.shape} maze. Orange dot is you; green diamond is the exit.`
      }
      data-seed={decorative ? undefined : maze.seed}
    >
      <path
        d={pointPath(trail)}
        className="maze-trail"
        fill="none"
        strokeWidth=".12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {hint.length > 0 && (
        <path
          d={pointPath(hint)}
          className="maze-hint"
          fill="none"
          strokeWidth=".08"
          strokeDasharray=".08 .12"
          strokeLinecap="round"
        />
      )}
      <path
        d={walls}
        fill="none"
        className="maze-wall"
        strokeWidth=".065"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={start.x} cy={start.y} r=".13" className="maze-start" />
      <rect
        x={end.x - 0.17}
        y={end.y - 0.17}
        width=".34"
        height=".34"
        rx=".045"
        transform={`rotate(45 ${end.x} ${end.y})`}
        className="maze-exit"
      />
      <g
        key={`${maze.id}:${trail.length}`}
        className="player"
        style={
          {
            transform: `translate(${position.x}px, ${position.y}px)`,
            "--player-from": `translate(${previous.x}px, ${previous.y}px)`,
            "--player-to": `translate(${position.x}px, ${position.y}px)`,
          } as CSSProperties
        }
      >
        <circle r=".25" className="player-halo" />
        <circle r=".14" className="player-dot" />
      </g>
    </svg>
  );
});
