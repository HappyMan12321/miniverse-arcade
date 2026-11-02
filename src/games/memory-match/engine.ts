import { random } from "@/lib/random";
export const symbols = [
  "Star",
  "Flower",
  "Heart",
  "Moon",
  "Sun",
  "Leaf",
  "Diamond",
  "Cloud",
  "Music",
  "Coffee",
  "Zap",
  "Anchor",
] as const;
export interface Card {
  id: number;
  symbol: number;
}
export interface MemoryState {
  deck: Card[];
  flipped: number[];
  matched: number[];
  turns: number;
}
export function createMemory(pairs: number, seed: string): MemoryState {
  const rng = random(seed),
    deck = Array.from({ length: pairs * 2 }, (_, i) => ({
      id: i,
      symbol: Math.floor(i / 2),
    }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return { deck, flipped: [], matched: [], turns: 0 };
}
export function flipCard(state: MemoryState, id: number): MemoryState {
  if (
    state.flipped.length === 2 ||
    state.flipped.includes(id) ||
    state.matched.includes(id) ||
    !state.deck.some((c) => c.id === id)
  )
    return state;
  const flipped = [...state.flipped, id];
  if (flipped.length === 1) return { ...state, flipped };
  const a = state.deck.find((c) => c.id === flipped[0])!,
    b = state.deck.find((c) => c.id === flipped[1])!;
  return a.symbol === b.symbol
    ? {
        ...state,
        turns: state.turns + 1,
        matched: [...state.matched, ...flipped],
        flipped: [],
      }
    : { ...state, turns: state.turns + 1, flipped };
}
export function clearMismatch(state: MemoryState): MemoryState {
  return state.flipped.length === 2 ? { ...state, flipped: [] } : state;
}
export function memoryComplete(state: MemoryState) {
  return state.matched.length === state.deck.length;
}
