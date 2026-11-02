import { describe, it, expect } from "vitest";
import {
  createMemory,
  flipCard,
  clearMismatch,
  memoryComplete,
} from "./engine";
describe("Memory Match", () => {
  for (const pairs of [6, 8, 12])
    it(`${pairs} pairs form a shuffled, completable deck`, () => {
      const game = createMemory(pairs, "test");
      expect(game).toEqual(createMemory(pairs, "test"));
      expect(new Set(game.deck.map((c) => c.id)).size).toBe(pairs * 2);
      for (let i = 0; i < pairs; i++)
        expect(game.deck.filter((c) => c.symbol === i)).toHaveLength(2);
      let state = game;
      for (let i = 0; i < pairs; i++)
        for (const c of game.deck.filter((c) => c.symbol === i))
          state = flipCard(state, c.id);
      expect(memoryComplete(state)).toBe(true);
      expect(state.turns).toBe(pairs);
      expect(flipCard(state, state.deck[0].id)).toBe(state);
    });
  it("rejects duplicate flips and locks a mismatch until cleared", () => {
    const game = createMemory(6, "test"),
      first = game.deck[0],
      other = game.deck.find((c) => c.symbol !== first.symbol)!;
    const once = flipCard(game, first.id);
    expect(flipCard(once, first.id)).toBe(once);
    const twice = flipCard(once, other.id);
    expect(twice.turns).toBe(1);
    expect(twice.matched).toHaveLength(0);
    expect(flipCard(twice, game.deck[3].id)).toBe(twice);
    const cleared = clearMismatch(twice);
    expect(cleared.flipped).toHaveLength(0);
    expect(cleared.turns).toBe(1);
  });
  it("changes layout across seeds and preserves the source state", () => {
    const initial = createMemory(8, "a");
    expect(createMemory(8, "b").deck).not.toEqual(initial.deck);
    flipCard(initial, initial.deck[0].id);
    expect(initial.flipped).toEqual([]);
  });
});
