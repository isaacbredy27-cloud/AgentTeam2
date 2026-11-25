# Vite: env variables and modes

Source: https://vite.dev/guide/env-and-mode (read 2026-11-25)

- Built-ins: `import.meta.env.MODE`, `BASE_URL`, `PROD`, `DEV`, `SSR`.
- "Variables prefixed with `VITE_` will be exposed in client-side source code after Vite bundling."
  "`VITE_*` variables should *not* contain sensitive information such as API keys."
- Load order: `.env`, `.env.local`, `.env.[mode]`, `.env.[mode].local`. `.local` files are git-ignored by convention;
  add `*.local` to `.gitignore`.
- `envPrefix` changes the prefix. We keep the default.

## Our rule
No secret ever has a `VITE_` prefix. The front end needs no secrets at all.
