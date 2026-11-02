import type { Metadata } from "next";
import BoardGame from "@/games/2048/board-game";
export const metadata: Metadata = {
  title: "2048",
  description:
    "Slide, merge, and find your way to 2048. Small moves, satisfying combinations.",
};
export default function NumbersPage() {
  return <BoardGame />;
}
