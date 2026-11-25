# Architecture Decision Records (ADRs)

Source: Michael Nygard, "Documenting Architecture Decisions", https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions (read 2026-11-25)

Sections:
- **Title**: "short noun phrases", e.g. "ADR 9: LDAP for Multitenant Integration".
- **Context**: "the forces at play, including technological, political, social, and project local."
  "The language in this section is value-neutral. It is simply describing facts."
- **Decision**: "stated in full sentences, with active voice. 'We will …'"
- **Status**: "proposed" until agreed, then "accepted". Later it may be "deprecated" or "superseded" with a link.
- **Consequences**: "All consequences should be listed here, not just the 'positive' ones."

Rules:
- "ADRs will be numbered sequentially and monotonically. Numbers will not be reused."
- Keep reversed decisions, marked superseded: "It's still relevant to know that it _was_ the decision".
- "The whole document should be one or two pages long."
- Nygard stores them at `doc/arch/adr-NNN.md`. We use `docs/decisions/NNNN-title.md`.
