# Platform constraints the architecture must respect

Sources (read 2026-11-25):
- https://docs.netlify.com/build/functions/configuration/ (limits table)
- https://docs.netlify.com/build/functions/background-functions/
- https://docs.netlify.com/manage/routing/headers/
- https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/
- https://opentdb.com/api_config.php
- This repo: docs/decisions/0001–0005

| Constraint | Value | Design consequence |
| --- | --- | --- |
| Sync and streaming function time | 60 s | Chat replies must finish in under ~45 s, else use a background job |
| Background function time | 15 min, retried after 1 and 2 min on error | Jobs must be idempotent; split longer work |
| Background payload | 256 KB | Pass a job ID, not the job content; results go to Blobs |
| Buffered payload | 6 MB | Cap chat history size |
| Custom headers | Not applied to function responses | Each function sets its own security headers |
| Rate-limit rules (Free plan) | 2 per project | `/api/login` and `/api/chat`; others use a Blobs budget |
| Open Trivia DB | 50 per call, 1 call / 5 s / IP | Browser calls it directly (no proxy) |
| Region / memory (Free) | `cmh`, 1024 MB | No tuning available; keep functions light |
