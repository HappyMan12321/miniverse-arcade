import type { Metadata } from "next";
import MazeGame from "@/games/maze/maze-game";
export const metadata: Metadata = {
  title: "Maze Explorer",
  description:
    "Find your way through four procedurally generated maze geometries. A little lost, in a good way.",
};
export default function MazePage() {
  return <MazeGame />;
}
