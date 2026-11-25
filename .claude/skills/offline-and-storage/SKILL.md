---
name: offline-and-storage
description: "Offline behaviour and on-device storage rules. Use when handling no network or saving data on the device."
---

# Offline states and storage

## Offline
- The app shell loads offline.
- New questions need the network. Show "You are offline" on the topic screen.
- Listen to `online` and `offline` events. Re-enable play when back online.
- Optional later: pre-fetch one round per favourite topic into IndexedDB.

## Storage
- Scores in `localStorage` or IndexedDB. Small records only.
- Wrap every read and write in try/catch. Private mode can throw.
- Call `navigator.storage.persist()` where it exists. Accept a refusal.
- No account or sync in v1. Scores stay on the device.

---
Shared by: mobile-pwa-expert, frontend-engineer, ux-designer-apple-hig. Lead: mobile-pwa-expert.
