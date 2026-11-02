import type { Metadata } from "next";
import MemoryGame from "@/games/memory-match/memory-game";
export const metadata: Metadata = {
  title: "Memory Match",
  description:
    "Find the pairs. Trust your memory. Play three sizes of a thoughtfully made matching game.",
};
export default function MemoryPage() {
  return <MemoryGame />;
}
