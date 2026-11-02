import type { Direction } from "../shared/types";
export interface BoardState {
  board: number[];
  score: number;
  won: boolean;
  over: boolean;
}
export interface SlideResult {
  board: number[];
  gained: number;
  changed: boolean;
}
export function mergeLine(line: number[]): { line: number[]; gained: number } {
  const values = line.filter(Boolean),
    result: number[] = [];
  let gained = 0;
  for (let i = 0; i < values.length; i++) {
    if (values[i] === values[i + 1]) {
      const value = values[i] * 2;
      result.push(value);
      gained += value;
      i++;
    } else result.push(values[i]);
  }
  while (result.length < line.length) result.push(0);
  return { line: result, gained };
}
export function slide(board: number[], direction: Direction): SlideResult {
  const result = [...board];
  let gained = 0;
  for (let line = 0; line < 4; line++) {
    const indices = Array.from({ length: 4 }, (_, i) =>
      direction === "left"
        ? line * 4 + i
        : direction === "right"
          ? line * 4 + 3 - i
          : direction === "up"
            ? i * 4 + line
            : (3 - i) * 4 + line,
    );
    const merged = mergeLine(indices.map((i) => board[i]));
    gained += merged.gained;
    indices.forEach((index, i) => {
      result[index] = merged.line[i];
    });
  }
  return {
    board: result,
    gained,
    changed: result.some((v, i) => v !== board[i]),
  };
}
export function spawnTile(
  board: number[],
  rng: () => number = Math.random,
): number[] {
  const empty = board.flatMap((value, i) => (value === 0 ? [i] : []));
  if (!empty.length) return [...board];
  const next = [...board],
    index = empty[Math.floor(rng() * empty.length)];
  next[index] = rng() < 0.9 ? 2 : 4;
  return next;
}
export function canMove(board: number[]): boolean {
  return (
    board.some((v) => v === 0) ||
    board.some(
      (value, i) =>
        (i % 4 < 3 && board[i + 1] === value) ||
        (i < 12 && board[i + 4] === value),
    )
  );
}
export function create2048(rng: () => number = Math.random): BoardState {
  return {
    board: spawnTile(spawnTile(Array(16).fill(0), rng), rng),
    score: 0,
    won: false,
    over: false,
  };
}
export function move2048(
  state: BoardState,
  direction: Direction,
  rng: () => number = Math.random,
): BoardState {
  if (state.over) return state;
  const moved = slide(state.board, direction);
  if (!moved.changed) return state;
  const board = spawnTile(moved.board, rng);
  return {
    board,
    score: state.score + moved.gained,
    won: state.won || board.some((v) => v >= 2048),
    over: !canMove(board),
  };
}
