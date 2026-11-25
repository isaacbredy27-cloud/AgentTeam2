// WCAG 1.4.3 contrast maths, plus a worst-case check for text on a translucent glass fill.
type RGB = [number, number, number];

export function hex(h: string): RGB {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const lin = (c8: number) => { const c = c8 / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export const luminance = ([r, g, b]: RGB) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

export function ratio(a: RGB, b: RGB): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// Composite a translucent fill over a backdrop. Ignores blur, so it is the worst case.
export function over(fill: RGB, alpha: number, backdrop: RGB): RGB {
  return fill.map((c, i) => Math.round(c * alpha + backdrop[i] * (1 - alpha))) as RGB;
}

// Lowest contrast of text on glass over any backdrop between black and white.
export function worstOnGlass(text: RGB, fill: RGB, alpha: number): number {
  return Math.min(ratio(text, over(fill, alpha, [0, 0, 0])), ratio(text, over(fill, alpha, [255, 255, 255])));
}
