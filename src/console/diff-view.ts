// Full diff, every file, no hidden lines. Added and removed lines are labelled in text too.
import { h } from "../ui/dom.ts";
import type { ProposalFile } from "./api.ts";

export function diffView(file: ProposalFile): HTMLElement {
  const pre = h("div", { class: "diff", role: "region", tabindex: 0, "aria-label": `Changes to ${file.path}` });
  for (const line of file.diff.split("\n")) {
    let cls = "";
    let label = "";
    if (line.startsWith("+++") || line.startsWith("---")) cls = "hunk";
    else if (line.startsWith("@@")) cls = "hunk";
    else if (line.startsWith("+")) { cls = "add"; label = "Added: "; }
    else if (line.startsWith("-")) { cls = "del"; label = "Removed: "; }
    pre.append(h("div", { class: `diff-line ${cls}` }, label ? h("span", { class: "sr-only", text: label }) : null, line === "" ? " " : line));
  }
  return pre;
}
