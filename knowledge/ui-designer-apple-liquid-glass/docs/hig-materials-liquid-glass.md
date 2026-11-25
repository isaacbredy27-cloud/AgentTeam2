# Apple HIG: Materials and Liquid Glass

Source: https://developer.apple.com/design/human-interface-guidelines/materials (read 2026-11-25)

## What Liquid Glass is
"A dynamic material that unifies the design language across Apple platforms." It forms "a distinct functional layer
for controls and navigation elements — like tab bars and sidebars — that floats above the content layer".
Content "scroll[s] and peek[s] through from beneath these elements".

## Where to use it
- Use it for controls and navigation that float above content.
- **"Don’t use Liquid Glass in the content layer."** Use standard materials there, such as app backgrounds.
- Exception: transient interactive controls in the content layer (sliders, toggles) take a glass look while active.
- "Use Liquid Glass effects sparingly." Overuse "can provide a subpar user experience by distracting from that content."
  "Limit these effects to the most important functional elements in your app."

## Variants
- **Regular**: blurs and adjusts luminosity of the background to keep text legible. Most system components use it.
  Use it when background content may hurt legibility, or for components with a lot of text (alerts, sidebars, popovers).
  It looks darker on dark backgrounds and lighter on light ones.
- **Clear**: highly translucent, for components over media such as photos and video.
  Over bright content, "consider adding a dark dimming layer of 35% opacity".
- Appearance changes with system settings such as Reduce Transparency and Increase Contrast.

## Standard materials (content layer)
`ultraThin` (diffuse gradient), `thin` (slightly darkened), `regular` (default, darkened), `thick` (dark, muted).
Use vibrant colours on top for legibility. Avoid the lowest-contrast vibrancy on `thin` and `ultraThin`.

## How we apply it on the web
- Glass only for the floating top bar, the bottom action bar and the install banner.
- Question text, answers and results sit on solid surfaces.
- Web version of "regular": translucent fill + `backdrop-filter: blur() saturate()`. We do not copy Apple assets.
