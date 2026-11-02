import type { Metadata } from "next";
import SnakeGame from "@/games/snake/snake-game";
export const metadata: Metadata = {
  title: "Snake",
  description:
    "A familiar favorite with three speeds, smooth controls, and a little room to grow.",
};
export default function SnakePage() {
  return <SnakeGame />;
}
