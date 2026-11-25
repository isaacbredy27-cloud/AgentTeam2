// Line-based unified diff for the proposal view. Shows every changed line.
const CONTEXT = 3;
const MAX_CELLS = 4_000_000;

type Op = { kind: " " | "-" | "+"; text: string };

function splitLines(s: string): string[] {
  if (s === "") return [];
  const lines = s.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
}

/** Myers' O((N+M)·D) diff. Falls back to remove-all/add-all only for huge edit distances. */
function lcsOps(a: string[], b: string[]): Op[] {
  const n = a.length, m = b.length;
  const max = n + m;
  const whole = (): Op[] => [...a.map((t) => ({ kind: "-" as const, text: t })), ...b.map((t) => ({ kind: "+" as const, text: t }))];
  if (max === 0) return [];
  const offset = max;
  const v = new Int32Array(2 * max + 2);
  const trace: Int32Array[] = [];
  let found = false;
  for (let d = 0; d <= max; d++) {
    if (trace.length * v.length > MAX_CELLS) return whole();
    trace.push(v.slice());
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1]) ? v[offset + k + 1] : v[offset + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) { x++; y++; }
      v[offset + k] = x;
      if (x >= n && y >= m) { found = true; break; }
    }
    if (found) break;
  }
  // Walk the trace backwards to recover the edit script.
  const ops: Op[] = [];
  let x = n, y = m;
  for (let d = trace.length - 1; d >= 0; d--) {
    const vd = trace[d];
    const k = x - y;
    const prevK = k === -d || (k !== d && vd[offset + k - 1] < vd[offset + k + 1]) ? k + 1 : k - 1;
    const prevX = d === 0 ? 0 : vd[offset + prevK];
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) { ops.push({ kind: " ", text: a[x - 1] }); x--; y--; }
    if (d > 0) {
      if (x === prevX) ops.push({ kind: "+", text: b[y - 1] });
      else ops.push({ kind: "-", text: a[x - 1] });
      x = prevX; y = prevY;
    }
  }
  return ops.reverse();
}

export function unifiedDiff(path: string, before: string | null, after: string | null): string {
  const a = splitLines(before ?? "");
  const b = splitLines(after ?? "");
  let pre = 0;
  while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++;
  let suf = 0;
  while (suf < a.length - pre && suf < b.length - pre && a[a.length - 1 - suf] === b[b.length - 1 - suf]) suf++;
  const ops: Op[] = [
    ...a.slice(0, pre).map((t) => ({ kind: " " as const, text: t })),
    ...lcsOps(a.slice(pre, a.length - suf), b.slice(pre, b.length - suf)),
    ...a.slice(a.length - suf).map((t) => ({ kind: " " as const, text: t })),
  ];
  const header = [`--- ${before === null ? "/dev/null" : "a/" + path}`, `+++ ${after === null ? "/dev/null" : "b/" + path}`];
  const changed = ops.map((o, k) => (o.kind !== " " ? k : -1)).filter((k) => k >= 0);
  if (changed.length === 0) return [...header, "(no changes)"].join("\n");

  // Group changes into hunks with CONTEXT lines around them.
  const hunks: [number, number][] = [];
  for (const k of changed) {
    const s = Math.max(0, k - CONTEXT), e = Math.min(ops.length - 1, k + CONTEXT);
    const last = hunks[hunks.length - 1];
    if (last && s <= last[1] + 1) last[1] = Math.max(last[1], e);
    else hunks.push([s, e]);
  }
  const out = [...header];
  for (const [s, e] of hunks) {
    let oldStart = 1, newStart = 1;
    for (let k = 0; k < s; k++) { if (ops[k].kind !== "+") oldStart++; if (ops[k].kind !== "-") newStart++; }
    const slice = ops.slice(s, e + 1);
    const oldLen = slice.filter((o) => o.kind !== "+").length;
    const newLen = slice.filter((o) => o.kind !== "-").length;
    out.push(`@@ -${oldLen ? oldStart : oldStart - 1},${oldLen} +${newLen ? newStart : newStart - 1},${newLen} @@`);
    for (const o of slice) out.push(o.kind + o.text);
  }
  return out.join("\n");
}
