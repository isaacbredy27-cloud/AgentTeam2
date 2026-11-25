# Accessibility: Apple HIG and WCAG 2.2

Sources (read 2026-11-25):
- https://developer.apple.com/design/human-interface-guidelines/accessibility
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html

## HIG
- iOS control size: default 44×44 pt, minimum 28×28 pt. Text: default 17 pt, minimum 11 pt.
- Contrast: 4.5:1 up to 17 pt; 3:1 at 18 pt or bold.
- Allow text enlargement of at least 200 percent.
- "Convey information with more than color alone." Add shapes or icons.
- Reduce Motion: cut automatic animations, use fades, avoid animating into and out of blurs.
- Describe the interface for VoiceOver.

## WCAG 2.2 SC 2.5.8 Target Size (Minimum), level AA
"The size of the target for pointer inputs is at least 24 by 24 CSS pixels", except: Spacing, Equivalent, Inline,
User Agent Control, Essential. We design to the HIG 44 pt default, which passes easily.

## WCAG 1.4.3 Contrast (Minimum)
4.5:1 for text; 3:1 for large text (18 pt, or 14 pt bold). Logos and inactive controls are exempt.
