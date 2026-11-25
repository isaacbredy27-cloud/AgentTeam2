import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { createLimiter, MIN_GAP_MS } from "./retry-wait.ts";

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-25T12:00:00Z")); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

test("first call is immediate, second waits the full 5 seconds", async () => {
  const wait = createLimiter();
  await wait();

  const done = vi.fn();
  const second = wait().then(done);
  await vi.advanceTimersByTimeAsync(MIN_GAP_MS - 1);
  expect(done).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  await second;
  expect(done).toHaveBeenCalledOnce();
});
