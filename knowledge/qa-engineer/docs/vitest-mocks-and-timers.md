# Vitest: mocks and fake timers

Source: https://vitest.dev/api/vi (read 2026-11-25)

- `vi.useFakeTimers()` wraps `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, `setImmediate`, `clearImmediate` and `Date`
  until `vi.useRealTimers()`.
- `vi.advanceTimersByTimeAsync(ms)` fires timers until `ms` passes or the queue empties, including async ones.
- `vi.runAllTimersAsync()` runs every timer until the queue is empty (throws after 10 000 loops on endless intervals).
- `vi.useRealTimers()` restores real timers and discards scheduled ones.
- `vi.fn()` makes a spy. `vi.stubGlobal(name, value)` replaces a global; `vi.unstubAllGlobals()` restores them.
- `vi.restoreAllMocks()` restores spies made with `vi.spyOn`.

## Rule
Restore in `afterEach`: `vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks();`
