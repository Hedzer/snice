# Shared authoring rules

These rules apply to the researcher, story writer, and critics within their assignments; the coordinator follows `SKILL.md`.

## Binding technical scope

Specify the requested outcome, behaviour, constraints, acceptance criteria, and agreed contracts.
Prescribe implementation details only when required by user instructions, repository policy, compatibility, or an evidenced design constraint.
Leave other implementation choices to the implementer.
Do not require file trees, function names, pseudocode, or exact internal structure by default.

## Binding accuracy and truth

Every story must be truthful and accurate.
Verify factual claims against relevant source material and cite the evidence.
Distinguish verified facts, user decisions, proposals, assumptions, estimates, and unknowns.
Never invent evidence, requirements, decisions, existing behaviour, or verification results.
When evidence conflicts or is insufficient, state the uncertainty and its effect on the story.
A story with an unresolved factual claim that could change its scope, solution, or acceptance criteria remains a draft.
Correct discovered inaccuracies in affected design artifacts and unfinished stories before declaring them ready.

## Authoring boundaries

Finished stories (`done` or the repository's equivalent completed state) are read-only.
Do not edit, reopen, move, or delete them, including to add missing context or apply new design, policy, or skill rules.
Check current status before each story write; if finished, leave it unchanged.
Read finished stories only as reference.
Requested changes to completed work belong in a new story that links to the finished story without modifying it.

Develop the detailed solution within agreed requirements; ask about unresolved choices affecting the requested outcome, scope, or constraints unless the user delegated those choices.
Maximize user experience and correct operation within the agreed scope and workload.
Apply YAGNI: use the simplest adequate solution; do not add speculative features, infrastructure, or process.

## Resume and establish context

Inspect relevant product/source facts to ground the design.

Read `.ai/policies/primer.md`, `.ai/policies/ui-policy.md` when relevant, existing stories, and the saved design index.
Continue from the unfinished point.
Do not repeat settled interviews, personas, research, or design phases unless the user requests changes.
Surface a new conflict against the specific decision it affects; do not restart the process.
Reuse approved requirements without strengthening them.
Distinguish User-provided details from Skill-authored details in each story and design artifact; preserve that attribution when reusing or revising content.
Apply the binding accuracy-and-truth rule above.

Use these phases to describe current work, not as gates to repeat: context/personas, flows/questions, research/options, detailed design, story finalization.
Move between them only as unresolved work requires.
Continue independent story-authoring work while awaiting an answer.

## Save stories and design

Keep personas, problem models, branch walkthroughs, research, specifications, diagrams, and decision rationale in `.local/design/`.
Reuse the existing organization; otherwise use `.local/design/<design-id>/` with a concise `index.md`.
Index artifact paths, linked stories, settled/open decisions, current phase, and the next unfinished action.
Use stable references between flows, criteria, decisions, and scenarios.
Update the owning design artifact and reuse shared definitions during design.

When an agreed decision changes, update the affected design and unfinished stories consistently.
Shared project designs can serve several stories.
Save at meaningful decisions and before ending the session.

Design artifacts are tracked and committed.
Keep `.local/board/` and `.local/cards/` ignored.
If a blanket `/.local/` ignore hides design, use a narrow exception in the repository ignore rules, preserving other ignores.
One root `.gitignore` form is:

```gitignore
!/.local/
/.local/*
!/.local/design/
!/.local/design/**
```

Check effective ignore rules, including Git excludes: design must be addable while board/cards remain ignored.
Never untrack existing design.
Commit scoped design and agreed primer/UI-policy changes at a coherent authoring checkpoint, preserving unrelated work and staged changes.
Respect an explicit instruction to return text only or not to commit; report that limit without claiming artifacts were saved or committed.

Record open questions with the specific work they affect.
An unanswered question does not stop independent design or stories, and an open decision is not an implementation-ready requirement.
Do not create `.local/cards/` implementation tasks or run product tests merely to author stories.
