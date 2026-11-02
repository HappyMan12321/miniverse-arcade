import { describe, it, expect } from "vitest";
import {
  mergeLine,
  slide,
  spawnTile,
  canMove,
  create2048,
  move2048,
  type BoardState,
} from "./engine";
import type { Direction } from "../shared/types";
describe("2048", () => {
  it.each([
    [[2, 2, 2, 2], [4, 4, 0, 0], 8],
    [[2, 2, 4, 0], [4, 4, 0, 0], 4],
    [[4, 0, 4, 4], [8, 4, 0, 0], 8],
    [[0, 0, 0, 0], [0, 0, 0, 0], 0],
  ])("merges %j only once per tile", (input, output, gained) => {
    expect(mergeLine(input as number[])).toEqual({ line: output, gained });
  });
  it.each(["left", "right", "up", "down"] as Direction[])(
    "conserves tile sum when sliding %s",
    (d) => {
      const board = [2, 0, 2, 4, 4, 4, 8, 8, 0, 2, 0, 2, 2, 0, 0, 2],
        moved = slide(board, d);
      expect(moved.board.reduce((a, b) => a + b, 0)).toBe(
        board.reduce((a, b) => a + b, 0),
      );
      expect(board[0]).toBe(2);
    },
  );
  it("merges vertical and reverse lines in the correct order", () => {
    const b = [2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0];
    expect(slide(b, "down").board).toEqual([
      0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0,
    ]);
    expect(
      slide([2, 2, 4, 0, ...Array(12).fill(0)], "right").board.slice(0, 4),
    ).toEqual([0, 0, 4, 4]);
  });
  it("only spawns a tile after a valid move", () => {
    const s: BoardState = {
      board: [2, ...Array(15).fill(0)],
      score: 0,
      over: false,
      won: false,
    };
    expect(move2048(s, "left")).toBe(s);
    const n = move2048(s, "right", () => 0);
    expect(n.board.filter(Boolean)).toHaveLength(2);
    expect(n.board[3]).toBe(2);
    expect(n.board[0]).toBe(2);
  });
  it("recognizes full blocked boards and available merges", () => {
    const board = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
    expect(canMove(board)).toBe(false);
    const next = [...board];
    next[0] = 4;
    expect(canMove(next)).toBe(true);
    expect(canMove([...board.slice(0, 15), 0])).toBe(true);
    expect(spawnTile(board)).toEqual(board);
  });
  it("detects reaching 2048 without ending a playable run", () => {
    const state: BoardState = {
      board: [1024, 1024, ...Array(14).fill(0)],
      score: 0,
      won: false,
      over: false,
    };
    const n = move2048(state, "left", () => 0);
    expect(n.won).toBe(true);
    expect(n.over).toBe(false);
    expect(n.score).toBe(2048);
  });
  it("starts with exactly two tiles and can spawn a four", () => {
    expect(create2048(() => 0).board.filter(Boolean)).toEqual([2, 2]);
    expect(spawnTile(Array(16).fill(0), () => 0.95).filter(Boolean)).toEqual([
      4,
    ]);
  });
  it("flags the last legal move as game over after its spawn", () => {
    const state: BoardState = {
      board: [2, 2, 8, 16, 8, 16, 32, 64, 16, 32, 64, 128, 32, 64, 128, 256],
      score: 0,
      won: false,
      over: false,
    };
    const n = move2048(state, "left", () => 0.99);
    expect(n.over).toBe(true);
    expect(n.score).toBe(4);
  });
});
