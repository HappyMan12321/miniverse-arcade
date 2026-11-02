"use client";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { MazeJoystick } from "./maze-joystick";
import { joystickTarget, JOYSTICK_DEAD_ZONE } from "./joystick";
import { STEP_DURATION, joystickStepDuration, type MotionStep } from "./motion";
import { mazeControls, directionForKey } from "./controls";
import type { Difficulty, Direction, MazeDefinition, Point } from "./types";
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
type HeldInput =
  | { kind: "direction"; direction: Direction }
  | { kind: "keyboard"; key: string }
  | { kind: "joystick"; vector: Point };
export default function MazeGame() {
  const [run, setRun] = useState<Run>(() => initialRun(defaultMaze)),
    runRef = useRef(run);
  const [elapsed, setElapsed] = useState(0),
    [showHint, setShowHint] = useState(false),
    [results, setResults] = useState(false),
    [best, setBest] = useState<number | null>(null),
    [motion, setMotion] = useState<MotionStep | null>(null),
    [inputMode, setInputMode] = useState<"buttons" | "joystick">("buttons"),
    [inputEpoch, setInputEpoch] = useState(0);
  const clock = useRef(new ActiveClock()),
    arena = useRef<HTMLDivElement>(null),
    active = useRef<MotionStep | null>(null),
    sequence = useRef(0),
    queue = useRef<Direction[]>([]),
    held = useRef<HeldInput | null>(null),
    helpOpen = useRef(false),
    pumpRef = useRef<(at: number) => void>(() => {});
  const update = useCallback((next: Run) => {
    runRef.current = next;
    setRun(next);
  }, []);
  const cancelInputs = useCallback(() => {
    held.current = null;
    queue.current = [];
  }, []);
  const stopPointer = useCallback(() => {
    if (held.current?.kind === "direction") held.current = null;
  }, []);
  const completeRun = useCallback(() => {
    const current = runRef.current;
    if (current.complete) return;
    clock.current.pause();
    const ms = clock.current.read();
    setElapsed(ms);
    cancelInputs();
    setMotion(null);
    setInputEpoch((n) => n + 1);
    update({ ...current, complete: true, paused: false });
    setResults(!helpOpen.current);
    localGameStats.save({
      gameId: "maze",
      shape: current.maze.shape,
      difficulty: current.maze.difficulty,
      milliseconds: ms,
      moves: current.moves,
      seed: current.maze.seed,
      completedAt: new Date().toISOString(),
    });
  }, [cancelInputs, update]);
  const beginStep = useCallback(
    (target: string, duration: number, at: number) => {
      const current = runRef.current,
        cell = current.maze.cells.find((c) => c.id === current.player)!;
      if (
        active.current ||
        current.complete ||
        current.paused ||
        document.hidden ||
        helpOpen.current ||
        !cell.passages.includes(target)
      )
        return;
      const step: MotionStep = {
        id: ++sequence.current,
        mazeId: current.maze.id,
        fromCellId: current.player,
        toCellId: target,
        from: cell.geometry.center,
        to: current.maze.cells.find((c) => c.id === target)!.geometry.center,
        startedAt: at,
        duration,
      };
      active.current = step;
      clock.current.start();
      update({
        ...current,
        player: target,
        moves: current.moves + 1,
        trail: [...current.trail, target],
      });
      setMotion(step);
    },
    [update],
  );
  const pump = useCallback(
    (at: number) => {
      const current = runRef.current;
      if (
        active.current ||
        current.complete ||
        current.paused ||
        document.hidden ||
        helpOpen.current
      )
        return;
      while (queue.current.length) {
        const direction = queue.current.shift()!,
          target = movementTarget(current.maze, current.player, direction);
        if (target) {
          beginStep(target, STEP_DURATION, at);
          return;
        }
      }
      const input = held.current;
      if (!input) return;
      if (input.kind === "joystick") {
        const target = joystickTarget(
          current.maze,
          current.player,
          input.vector,
        );
        if (target)
          beginStep(
            target,
            joystickStepDuration(Math.hypot(input.vector.x, input.vector.y)),
            at,
          );
        return;
      }
      const direction =
        input.kind === "direction"
          ? input.direction
          : directionForKey(current.maze, current.player, input.key);
      if (direction) {
        const target = movementTarget(current.maze, current.player, direction);
        if (target) beginStep(target, STEP_DURATION, at);
      }
    },
    [beginStep],
  );
  useLayoutEffect(() => {
    pumpRef.current = pump;
  }, [pump]);
  const finishStep = useCallback(
    (id: number, at: number) => {
      const step = active.current;
      if (!step || step.id !== id || step.mazeId !== runRef.current.maze.id)
        return;
      active.current = null;
      setMotion(null);
      if (runRef.current.player === runRef.current.maze.exitCellId) {
        completeRun();
        return;
      }
      // Carry a normal frame's remainder into the next segment without catching up
      // an arbitrarily long background/slow frame in a burst of movements.
      pumpRef.current(Math.max(at, performance.now() - 32));
    },
    [completeRun],
  );
  const settleStep = useCallback(() => {
    if (!active.current) return;
    active.current = null;
    setMotion(null);
    if (runRef.current.player === runRef.current.maze.exitCellId) completeRun();
  }, [completeRun]);
  const reset = useCallback(
    (maze: MazeDefinition) => {
      cancelInputs();
      active.current = null;
      setMotion(null);
      setInputEpoch((n) => n + 1);
      clock.current.reset();
      setElapsed(0);
      setShowHint(false);
      setResults(false);
      setBest(localGameStats.personalBest(maze.shape, maze.difficulty));
      update(initialRun(maze));
    },
    [cancelInputs, update],
  );
  useEffect(() => {
    // Restore browser-only preferences after hydration.
    /* eslint-disable react-hooks/set-state-in-effect -- Restore persisted browser settings. */
    try {
      const saved = localStorage.getItem("miniverse:maze-input");
      if (saved === "buttons" || saved === "joystick") setInputMode(saved);
      const prefs = JSON.parse(
        localStorage.getItem("miniverse:maze-preferences") ?? "null",
      );
      reset(
        generateMaze(
          prefs && shapes.includes(prefs.shape) ? prefs.shape : "square",
          prefs && difficulties.includes(prefs.difficulty)
            ? prefs.difficulty
            : "easy",
          crypto.randomUUID(),
        ),
      );
    } catch {
      reset(generateMaze("square", "easy", crypto.randomUUID()));
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [reset]);
  useEffect(() => {
    const visibility = () => {
      cancelInputs();
      setInputEpoch((n) => n + 1);
      if (document.hidden) {
        clock.current.pause();
        settleStep();
      } else if (
        runRef.current.moves > 0 &&
        !runRef.current.complete &&
        !runRef.current.paused
      )
        clock.current.start();
      setElapsed(clock.current.read());
    };
    const ticker = setInterval(() => setElapsed(clock.current.read()), 100);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", cancelInputs);
    window.addEventListener("pointerup", stopPointer);
    window.addEventListener("pointercancel", cancelInputs);
    return () => {
      clearInterval(ticker);
      cancelInputs();
      active.current = null;
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", cancelInputs);
      window.removeEventListener("pointerup", stopPointer);
      window.removeEventListener("pointercancel", cancelInputs);
    };
  }, [cancelInputs, settleStep, stopPointer]);
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
  const move = useCallback((direction: Direction) => {
    if (
      runRef.current.complete ||
      runRef.current.paused ||
      document.hidden ||
      helpOpen.current
    )
      return;
    if (queue.current.length < 8) queue.current.push(direction);
    pumpRef.current(performance.now());
  }, []);
  const joystick = useCallback((vector: Point | null) => {
    if (!vector || Math.hypot(vector.x, vector.y) < JOYSTICK_DEAD_ZONE) {
      if (held.current?.kind === "joystick") held.current = null;
      return;
    }
    if (runRef.current.complete || runRef.current.paused || helpOpen.current)
      return;
    held.current = { kind: "joystick", vector };
    pumpRef.current(performance.now());
  }, []);
  const pause = () => {
    cancelInputs();
    setInputEpoch((n) => n + 1);
    clock.current.pause();
    settleStep();
    if (runRef.current.complete) return;
    const paused = !runRef.current.paused;
    update({ ...runRef.current, paused });
    if (!paused && runRef.current.moves > 0 && !document.hidden)
      clock.current.start();
  };
  const changeInput = (mode: "buttons" | "joystick") => {
    cancelInputs();
    setInputEpoch((n) => n + 1);
    setInputMode(mode);
    try {
      localStorage.setItem("miniverse:maze-input", mode);
    } catch {}
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
        helpOpen.current = open;
        cancelInputs();
        setInputEpoch((n) => n + 1);
        if (!open && runRef.current.complete) setResults(true);
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
            Hold a direction button or select Joystick and drag toward an
            opening. Release to stop after the current cell. At a fork, steer
            toward the branch you want; a blocked direction never selects
            another opening. Restart keeps the current layout; New maze changes
            it. The timer starts on your first move and pauses in a hidden tab.
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
        className={`maze-area input-${inputMode}`}
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
            if (d) {
              if (!e.repeat) {
                held.current = { kind: "keyboard", key: e.key.toLowerCase() };
                move(d);
              } else if (!active.current) pumpRef.current(performance.now());
            }
          }
        }}
        onKeyUp={(e) => {
          if (
            held.current?.kind === "keyboard" &&
            held.current.key === e.key.toLowerCase()
          )
            held.current = null;
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
              motion={motion}
              onArrival={finishStep}
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
          <div className="maze-legend">
            <span>
              <span className="player-legend" /> You
            </span>
            <span>
              <span className="exit-legend" /> Exit
            </span>
          </div>
          <div
            className="maze-input-modes"
            role="group"
            aria-label="Movement input"
          >
            <button
              type="button"
              aria-pressed={inputMode === "buttons"}
              onClick={() => changeInput("buttons")}
            >
              Buttons
            </button>
            <button
              type="button"
              aria-pressed={inputMode === "joystick"}
              onClick={() => changeInput("joystick")}
            >
              Joystick
            </button>
          </div>
        </div>
        {inputMode === "joystick" ? (
          <MazeJoystick
            key={`${run.maze.id}:${run.paused}:${run.complete}:${inputEpoch}`}
            maze={run.maze}
            player={run.player}
            disabled={run.complete || run.paused}
            onChange={joystick}
            onFocus={() => {
              cancelInputs();
              arena.current?.focus({ preventScroll: true });
            }}
          />
        ) : (
          <MazeControls
            shape={shape}
            controls={controls}
            disabled={run.complete || run.paused}
            onPress={(d) => {
              arena.current?.focus({ preventScroll: true });
              cancelInputs();
              held.current = { kind: "direction", direction: d };
              move(d);
            }}
            onRelease={stopPointer}
            onActivate={(d) => {
              arena.current?.focus({ preventScroll: true });
              move(d);
            }}
          />
        )}
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
