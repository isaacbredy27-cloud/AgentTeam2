# Environment variables and functions

Source: https://docs.netlify.com/build/functions/environment-variables/ (read 2026-11-25)

- Read with `process.env.MY_IMPORTANT_VARIABLE`.
- "For an environment variable to be available to serverless functions during runtime, its scope must include **Functions**."
- "Environment variables declared in a Netlify configuration file (`netlify.toml`) are not available to serverless functions."
- Values are fixed per deploy. "To apply updated environment variable values, create a new deploy."
- Lambda compatibility mode limits all env vars to 4 KB total. Modern functions do not have that limit.
- Values can differ per deploy context. Put secrets in Production only so Deploy Previews have none.
