"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  Check,
  ChevronLeft,
  Circle,
  CircleHelp,
  Flag,
  Footprints,
  Hexagon,
  Lightbulb,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Square,
  Timer,
  Triangle,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { localGameStats } from "@/services/game-stats";
import { ActiveClock, formatTime } from "./clock";
import { generateMaze, movementTarget, solution } from "./engine";
import { difficulties, shapes } from "./topology";
import { MazeRenderer } from "./maze-renderer";
import type { Difficulty, Direction, MazeDefinition } from "./types";
const icons = {
  square: Square,
  triangle: Triangle,
  hexagon: Hexagon,
  circle: Circle,
};
const arrows = {
  up: ArrowUp,
  down: ArrowDown,
  left: ArrowLeft,
  right: ArrowRight,
  nw: ArrowUpLeft,
  ne: ArrowUpRight,
  sw: ArrowDownLeft,
  se: ArrowDownRight,
};
const names: Record<Direction, string> = {
  up: "Up",
  down: "Down",
  left: "Left",
  right: "Right",
  nw: "Upper left",
  ne: "Upper right",
  sw: "Lower left",
  se: "Lower right",
};
interface Run {
  maze: MazeDefinition;
  player: string;
  moves: number;
  trail: string[];
  complete: boolean;
  paused: boolean;
}
function initialRun(maze: MazeDefinition): Run {
  return {
    maze,
    player: maze.startCellId,
    moves: 0,
    trail: [maze.startCellId],
    complete: false,
    paused: false,
  };
}
const defaultMaze = generateMaze("square", "easy", "welcome-to-miniverse");
export default function MazeGame() {
  const [run, setRun] = useState<Run>(() => initialRun(defaultMaze)),
    runRef = useRef(run);
  const [elapsed, setElapsed] = useState(0),
    [showHint, setShowHint] = useState(false),
    [help, setHelp] = useState(false),
    [results, setResults] = useState(false),
    [best, setBest] = useState<number | null>(null);
  const clock = useRef(new ActiveClock()),
    repeat = useRef<ReturnType<typeof setInterval> | null>(null),
    arena = useRef<HTMLDivElement>(null);
  const update = useCallback((next: Run) => {
    runRef.current = next;
    setRun(next);
  }, []);
  const cancelRepeat = useCallback(() => {
    if (repeat.current) {
      clearInterval(repeat.current);
      repeat.current = null;
    }
  }, []);
  const reset = useCallback(
    (maze: MazeDefinition) => {
      cancelRepeat();
      clock.current.reset();
      setElapsed(0);
      setShowHint(false);
      setResults(false);
      setBest(localGameStats.personalBest(maze.shape, maze.difficulty));
      update(initialRun(maze));
    },
    [update, cancelRepeat],
  );
  useEffect(() => {
    // Restore browser-only preferences after the server-rendered first view.
    /* eslint-disable react-hooks/set-state-in-effect -- Restore browser-only preferences after hydration. */
    try {
      const prefs = JSON.parse(
        localStorage.getItem("miniverse:maze-preferences") ?? "null",
      );
      if (
        prefs &&
        shapes.includes(prefs.shape) &&
        difficulties.includes(prefs.difficulty)
      )
        reset(generateMaze(prefs.shape, prefs.difficulty, crypto.randomUUID()));
      else reset(generateMaze("square", "easy", crypto.randomUUID()));
    } catch {
      reset(generateMaze("square", "easy", crypto.randomUUID()));
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [reset]);
  useEffect(() => {
    const visibility = () => {
      cancelRepeat();
      if (document.hidden) clock.current.pause();
      else if (
        runRef.current.moves > 0 &&
        !runRef.current.complete &&
        !runRef.current.paused
      )
        clock.current.start();
      setElapsed(clock.current.read());
    };
    const ticker = setInterval(() => setElapsed(clock.current.read()), 100);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", cancelRepeat);
    window.addEventListener("pointerup", cancelRepeat);
    window.addEventListener("pointercancel", cancelRepeat);
    return () => {
      clearInterval(ticker);
      cancelRepeat();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", cancelRepeat);
      window.removeEventListener("pointerup", cancelRepeat);
      window.removeEventListener("pointercancel", cancelRepeat);
    };
  }, [cancelRepeat]);
  const newMaze = (
    shape = run.maze.shape,
    difficulty = run.maze.difficulty,
  ) => {
    reset(generateMaze(shape, difficulty, crypto.randomUUID()));
    try {
      localStorage.setItem(
        "miniverse:maze-preferences",
        JSON.stringify({ shape, difficulty }),
      );
    } catch {}
  };
  const move = useCallback(
    (direction: Direction) => {
      const current = runRef.current;
      if (current.complete || current.paused || document.hidden) return;
      const next = movementTarget(current.maze, current.player, direction);
      if (!next) return;
      clock.current.start();
      const complete = next === current.maze.exitCellId;
      const nextRun = {
        ...current,
        player: next,
        moves: current.moves + 1,
        trail: [...current.trail, next],
        complete,
      };
      if (complete) {
        clock.current.pause();
        const ms = clock.current.read();
        setElapsed(ms);
        setResults(true);
        cancelRepeat();
        localGameStats.save({
          gameId: "maze",
          shape: current.maze.shape,
          difficulty: current.maze.difficulty,
          milliseconds: ms,
          moves: nextRun.moves,
          seed: current.maze.seed,
          completedAt: new Date().toISOString(),
        });
      }
      update(nextRun);
    },
    [update, cancelRepeat],
  );
  const pause = () => {
    cancelRepeat();
    const paused = !runRef.current.paused;
    if (paused) clock.current.pause();
    else if (runRef.current.moves > 0) clock.current.start();
    update({ ...runRef.current, paused });
  };
  const shape = run.maze.shape,
    g = run.maze.cells.find((c) => c.id === run.player)!.geometry;
  let directions: Direction[] = ["up", "left", "down", "right"];
  let keyLabels: Partial<Record<Direction, string>> = {
    up: "W / ↑",
    left: "A / ←",
    down: "S / ↓",
    right: "D / →",
  };
  if (shape === "hexagon") {
    directions = ["nw", "ne", "left", "right", "sw", "se"];
    keyLabels = { nw: "Q", ne: "W", left: "A", right: "D", sw: "Z", se: "X" };
  }
  if (shape === "triangle") {
    const down = g.kind === "polygon" && run.player.endsWith("d");
    directions = down ? ["up", "sw", "se"] : ["nw", "ne", "down"];
    keyLabels = down
      ? { up: "W / ↑", sw: "A / ←", se: "D / →" }
      : { nw: "Q / ←", ne: "E / →", down: "S / ↓" };
  }
  if (
    shape === "circle" &&
    movementTarget(run.maze, run.player, "sw") &&
    movementTarget(run.maze, run.player, "se") !==
      movementTarget(run.maze, run.player, "sw")
  ) {
    directions = ["up", "left", "right", "sw", "se"];
    keyLabels = { ...keyLabels, sw: "Z", se: "X" };
  }
  const keyDirection = (key: string): Direction | undefined => {
    key = key.toLowerCase();
    if (shape === "circle" && key === "z") return "sw";
    if (shape === "circle" && key === "x") return "se";
    if (shape === "hexagon")
      return (
        { q: "nw", w: "ne", a: "left", d: "right", z: "sw", x: "se" } as Record<
          string,
          Direction
        >
      )[key];
    if (shape === "triangle") {
      if (directions.includes("up"))
        return (
          {
            w: "up",
            arrowup: "up",
            a: "sw",
            arrowleft: "sw",
            d: "se",
            arrowright: "se",
          } as Record<string, Direction>
        )[key];
      return (
        {
          q: "nw",
          a: "nw",
          arrowleft: "nw",
          e: "ne",
          d: "ne",
          arrowright: "ne",
          s: "down",
          arrowdown: "down",
        } as Record<string, Direction>
      )[key];
    }
    return (
      {
        w: "up",
        arrowup: "up",
        a: "left",
        arrowleft: "left",
        s: "down",
        arrowdown: "down",
        d: "right",
        arrowright: "right",
      } as Record<string, Direction>
    )[key];
  };
  const hint = showHint ? solution(run.maze, run.player).slice(0, 4) : [];
  return (
    <main id="main" className="game-page container">
      <div className="game-breadcrumb">
        <Link href="/#games">
          <ChevronLeft size={15} /> Back to the arcade
        </Link>
        <span>01 / THE ORIGINAL</span>
      </div>
      <div className="game-heading">
        <div>
          <div className="eyebrow orange-text">TAKE THE SCENIC ROUTE</div>
          <h1>
            Maze Explorer<span className="orange-text">.</span>
          </h1>
          <p>
            Every maze is a new beginning. Find your way to the green diamond.
          </p>
        </div>
        <Button variant="outline" size="small" onClick={() => setHelp(true)}>
          <CircleHelp size={16} /> How to play
        </Button>
      </div>
      <div className="game-workspace">
        <div className="settings-bar">
          <fieldset className="shape-fieldset">
            <legend>MAKE IT YOURS</legend>
            <div className="shape-buttons">
              {shapes.map((s) => {
                const Icon = icons[s];
                return (
                  <button
                    key={s}
                    onClick={() => newMaze(s)}
                    aria-pressed={shape === s}
                    className={shape === s ? "selected" : ""}
                  >
                    <Icon size={17} />
                    <span>
                      {s === "circle"
                        ? "Circle"
                        : s.charAt(0).toUpperCase() + s.slice(1)}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="difficulty-field">
            <label htmlFor="difficulty">YOUR CHALLENGE</label>
            <select
              id="difficulty"
              value={run.maze.difficulty}
              onChange={(e) => newMaze(shape, e.target.value as Difficulty)}
            >
              {difficulties.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={() => newMaze()} className="new-maze-button">
            <RefreshCw size={16} /> New maze
          </Button>
        </div>
        <div className="play-layout">
          <div
            className="maze-area"
            ref={arena}
            tabIndex={0}
            role="group"
            aria-label="Maze gameplay. Focus here to use the keyboard controls."
            onKeyDown={(e) => {
              if (
                e.target instanceof HTMLSelectElement ||
                e.target instanceof HTMLInputElement ||
                e.ctrlKey ||
                e.metaKey ||
                e.altKey
              )
                return;
              const d = keyDirection(e.key);
              if (d) {
                e.preventDefault();
                move(d);
              }
            }}
          >
            <div className="maze-toolbar">
              <span className="maze-level">
                <span className="online-dot" />
                {run.maze.difficulty} exploration
              </span>
              <div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Restart current maze"
                  title="Restart current maze"
                  onClick={() => reset(run.maze)}
                >
                  <RotateCcw size={17} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={run.paused ? "Resume game" : "Pause game"}
                  disabled={run.complete}
                  onClick={pause}
                >
                  {run.paused ? <Play size={17} /> : <Pause size={17} />}
                </Button>
              </div>
            </div>
            <div
              className="maze-canvas"
              data-testid="maze-canvas"
              onClick={() => arena.current?.focus()}
            >
              <div
                className={run.paused ? "maze-inner is-paused" : "maze-inner"}
              >
                <MazeRenderer
                  maze={run.maze}
                  player={run.player}
                  trail={run.trail}
                  hint={hint}
                />
              </div>
              {run.paused && (
                <div className="pause-overlay">
                  <span className="eyebrow">TAKE YOUR TIME</span>
                  <h2>A little breather.</h2>
                  <Button onClick={pause}>
                    <Play size={16} /> Keep exploring
                  </Button>
                </div>
              )}
            </div>
            <div className="maze-bottom">
              <span>
                <span className="player-legend" /> You
              </span>
              <span>
                <span className="exit-legend" /> The way out
              </span>
              <span className="seed-label">
                {run.maze.cells.length} little possibilities
              </span>
            </div>
            <div className="movement-section">
              <div
                className={`dpad dpad-${shape} ${shape === "circle" && directions.includes("sw") ? "radial-split" : ""}`}
              >
                {directions.map((d) => {
                  const Icon = arrows[d],
                    target = movementTarget(run.maze, run.player, d);
                  const label =
                    shape === "circle"
                      ? (
                          {
                            up: "Inward",
                            down: "Outward",
                            left: "Counterclockwise",
                            right: "Clockwise",
                            sw: "Outward left",
                            se: "Outward right",
                          } as Record<string, string>
                        )[d]
                      : names[d];
                  return (
                    <button
                      key={d}
                      className={`direction dir-${d}`}
                      aria-label={`Move ${label.toLowerCase()}`}
                      aria-disabled={!target || run.complete || run.paused}
                      onPointerDown={(e) => {
                        if (e.button !== 0) return;
                        e.preventDefault();
                        arena.current?.focus();
                        cancelRepeat();
                        move(d);
                        repeat.current = setInterval(() => move(d), 145);
                      }}
                      onPointerUp={cancelRepeat}
                      onPointerCancel={cancelRepeat}
                      onPointerLeave={cancelRepeat}
                      onClick={(e) => {
                        if (e.detail === 0) move(d);
                      }}
                    >
                      <Icon size={20} />
                      <kbd>{keyLabels[d]}</kbd>
                      {shape === "circle" && (
                        <span className="radial-label">{label}</span>
                      )}
                    </button>
                  );
                })}
                <span className="dpad-center">✳</span>
              </div>
              <p className="control-caption">
                {shape === "hexagon"
                  ? "Six directions. One way through."
                  : shape === "triangle"
                    ? "Your directions follow the triangle you’re in."
                    : shape === "circle"
                      ? "In, out, and around. Follow the open passages."
                      : "Use your arrow keys or the controls above."}
              </p>
            </div>
          </div>
          <aside className="game-sidebar">
            <div className="run-card">
              <span className="eyebrow">YOUR LITTLE JOURNEY</span>
              <div className="stat">
                <span>
                  <Timer size={17} /> Time exploring
                </span>
                <strong data-testid="timer">{formatTime(elapsed)}</strong>
              </div>
              <div className="stat">
                <span>
                  <Footprints size={17} /> Steps taken
                </span>
                <strong data-testid="moves">
                  {run.moves.toString().padStart(2, "0")}
                </strong>
              </div>
              <div className="personal-best">
                <Trophy size={15} />
                <span>
                  {best === null
                    ? "Your first adventure awaits"
                    : `Personal best · ${formatTime(best)}`}
                </span>
              </div>
            </div>
            <div className="explorer-note">
              <span className="note-icon">
                <Flag size={22} />
              </span>
              <h3>There’s no wrong turn.</h3>
              <p>
                Just a different way of getting there. Explore, backtrack, and
                enjoy the journey.
              </p>
              <div className="note-divider" />
              <span>
                <Check size={14} /> One maze. One unique path.
              </span>
            </div>
            <Button
              variant="outline"
              className="hint-button"
              aria-pressed={showHint}
              onClick={() => setShowHint((v) => !v)}
              disabled={run.complete}
            >
              <Lightbulb size={16} />
              {showHint ? "Hide the little nudge" : "Need a little nudge?"}
            </Button>
            <p className="timer-policy">
              Your timer starts with your first step and pauses when this tab is
              hidden.
            </p>
            {run.complete && (
              <Button variant="outline" onClick={() => setResults(true)}>
                <Trophy size={16} /> View your result
              </Button>
            )}
          </aside>
        </div>
      </div>
      <div className="below-game">
        <span>✳</span> Finding your way is half the fun.
      </div>
      <Dialog
        open={help}
        onOpenChange={setHelp}
        title="A little guide to getting lost."
        description="Move the orange dot to the green diamond. You can only travel through open passages."
      >
        <div className="help-content">
          <p>
            <strong>Square:</strong> Arrow keys or W, A, S, D.
          </p>
          <p>
            <strong>Triangle:</strong> Follow the three arrows beneath your
            maze. W/A/D move through a downward triangle; Q/E/S through an
            upward triangle. Left and right arrows follow the diagonals.
          </p>
          <p>
            <strong>Hexagon:</strong> Q/W for upper diagonals, A/D for
            left/right, Z/X for lower diagonals.
          </p>
          <p>
            <strong>Circle:</strong> ↑ inward, ↓ outward, ← counterclockwise, →
            clockwise. At a ring split with two open passages, use the two
            outward arrows (Z/X) to choose your branch.
          </p>
          <p>
            Click the maze to focus keyboard controls. Hold an on-screen arrow
            to keep moving. Restart keeps your maze; New maze creates a new
            adventure.
          </p>
          <p>
            The timer measures active play and pauses in hidden tabs. Shape and
            difficulty changes start a new run.
          </p>
        </div>
        <Button
          onClick={() => {
            setHelp(false);
            arena.current?.focus();
          }}
        >
          Let’s explore <ArrowUpRight size={16} />
        </Button>
      </Dialog>
      <Dialog
        open={results}
        onOpenChange={setResults}
        title="Look at you. You found your way."
        description={`One little maze, conquered. ${shape.charAt(0).toUpperCase() + shape.slice(1)} · ${run.maze.difficulty}`}
      >
        <div className="result-icon">
          <Trophy size={38} />
        </div>
        <div className="result-stats">
          <div>
            <span>TIME</span>
            <strong>{formatTime(elapsed)}</strong>
          </div>
          <div>
            <span>MOVES</span>
            <strong>{run.moves}</strong>
          </div>
        </div>
        {best !== null && elapsed < best && (
          <p className="new-best">A new personal best. Nicely explored!</p>
        )}
        <div className="result-actions">
          <Button onClick={() => newMaze()}>
            <RefreshCw size={16} /> Play again
          </Button>
          <Link href="/#games" className="button button-outline">
            Back to games <ArrowRight size={16} />
          </Link>
        </div>
      </Dialog>
    </main>
  );
}
