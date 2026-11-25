# 0003 · Approve commits straight to main

- Status: Accepted
- Date: 2026-11-25
- Decided by: project lead

## Context
An approved Agent Console proposal must reach production. Options were a pull request or a direct commit.

## Decision
Approve commits straight to `main`. No pull request step.

## Consequences
- Every approval deploys to production at once, through Netlify's Git deploy.
- The Approve click is the only review. The diff view must show every file in full.
- Approve asks for confirmation: "Commit N files to main?"
- Base-SHA checks stop stale proposals from overwriting newer work.
- A bad change is undone by Netlify rollback, then a revert commit.
- Path rules matter more. Agents still cannot touch functions, config, agent files, CI, dependencies or `sw.js`.
