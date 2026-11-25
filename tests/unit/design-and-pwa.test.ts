import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

// WCAG relative luminance and contrast ratio.
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

function tokens(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})/gi)) out[m[1]] = m[2];
  return out;
}

describe("design tokens contrast (WCAG AA)", () => {
  const css = read("src/styles/tokens.css");
  const light = tokens(css.split("@media")[0]);
  const dark = { ...light, ...tokens(css.split("@media (prefers-color-scheme: dark)")[1]) };
  const pairs: [string, string][] = [
    ["color-text", "color-bg"], ["color-text", "color-surface"], ["color-text-secondary", "color-bg"],
    ["color-text-secondary", "color-surface"], ["color-on-accent", "color-accent"], ["color-accent", "color-surface"],
    ["color-accent", "color-bg"], ["color-correct", "color-correct-bg"], ["color-wrong", "color-wrong-bg"],
    ["color-notice-text", "color-notice-bg"], ["color-text", "color-correct-bg"], ["color-text", "color-wrong-bg"],
  ];
  for (const [name, t] of [["light", light], ["dark", dark]] as const) {
    it.each(pairs)(`${name}: %s on %s >= 4.5`, (fg, bg) => expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5));
  }
});

describe("manifest and icons", () => {
  const m = JSON.parse(read("public/manifest.webmanifest"));
  it("meets Chromium install criteria", () => {
    expect(m.name).toBeTruthy();
    expect(m.start_url).toBeTruthy();
    expect(m.display).toBe("standalone");
    expect(m.prefer_related_applications).toBeUndefined();
    const sizes = m.icons.map((i: any) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    expect(m.icons.some((i: any) => i.purpose === "maskable")).toBe(true);
  });
  it("points at real PNGs of the right size", () => {
    for (const icon of [...m.icons, { src: "/icons/apple-touch-icon-180.png", sizes: "180x180" }]) {
      const file = resolve(root, "public" + icon.src);
      expect(existsSync(file)).toBe(true);
      const buf = readFileSync(file);
      expect(buf.subarray(1, 4).toString()).toBe("PNG");
      const [w, h] = [buf.readUInt32BE(16), buf.readUInt32BE(20)];
      expect(`${w}x${h}`).toBe(icon.sizes);
    }
  });
});

describe("netlify.toml", () => {
  const toml = read("netlify.toml");
  it("publishes dist and bundles agent files and knowledge", () => {
    expect(toml).toMatch(/publish = "dist"/);
    expect(toml).toContain('".claude/agents/**"');
    expect(toml).toContain('"knowledge/*/docs/**"');
  });
  it("has a strict CSP that allows only Open Trivia DB and Supabase", () => {
    const csp = /Content-Security-Policy = "([^"]+)"/.exec(toml)![1];
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("connect-src 'self' https://opentdb.com https://*.supabase.co");
    expect(csp).not.toContain("unsafe-inline");
    expect(csp).toContain("frame-ancestors 'none'");
  });
  it("holds no secrets", () => {
    expect(toml).not.toMatch(/ANTHROPIC_API_KEY|GITHUB_TOKEN\s*=|sk-ant-|github_pat_/);
  });
});
