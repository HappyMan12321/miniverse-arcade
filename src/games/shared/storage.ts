/** Only personal bests are persisted; storage is optional and never blocks play. */
export function readBest(key: string): number | null {
  try {
    const raw = localStorage.getItem(`miniverse:${key}`);
    const n = Number(raw);
    return raw !== null && Number.isFinite(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}
export function saveBest(
  key: string,
  value: number,
  order: "low" | "high" = "high",
): number {
  const best = readBest(key),
    next =
      best === null
        ? value
        : order === "high"
          ? Math.max(best, value)
          : Math.min(best, value);
  try {
    localStorage.setItem(`miniverse:${key}`, String(next));
  } catch {}
  return next;
}
