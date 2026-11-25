# GitHub: fine-grained personal access tokens

Sources (read 2026-11-25):
- https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
- https://docs.github.com/en/rest/repos/contents
- https://docs.github.com/en/rest/git/trees, /git/commits, /git/refs

## Creating the token
- Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.
- "There is a limit of 50 fine-grained personal access tokens you can create."
- Expiration: pick one. The API field allows 1–366 days or none; default 30 days. Org policy may cap it.
- Resource owner: the token "will only be able to access resources owned by the selected resource owner."
- Repository access: choose **Only select repositories**, then pick this repo. "Choose the minimal repository access."
- "Tokens always include read-only access to all public repositories on GitHub."
- If an organization requires approval, the token stays `pending` and can only read public resources until approved.

## Permissions our endpoints need
| Endpoint | Permission |
| --- | --- |
| `PUT /repos/{o}/{r}/contents/{path}` | Contents: write (plus Workflows: write for `.github/workflows`) |
| `POST /repos/{o}/{r}/git/trees` | Contents: write |
| `POST /repos/{o}/{r}/git/commits` | Contents: write |
| `GET /repos/{o}/{r}/git/ref/{ref}` | Contents: read |
| `PATCH /repos/{o}/{r}/git/refs/{ref}` | Contents: write (plus Workflows: write if workflows change) |

So the token needs **Contents: Read and write** and nothing else. Metadata read is included.
Without Workflows permission, GitHub itself blocks changes to `.github/workflows`.

## Limits
Fine-grained tokens cannot contribute to repos where the user is an outside collaborator,
access several organizations at once, access Packages, call the Checks API or access user-owned Projects.

"Treat your access tokens like passwords."
