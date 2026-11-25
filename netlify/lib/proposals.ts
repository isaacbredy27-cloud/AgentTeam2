// Proposal lifecycle: create (from propose_change), approve (one commit), reject.
import { checkChange, type FileChange } from "./paths.ts";
import { unifiedDiff } from "./diff.ts";
import { commitFiles, getFile, GitHubError, gitHubReady, type GitHubConfig } from "./github.ts";
import type { JsonStore } from "./store.ts";
import { newProposalId } from "./deps.ts";

export type ProposalFile = FileChange & { baseSha: string | null; diff: string };
export type ProposalStatus = "pending" | "committing" | "approved" | "rejected" | "stale";
export type Proposal = {
  id: string; agent: string; summary: string; status: ProposalStatus;
  createdBy: string; createdAt: string; files: ProposalFile[];
  commitSha?: string; commitUrl?: string; decidedBy?: string; decidedAt?: string; staleFiles?: string[];
};

export type CreateResult = { ok: true; proposal: Proposal } | { ok: false; reason: string };

export async function createProposal(
  gh: GitHubConfig, store: JsonStore, input: unknown, meta: { agent: string; user: string; now: Date },
): Promise<CreateResult> {
  const check = checkChange(input);
  if (!check.ok) return { ok: false, reason: check.reason };
  if (!gitHubReady(gh)) return { ok: false, reason: "GitHub is not set up on this site, so proposals cannot be saved." };
  const files: ProposalFile[] = [];
  for (const f of check.files) {
    let current: { sha: string; content: string } | null;
    try { current = await getFile(gh, f.path); } catch { return { ok: false, reason: `Could not read ${f.path} from GitHub.` }; }
    if (f.action === "create" && current) return { ok: false, reason: `${f.path} already exists. Use update.` };
    if (f.action !== "create" && !current) return { ok: false, reason: `${f.path} does not exist. Use create.` };
    files.push({
      ...f,
      baseSha: current?.sha ?? null,
      diff: unifiedDiff(f.path, current?.content ?? null, f.action === "delete" ? null : f.content),
    });
  }
  const proposal: Proposal = {
    id: newProposalId(), agent: meta.agent, summary: check.summary, status: "pending",
    createdBy: meta.user, createdAt: meta.now.toISOString(), files,
  };
  const saved = await store.setJSON(proposal.id, proposal, { onlyIfNew: true });
  if (!saved.modified) return { ok: false, reason: "Could not save the proposal. Try again." };
  return { ok: true, proposal };
}

export type ApproveResult =
  | { status: 200; proposal: Proposal }
  | { status: 404 | 409 | 422 | 502 | 503; error: string; proposal?: Proposal };

async function staleFiles(gh: GitHubConfig, files: ProposalFile[]): Promise<string[]> {
  const stale: string[] = [];
  for (const f of files) {
    const cur = await getFile(gh, f.path);
    if ((cur?.sha ?? null) !== f.baseSha) stale.push(f.path);
  }
  return stale;
}

export async function approveProposal(
  gh: GitHubConfig, store: JsonStore, id: string, meta: { user: string; now: Date },
): Promise<ApproveResult> {
  const got = await store.getWithMetadata(id, { type: "json" });
  if (!got) return { status: 404, error: "No proposal with that ID." };
  const p = got.data as Proposal;
  if (p.status !== "pending") {
    const msg = p.status === "approved" ? "This proposal is already approved." : `This proposal is ${p.status}.`;
    return { status: 409, error: msg, proposal: p };
  }
  // Never trust the stored copy alone: validate again.
  const check = checkChange({ summary: p.summary, files: p.files.map(({ path, action, content }) => ({ path, action, content })) });
  if (!check.ok) return { status: 422, error: `Blocked: ${check.reason}` };
  if (!gitHubReady(gh)) return { status: 503, error: "GitHub is not set up." };

  // Claim first, so a second Approve click (or a retry) cannot commit twice.
  const claim = await store.setJSON(id, { ...p, status: "committing" }, { onlyIfMatch: got.etag });
  if (!claim.modified) return { status: 409, error: "Someone already acted on this proposal." };
  let etag = claim.etag;
  const release = async (next: Proposal) => { await store.setJSON(id, next, etag ? { onlyIfMatch: etag } : {}); };

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const stale = await staleFiles(gh, p.files);
      if (stale.length) {
        const next: Proposal = { ...p, status: "stale", staleFiles: stale, decidedAt: meta.now.toISOString() };
        await release(next);
        return { status: 409, error: "These files changed since the proposal. Ask the agent to redo it.", proposal: next };
      }
      const commit = await commitFiles(gh, `${p.summary}\n\nApproved in the Agent Console. Proposal ${p.id} from ${p.agent}.`, check.files);
      const next: Proposal = {
        ...p, status: "approved", commitSha: commit.sha, commitUrl: commit.url,
        decidedBy: meta.user, decidedAt: meta.now.toISOString(),
      };
      await release(next);
      return { status: 200, proposal: next };
    } catch (e) {
      // 422 on the ref update means main moved: re-check SHAs and retry once.
      if (e instanceof GitHubError && e.status === 422 && attempt === 0) continue;
      await release({ ...p, status: "pending" });
      return { status: 502, error: "GitHub did not accept the commit. Nothing changed. Try again." };
    }
  }
  await release({ ...p, status: "pending" });
  return { status: 502, error: "GitHub did not accept the commit. Nothing changed. Try again." };
}

export async function rejectProposal(store: JsonStore, id: string, meta: { user: string; now: Date }): Promise<ApproveResult> {
  const got = await store.getWithMetadata(id, { type: "json" });
  if (!got) return { status: 404, error: "No proposal with that ID." };
  const p = got.data as Proposal;
  if (p.status !== "pending") return { status: 409, error: `This proposal is ${p.status}.`, proposal: p };
  const next: Proposal = { ...p, status: "rejected", decidedBy: meta.user, decidedAt: meta.now.toISOString() };
  const r = await store.setJSON(id, next, { onlyIfMatch: got.etag });
  if (!r.modified) return { status: 409, error: "Someone already acted on this proposal." };
  return { status: 200, proposal: next };
}
