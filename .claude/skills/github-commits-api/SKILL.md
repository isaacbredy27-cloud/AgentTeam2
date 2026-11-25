---
name: github-commits-api
description: "Commit approved changes straight to main with the GitHub REST API and a fine-grained token. Use when writing or reviewing the approve function."
---

# GitHub commits from the approve function

## Token
- Fine-grained personal access token. Only this one repository.
- Permissions: Contents read and write. Metadata read (automatic). Nothing else.
- Stored as `GITHUB_TOKEN` in Netlify. Functions scope. Production context only.

## Headers
- `Authorization: Bearer $GITHUB_TOKEN`
- `Accept: application/vnd.github+json`
- `X-GitHub-Api-Version: 2026-03-10`

## One file: Contents API
- `PUT /repos/{owner}/{repo}/contents/{path}` with `message`, Base64 `content`, `branch: main`.
- `sha` is required when updating.
- Run create, update and delete serially. Parallel calls conflict.

## Several files: one commit via Git Data API
1. `GET /git/ref/heads/main` → commit SHA.
2. `GET /git/commits/{sha}` → tree SHA.
3. `POST /git/trees` with `base_tree` and changed paths. Delete with `sha: null`.
4. `POST /git/commits` with the tree and parent.
5. `PATCH /git/refs/heads/main` with `force: false`.

## Decision
- Approve commits straight to `main`. No pull request.
- The push triggers the Netlify production deploy.

## Errors
- 409: branch moved. Re-check base SHAs, retry once, else mark the proposal stale.
- 422: validation failed. Do not retry blindly.

---
Shared by: agent-console-engineer, security-expert, netlify-engineer. Lead: agent-console-engineer.
