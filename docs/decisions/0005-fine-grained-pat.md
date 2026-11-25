# 0005 · Fine-grained personal access token for GitHub

- Status: Accepted
- Date: 2026-11-25
- Decided by: project lead

## Context
The approve function needs to write to this repository. Options were a token or a GitHub App.

## Decision
Use a fine-grained personal access token.

## Consequences
- Repository access: only this repository.
- Permissions: Contents read and write. Metadata read (automatic). Nothing else.
- No Workflows permission, so `.github/workflows` cannot change through the console.
- Expiry 90 days or less. Rotate before expiry.
- Stored as `GITHUB_TOKEN` in Netlify, Functions scope, Production context only.
- Commits appear as the token owner.
- A GitHub App stays the upgrade path if we need more repos or bot identity.
