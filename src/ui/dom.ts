// Tiny DOM helper. Text always goes in through textContent, never innerHTML.
type Attrs = Record<string, string | boolean | number | undefined | null>;
type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "text") el.textContent = String(v);
    else if (v === true) el.setAttribute(k, "");
    else el.setAttribute(k, String(v));
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return el;
}

export function clear(el: Element): void {
  el.replaceChildren();
}

/** Move focus to a screen heading so screen readers announce the new screen. */
export function focusHeading(root: ParentNode): void {
  const h1 = root.querySelector<HTMLElement>("h1, h2");
  if (h1) { h1.tabIndex = -1; h1.focus({ preventScroll: false }); }
}
