import type { Metadata } from "next";
import MazeGame from "@/games/maze/maze-game";
export const metadata: Metadata = {
  title: "Maze Explorer",
  description:
    "Play square, triangular, hexagonal, and circular mazes across four difficulty levels.",
};
export default function MazePage() {
  return <MazeGame />;
}
