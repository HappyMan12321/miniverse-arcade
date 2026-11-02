import { movementTarget, radialOutwardNeighbors } from "./engine";
import type { Direction, MazeDefinition } from "./types";
export interface MazeControl {
  direction: Direction;
  label: string;
  shortLabel?: string;
  keyLabel: string;
  keys: string[];
  target: string | null;
  visible: boolean;
  angle?: number;
  kind?: "in" | "out" | "ccw" | "cw" | "out-ccw" | "out-cw";
}
type Definition = Omit<MazeControl, "target" | "visible"> & {
  visible?: boolean;
};
const cardinal: Definition[] = [
  { direction: "up", label: "Up", keyLabel: "W / ↑", keys: ["w", "arrowup"] },
  {
    direction: "left",
    label: "Left",
    keyLabel: "A / ←",
    keys: ["a", "arrowleft"],
  },
  {
    direction: "down",
    label: "Down",
    keyLabel: "S / ↓",
    keys: ["s", "arrowdown"],
  },
  {
    direction: "right",
    label: "Right",
    keyLabel: "D / →",
    keys: ["d", "arrowright"],
  },
];
export function mazeControls(
  maze: MazeDefinition,
  player: string,
): MazeControl[] {
  let definitions = cardinal;
  if (maze.shape === "hexagon")
    definitions = [
      {
        direction: "nw",
        label: "Upper left",
        keyLabel: "Q",
        keys: ["q"],
        angle: -120,
      },
      {
        direction: "ne",
        label: "Upper right",
        keyLabel: "E",
        keys: ["e", "w"],
        angle: -60,
      },
      {
        direction: "left",
        label: "Left",
        keyLabel: "A",
        keys: ["a", "arrowleft"],
        angle: 180,
      },
      {
        direction: "right",
        label: "Right",
        keyLabel: "D",
        keys: ["d", "arrowright"],
        angle: 0,
      },
      {
        direction: "sw",
        label: "Lower left",
        keyLabel: "Z",
        keys: ["z"],
        angle: 120,
      },
      {
        direction: "se",
        label: "Lower right",
        keyLabel: "C",
        keys: ["c", "x"],
        angle: 60,
      },
    ];
  if (maze.shape === "triangle") {
    const down = player.endsWith("d");
    definitions = down
      ? [
          cardinal[0],
          {
            direction: "sw",
            label: "Lower left",
            keyLabel: "A / ←",
            keys: ["a", "arrowleft"],
          },
          {
            direction: "se",
            label: "Lower right",
            keyLabel: "D / →",
            keys: ["d", "arrowright"],
          },
        ]
      : [
          {
            direction: "nw",
            label: "Upper left",
            keyLabel: "Q / ←",
            keys: ["q", "a", "arrowleft"],
          },
          {
            direction: "ne",
            label: "Upper right",
            keyLabel: "E / →",
            keys: ["e", "d", "arrowright"],
          },
          cardinal[2],
        ];
  }
  if (maze.shape === "circle") {
    const split = radialOutwardNeighbors(maze, player).length === 2;
    definitions = [
      {
        direction: "up",
        label: "Inward",
        shortLabel: "In",
        keyLabel: "W / ↑",
        keys: ["w", "arrowup"],
        kind: "in",
      },
      {
        direction: "left",
        label: "Counterclockwise",
        shortLabel: "CCW",
        keyLabel: "A / ←",
        keys: ["a", "arrowleft"],
        kind: "ccw",
      },
      {
        direction: "right",
        label: "Clockwise",
        shortLabel: "CW",
        keyLabel: "D / →",
        keys: ["d", "arrowright"],
        kind: "cw",
      },
      {
        direction: "sw",
        label: "Outward counterclockwise branch",
        shortLabel: "Out CCW",
        keyLabel: "Q / Z",
        keys: ["q", "z"],
        kind: "out-ccw",
        visible: split,
      },
      {
        direction: "down",
        label: "Outward",
        shortLabel: "Out",
        keyLabel: "S / ↓",
        keys: ["s", "arrowdown"],
        kind: "out",
      },
      {
        direction: "se",
        label: "Outward clockwise branch",
        shortLabel: "Out CW",
        keyLabel: "E / X",
        keys: ["e", "x"],
        kind: "out-cw",
        visible: split,
      },
    ];
  }
  return definitions.map((c) => ({
    ...c,
    visible: c.visible ?? true,
    target: movementTarget(maze, player, c.direction),
  }));
}
export function directionForKey(
  maze: MazeDefinition,
  player: string,
  key: string,
): Direction | null | undefined {
  const normalized = key.toLowerCase();
  // Vertical arrow keys cannot identify one of two hex diagonals. Consume them
  // while the board has focus rather than scrolling or picking a random side.
  if (
    maze.shape === "hexagon" &&
    (normalized === "arrowup" || normalized === "arrowdown")
  )
    return null;
  return mazeControls(maze, player).find((c) => c.keys.includes(normalized))
    ?.direction;
}
