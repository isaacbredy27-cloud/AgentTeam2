// The one place that maps agent `model` values to Claude API IDs (doc 04 §2).
export const DEFAULT_MODEL = "claude-opus-5-5";
const ALIASES: Record<string, string> = {
  opus: "claude-opus-5-5",
  sonnet: "claude-sonnet-5-5",
  haiku: "claude-haiku-5-5",
  inherit: DEFAULT_MODEL,
};
const ALLOWED_IDS = new Set(Object.values(ALIASES));

/** Returns the API model ID, or null for an unknown full ID. */
export function resolveModel(value: string | undefined | null): string | null {
  if (value === undefined || value === null || value.trim() === "") return DEFAULT_MODEL;
  const v = value.trim();
  if (v in ALIASES) return ALIASES[v];
  return ALLOWED_IDS.has(v) ? v : null;
}
