import { describe, it, expect } from "vitest";
import { createSnake, stepSnake, placeFood, type SnakeState } from "./engine";
const running = (): SnakeState => ({ ...createSnake(), status: "running" });
describe("Snake", () => {
  it("moves once per tick, rejects reverse, and leaves source state unchanged", () => {
    const game = running(),
      next = stepSnake(game, "left");
    expect(next.body[0]).toEqual({ x: 8, y: 7 });
    expect(next.direction).toBe("right");
    expect(game.body[0]).toEqual({ x: 7, y: 7 });
    expect(next.body).toHaveLength(3);
  });
  it("grows and scores only when eating; food never overlaps the body", () => {
    let s = running();
    for (let i = 0; i < 3; i++) s = stepSnake(s, "right", () => 0);
    expect(s.score).toBe(10);
    expect(s.body).toHaveLength(4);
    expect(s.body).not.toContainEqual(s.food);
  });
  it("ends on wall collision and respects pause", () => {
    const s = {
      ...running(),
      body: [
        { x: 13, y: 7 },
        { x: 12, y: 7 },
        { x: 11, y: 7 },
      ],
    };
    expect(stepSnake(s).status).toBe("over");
    const paused = { ...s, status: "paused" as const };
    expect(stepSnake(paused)).toBe(paused);
  });
  it("detects body collision but allows entering the departing tail", () => {
    const s: SnakeState = {
      ...running(),
      direction: "up",
      body: [
        { x: 2, y: 2 },
        { x: 1, y: 2 },
        { x: 1, y: 3 },
        { x: 2, y: 3 },
      ],
    };
    expect(stepSnake(s, "down").body[0]).toEqual({ x: 2, y: 1 });
    const looping = { ...s, direction: "right" as const };
    expect(stepSnake(looping, "down").status).toBe("running");
    const collision = {
      ...s,
      body: [...s.body, { x: 2, y: 1 }, { x: 3, y: 1 }],
    };
    expect(stepSnake(collision, "up").status).toBe("over");
  });
  it("wins when the last free cell is eaten", () => {
    const s: SnakeState = {
      size: 2,
      body: [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ],
      direction: "up",
      food: { x: 1, y: 0 },
      score: 0,
      status: "running",
    };
    const next = stepSnake(s, "right");
    expect(next.status).toBe("won");
    expect(next.food).toBeNull();
    expect(next.score).toBe(10);
  });
  it("chooses every free cell without retry loops", () => {
    const body = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ];
    expect(placeFood(body, 2, () => 0.999)).toEqual({ x: 1, y: 1 });
    expect(placeFood([...body, { x: 1, y: 1 }], 2)).toBeNull();
  });
});
