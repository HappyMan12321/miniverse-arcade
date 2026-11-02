"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RefreshCw, Apple, Trophy } from "lucide-react";
import {
  MiniGameFrame,
  GameStat,
  BestStat,
} from "@/components/mini-game-frame";
import { Button } from "@/components/ui/button";
import { DirectionPad } from "@/components/direction-pad";
import { useDirectionInput } from "../shared/use-direction-input";
import { useBest } from "../shared/use-best";
import type { Direction } from "../shared/types";
import { createSnake, opposite, stepSnake, type SnakeState } from "./engine";
const speeds = { cozy: 210, classic: 145, quick: 95 };
export default function SnakeGame() {
  const [state, setState] = useState(createSnake),
    ref = useRef(state),
    queued = useRef<Direction | null>(null),
    [speed, setSpeed] = useState<keyof typeof speeds>("classic"),
    arena = useRef<HTMLDivElement>(null);
  const { best, record } = useBest(`snake:${speed}`);
  const update = useCallback((next: SnakeState) => {
    ref.current = next;
    setState(next);
  }, []);
  const pause = useCallback(() => {
    if (ref.current.status === "running") {
      queued.current = null;
      update({ ...ref.current, status: "paused" });
    }
  }, [update]);
  const reset = () => {
    queued.current = null;
    update(createSnake());
  };
  const start = () => {
    if (ref.current.status === "ready" || ref.current.status === "paused") {
      update({ ...ref.current, status: "running" });
      arena.current?.focus();
    }
  };
  const turn = (direction: Direction) => {
    const current = ref.current;
    if (
      current.status !== "running" ||
      queued.current !== null ||
      direction === opposite[current.direction]
    )
      return;
    queued.current = direction;
  };
  const input = useDirectionInput(turn);
  useEffect(() => {
    if (state.status !== "running") return;
    const id = setInterval(() => {
      if (document.hidden) return;
      const current = ref.current,
        next = stepSnake(current, queued.current ?? current.direction);
      queued.current = null;
      update(next);
      if (next.status === "over" || next.status === "won") record(next.score);
    }, speeds[speed]);
    return () => clearInterval(id);
  }, [state.status, speed, update, record]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) pause();
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("blur", pause);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("blur", pause);
    };
  }, [pause]);
  const ended = state.status === "over" || state.status === "won";
  return (
    <MiniGameFrame
      title="Snake"
      number="03"
      kicker="A FAMILIAR FAVORITE. A FRESH LITTLE FOCUS."
      description="Follow your appetite. Find your rhythm. Leave a little room to grow."
      onHelpChange={(open) => {
        if (open) pause();
      }}
      help={
        <>
          <p>
            Eat the orange fruit to grow and earn 10 points. Stay inside the
            board and avoid your own body.
          </p>
          <p>
            Use the arrow keys, WASD, a swipe on the board, or the directional
            buttons. You can’t reverse into yourself. One turn is queued per
            movement tick so quick presses stay predictable.
          </p>
          <p>
            Space pauses or resumes when the board is focused. Switching tabs or
            leaving the window pauses your run; resume when you’re ready. Choose
            Cozy, Classic, or Quick for your preferred pace.
          </p>
        </>
      }
      toolbar={
        <>
          <div className="mini-option">
            <label htmlFor="snake-speed">FIND YOUR PACE</label>
            <select
              id="snake-speed"
              value={speed}
              onChange={(e) => {
                setSpeed(e.target.value as keyof typeof speeds);
                reset();
              }}
            >
              <option value="cozy">Cozy</option>
              <option value="classic">Classic</option>
              <option value="quick">Quick</option>
            </select>
          </div>
          <div className="mini-toolbar-actions">
            <Button
              variant="outline"
              onClick={() => (state.status === "running" ? pause() : start())}
              disabled={ended}
            >
              {state.status === "running" ? (
                <Pause size={16} />
              ) : (
                <Play size={16} />
              )}{" "}
              {state.status === "running"
                ? "Pause"
                : state.status === "paused"
                  ? "Resume"
                  : "Start"}
            </Button>
            <Button onClick={reset}>
              <RefreshCw size={16} /> New game
            </Button>
          </div>
        </>
      }
      stats={
        <>
          <GameStat
            label="Points collected"
            value={state.score}
            testId="snake-score"
          />
          <GameStat
            label="A little longer"
            value={`${state.body.length} segments`}
            testId="snake-length"
          />
          <GameStat
            label="Your pace"
            value={speed.charAt(0).toUpperCase() + speed.slice(1)}
          />
          <BestStat value={best} />
        </>
      }
      note={{
        title: "One turn at a time.",
        body: "Give yourself a little space. The best route is the one that leaves somewhere to go next.",
      }}
    >
      <div className="mini-board-top">
        <span className="eyebrow">
          <Apple size={13} /> A LITTLE ROOM TO GROW
        </span>
        <span className="mini-status" aria-live="polite">
          {state.status === "running"
            ? "Find your flow."
            : state.status === "paused"
              ? "Paused. Take your time."
              : ended
                ? "A good little run."
                : "Your next little obsession."}
        </span>
      </div>
      <div
        ref={arena}
        tabIndex={0}
        role="group"
        aria-label="Snake gameplay"
        className="snake-playfield gesture-board"
        data-status={state.status}
        {...input}
        onClick={() => arena.current?.focus()}
        onKeyDown={(e) => {
          if (e.key === " " && !(e.target instanceof HTMLButtonElement)) {
            e.preventDefault();
            if (ref.current.status === "running") pause();
            else start();
          } else input.onKeyDown(e);
        }}
      >
        <svg
          viewBox={`0 0 ${state.size} ${state.size}`}
          role="img"
          aria-label={`Snake board. Length ${state.body.length}, score ${state.score}.`}
        >
          <defs>
            <pattern
              id="snake-board-dots"
              width="1"
              height="1"
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx=".5"
                cy=".5"
                r=".025"
                fill="currentColor"
                opacity=".25"
              />
            </pattern>
          </defs>
          <rect
            width={state.size}
            height={state.size}
            fill="url(#snake-board-dots)"
          />
          {state.food && (
            <g
              transform={`translate(${state.food.x + 0.5} ${state.food.y + 0.5})`}
              className="snake-food"
            >
              <circle r=".29" />
              <path
                d="M 0 -.29 Q -.03 -.53 .2 -.43"
                fill="none"
                stroke="var(--green)"
                strokeWidth=".08"
                strokeLinecap="round"
              />
            </g>
          )}
          {state.body.map((p, i) => (
            <g key={`${p.x},${p.y}`} transform={`translate(${p.x} ${p.y})`}>
              <rect
                x=".07"
                y=".07"
                width=".86"
                height=".86"
                rx={i === 0 ? ".27" : ".17"}
                fill={i === 0 ? "var(--green)" : "var(--snake-body)"}
              />
              {i === 0 && (
                <g
                  transform={`rotate(${{ right: 0, down: 90, left: 180, up: 270 }[state.direction]} .5 .5)`}
                >
                  <circle cx=".68" cy=".31" r=".065" fill="var(--surface)" />
                  <circle cx=".68" cy=".69" r=".065" fill="var(--surface)" />
                </g>
              )}
            </g>
          ))}
        </svg>
        {state.status !== "running" && (
          <div className={`snake-overlay ${ended ? "is-ended" : ""}`}>
            <span className="eyebrow">
              {ended ? "A LITTLE WELL PLAYED" : "AT YOUR OWN PACE"}
            </span>
            <h2>
              {state.status === "ready"
                ? "Ready to grow?"
                : state.status === "paused"
                  ? "A little breather."
                  : state.status === "won"
                    ? "A full little universe."
                    : "One more little go?"}
            </h2>
            {ended ? (
              <>
                <p>
                  <Trophy size={17} /> {state.score} points ·{" "}
                  {state.body.length} segments
                </p>
                <Button onClick={reset}>
                  <RefreshCw size={16} /> Play again
                </Button>
              </>
            ) : (
              <Button onClick={start}>
                <Play size={16} />
                {state.status === "paused" ? "Keep growing" : "Let’s play"}
              </Button>
            )}
          </div>
        )}
      </div>
      <DirectionPad
        move={(direction) => {
          arena.current?.focus();
          turn(direction);
        }}
        disabled={state.status !== "running"}
      />
      <p className="mini-board-caption">
        Click the board to focus your keys. Space for a breather.
      </p>
    </MiniGameFrame>
  );
}
