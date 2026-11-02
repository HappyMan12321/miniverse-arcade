import Link from "next/link";
import { Play, Star, Heart, Flower2, Moon } from "lucide-react";
import type { GameMetadata } from "@/games/registry";
import { MazeRenderer } from "@/games/maze/maze-renderer";
import { generateMaze, solution } from "@/games/maze/engine";
export function GameArt({ kind }: { kind: GameMetadata["illustration"] }) {
  if (kind === "maze") {
    const maze = generateMaze("square", "medium", "miniverse-feature");
    const path = solution(maze);
    return (
      <div className="art-maze">
        <MazeRenderer
          maze={maze}
          player={path[Math.floor(path.length * 0.3)]}
          trail={path.slice(0, Math.floor(path.length * 0.3) + 1)}
          decorative
        />
      </div>
    );
  }
  if (kind === "memory")
    return (
      <div className="memory-art">
        {[Star, Flower2, Heart, Moon, Flower2, Star].map((Icon, i) => (
          <span className={`memory-tile memory-tile-${i}`} key={i}>
            <Icon size={29} strokeWidth={1.5} />
          </span>
        ))}
      </div>
    );
  if (kind === "snake")
    return (
      <svg viewBox="0 0 240 160" className="snake-art" aria-hidden="true">
        <defs>
          <pattern
            id="dots"
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="8" cy="8" r="1" fill="currentColor" opacity=".18" />
          </pattern>
        </defs>
        <rect width="240" height="160" fill="url(#dots)" />
        <path
          d="M 58 119 H 106 V 71 H 154 V 39 H 186"
          fill="none"
          stroke="currentColor"
          strokeWidth="17"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx="185" cy="36" r="2" fill="white" />
        <circle cx="185" cy="43" r="2" fill="white" />
        <circle cx="60" cy="57" r="8" className="snake-fruit" />
        <path
          d="M 61 48 Q 62 40 68 43"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    );
  return (
    <div className="numbers-art">
      {[2, 4, 8, 4, 8, 16, 8, 16, 32].map((n, i) => (
        <span className={`number-tile n-${n}`} key={i}>
          {n}
        </span>
      ))}
    </div>
  );
}
export function GameCard({ game }: { game: GameMetadata }) {
  const content = (
    <>
      <div className="game-art">
        <GameArt kind={game.illustration} />
      </div>
      <div className="card-info">
        <span className="card-category">{game.category}</span>
        <h2>{game.title}</h2>
        <span className="card-play">
          {game.status === "available" ? (
            <>
              <Play size={15} fill="currentColor" />
              Play
            </>
          ) : (
            "Coming soon"
          )}
        </span>
      </div>
    </>
  );
  return (
    <article className={`game-card ${game.color}`}>
      {game.status === "available" ? (
        <Link
          href={`/games/${game.slug}`}
          className="card-link"
          aria-label={`Play ${game.title}`}
        >
          {content}
        </Link>
      ) : (
        content
      )}
    </article>
  );
}
