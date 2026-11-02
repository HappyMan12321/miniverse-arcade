/** Active play only: pauses while hidden, manually paused, or after completion. */
export class ActiveClock {
  private accumulated = 0;
  private since: number | null = null;
  constructor(private now: () => number = () => performance.now()) {}
  start() {
    if (this.since === null) this.since = this.now();
  }
  pause() {
    if (this.since !== null) {
      this.accumulated += this.now() - this.since;
      this.since = null;
    }
  }
  reset() {
    this.accumulated = 0;
    this.since = null;
  }
  read() {
    return (
      this.accumulated + (this.since === null ? 0 : this.now() - this.since)
    );
  }
}
export function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
