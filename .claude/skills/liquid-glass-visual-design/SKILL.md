---
name: liquid-glass-visual-design
description: "The app's Apple Liquid Glass-inspired visual language and design tokens for the web. Use when styling surfaces, colour, type or icons."
---

# Liquid Glass visual design (web)

## Material
- Glass surfaces: translucent fill plus `backdrop-filter: blur() saturate()`.
- Use glass for floating controls and bars. Keep content on solid or near-solid layers.
- Thin light border and soft shadow give depth. Avoid heavy drop shadows.
- Corner radius is concentric: inner radius = outer radius minus padding.

## Tokens
- Define all values as CSS custom properties in `src/styles/tokens.css`.
- Groups: colour, glass (fill, blur, border), type scale, spacing, radius, motion.
- Light and dark sets via `prefers-color-scheme`.

## Accessibility guards
- Text contrast at least 4.5:1 on every glass layer, over any background.
- `prefers-reduced-transparency`: swap glass for solid fills.
- `prefers-reduced-motion`: no parallax or bounce.
- Browsers without `backdrop-filter`: solid fallback via `@supports`.

## Icons
- App icon: 192, 512, maskable 512, Apple touch 180.
- UI icons: simple line icons, always with a text label or `aria-label`.

This is a web interpretation of Apple's style. Do not copy Apple's own icons or assets.

---
Shared by: ui-designer-apple-liquid-glass, frontend-engineer. Lead: ui-designer-apple-liquid-glass.
