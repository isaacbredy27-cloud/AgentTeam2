# Web CSS for glass surfaces

Sources (read 2026-11-25):
- https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency
- https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html

## backdrop-filter
- Applies effects "such as blurring or color shifting to the area behind an element".
- "The element or its background needs to be transparent or partially transparent" to see it.
- `backdrop-filter: blur(2px); backdrop-filter: saturate(80%);`
- Baseline 2024: works in current browsers since September 2024. Older devices may lack it → use `@supports`.

## prefers-reduced-transparency
- Values `no-preference` and `reduce`. iOS setting: Accessibility > Display & Text Size > Reduce Transparency.
- **Limited availability.** Chrome/Edge 118+, Chrome Android 118+, Samsung 25+ support it.
  **Safari, Safari on iOS and Firefox do not.**
- So on iPhone our glass must already be legible by default. The media query is a bonus, not the safety net.

## WCAG 1.4.3 contrast
- Text ≥ 4.5:1. Large text (≥ 18 pt, or 14 pt bold) ≥ 3:1.
- Relative luminance L = 0.2126 R + 0.7152 G + 0.0722 B, with each channel c = c8/255,
  linearised as c ≤ 0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4.
- Ratio = (L1 + 0.05) / (L2 + 0.05), L1 the lighter colour.
