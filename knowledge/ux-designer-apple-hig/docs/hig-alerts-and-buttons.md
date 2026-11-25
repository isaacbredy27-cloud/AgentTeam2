# Apple HIG: Alerts and Buttons (interaction rules)

Sources (read 2026-11-25):
- https://developer.apple.com/design/human-interface-guidelines/alerts
- https://developer.apple.com/design/human-interface-guidelines/buttons

## Alerts
- "Use alerts sparingly." For critical info, warnings before data loss, or confirming an important action people started.
- Avoid alerts for plain information, for common undoable actions, or at app start.
- Title: says what happened and why. Not "Error". At most two lines.
  Sentence → sentence case with punctuation. Fragment → title case, no punctuation.
- Buttons: one or two words that describe the result, verbs tied to the alert text ("View All", "Reply").
  Avoid "OK" unless purely informational. "Always use 'Cancel' to title a button that cancels."
- Placement: likely/default button on the trailing side of a row (top of a stack). Cancel on the leading side (bottom of a stack).
- Destructive style only for a destructive action people did **not** deliberately choose.
  When people deliberately chose it (like Empty Trash), the confirm button is not styled destructive.
- Always include Cancel for destructive actions. "Do not make a Cancel button the default button."

## Buttons
- Hit region at least 44×44 pt.
- One or two prominent buttons per view, for the most likely action.
- "Use style — not size — to visually distinguish the preferred choice."
- Title-style capitalization; start with a verb.
- Never give a destructive action the primary role.
- Leave enough space around buttons so people can tell them apart.
