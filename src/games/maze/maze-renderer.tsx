"use client";
import { memo, useMemo, useLayoutEffect, useRef } from "react";
import { interpolateMotion, motionProgress, type MotionStep } from "./motion";
import { mazeWalls } from "./rendering";
import type { MazeDefinition } from "./types";
export const MazeRenderer = memo(function MazeRenderer({
  maze,
  player,
  trail = [],
  hint = [],
  decorative = false,
  motion = null,
  onArrival,
}: {
  maze: MazeDefinition;
  player: string;
  trail?: string[];
  hint?: string[];
  decorative?: boolean;
  motion?: MotionStep | null;
  onArrival?: (id: number, at: number) => void;
}) {
  const walls = useMemo(() => mazeWalls(maze), [maze]);
  const map = useMemo(() => new Map(maze.cells.map((c) => [c.id, c])), [maze]);
  const start = map.get(maze.startCellId)!.geometry.center,
    end = map.get(maze.exitCellId)!.geometry.center,
    position = map.get(player)!.geometry.center;
  const dot = useRef<SVGGElement>(null),
    arrival = useRef(onArrival);
  useLayoutEffect(() => {
    arrival.current = onArrival;
  }, [onArrival]);
  useLayoutEffect(() => {
    const node = dot.current;
    if (!node) return;
    if (!motion) {
      node.style.transform = `translate(${position.x}px, ${position.y}px)`;
      node.dataset.motionProgress = "1";
      node.dataset.motionPhase = "idle";
      return;
    }
    let raf = 0,
      stopped = false;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const draw = (now: number) => {
      if (stopped) return;
      const t = motionProgress(motion, now),
        point = reduced.matches ? motion.to : interpolateMotion(motion, now);
      node.style.transform = `translate(${point.x}px, ${point.y}px)`;
      node.dataset.motionProgress = String(t);
      node.dataset.motionPhase = t < 1 ? "moving" : "idle";
      if (t >= 1) {
        arrival.current?.(motion.id, motion.startedAt + motion.duration);
        return;
      }
      raf = requestAnimationFrame(draw);
    };
    draw(performance.now());
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, [motion, position.x, position.y]);
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
      data-player-cell={decorative ? undefined : player}
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
        ref={dot}
        className="player"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        data-motion-id={motion?.id}
      >
        <circle r=".25" className="player-halo" />
        <circle r=".14" className="player-dot" />
      </g>
    </svg>
  );
});
