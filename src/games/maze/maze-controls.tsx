"use client";
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowUpLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
  RotateCcw,
  RotateCw,
  Shrink,
  Expand,
  Hexagon,
  Circle,
  CornerDownLeft,
  CornerDownRight,
} from "lucide-react";
import type { Direction, MazeShape } from "./types";
import type { MazeControl } from "./controls";
const arrows = {
  up: ArrowUp,
  down: ArrowDown,
  left: ArrowLeft,
  right: ArrowRight,
  nw: ArrowUpLeft,
  ne: ArrowUpRight,
  sw: ArrowDownLeft,
  se: ArrowDownRight,
};
const radialIcons = {
  in: Shrink,
  out: Expand,
  ccw: RotateCcw,
  cw: RotateCw,
  "out-ccw": CornerDownLeft,
  "out-cw": CornerDownRight,
};
export function MazeControls({
  shape,
  controls,
  disabled,
  onPress,
  onRelease,
  onActivate,
}: {
  shape: MazeShape;
  controls: MazeControl[];
  disabled: boolean;
  onPress: (d: Direction) => void;
  onRelease: () => void;
  onActivate: (d: Direction) => void;
}) {
  return (
    <div className="movement-section">
      <div
        className={`dpad dpad-${shape}`}
        role="group"
        aria-label={`${shape[0].toUpperCase() + shape.slice(1)} movement controls`}
      >
        {controls.map((c) => {
          const Icon = c.kind
            ? radialIcons[c.kind]
            : shape === "hexagon"
              ? ArrowRight
              : arrows[c.direction];
          const blocked = disabled || c.target === null;
          return (
            <button
              key={c.direction}
              className={`direction dir-${c.direction} ${!c.visible ? "control-hidden" : ""}`}
              data-direction={c.direction}
              data-target={c.target ?? ""}
              aria-label={`Move ${c.label.toLowerCase()}`}
              aria-disabled={blocked}
              aria-hidden={!c.visible || undefined}
              tabIndex={c.visible ? 0 : -1}
              title={`${c.label} (${c.keyLabel})`}
              onPointerDown={(e) => {
                if (e.button !== 0 || blocked) return;
                e.preventDefault();
                onPress(c.direction);
              }}
              onPointerUp={onRelease}
              onPointerCancel={onRelease}
              onPointerLeave={onRelease}
              onClick={(e) => {
                if (e.detail === 0 && !blocked) onActivate(c.direction);
              }}
            >
              <Icon
                size={21}
                style={
                  c.angle === undefined
                    ? undefined
                    : { transform: `rotate(${c.angle}deg)` }
                }
              />
              {c.shortLabel && (
                <span className="radial-label">{c.shortLabel}</span>
              )}
              <kbd>{c.keyLabel}</kbd>
            </button>
          );
        })}
        {(shape === "hexagon" || shape === "circle") && (
          <span className="controller-core" aria-hidden="true">
            {shape === "hexagon" ? <Hexagon size={18} /> : <Circle size={18} />}
          </span>
        )}
      </div>
    </div>
  );
}
