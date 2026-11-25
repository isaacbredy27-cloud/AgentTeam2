---
name: propose-approve-flow
description: "The propose_change tool, proposal storage, diff view and the human Approve step. Use when building, designing or testing proposals."
---

# Propose-and-approve flow

## Rule
Agents can only propose. A human Approve click is the only path to a commit.

## propose_change tool
- Input: `summary` (commit message) and `files[]` of `{ path, action: create|update|delete, content }`.
- `strict: true`, `additionalProperties: false`.

## On proposal
1. Validate every path (path-allowlist-rules).
2. Read current files and blob SHAs from `main`. Store as the base.
3. Build a unified diff.
4. Save to Blobs `proposals/<id>` with `status: pending` (strong consistency).
5. Return a `tool_result` to the model. On failure, `is_error: true` with the reason.

## On Approve
1. Check session and CSRF.
2. Proposal must be `pending`. Re-validate paths.
3. Compare base SHAs with `main`. Changed → `stale`.
4. Commit to `main` (github-commits-api).
5. Set `approved` with `onlyIfMatch`. Blocks double approval.
6. Write an audit record. Return the commit URL.

## Diff view
- Show every file in full. Nothing collapsed or hidden.
- Approve asks to confirm: "Commit 3 files to main?"

---
Shared by: agent-console-engineer, security-expert, ux-designer-apple-hig, qa-engineer. Lead: agent-console-engineer.
