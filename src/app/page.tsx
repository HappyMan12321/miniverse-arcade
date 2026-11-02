import { games } from "@/games/registry";
import { GameCard } from "@/components/game-card";
export default function Home() {
  return (
    <main id="main" className="arcade-page container">
      <header className="arcade-heading">
        <h1>Arcade</h1>
        <span>
          {games.filter((g) => g.status === "available").length} games
        </span>
      </header>
      <section id="games" aria-label="Games">
        <div className="game-grid">
          {games.map((game) => (
            <GameCard game={game} key={game.id} />
          ))}
        </div>
      </section>
    </main>
  );
}
