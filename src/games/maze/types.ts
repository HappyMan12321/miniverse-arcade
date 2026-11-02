export type MazeShape = "square" | "triangle" | "hexagon" | "circle";
export type Difficulty = "easy" | "medium" | "hard" | "expert";
export type Point = { x: number; y: number };
export type CellGeometry =
  | {
      kind: "polygon";
      points: Point[];
      center: Point;
      row: number;
      column: number;
    }
  | {
      kind: "radial";
      ring: number;
      sector: number;
      count: number;
      center: Point;
    };
export interface MazeCell {
  id: string;
  neighbors: string[];
  passages: string[];
  geometry: CellGeometry;
}
export interface MazeDefinition {
  id: string;
  shape: MazeShape;
  difficulty: Difficulty;
  cells: MazeCell[];
  startCellId: string;
  exitCellId: string;
  seed: string;
  bounds: { x: number; y: number; width: number; height: number };
}
export type Direction =
  "up" | "down" | "left" | "right" | "nw" | "ne" | "sw" | "se";
