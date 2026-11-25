---
name: netlify-deploys-and-rollback
description: "How code reaches production on Netlify and how to roll back. Use when shipping, checking a deploy or recovering from a bad one."
---

# Deploys and rollback

- The repo is linked to the Netlify site. Every push to `main` deploys to production.
- An approved console proposal commits to `main`, so it deploys at once.
- Pull requests get Deploy Previews. Previews have no secrets.
- Before release: tests green, QA definition of done met.
- After deploy: smoke test the topic screen, one question and the console login.
- Bad deploy: publish the previous deploy in the Netlify UI (instant rollback). Then fix forward with a revert commit.
- Watch function logs after any change to `netlify/functions/`.

---
Shared by: netlify-engineer, qa-engineer, orchestrator. Lead: netlify-engineer.
