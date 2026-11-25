# Claude Code subagents: running a team

Source: https://code.claude.com/docs/en/sub-agents (read 2026-11-25)

## What each subagent starts with
"Each subagent starts with a fresh, isolated context window. It doesn’t see your conversation history, the skills
you’ve already invoked, or the files Claude has already read." It gets: its own system prompt, **the task message you write**,
the CLAUDE.md files, a git status snapshot, and its preloaded `skills`.
→ Put every fact the expert needs into the delegation message.

## Parallel and chained work
- Parallel: "For independent investigations, spawn multiple subagents to work simultaneously ... then Claude synthesizes the findings."
- Chain: "Each subagent completes its task and returns results to Claude, which then passes relevant context to the next subagent."
- Results return to the caller and use its context. Many detailed results "can consume significant context". Ask for short reports.

## Background and limits
- A custom subagent spawned from the main conversation "starts in the background" by default. Permission prompts surface in the main session.
- Nesting: a subagent can spawn its own, "up to three layers below the main conversation". Main → orchestrator → expert is two layers.
- Concurrency: "when 20 subagents are running in a session, spawning another with the Agent tool fails with `Concurrent subagent limit reached`."
  There is no limit on the total over a session.
- `Agent(type1, type2)` allow-lists in `tools` only apply when the agent runs as the main thread (`claude --agent orchestrator`).
  In a subagent the list in parentheses is ignored.

## Keeping handoffs through the orchestrator
- An expert without the `Agent` tool cannot start other agents.
- A subagent whose tools include `SendMessage` gets a "sibling roster" and could message other agents directly.
  Our experts set `disallowedTools: Agent, SendMessage` so every handoff comes back to the orchestrator.

## When not to delegate
Use the main conversation for quick, targeted changes or tight back-and-forth. Subagents start fresh and need context.
