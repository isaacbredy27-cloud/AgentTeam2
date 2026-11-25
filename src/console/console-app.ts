// Agent Console UI. Owner: Orin. Flow and words: Wren. Look: Sable.
// The UI hides the console unless /api/me confirms super_admin. The server enforces it on every call.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { clear, focusHeading, h } from "../ui/dom.ts";
import { api, chat, type AgentInfo, type Proposal } from "./api.ts";
import { diffView } from "./diff-view.ts";

type Msg = { role: "user" | "assistant"; content: any };
type Config = { supabaseUrl: string; supabaseAnonKey: string; authReady: boolean };

export class ConsoleApp {
  private sb: SupabaseClient | null = null;
  private agents: AgentInfo[] = [];
  private histories = new Map<string, Msg[]>();
  private email = "";
  private streaming: AbortController | null = null;

  private root: HTMLElement;
  private announcer: HTMLElement;
  constructor(root: HTMLElement, announcer: HTMLElement) { this.root = root; this.announcer = announcer; }

  private say(text: string) {
    this.announcer.textContent = "";
    setTimeout(() => { this.announcer.textContent = text; }, 50);
  }

  private async token(): Promise<string | null> {
    const { data } = await this.sb!.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async start(): Promise<void> {
    let cfg: Config;
    try {
      const res = await fetch("/api/config");
      cfg = await res.json();
    } catch {
      return this.message("Agents", "No connection. Check your network and try again.");
    }
    if (!cfg.authReady) {
      return this.message("Agents", "Sign-in is not set up yet. Follow the setup guide to add Supabase.", true);
    }
    this.sb = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    this.sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") this.renderSignIn();
    });
    await this.route();
  }

  private message(title: string, text: string, guide = false) {
    clear(this.root);
    this.root.append(h("section", { class: "screen" }, h("h1", { text: title }), h("p", { role: "alert", text }),
      guide ? h("p", {}, h("a", { href: "/guide/#supabase", text: "Open the setup guide" })) : null));
  }

  private async route() {
    const token = await this.token();
    if (!token) return this.renderSignIn();
    const me = await api<{ email: string; superAdmin: boolean }>(token, "/api/me");
    if (me.ok && me.data.superAdmin) {
      this.email = me.data.email;
      return this.loadAgents();
    }
    if (!me.ok && me.status === 403) {
      this.email = me.data?.email ?? "";
      return this.renderNotAdmin();
    }
    if (!me.ok && me.status === 401) {
      await this.sb!.auth.signOut({ scope: "local" });
      return this.renderSignIn("Your session ended. Sign in again.");
    }
    this.message("Agents", me.ok ? "Something went wrong." : me.error);
  }

  private signOutButton() {
    const b = h("button", { class: "btn secondary small", type: "button", text: "Sign Out" });
    b.addEventListener("click", async () => {
      this.streaming?.abort();
      this.histories.clear();
      await this.sb!.auth.signOut({ scope: "local" });
      this.renderSignIn();
    });
    return b;
  }

  renderSignIn(error = "") {
    clear(this.root);
    const err = h("p", { id: "signin-error", class: "field-error", role: "alert", hidden: !error, text: error });
    const email = h("input", { id: "email", type: "email", name: "email", autocomplete: "username", required: true, "aria-describedby": "signin-error" });
    const pass = h("input", { id: "password", type: "password", name: "password", autocomplete: "current-password", required: true, "aria-describedby": "signin-error" });
    const submit = h("button", { class: "btn primary block", type: "submit", text: "Sign In" });
    const form = h("form", { novalidate: true },
      h("div", { class: "field" }, h("label", { for: "email", text: "Email" }), email),
      h("div", { class: "field" }, h("label", { for: "password", text: "Password" }), pass),
      err, submit);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!email.value || !pass.value) { err.hidden = false; err.textContent = "Enter your email and password."; return; }
      submit.disabled = true;
      submit.textContent = "Signing In…";
      const { error: e2 } = await this.sb!.auth.signInWithPassword({ email: email.value.trim(), password: pass.value });
      submit.disabled = false;
      submit.textContent = "Sign In";
      if (e2) {
        err.hidden = false;
        err.textContent = e2.status === 429 ? "Too many tries. Wait a few minutes and try again." : "That email and password didn't work. Try again.";
        pass.focus();
        return;
      }
      await this.route();
    });
    const google = h("button", { class: "btn google", type: "button", text: "Continue with Google" });
    google.addEventListener("click", async () => {
      const { error: e3 } = await this.sb!.auth.signInWithOAuth({
        provider: "google", options: { redirectTo: `${location.origin}/agents/` },
      });
      if (e3) { err.hidden = false; err.textContent = "Google sign-in isn't available. Use email instead."; }
    });
    this.root.append(h("section", { class: "screen" },
      h("h1", { text: "Agents" }),
      h("p", { class: "lead", text: "Sign in to chat with the agent team. Only admins can use this page." }),
      h("div", { class: "auth-card glass" },
        h("h2", { text: "Sign in" }), form, h("p", { class: "divider", text: "or" }), google)));
  }

  private renderNotAdmin() {
    clear(this.root);
    this.root.append(h("section", { class: "screen" },
      h("h1", { text: "Agents" }),
      h("p", { role: "alert", text: "This page is for admins only." }),
      h("p", { class: "muted", text: this.email ? `You're signed in as ${this.email}. Ask an admin for access.` : "Ask an admin for access." }),
      h("div", { class: "actions" }, this.signOutButton(), h("a", { class: "btn primary", href: "/", text: "Play Trivia" }))));
    focusHeading(this.root);
  }

  private async loadAgents() {
    const token = await this.token();
    if (!token) return this.renderSignIn();
    const r = await api<{ agents: AgentInfo[] }>(token, "/api/agents");
    if (!r.ok) {
      if (r.status === 403) return this.renderNotAdmin();
      if (r.status === 401) return this.renderSignIn("Your session ended. Sign in again.");
      return this.message("Agents", r.error);
    }
    this.agents = r.data.agents;
    this.renderList();
  }

  private bar() {
    return h("div", { class: "console-bar" },
      h("p", { class: "muted small", text: `Signed in as ${this.email}` }), this.signOutButton());
  }

  private renderList(focusName?: string) {
    clear(this.root);
    const list = h("ul", { class: "agent-list", role: "list" }, ...this.agents.map((a) => {
      const btn = h("button", { class: "btn primary", type: "button", "data-agent": a.name, text: `Chat with ${a.firstName}` });
      btn.addEventListener("click", () => this.renderChat(a));
      return h("li", { class: "agent-card glass", "data-agent-card": a.name },
        h("div", { class: "agent-head" },
          h("h3", {}, a.firstName, " ", h("span", { class: "slug", text: a.name })),
          h("span", { class: "model-badge", text: `${a.model} · ${a.modelId}` })),
        h("p", { text: a.description }),
        h("p", { class: "personality" }, h("strong", { text: "Personality: " }), a.personality || "Not set."),
        h("details", {},
          h("summary", { text: `Knowledge files (${a.knowledgeFiles.length})` }),
          h("p", { class: "muted small", text: `knowledge/${a.name}/` }),
          a.knowledgeFiles.length
            ? h("ul", { class: "file-list" }, ...a.knowledgeFiles.map((f) => h("li", { text: f })))
            : h("p", { class: "muted", text: "No files." })),
        h("div", { class: "actions" }, btn));
    }));
    this.root.append(h("section", { class: "screen" },
      h("h1", { text: "Agents" }), this.bar(),
      h("p", { class: "lead", text: `${this.agents.length} agents. Pick one to chat. Agents can propose changes. You approve each one.` }),
      list));
    if (focusName) this.root.querySelector<HTMLButtonElement>(`[data-agent="${focusName}"]`)?.focus();
    else focusHeading(this.root);
  }

  private renderChat(a: AgentInfo) {
    clear(this.root);
    const history = this.histories.get(a.name) ?? [];
    this.histories.set(a.name, history);
    const back = h("button", { class: "btn plain", type: "button", text: "‹ All Agents" });
    back.addEventListener("click", () => { this.streaming?.abort(); this.renderList(a.name); });
    const log = h("div", { class: "chat-log", role: "log", "aria-live": "off", "aria-label": `Chat with ${a.firstName}` });
    const input = h("textarea", { id: "chat-input", name: "message", rows: 3, required: true });
    const send = h("button", { class: "btn primary", type: "submit", text: "Send" });
    const stop = h("button", { class: "btn secondary", type: "button", hidden: true, text: "Stop" });
    const form = h("form", { class: "composer" },
      h("label", { for: "chat-input", text: `Message to ${a.firstName}` }), input,
      h("div", { class: "actions" }, send, stop));

    // Replay visible history.
    for (const m of history) {
      if (m.role === "user") {
        const text = typeof m.content === "string" ? m.content
          : (m.content as any[]).filter((b) => b.type === "text").map((b) => b.text).join("\n");
        if (text) log.append(this.bubble("user", "You", text));
      } else {
        const text = (m.content as any[]).filter((b) => b.type === "text").map((b) => b.text).join("");
        if (text) log.append(this.bubble("assistant", a.firstName, text));
      }
    }

    stop.addEventListener("click", () => this.streaming?.abort());
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || this.streaming) return;
      const token = await this.token();
      if (!token) return this.renderSignIn("Your session ended. Sign in again.");
      // Keep turns alternating: a pending tool_result joins the next user message.
      const last = history[history.length - 1];
      let added: "new" | "merged";
      if (last && last.role === "user" && Array.isArray(last.content)) {
        last.content.push({ type: "text", text });
        added = "merged";
      } else {
        history.push({ role: "user", content: text });
        added = "new";
      }
      const undo = () => {
        if (added === "new") history.pop();
        else (history[history.length - 1].content as any[]).pop();
      };
      input.value = "";
      log.append(this.bubble("user", "You", text));
      const reply = this.bubble("assistant", a.firstName, "");
      const body = reply.querySelector(".body") as HTMLElement;
      log.append(reply);
      send.disabled = true;
      stop.hidden = false;
      const ctrl = new AbortController();
      this.streaming = ctrl;
      await chat(token, { agent: a.name, messages: history }, {
        onText: (t) => { body.textContent += t; },
        onDone: (d) => {
          history.push({ role: "assistant", content: d.assistantContent });
          if (d.toolResult) history.push({ role: "user", content: [d.toolResult] });
          if (!body.textContent) body.textContent = d.proposal ? "I proposed a change. Review it below." : "(No text in this reply.)";
          if (d.stopReason === "max_tokens") log.append(this.bubble("error", "Note", "The reply hit its length limit."));
          if (d.stopReason === "refusal") log.append(this.bubble("error", "Note", "The agent declined this request."));
          if (d.proposal) log.append(this.proposalCard(d.proposal));
          else if (d.toolResult && (d.toolResult as any).is_error) {
            log.append(this.bubble("error", "Proposal blocked", String((d.toolResult as any).content)));
          }
          this.say(`Reply from ${a.firstName} finished.`);
        },
        onError: (msg) => {
          undo();
          reply.remove();
          log.append(this.bubble("error", "Error", msg));
          input.value = text;
          this.say(msg);
        },
      }, ctrl.signal);
      if (ctrl.signal.aborted && this.streaming === ctrl) {
        undo();
        body.textContent += " (stopped)";
        input.value = text;
      }
      this.streaming = null;
      send.disabled = false;
      stop.hidden = true;
      input.focus();
    });

    this.root.append(h("section", { class: "screen" },
      back,
      h("h1", { text: `Chat with ${a.firstName}` }),
      h("p", { class: "muted small", text: `${a.name} · ${a.modelId}` }),
      log, form));
    focusHeading(this.root);
  }

  private bubble(kind: "user" | "assistant" | "error", who: string, text: string): HTMLElement {
    return h("div", { class: `msg ${kind}` }, h("span", { class: "who", text: who }), h("span", { class: "body", text }));
  }

  private proposalCard(p: Proposal): HTMLElement {
    const n = p.files.length;
    const filesWord = n === 1 ? "file" : "files";
    const status = h("span", { class: "status-pill", text: "Waiting for review" });
    const result = h("p", { role: "status" });
    const approve = h("button", { class: "btn primary", type: "button", "data-action": "approve", text: "Approve" });
    const reject = h("button", { class: "btn secondary", type: "button", "data-action": "reject", text: "Reject" });

    const dialog = h("dialog", { "aria-labelledby": `dlg-${p.id}` },
      h("h2", { id: `dlg-${p.id}`, text: `Commit ${n} ${filesWord} to main?` }),
      h("p", { text: "This commits straight to main. Netlify deploys it to production at once." }));
    const cancel = h("button", { class: "btn secondary", type: "button", text: "Cancel" });
    const confirm = h("button", { class: "btn primary", type: "button", "data-action": "confirm", text: `Commit ${n} ${n === 1 ? "File" : "Files"}` });
    dialog.append(h("div", { class: "actions" }, cancel, confirm));
    cancel.addEventListener("click", () => { dialog.close(); approve.focus(); });

    const lock = () => { approve.disabled = true; reject.disabled = true; };
    approve.addEventListener("click", () => dialog.showModal());
    confirm.addEventListener("click", async () => {
      confirm.disabled = true;
      dialog.close();
      lock();
      const token = await this.token();
      if (!token) return this.renderSignIn("Your session ended. Sign in again.");
      status.textContent = "Committing…";
      const r = await api<{ proposal: Proposal }>(token, `/api/proposals/${p.id}/approve`, { method: "POST", body: { confirm: true } });
      if (r.ok) {
        status.textContent = "Approved";
        clear(result);
        result.append(`Committed ${n} ${filesWord}. Deploy started. `,
          h("a", { href: r.data.proposal.commitUrl ?? "#", target: "_blank", rel: "noopener noreferrer", text: "View commit" }));
        approve.hidden = true;
        reject.hidden = true;
      } else {
        const st = r.data?.proposal?.status;
        status.textContent = st === "stale" ? "Out of date" : st ? st[0].toUpperCase() + st.slice(1) : "Not committed";
        result.textContent = r.error;
        if (!st || st === "pending") { approve.disabled = false; reject.disabled = false; confirm.disabled = false; }
      }
      result.focus();
      this.say(result.textContent ?? "");
    });
    reject.addEventListener("click", async () => {
      lock();
      const token = await this.token();
      if (!token) return this.renderSignIn("Your session ended. Sign in again.");
      const r = await api<{ proposal: Proposal }>(token, `/api/proposals/${p.id}/reject`, { method: "POST", body: {} });
      status.textContent = r.ok ? "Rejected" : "Not changed";
      result.textContent = r.ok ? "Rejected. Nothing was committed." : r.error;
      if (r.ok) { approve.hidden = true; reject.hidden = true; }
    });
    result.tabIndex = -1;

    return h("section", { class: "proposal glass", "aria-label": `Proposal ${p.id}`, "data-proposal": p.id },
      h("h3", { text: p.summary }),
      h("p", {}, status, " ", h("span", { class: "muted small", text: `${p.id} · ${n} ${filesWord}` })),
      h("ul", {}, ...p.files.map((f) => h("li", {}, h("code", { text: f.path }), ` (${f.action})`))),
      h("p", { class: "diff-legend", text: "Lines starting with + are added. Lines starting with − are removed." }),
      ...p.files.flatMap((f) => [h("h4", {}, h("code", { text: f.path })), diffView(f)]),
      h("div", { class: "actions" }, approve, reject),
      result, dialog);
  }
}
