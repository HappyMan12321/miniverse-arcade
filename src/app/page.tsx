import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Asterisk,
  Check,
  Compass,
  Gamepad2,
  MousePointer2,
  Sparkles,
} from "lucide-react";
import { games } from "@/games/registry";
import { GameArt, GameCard } from "@/components/game-card";
export default function Home() {
  return (
    <main id="main">
      <section className="hero container">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="tiny-star">✳</span> A SMALL UNIVERSE OF PLAY
          </div>
          <h1>
            Small games.
            <br />
            Big little <span className="serif-word">escapes.</span>
            <span className="heading-spark">✳</span>
          </h1>
          <p>
            A pause from the everyday. A challenge for your curious side.
            <br className="desktop-break" /> Thoughtfully made minigames, ready
            whenever you are.
          </p>
          <div className="hero-buttons">
            <Link href="/games/maze" className="button button-primary">
              Find your way <ArrowUpRight size={18} />
            </Link>
            <a href="#games" className="text-button">
              Explore the arcade <ArrowRight size={16} />
            </a>
          </div>
          <div className="hero-perks">
            <span>
              <Check size={14} /> No downloads
            </span>
            <span>
              <Check size={14} /> No sign-ups
            </span>
            <span>
              <Check size={14} /> Just play
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-label">
            <Sparkles size={15} /> Your next little obsession
          </div>
          <div className="feature-board">
            <div className="board-top">
              <span>
                <span className="online-dot" /> MAZE EXPLORER
              </span>
              <span>01 / THE ORIGINAL</span>
            </div>
            <GameArt kind="maze" />
            <div className="board-bottom">
              <span>
                <span className="player-legend" /> You are here
              </span>
              <span>
                Find your own way <Compass size={14} />
              </span>
            </div>
          </div>
          <div className="floating-note">
            <MousePointer2 size={17} />
            <span>
              A little lost.
              <br />
              <strong>In a good way.</strong>
            </span>
          </div>
          <span className="orbit-star">✳</span>
        </div>
      </section>
      <div className="promise-strip">
        <div className="container">
          <span>
            <Gamepad2 size={16} /> Good games. Zero fuss.
          </span>
          <span className="strip-separator">✳</span>
          <span>Made for your five-minute break</span>
          <span className="strip-separator">✳</span>
          <span>Easy to start. Hard to leave.</span>
          <span className="strip-separator">✳</span>
          <span>Play at your own pace</span>
        </div>
      </div>
      <section id="games" className="games-section container">
        <div className="section-heading">
          <div>
            <div className="eyebrow orange-text">PICK YOUR LITTLE ESCAPE</div>
            <h2>
              The arcade<span className="orange-text">.</span>
            </h2>
          </div>
          <p>A growing collection. A whole lot of possibility.</p>
        </div>
        <div className="game-grid">
          {games.map((game) => (
            <GameCard game={game} key={game.id} />
          ))}
        </div>
        <div className="arcade-note">
          <span className="note-line" />
          <Asterisk size={18} />
          <span>Four little escapes. Find the one that feels like you.</span>
          <span className="note-line" />
        </div>
      </section>
      <section id="about" className="about-section container">
        <div className="about-icon">
          <Asterisk size={48} />
        </div>
        <div>
          <span className="eyebrow orange-text">A LITTLE ROOM FOR PLAY</span>
          <h2>Not everything needs to be productive.</h2>
          <p>
            Sometimes, you just need to follow a path, match a pair, or beat
            your own best.
            <br className="desktop-break" /> MiniVerse is a small reminder that
            a little play goes a long way.
          </p>
        </div>
        <Link
          href="/games/maze"
          className="round-link"
          aria-label="Play Maze Explorer"
        >
          <ArrowUpRight size={25} />
        </Link>
      </section>
    </main>
  );
}
