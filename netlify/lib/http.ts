// Shared HTTP helpers. Netlify custom headers do not apply to function
// responses, so every function response carries these headers itself.
export const SECURITY_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
};

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...SECURITY_HEADERS, "Content-Type": "application/json; charset=utf-8" },
  });
}

export const fail = (status: number, error: string): Response => json(status, { error });

/** POSTs must be JSON and, when the browser sends Origin, come from this site. */
export function checkPost(req: Request): Response | null {
  const type = req.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) return fail(415, "Send JSON.");
  const origin = req.headers.get("origin");
  if (origin !== null && origin !== new URL(req.url).origin) return fail(403, "This request came from another site.");
  return null;
}

export async function readJson(req: Request, maxBytes: number): Promise<unknown> {
  const text = await req.text();
  if (new TextEncoder().encode(text).length > maxBytes) throw new RangeError("too large");
  return JSON.parse(text);
}

/** Read `:id` from Netlify's context.params, or from the URL as a fallback. */
export function routeId(req: Request, context: { params?: Record<string, string> } | undefined): string | null {
  const fromCtx = context?.params?.id;
  const id = fromCtx ?? new URL(req.url).pathname.split("/")[3] ?? "";
  return /^P-[A-Za-z0-9]{6,32}$/.test(id) ? id : null;
}
