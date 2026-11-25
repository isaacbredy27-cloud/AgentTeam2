// Wait at least 5 s between Open Trivia DB calls. Used to show fake timers in Vitest.
export const MIN_GAP_MS = 5000;

export function createLimiter(now: () => number = Date.now) {
  let last = -Infinity;
  return async function wait(): Promise<void> {
    const gap = last + MIN_GAP_MS - now();
    if (gap > 0) await new Promise((r) => setTimeout(r, gap));
    last = now();
  };
}
