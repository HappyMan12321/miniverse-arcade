"use client";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import type { Direction } from "@/games/shared/types";
const icons = {
  up: ArrowUp,
  down: ArrowDown,
  left: ArrowLeft,
  right: ArrowRight,
};
export function DirectionPad({
  move,
  disabled = false,
}: {
  move: (d: Direction) => void;
  disabled?: boolean;
}) {
  return (
    <div className="movement-section">
      <div className="dpad">
        {(["up", "left", "down", "right"] as Direction[]).map((d) => {
          const Icon = icons[d];
          return (
            <button
              key={d}
              className={`direction dir-${d}`}
              aria-label={`Move ${d}`}
              disabled={disabled}
              onClick={() => move(d)}
            >
              <Icon size={21} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
