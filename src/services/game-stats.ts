export interface GameResult {
  gameId: string;
  shape: string;
  difficulty: string;
  milliseconds: number;
  moves: number;
  seed: string;
  completedAt: string;
}
export interface GameStatsService {
  personalBest(shape: string, difficulty: string): number | null;
  save(result: GameResult): void;
}
/** Replace this adapter with a cloud service when accounts become necessary. */
export const localGameStats: GameStatsService = {
  personalBest(shape, difficulty) {
    try {
      const raw = localStorage.getItem(`miniverse:best:${shape}:${difficulty}`);
      const n = Number(raw);
      return raw !== null && Number.isFinite(n) && n >= 0 ? n : null;
    } catch {
      return null;
    }
  },
  save(result) {
    try {
      const key = `miniverse:best:${result.shape}:${result.difficulty}`,
        best = this.personalBest(result.shape, result.difficulty);
      if (best === null || result.milliseconds < best)
        localStorage.setItem(key, String(result.milliseconds));
    } catch {
      /* Gameplay remains available when storage is disabled. */
    }
  },
};
