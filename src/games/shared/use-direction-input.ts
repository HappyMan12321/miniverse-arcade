"use client";
import { useRef, type KeyboardEvent, type TouchEvent } from "react";
import { directionKeys, type Direction } from "./types";
export function useDirectionInput(move: (direction: Direction) => void) {
  const touch = useRef<{ x: number; y: number } | null>(null);
  return {
    onKeyDown(e: KeyboardEvent<HTMLElement>) {
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      const d = directionKeys[e.key] ?? directionKeys[e.key.toLowerCase()];
      if (d) {
        e.preventDefault();
        move(d);
      }
    },
    onTouchStart(e: TouchEvent<HTMLElement>) {
      const p = e.touches[0];
      touch.current = { x: p.clientX, y: p.clientY };
    },
    onTouchEnd(e: TouchEvent<HTMLElement>) {
      const p = e.changedTouches[0],
        start = touch.current;
      touch.current = null;
      if (!start || !p) return;
      const x = p.clientX - start.x,
        y = p.clientY - start.y;
      if (Math.max(Math.abs(x), Math.abs(y)) < 24) return;
      move(
        Math.abs(x) > Math.abs(y)
          ? x > 0
            ? "right"
            : "left"
          : y > 0
            ? "down"
            : "up",
      );
    },
    onTouchCancel() {
      touch.current = null;
    },
  };
}
