import type { Metadata } from "next";
import SnakeGame from "@/games/snake/snake-game";
export const metadata: Metadata = {
  title: "Snake",
  description:
    "Play Snake with three speeds, keyboard and touch controls, and saved high scores.",
};
export default function SnakePage() {
  return <SnakeGame />;
}
