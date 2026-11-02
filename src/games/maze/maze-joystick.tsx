"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { MazeDefinition, Point } from "./types";
import { clampJoystick, JOYSTICK_TRAVEL } from "./joystick";
export function MazeJoystick({
  maze,
  player,
  disabled,
  onChange,
  onFocus,
}: {
  maze: MazeDefinition;
  player: string;
  disabled: boolean;
  onChange: (vector: Point | null) => void;
  onFocus: () => void;
}) {
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 }),
    [dragging, setDragging] = useState(false),
    pointer = useRef<number | null>(null),
    base = useRef<HTMLButtonElement>(null);
  const stop = useCallback(() => {
    const id = pointer.current;
    pointer.current = null;
    if (id !== null && base.current?.hasPointerCapture(id))
      base.current.releasePointerCapture(id);
    setOffset({ x: 0, y: 0 });
    setDragging(false);
    onChange(null);
  }, [onChange]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) stop();
    };
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", hidden);
      onChange(null);
    };
  }, [onChange, stop]);
  const update = (x: number, y: number) => {
    const rect = base.current!.getBoundingClientRect(),
      vector = clampJoystick(
        x - rect.x - rect.width / 2,
        y - rect.y - rect.height / 2,
      );
    setOffset(vector);
    onChange(vector);
  };
  const cell = maze.cells.find((c) => c.id === player)!,
    markers = cell.neighbors.map((id) => {
      const neighbor = maze.cells.find((c) => c.id === id)!,
        dx = neighbor.geometry.center.x - cell.geometry.center.x,
        dy = neighbor.geometry.center.y - cell.geometry.center.y,
        length = Math.hypot(dx, dy);
      return {
        id,
        x: (dx / length) * 53,
        y: (dy / length) * 53,
        open: cell.passages.includes(id),
      };
    });
  return (
    <div className="movement-section joystick-section">
      <button
        ref={base}
        type="button"
        className={`maze-joystick ${dragging ? "is-dragging" : ""}`}
        aria-label="Maze joystick"
        aria-disabled={disabled}
        title="Drag toward a passage; release to stop"
        onPointerDown={(e) => {
          if (disabled || e.button !== 0 || pointer.current !== null) return;
          e.preventDefault();
          pointer.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
          onFocus();
          update(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (pointer.current === e.pointerId) {
            e.preventDefault();
            update(e.clientX, e.clientY);
          }
        }}
        onPointerUp={(e) => {
          if (pointer.current === e.pointerId) stop();
        }}
        onPointerCancel={stop}
        onLostPointerCapture={() => {
          if (pointer.current !== null) stop();
        }}
      >
        <span className="joystick-crosshair" aria-hidden="true" />
        {markers.map((marker) => (
          <span
            key={marker.id}
            className={`joystick-mark ${marker.open ? "is-open" : ""}`}
            aria-hidden="true"
            style={{
              left: `calc(50% + ${marker.x}px)`,
              top: `calc(50% + ${marker.y}px)`,
            }}
          />
        ))}
        <span
          className="joystick-thumb"
          aria-hidden="true"
          style={
            {
              transform: `translate(${offset.x * JOYSTICK_TRAVEL}px, ${offset.y * JOYSTICK_TRAVEL}px)`,
            } as CSSProperties
          }
        >
          <span />
        </span>
      </button>
    </div>
  );
}
