# GitHub REST: file contents and the Git data API

Sources (read 2026-11-25):
- https://docs.github.com/en/rest/repos/contents
- https://docs.github.com/en/rest/git/trees
- https://docs.github.com/en/rest/git/commits
- https://docs.github.com/en/rest/git/refs

## Headers
`Authorization: Bearer <token>`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2026-03-10`.

## Read a file: `GET /repos/{owner}/{repo}/contents/{path}?ref=main`
- ≤ 1 MB: full support; JSON has `content` (Base64) and `sha`.
- 1–100 MB: only `raw` or `object` media types. > 100 MB: not supported.
- Raw media type: `application/vnd.github.raw+json`.

## Create or update one file: `PUT /repos/{owner}/{repo}/contents/{path}`
- `message` (required), `content` Base64 (required), `sha` ("Required if you are updating a file"), `branch`, `committer`.
- Codes: 200 updated, 201 created, 404, 409 conflict, 422 validation failed.
- "If you use this endpoint and the 'Delete a file' endpoint in parallel, the concurrent requests will conflict ... use these endpoints serially."
- Permission: Contents write. `.github/workflows` also needs Workflows write.

## One commit for many files (Git data API)
1. `GET /repos/{o}/{r}/git/ref/heads/main` → `object.sha` (Contents read). Codes 200, 404, 409.
2. `GET /repos/{o}/{r}/git/commits/{sha}` → `tree.sha`.
3. `POST /repos/{o}/{r}/git/trees` with `base_tree` and `tree: [{ path, mode, type, sha | content }]`.
   Modes: `100644` file, `100755` executable, `040000` subdirectory, `160000` submodule, `120000` symlink.
   "If the value of `sha` is `null` then the file will be deleted." Codes 201, 403, 404, 409, 422.
4. `POST /repos/{o}/{r}/git/commits` with `message`, `tree`, `parents: [parentSha]`.
   Author defaults to the authenticated user; committer defaults to author. Codes 201, 404, 409, 422.
5. `PATCH /repos/{o}/{r}/git/refs/heads/main` with `sha` and `force: false`.
   "Leaving this out or setting it to `false` will make sure you're not overwriting work." Codes 200, 409, 422.

All writes need **Contents: write** on a fine-grained token.
