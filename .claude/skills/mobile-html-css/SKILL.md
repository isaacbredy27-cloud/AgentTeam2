---
name: mobile-html-css
description: "Semantic, mobile-first HTML and CSS conventions. Use when building or styling any screen."
---

# Mobile HTML and CSS

- Mobile first. Design from 320 px wide up. No horizontal scroll.
- Semantic elements: `header`, `main`, `nav`, `footer`, `button`, `fieldset`, `legend`.
- One `h1` per screen.
- CSS custom properties for all design tokens. Values come from Sable's token file.
- Respect safe areas: `env(safe-area-inset-*)` with `viewport-fit=cover`.
- Use `dvh` units for full-height layouts on mobile.
- Respect `prefers-reduced-motion`, `prefers-color-scheme` and `prefers-reduced-transparency`.
- Touch targets at least 44×44 CSS px.
- No inline styles or scripts. The CSP blocks them.

---
Shared by: frontend-engineer, ui-designer-apple-liquid-glass, mobile-pwa-expert. Lead: frontend-engineer.
