---
name: w4s-stories
description: Research and craft detailed, self-contained, small, independently deliverable stories using .local/board and durable design artifacts. Use to create, refine, or resume stories, personas, and flows; authoring only, without starting implementation.
---

# Craft implementation stories

Every agent using this skill must read this entire `SKILL.md` before acting.
No skimming or substituting excerpts or summaries for the full text.
Read applicable referenced instructions in full when needed.
Reuse unchanged text already read fully in the current context.

This skill's sole purpose is to craft and refine stories and their supporting design.
All agents, including the coordinator, must read and apply the binding technical-scope and accuracy-and-truth rules in [shared rules](references/shared.md).
The terminal invoking this skill is the coordinator and the user's liaison only.
Dispatch research and story writing to two separate agents; do not perform research, design, story writing, or artifact edits in the coordinator.

Separate implementation agents will execute the stories later, in a separately invoked workflow.
You do not implement them.
Agents dispatched during story authoring perform only research, design, or advisory review; do not dispatch implementation workers or modify product code.
Invoking this skill or accepting a story does not request implementation.
Do not assume when implementation will happen, launch the factory, or steer the session toward an immediate implementation handoff.
Finish with the saved stories and design status.

Read `.ai/README.md`, all policies under `.ai/policies/`, and applicable `.claude/rules/` pointers and nested rules in full.
Each agent reads the policies applicable to its assignment.
Informational documents and unrelated skills are not policy.
Reuse unchanged policy text already read in the current context.

Agents are responsible for reading, reviewing, and reconciling documents; never tell the user to do that work on your behalf.
Relay questions in chat, one at a time, with enough context to answer without reading the documents.
Have the researcher and writer return concise questions, progress, and artifact paths; keep detailed investigation and drafts in their contexts and saved artifacts.

## Load instructions by role

- Researcher: read [shared rules](references/shared.md) and [researcher instructions](references/researcher.md) in full.
- Story writer: read [shared rules](references/shared.md) and [writer instructions](references/writer.md) in full.
- Critics: read [shared rules](references/shared.md), [advisory-critic instructions](references/critics.md), the authoring role instructions supplied with the assignment, and the assigned critic definition in full.

## Working loop

1. Launch the researcher with the user's request and answers, applicable policy paths, and existing story/design paths; assign the researcher instructions.
2. Relay the researcher's focused questions to the user, one at a time, preserving their context, options, and evidence; return the user's answers to the researcher.
3. Once the researcher has saved enough understanding for actionable stories, launch a separate story writer with the user's request and answers, saved research/design paths, settled and open decisions, and the writer instructions; do not wait for unrelated research to finish.
4. Relay the writer's information gaps to the researcher and the resulting user questions to the user; return findings and answers to the affected agents.
5. The writer launches A/B/C/D for each story under this skill's advisory-critic instructions; critics report directly to the writer, which continues authoring while they review.
6. Repeat the affected work as needed until the stories are complete; relay saved story/design paths, commit status, and remaining user decisions.

## Model selection

Use the strongest suitable available models for substantive story work: interviews, personas/flows, engineering, UX/UI, research synthesis, writing, and advisory critics.
Resolve the latest available releases; do not pin versions or mandate one fixed model.

| Workflow | Substantive story work | Specific facts, searches, light research |
|---|---|---|
| Claude | Fable or Opus latest, selected for the task | Haiku latest |
| Codex | Astra or Sol latest, selected for the task | Luna latest |

Delegate bounded fact lookups, searches, and light research to the smallest capable model.
Keep substantive analysis, interpretation, and design decisions on the stronger models.
Apply this capability distinction on other harnesses too.
Set each agent's model explicitly and reasoning effort to high or above based on its task and supported settings.
These authoring selections do not inherit factory rigor or cheap-mode defaults.

## Progress

Announce the phase at entry and when it changes.
Every 20 minutes, report one line:

`<phase> | phase ~<percent>% | ETA ~<time remaining> | last: <current/latest work>`

Estimate phase completion and remaining overall time from work done and known remaining work.
Never report unknown progress or ETA.
Use natural work events and sensible waits; do not repeatedly poll agents or reread artifacts just to produce updates.
