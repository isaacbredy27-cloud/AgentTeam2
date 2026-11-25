# OWASP: LLM Prompt Injection Prevention

Source: https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html (read 2026-11-25)

Attack types listed include: direct injection, remote/indirect injection, encoding and obfuscation,
HTML and Markdown injection, jailbreaking, multi-turn attacks, system prompt extraction,
data exfiltration, RAG poisoning and agent-specific attacks.

Primary defences listed:
- Input validation and sanitisation.
- Structured prompts with clear separation of instructions and data.
- Output monitoring and validation.
- **Human-in-the-loop (HITL) controls** for high-risk actions.
- Best-of-N attack mitigation.

## How we apply it
- The model's only tool is `propose_change`. Writing to GitHub needs a human Approve click (HITL).
- Server code re-validates every path and size the model sends (output validation).
- Agent text renders as plain text (blocks HTML and Markdown injection).
- No secrets ever enter a prompt (nothing to exfiltrate).
