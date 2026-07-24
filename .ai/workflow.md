# Agent Dispatch Workflow

Rules for when and how the main AI session delegates work to subagents.

## Research → dispatch tiered subagents

Self-contained research questions (repo archaeology, "how is X wired",
doc sweeps, sizing/feasibility checks) go to subagents, not the main
session. Pick the model tier by the rigor the answer needs:

| Tier | Use for |
|--------|---------------------------------------------------------------|
| haiku | Mechanical lookups: grep-style questions, file inventories, counting things |
| sonnet | Standard tracing and summarizing: build pipelines, config chains, API surfaces |
| opus | High-rigor analysis where a wrong conclusion is expensive: migrations, security, architecture calls |

### Model names per harness

The tier names above are the Claude Code names. When the session runs in a
different harness, substitute the equivalent model for the same tier:

| Tier (Claude Code) | OpenAI Codex | Kimi |
|--------------------|--------------|--------|
| fable (main session / visuals) | sol | k3 |
| sonnet (standard tracing) | terra | kimi 2 |
| haiku (mechanical lookups) | lina | kimi 2 |

Tiers without a stated equivalent in a harness fall back to that harness's
strongest listed model.

- Run independent questions in **parallel** (one message, multiple dispatches).
- Subagents return **conclusions**, not file dumps; only conclusions enter the main thread.
- Every subagent prompt that touches Snice development work must instruct:
  "read all `.ai/` files first".
- Research subagents are read-only: no edits, no commits, no deploys.

## Visuals → never delegated

Anything that requires eyes on rendered UI is done directly by the main
session (the strongest model available — Fable), never by a subagent:

- Screenshots and component appearance review
- Dark/light mode verification
- Design judgment, polish calls, "does this look right"

Rationale: visual judgment quality tracks model tier, and the user wants
the top-tier model's eyes on anything visual.

## Fixes and features → main session

Implementation follows the normal rules (`coding-standards.md`,
`component-checklist.md`, test-first bug discipline). Subagents may be used
for mechanical fan-out (e.g. the same one-line change across many files),
but design decisions and visual verification stay in the main session.
