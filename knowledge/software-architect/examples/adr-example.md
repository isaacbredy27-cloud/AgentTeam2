# EXAMPLE ONLY — not a project decision

This shows what a good ADR looks like. Copy the shape, not the content.

# 0006 · Store score history in localStorage, not IndexedDB

- Status: Proposed
- Date: 2026-11-25

## Context
Players want to see their best score per topic. Each round record is about 80 bytes.
We keep the last 200 rounds, so about 16 KB. `localStorage` is synchronous and string-only.
IndexedDB is asynchronous and suits large or structured data. Safari may clear site data for sites not used for a while.
No server storage exists for players (decision 0001).

## Decision
We will store score history as one JSON array in `localStorage` under `trivia.history.v1`.
We will wrap every read and write in try/catch and treat failure as "no history".

## Consequences
- Good: tiny code, no async setup, easy tests.
- Bad: blocks the main thread briefly on read; fine at 16 KB.
- Bad: history can vanish on iOS or in private mode. We tell no one it is permanent.
- Neutral: moving to IndexedDB later needs a one-time migration keyed on `v1`.
