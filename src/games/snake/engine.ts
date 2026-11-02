import type { Direction } from "../shared/types";
export interface Point {
  x: number;
  y: number;
}
export interface SnakeState {
  size: number;
  body: Point[];
  direction: Direction;
  food: Point | null;
  score: number;
  status: "ready" | "running" | "paused" | "over" | "won";
}
const vectors: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
export const opposite: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};
export function same(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}
export function placeFood(
  body: Point[],
  size: number,
  rng: () => number = Math.random,
): Point | null {
  const free: Point[] = [];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      if (!body.some((p) => same(p, { x, y }))) free.push({ x, y });
  return free.length ? free[Math.floor(rng() * free.length)] : null;
}
export function createSnake(size = 14): SnakeState {
  const mid = Math.floor(size / 2);
  return {
    size,
    body: [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
    ],
    direction: "right",
    food: { x: mid + 3, y: mid },
    score: 0,
    status: "ready",
  };
}
export function stepSnake(
  state: SnakeState,
  requested: Direction = state.direction,
  rng: () => number = Math.random,
): SnakeState {
  if (state.status !== "running") return state;
  const direction =
      requested === opposite[state.direction] ? state.direction : requested,
    delta = vectors[direction],
    head = { x: state.body[0].x + delta.x, y: state.body[0].y + delta.y },
    eat = state.food !== null && same(head, state.food);
  // A departing tail is free on the same tick unless this move grows the snake.
  const collisionBody = eat ? state.body : state.body.slice(0, -1);
  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x >= state.size ||
    head.y >= state.size ||
    collisionBody.some((p) => same(p, head))
  )
    return { ...state, direction, status: "over" };
  const body = [head, ...state.body];
  if (!eat) body.pop();
  const food = eat ? placeFood(body, state.size, rng) : state.food;
  return {
    ...state,
    body,
    direction,
    food,
    score: state.score + (eat ? 10 : 0),
    status: food === null ? "won" : "running",
  };
}
