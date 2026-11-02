"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Star,
  Flower2,
  Heart,
  Moon,
  Sun,
  Leaf,
  Diamond,
  Cloud,
  Music,
  Coffee,
  Zap,
  Anchor,
  Asterisk,
  RefreshCw,
  Check,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import {
  MiniGameFrame,
  GameStat,
  BestStat,
} from "@/components/mini-game-frame";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useBest } from "../shared/use-best";
import { useTimer } from "../shared/use-timer";
import { formatTime } from "../shared/clock";
import {
  createMemory,
  flipCard,
  clearMismatch,
  memoryComplete,
  symbols,
  type MemoryState,
} from "./engine";
const cardIcons = [
  Star,
  Flower2,
  Heart,
  Moon,
  Sun,
  Leaf,
  Diamond,
  Cloud,
  Music,
  Coffee,
  Zap,
  Anchor,
];
export default function MemoryGame() {
  const [state, setState] = useState(() => createMemory(8, "welcome-memory")),
    ref = useRef(state),
    [seed, setSeed] = useState("welcome-memory"),
    [helpOpen, setHelpOpen] = useState(false),
    [results, setResults] = useState(false),
    [finishedTime, setFinishedTime] = useState(0);
  const pairs = state.deck.length / 2,
    complete = memoryComplete(state),
    { best, record } = useBest(`memory:${pairs}`, "low"),
    started = state.turns > 0 || state.flipped.length > 0;
  const timer = useTimer(started && !complete && !helpOpen, seed);
  const update = useCallback((next: MemoryState) => {
    ref.current = next;
    setState(next);
  }, []);
  const reset = useCallback(
    (count: number) => {
      const nextSeed = crypto.randomUUID();
      setSeed(nextSeed);
      update(createMemory(count, nextSeed));
      setResults(false);
      setFinishedTime(0);
    },
    [update],
  );
  useEffect(() => {
    const id = setTimeout(() => reset(8), 0);
    return () => clearTimeout(id);
  }, [reset]);
  useEffect(() => {
    if (state.flipped.length !== 2) return;
    const id = setTimeout(() => update(clearMismatch(ref.current)), 700);
    return () => clearTimeout(id);
  }, [state.flipped, seed, update]);
  const flip = (id: number) => {
    if (helpOpen) return;
    const current = ref.current,
      next = flipCard(current, id);
    if (next === current) return;
    update(next);
    if (memoryComplete(next)) {
      setFinishedTime(timer.read());
      record(next.turns);
      setResults(true);
    }
  };
  return (
    <MiniGameFrame
      title="Memory Match"
      number="02"
      kicker="A LITTLE FOCUS GOES A LONG WAY"
      description="Turn a card. Find its other half. Give your memory a little moment."
      onHelpChange={setHelpOpen}
      help={
        <>
          <p>
            Reveal two cards at a time. Matching symbols stay face up; different
            symbols turn back after a moment.
          </p>
          <p>
            A turn counts when you reveal your second card. Find every pair to
            finish. Choose 6, 8, or 12 pairs for a different challenge.
          </p>
          <p>
            Use a mouse, touch, or Tab and Enter to flip cards. Your timer
            pauses in a hidden tab and while this guide is open. A new deck
            resets your run.
          </p>
        </>
      }
      toolbar={
        <>
          <div className="mini-option">
            <label htmlFor="memory-size">YOUR CHALLENGE</label>
            <select
              id="memory-size"
              value={pairs}
              onChange={(e) => reset(Number(e.target.value))}
            >
              <option value={6}>A little warm-up · 6 pairs</option>
              <option value={8}>Find your flow · 8 pairs</option>
              <option value={12}>Stretch your memory · 12 pairs</option>
            </select>
          </div>
          <Button onClick={() => reset(pairs)}>
            <RefreshCw size={16} /> New deck
          </Button>
        </>
      }
      stats={
        <>
          <GameStat
            label="Pairs reunited"
            value={`${state.matched.length / 2} / ${pairs}`}
            testId="memory-pairs"
          />
          <GameStat
            label="Turns taken"
            value={state.turns}
            testId="memory-turns"
          />
          <GameStat
            label="Time exploring"
            value={formatTime(complete ? finishedTime : timer.elapsed)}
            testId="memory-timer"
          />
          <BestStat label="Fewest turns" value={best} />
        </>
      }
      note={{
        title: "A familiar little feeling.",
        body: "Every card is a clue. Take your time, remember the little details, and let the pairs find each other.",
      }}
    >
      <div className="mini-board-top">
        <span className="eyebrow">{pairs} PAIRS. ONE LITTLE CHALLENGE.</span>
        <span className="mini-status" aria-live="polite">
          {complete
            ? "All together. Nicely done."
            : state.flipped.length === 2
              ? "A little moment to remember…"
              : "Find the matching symbols"}
        </span>
      </div>
      <div
        className={`memory-board memory-pairs-${pairs}`}
        role="group"
        aria-label="Memory cards"
        data-seed={seed}
      >
        {state.deck.map((card, index) => {
          const matched = state.matched.includes(card.id),
            visible = matched || state.flipped.includes(card.id),
            Icon = cardIcons[card.symbol];
          return (
            <button
              key={`${seed}:${card.id}`}
              className={`memory-card ${visible ? "is-revealed" : ""} ${matched ? "is-matched" : ""}`}
              disabled={matched}
              aria-label={`Card ${index + 1}${visible ? `: ${symbols[card.symbol]}${matched ? ", matched" : ""}` : ", face down"}`}
              aria-pressed={visible}
              onClick={() => flip(card.id)}
            >
              <span className="memory-card-back" aria-hidden="true">
                <Asterisk size={30} />
              </span>
              <span className="memory-card-face" aria-hidden="true">
                <Icon size={34} strokeWidth={1.5} />
                {matched && <Check size={11} className="match-check" />}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mini-board-caption">
        A click, a little curiosity, and a pair worth remembering.
      </p>
      {complete && (
        <Button
          variant="outline"
          className="center-button"
          onClick={() => setResults(true)}
        >
          View your result
        </Button>
      )}
      <Dialog
        open={results}
        onOpenChange={setResults}
        title="A perfect little reunion."
        description={`All ${pairs} pairs found. Your memory deserves a moment.`}
      >
        <div className="result-icon">
          <Flower2 size={40} />
        </div>
        <div className="result-stats">
          <div>
            <span>TURNS</span>
            <strong>{state.turns}</strong>
          </div>
          <div>
            <span>TIME</span>
            <strong>{formatTime(finishedTime)}</strong>
          </div>
        </div>
        <div className="result-actions">
          <Button onClick={() => reset(pairs)}>
            <RefreshCw size={16} /> Play again
          </Button>
          <Link href="/#games" className="button button-outline">
            Back to games <ArrowRight size={16} />
          </Link>
        </div>
      </Dialog>
    </MiniGameFrame>
  );
}
