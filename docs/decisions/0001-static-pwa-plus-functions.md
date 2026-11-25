# 0001 · Static PWA plus Netlify Functions

- Status: Accepted
- Date: 2026-11-25
- Decided by: project lead

## Context
The app needs a mobile front end, Claude API calls and GitHub commits. We want few moving parts.

## Decision
The Trivia App is a PWA on Netlify.
It has a static front end and Netlify Functions for the Claude and GitHub calls.
There are no other servers.

## Consequences
- The trivia game runs fully in the browser.
- All secrets live in Netlify Function env vars.
- Function time limits apply: 60 s sync and streaming, 15 min background.
- Any new server or service needs a new decision record.
