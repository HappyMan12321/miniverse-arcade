"use client";
import { useRef, useState } from "react";
import { RefreshCw, Undo2, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import {
  MiniGameFrame,
  GameStat,
  BestStat,
} from "@/components/mini-game-frame";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DirectionPad } from "@/components/direction-pad";
import { useDirectionInput } from "../shared/use-direction-input";
import { useBest } from "../shared/use-best";
import type { Direction } from "../shared/types";
import { random } from "@/lib/random";
import { create2048, move2048, type BoardState } from "./engine";
interface Run {
  game: BoardState;
  previous: BoardState | null;
  moves: number;
  continued: boolean;
}
const initial = () => ({
  game: create2048(random("welcome-2048")),
  previous: null,
  moves: 0,
  continued: false,
});
export default function BoardGame() {
  const [run, setRun] = useState<Run>(initial),
    ref = useRef(run),
    arena = useRef<HTMLDivElement>(null),
    [helpOpen, setHelpOpen] = useState(false),
    [dismissed, setDismissed] = useState(false),
    { best, record } = useBest("2048");
  const update = (next: Run) => {
    ref.current = next;
    setRun(next);
  };
  const reset = () => {
    update({ game: create2048(), previous: null, moves: 0, continued: false });
    setDismissed(false);
    arena.current?.focus();
  };
  const move = (direction: Direction) => {
    const current = ref.current;
    if (
      helpOpen ||
      current.game.over ||
      (current.game.won && !current.continued)
    )
      return;
    const next = move2048(current.game, direction);
    if (next === current.game) return;
    update({
      ...current,
      game: next,
      previous: current.game,
      moves: current.moves + 1,
    });
    setDismissed(false);
    record(next.score);
  };
  const undo = () => {
    const current = ref.current;
    if (!current.previous) return;
    update({
      ...current,
      game: current.previous,
      previous: null,
      moves: Math.max(0, current.moves - 1),
      continued: current.previous.won && current.continued,
    });
    setDismissed(false);
    arena.current?.focus();
  };
  const input = useDirectionInput(move),
    win = run.game.won && !run.continued,
    over = run.game.over,
    dialog = (win || over) && !dismissed;
  const closeResult = (open: boolean) => {
    if (!open) {
      setDismissed(true);
      if (win) update({ ...ref.current, continued: true });
    }
  };
  return (
    <MiniGameFrame
      title="2048"
      onHelpChange={setHelpOpen}
      help={
        <>
          <p>
            Slide all tiles in one direction using the arrow keys, WASD, swipe
            gestures, or the buttons below.
          </p>
          <p>
            Equal neighbors combine: 2 + 2 becomes 4. Each tile merges only once
            per move, and each merge adds its new value to your score. A valid
            move adds a new 2 or, occasionally, 4 tile.
          </p>
          <p>
            Reach 2048 to win, then keep going if you like. Your run ends when
            the board is full and no neighboring tiles can merge. Undo takes
            back your most recent move and its new tile, once. A new game starts
            fresh.
          </p>
        </>
      }
      toolbar={
        <>
          <div className="mini-toolbar-actions">
            <Button variant="outline" onClick={undo} disabled={!run.previous}>
              <Undo2 size={16} /> Undo
            </Button>
            <Button onClick={reset}>
              <RefreshCw size={16} /> New game
            </Button>
          </div>
        </>
      }
      stats={
        <>
          <GameStat label="Score" value={run.game.score} testId="2048-score" />
          <GameStat
            label="Max tile"
            value={Math.max(...run.game.board)}
            testId="2048-highest"
          />
          <GameStat label="Moves" value={run.moves} testId="2048-moves" />
          <BestStat value={best} />
        </>
      }
    >
      <div
        ref={arena}
        tabIndex={0}
        role="group"
        aria-label="2048 gameplay"
        className="board-2048 gesture-board"
        {...input}
        onClick={() => arena.current?.focus()}
      >
        <div className="tile-grid" role="grid" aria-label="2048 tile grid">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} role="row" className="tile-row">
              {run.game.board
                .slice(row * 4, row * 4 + 4)
                .map((value, column) => {
                  const i = row * 4 + column;
                  return (
                    <div
                      key={i}
                      role="gridcell"
                      aria-label={`Row ${row + 1}, column ${column + 1}: ${value || "empty"}`}
                      data-value={value}
                      className={`tile-2048 tile-value-${Math.min(value, 2048)}`}
                    >
                      <span key={`${i}:${value}`}>{value || ""}</span>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
      <DirectionPad
        move={(direction) => {
          arena.current?.focus();
          move(direction);
        }}
        disabled={over || win}
      />
      {over && dismissed && (
        <Button
          variant="outline"
          className="center-button"
          onClick={() => setDismissed(false)}
        >
          Results
        </Button>
      )}
      <Dialog
        open={dialog}
        onOpenChange={closeResult}
        title={win ? "You win" : "Game over"}
        description={win ? "2048 reached." : "No moves remaining."}
      >
        <div className="result-icon">
          <Sparkles size={40} />
        </div>
        <div className="result-stats">
          <div>
            <span>SCORE</span>
            <strong>{run.game.score}</strong>
          </div>
          <div>
            <span>HIGHEST TILE</span>
            <strong>{Math.max(...run.game.board)}</strong>
          </div>
        </div>
        <div className="result-actions">
          {win ? (
            <Button onClick={() => closeResult(false)}>
              Keep playing <ArrowRight size={16} />
            </Button>
          ) : (
            <Button onClick={reset}>
              <RefreshCw size={16} /> Play again
            </Button>
          )}
          {!win && run.previous ? (
            <Button variant="outline" onClick={undo}>
              <Undo2 size={16} /> Undo last move
            </Button>
          ) : (
            <Link href="/#games" className="button button-outline">
              Back to games
            </Link>
          )}
        </div>
      </Dialog>
    </MiniGameFrame>
  );
}
