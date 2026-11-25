# Open Trivia DB client plan

Owner: opentdb-integration-expert (Pip). Date: 2026-11-25. Source: doc 01 and opentdb.com/api_config.php.

## Contract (`src/api/opentdb.ts`)
```ts
getCategories(deps): Promise<{ categories: Category[]; source: "live" | "cache" | "fallback" }>
fetchRound(categoryId: number | null, deps, opts?): Promise<RoundResult>
```
- `deps` injects `fetch`, `sleep`, `now` and `storage`. Tests need no network.
- Categories: live list first. Cache it in storage for 24 hours. Fall back to the 24-item table.
- Round: `amount=50`, `encode=url3986`, a session token, no `type` filter.
- One request in flight. At least 5 s between any two calls, measured with `now()`.
- The token is kept in storage. Drop it after 6 hours idle.

## Response codes
| Code | Action |
| --- | --- |
| 0 | Decode and return questions |
| 1 | Call `api_count.php`, retry with `min(50, total)`. Report `requested < 50` |
| 2 | Return `invalid-parameter` |
| 3 | Request a new token, retry once |
| 4 | Reset the token, retry once |
| 5 | Wait 5 s, retry (max 5 attempts in total) |
Network errors return `network`. Callers can pass an `AbortSignal` to cancel.

## Decoding
`decodeURIComponent` per field. Drop malformed items. Never `innerHTML`.

## CORS
Open question from doc 01. opentdb.com was not reachable from the build container.
The client handles a failed fetch as `network`. Confirm CORS on the first live deploy.
