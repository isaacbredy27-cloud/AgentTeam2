// Trivia screens: topic -> loading -> questions -> results. Owner: Kit. Flows and words: Wren.
import { browserDeps, fetchRound, getCategories, warmToken, type Category, type Deps, type RoundResult } from "../api/opentdb.ts";
import { answerCurrent, isAnswered, isLast, newRound, next, summary, type Round } from "../quiz/game.ts";
import { bestByCategory, defaultStorage, loadHistory, saveRound } from "../quiz/storage.ts";
import { clear, focusHeading, h } from "./dom.ts";

type RoundFail = Exclude<RoundResult, { ok: true }>["reason"];
type Last = { categoryId: number | null; categoryName: string };

export class TriviaApp {
  private round: Round | null = null;
  private last: Last | null = null;
  private notice = "";
  private abort: AbortController | null = null;
  private categories: Category[] = [];
  private categorySource: "live" | "cache" | "fallback" = "fallback";

  private root: HTMLElement;
  private announcer: HTMLElement;
  private deps: Deps;
  constructor(root: HTMLElement, announcer: HTMLElement, deps: Deps = browserDeps()) {
    this.root = root; this.announcer = announcer; this.deps = deps;
    addEventListener("online", () => this.refreshOnline());
    addEventListener("offline", () => this.refreshOnline());
  }

  async start(): Promise<void> {
    this.renderTopicsLoading();
    const { categories, source } = await getCategories(this.deps);
    this.categories = categories;
    this.categorySource = source;
    this.renderTopics(false);
    if (this.online()) void warmToken(this.deps);
  }

  private say(text: string) {
    this.announcer.textContent = "";
    setTimeout(() => { this.announcer.textContent = text; }, 50);
  }

  private online() { return navigator.onLine !== false; }

  private refreshOnline() {
    this.root.querySelectorAll<HTMLButtonElement>("[data-needs-network]").forEach((b) => { b.disabled = !this.online(); });
    const note = this.root.querySelector<HTMLElement>("#topic-offline");
    if (note) note.hidden = this.online();
  }

  private renderTopicsLoading() {
    clear(this.root);
    this.root.append(h("section", { class: "screen", "aria-busy": "true" },
      h("h1", { text: "Pick a topic" }), h("p", { class: "muted", text: "Loading topics…" })));
  }

  renderTopics(focus = true) {
    this.abort?.abort();
    this.round = null;
    clear(this.root);
    const history = loadHistory(defaultStorage());
    const best = bestByCategory(history);
    const bestText = (key: string) => {
      const b = best.get(key);
      return b ? `Best ${b.score} / ${b.total}` : "Not played yet";
    };
    const topicButton = (id: number | null, name: string) =>
      h("li", {},
        h("button", { class: "topic glass-row", type: "button", "data-needs-network": true, "data-category": id === null ? "any" : id },
          h("span", { class: "topic-name", text: name }),
          h("span", { class: "topic-best", text: bestText(id === null ? "any" : String(id)) })));

    const list = h("ul", { class: "topic-list", role: "list" },
      topicButton(null, "Any topic"),
      ...this.categories.map((c) => topicButton(c.id, c.name)));
    list.addEventListener("click", (e) => {
      const btn = (e.target as Element).closest<HTMLButtonElement>("button[data-category]");
      if (!btn || btn.disabled) return;
      const raw = btn.dataset.category!;
      const id = raw === "any" ? null : Number(raw);
      const name = id === null ? "Any topic" : this.categories.find((c) => c.id === id)?.name ?? "Topic";
      void this.play({ categoryId: id, categoryName: name });
    });

    const recent = history.slice(-5).reverse();
    this.root.append(h("section", { class: "screen" },
      h("h1", { text: "Pick a topic" }),
      h("p", { class: "lead", text: "Answer up to 50 questions. Each correct answer scores 1 point." }),
      h("p", { id: "topic-offline", class: "notice", role: "status", hidden: this.online(), text: "You're offline. New questions need a connection." }),
      this.categorySource === "fallback" ? h("p", { class: "muted small", text: "Showing the saved topic list." }) : null,
      list,
      h("h2", { text: "Your recent scores" }),
      recent.length
        ? h("ul", { class: "history-list", role: "list" }, ...recent.map((r) =>
            h("li", { class: "history-item" },
              h("span", { text: r.categoryName }),
              h("span", { class: "num", text: `${r.score} / ${r.total}` }),
              h("time", { class: "muted small", datetime: r.date, text: new Date(r.date).toLocaleDateString() }))))
        : h("p", { class: "muted", text: "No scores yet. Pick a topic to play your first round." }),
    ));
    this.refreshOnline();
    if (focus) focusHeading(this.root);
  }

  private renderLoading(cat: Last) {
    clear(this.root);
    const status = h("p", { id: "loading-status", role: "status", text: "Getting questions…" });
    const cancel = h("button", { class: "btn secondary", type: "button", text: "Cancel" });
    cancel.addEventListener("click", () => this.renderTopics());
    this.root.append(h("section", { class: "screen center", "aria-busy": "true" },
      h("h1", { text: cat.categoryName }), h("div", { class: "spinner", "aria-hidden": "true" }), status, cancel));
    focusHeading(this.root);
  }

  async play(cat: Last): Promise<void> {
    if (!this.online()) { this.renderError(cat, "network"); return; }
    this.last = cat;
    this.abort?.abort();
    const ctrl = new AbortController();
    this.abort = ctrl;
    this.renderLoading(cat);
    const slow = () => {
      const s = this.root.querySelector("#loading-status");
      if (s) s.textContent = "Getting questions… this can take a few seconds.";
    };
    const timer = setTimeout(slow, 2000);
    const result = await fetchRound(cat.categoryId, this.deps, { signal: ctrl.signal, onWait: slow });
    clearTimeout(timer);
    if (ctrl.signal.aborted) return;
    this.abort = null;
    if (!result.ok) { this.renderError(cat, result.reason); return; }
    this.notice = result.requested < 50 && result.available !== null
      ? `This topic has only ${result.questions.length} questions, so this round is shorter.`
      : result.questions.length < 50 ? `This round has ${result.questions.length} ${result.questions.length === 1 ? "question" : "questions"}.` : "";
    this.round = newRound(cat.categoryId, cat.categoryName, result.questions);
    this.renderQuestion(true);
  }

  private renderError(cat: Last, reason: RoundFail) {
    if (reason === "aborted") return;
    const text: Record<RoundFail, string> = {
      network: "Couldn't get questions. Check your connection and try again.",
      "rate-limited": "Open Trivia DB is busy. Wait a few seconds and try again.",
      "no-questions": "This topic has no new questions right now. Pick another topic.",
      "invalid-parameter": "Something went wrong on our side. Pick another topic.",
      failed: "Couldn't get questions. Try again.",
      aborted: "",
    };
    clear(this.root);
    const retry = h("button", { class: "btn primary", type: "button", "data-needs-network": true, text: "Try Again" });
    retry.addEventListener("click", () => void this.play(cat));
    const back = h("button", { class: "btn secondary", type: "button", text: "Pick a Topic" });
    back.addEventListener("click", () => this.renderTopics());
    this.root.append(h("section", { class: "screen center" },
      h("h1", { text: "No questions" }),
      h("p", { role: "alert", text: text[reason] }),
      h("div", { class: "actions" }, reason === "no-questions" || reason === "invalid-parameter" ? null : retry, back)));
    this.refreshOnline();
    focusHeading(this.root);
  }

  private renderQuestion(focus: boolean) {
    const r = this.round!;
    const q = r.questions[r.index];
    const choice = r.choices[r.index];
    const answered = isAnswered(r);
    const ans = r.answers[r.index];
    const total = r.questions.length;
    clear(this.root);

    const options = h("div", { class: "answers" });
    choice.options.forEach((opt, i) => {
      let state = "";
      if (answered) {
        if (i === choice.correctIndex) state = "correct";
        else if (i === ans.picked) state = "wrong";
      }
      const btn = h("button", {
        class: `answer ${state}`, type: "button", "data-index": i,
        "aria-disabled": answered ? "true" : undefined,
      }, h("span", { class: "answer-text", text: opt }),
        state ? h("span", { class: "answer-mark", text: state === "correct" ? " ✓ Correct answer" : " ✗ Your answer" }) : null);
      btn.addEventListener("click", () => {
        if (isAnswered(this.round!)) return;
        this.round = answerCurrent(this.round!, i);
        const a = this.round.answers[this.round.index];
        this.say(a.correct ? "Correct." : `Wrong. The answer is ${choice.options[choice.correctIndex]}.`);
        this.renderQuestion(false);
        this.root.querySelector<HTMLButtonElement>("#next-btn")?.focus();
      });
      options.append(btn);
    });

    const nextBtn = h("button", { id: "next-btn", class: "btn primary", type: "button", hidden: !answered, text: isLast(r) ? "See Results" : "Next Question" });
    nextBtn.addEventListener("click", () => {
      if (isLast(this.round!)) this.finish();
      else { this.round = next(this.round!); this.renderQuestion(true); }
    });
    const quit = h("button", { class: "btn plain", type: "button", text: "Quit" });
    quit.addEventListener("click", () => this.renderTopics());

    const feedback = answered
      ? h("p", { class: `feedback ${ans.correct ? "is-correct" : "is-wrong"}` },
          h("span", { "aria-hidden": "true", text: ans.correct ? "✓ " : "✗ " }),
          ans.correct ? "Correct." : `Wrong. The answer is ${choice.options[choice.correctIndex]}.`)
      : null;

    this.root.append(h("section", { class: "screen question-screen" },
      h("div", { class: "q-top" },
        h("p", { class: "q-count", text: `Question ${r.index + 1} of ${total}` }),
        quit),
      h("progress", { max: total, value: r.answers.length, "aria-label": `${r.answers.length} of ${total} answered` }),
      h("p", { class: "q-meta" },
        h("span", { text: `Score ${r.answers.filter((a) => a.correct).length}` }),
        h("span", { text: `Streak ${r.streak}` }),
        h("span", { class: `badge ${q.difficulty}`, text: q.difficulty[0].toUpperCase() + q.difficulty.slice(1) })),
      r.index === 0 && this.notice ? h("p", { class: "notice", role: "status", text: this.notice }) : null,
      h("fieldset", { class: "question glass" },
        h("legend", { class: "q-text" }, h("h1", { class: "q-heading", text: q.text })),
        options),
      feedback,
      h("div", { class: "actions sticky" }, nextBtn)));
    if (focus) focusHeading(this.root);
  }

  private finish() {
    const r = this.round!;
    const s = summary(r);
    saveRound(defaultStorage(), {
      categoryId: r.categoryId, categoryName: r.categoryName, score: s.correct, total: s.total, date: new Date().toISOString(),
    });
    clear(this.root);
    const again = h("button", { class: "btn primary", type: "button", "data-needs-network": true, text: "Play Again" });
    again.addEventListener("click", () => this.last && void this.play(this.last));
    const pick = h("button", { class: "btn secondary", type: "button", text: "Pick a New Topic" });
    pick.addEventListener("click", () => this.renderTopics());
    const diffs = (["easy", "medium", "hard"] as const).filter((d) => s.byDifficulty[d].total > 0);

    this.root.append(h("section", { class: "screen results" },
      h("h1", { text: "Round complete" }),
      h("div", { class: "score-card glass" },
        h("p", { class: "score-big", text: `${s.correct} / ${s.total}` }),
        h("p", { class: "score-sub", text: `${s.percent}% correct · Best streak ${s.bestStreak}` }),
        h("p", { class: "muted", text: r.categoryName })),
      this.notice ? h("p", { class: "notice", text: this.notice }) : null,
      h("h2", { text: "By difficulty" }),
      h("ul", { class: "diff-list", role: "list" }, ...diffs.map((d) =>
        h("li", {}, h("span", { text: d[0].toUpperCase() + d.slice(1) }), h("span", { class: "num", text: `${s.byDifficulty[d].correct} / ${s.byDifficulty[d].total}` })))),
      h("div", { class: "actions" }, again, pick),
      h("h2", { text: "Review" }),
      h("ol", { class: "review-list" }, ...r.questions.map((q, i) => {
        const a = r.answers[i];
        const c = r.choices[i];
        return h("li", { class: `review-item ${a?.correct ? "is-correct" : "is-wrong"}` },
          h("p", { class: "review-q", text: q.text }),
          h("p", {}, h("span", { "aria-hidden": "true", text: a?.correct ? "✓ " : "✗ " }),
            `Your answer: ${a ? c.options[a.picked] : "Not answered"}${a?.correct ? " (correct)" : ""}`),
          a?.correct ? null : h("p", { text: `Correct answer: ${c.options[c.correctIndex]}` }));
      }))));
    this.refreshOnline();
    focusHeading(this.root);
    this.say(`Round complete. You scored ${s.correct} out of ${s.total}.`);
  }
}
