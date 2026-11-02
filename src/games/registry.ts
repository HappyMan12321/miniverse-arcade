export interface GameMetadata {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  status: "available" | "coming-soon";
  illustration: "maze" | "memory" | "snake" | "2048";
  color: string;
}
export const games: GameMetadata[] = [
  {
    id: "maze",
    slug: "maze",
    title: "Maze Explorer",
    description:
      "A little lost. A lot of possibility. Find your way through a world that’s never the same twice.",
    category: "Puzzle · Exploration",
    status: "available",
    illustration: "maze",
    color: "peach",
  },
  {
    id: "memory",
    slug: "memory-match",
    title: "Memory Match",
    description: "Find the pairs. Trust your memory.",
    category: "Memory",
    status: "available",
    illustration: "memory",
    color: "lavender",
  },
  {
    id: "snake",
    slug: "snake",
    title: "Snake",
    description: "A familiar favorite. A fresh little twist.",
    category: "Arcade",
    status: "available",
    illustration: "snake",
    color: "sage",
  },
  {
    id: "2048",
    slug: "2048",
    title: "2048",
    description: "Small moves. Satisfying combinations.",
    category: "Strategy",
    status: "available",
    illustration: "2048",
    color: "sand",
  },
];
