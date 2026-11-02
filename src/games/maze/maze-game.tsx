"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Circle,
  Hexagon,
  Lightbulb,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Square,
  Triangle,
} from "lucide-react";
import {
  MiniGameFrame,
  GameStat,
  BestStat,
} from "@/components/mini-game-frame";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { localGameStats } from "@/services/game-stats";
import { ActiveClock, formatTime } from "./clock";
import { generateMaze, movementTarget, solution } from "./engine";
import { difficulties, shapes } from "./topology";
import { MazeRenderer } from "./maze-renderer";
import { MazeControls } from "./maze-controls";
import { mazeControls, directionForKey } from "./controls";
import type { Difficulty, Direction, MazeDefinition } from "./types";
const icons = {
  square: Square,
  triangle: Triangle,
  hexagon: Hexagon,
  circle: Circle,
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
  const shape = run.maze.shape;
  const controls = useMemo(
    () => mazeControls(run.maze, run.player),
    [run.maze, run.player],
  );
  const hint = showHint ? solution(run.maze, run.player).slice(0, 4) : [];
  return (
    <MiniGameFrame
      title="Maze Explorer"
      onHelpChange={(open) => {
        if (open) cancelRepeat();
      }}
      help={
        <>
          <p>Move the orange dot to the green diamond through open passages.</p>
          <p>
            <strong>Square:</strong> Arrow keys or WASD.
          </p>
          <p>
            <strong>Triangle:</strong> Use the three displayed directions. W/A/D
            for downward cells, Q/E/S for upward cells. Left/right arrows follow
            the diagonals.
          </p>
          <p>
            <strong>Hexagon:</strong> Q/E upper diagonals, A/D left/right, Z/C
            lower diagonals. Left/right arrow keys also work.
          </p>
          <p>
            <strong>Circle:</strong> In/Out move between rings; CCW/CW rotate
            around a ring. Arrow keys or WASD control these four actions. At two
            open outward branches, select Out CCW (Q/Z) or Out CW (E/X); Out
            does not pick a branch for you.
          </p>
          <p>
            Hold a direction button to repeat. Restart keeps the current layout;
            New maze changes it. The timer starts on your first move and pauses
            in a hidden tab.
          </p>
        </>
      }
      stats={
        <>
          <GameStat label="Time" value={formatTime(elapsed)} testId="timer" />
          <GameStat
            label="Moves"
            value={String(run.moves).padStart(2, "0")}
            testId="moves"
          />
          <BestStat value={best === null ? null : formatTime(best)} />
        </>
      }
      toolbar={
        <>
          <fieldset className="shape-fieldset">
            <legend className="sr-only">Maze shape</legend>
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
                    <span>{s[0].toUpperCase() + s.slice(1)}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="maze-action-row">
            <div className="difficulty-field">
              <label className="sr-only" htmlFor="difficulty">
                Difficulty
              </label>
              <select
                id="difficulty"
                value={run.maze.difficulty}
                onChange={(e) => newMaze(shape, e.target.value as Difficulty)}
              >
                {difficulties.map((d) => (
                  <option key={d} value={d}>
                    {d[0].toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={() => newMaze()}
              className="new-maze-button"
              aria-label="New maze"
            >
              <RefreshCw size={16} />
              <span>New maze</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Restart current maze"
              title="Restart"
              onClick={() => reset(run.maze)}
            >
              <RotateCcw size={18} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={run.paused ? "Resume game" : "Pause game"}
              title={run.paused ? "Resume" : "Pause"}
              disabled={run.complete}
              onClick={pause}
            >
              {run.paused ? <Play size={18} /> : <Pause size={18} />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={showHint ? "Hide hint" : "Hint"}
              title={showHint ? "Hide hint" : "Hint"}
              aria-pressed={showHint}
              onClick={() => setShowHint((v) => !v)}
              disabled={run.complete}
            >
              <Lightbulb size={18} />
            </Button>
          </div>
        </>
      }
    >
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
          const d = directionForKey(
            runRef.current.maze,
            runRef.current.player,
            e.key,
          );
          if (d !== undefined) {
            e.preventDefault();
            if (d) move(d);
          }
        }}
      >
        <div
          className="maze-canvas"
          data-testid="maze-canvas"
          onClick={() => arena.current?.focus()}
        >
          <div className={run.paused ? "maze-inner is-paused" : "maze-inner"}>
            <MazeRenderer
              maze={run.maze}
              player={run.player}
              trail={run.trail}
              hint={hint}
            />
          </div>
          {run.paused && (
            <div className="pause-overlay">
              <h2>Paused</h2>
              <Button onClick={pause}>
                <Play size={17} /> Resume
              </Button>
            </div>
          )}
        </div>
        <div className="maze-bottom">
          <span>
            <span className="player-legend" /> You
          </span>
          <span>
            <span className="exit-legend" /> Exit
          </span>
        </div>
        <MazeControls
          shape={shape}
          controls={controls}
          disabled={run.complete || run.paused}
          onPress={(d) => {
            arena.current?.focus();
            cancelRepeat();
            move(d);
            if (!runRef.current.complete)
              repeat.current = setInterval(() => move(d), 145);
          }}
          onRelease={cancelRepeat}
          onActivate={(d) => {
            arena.current?.focus();
            move(d);
          }}
        />
      </div>
      {run.complete && (
        <Button
          variant="outline"
          className="center-button"
          onClick={() => setResults(true)}
        >
          Results
        </Button>
      )}
      <Dialog
        open={results}
        onOpenChange={setResults}
        title="Maze completed"
        description={`${shape[0].toUpperCase() + shape.slice(1)} · ${run.maze.difficulty}`}
      >
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
          <p className="new-best">New best time</p>
        )}
        <div className="result-actions">
          <Button onClick={() => newMaze()}>
            <RefreshCw size={16} /> Play again
          </Button>
          <Link href="/#games" className="button button-outline">
            Arcade <ArrowRight size={16} />
          </Link>
        </div>
      </Dialog>
    </MiniGameFrame>
  );
}
