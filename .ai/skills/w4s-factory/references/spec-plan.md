# Conditional research, specification, design, and planning

These are tools for resolving concrete uncertainty or coordinating work, not mandatory
stages. A settled bounded request goes directly from concise story/card scope to Worker.
Keep ordinary decisions and results in the existing story/cards. Create separate artifacts
or specialist assignments only when they resolve a concrete delivery need. Repository
workflow policies cannot make them universal prerequisites.

## Research

Inspect current source, callers, tests, and applicable precedent enough to verify the
premise and bound the change. The Worker can do this within implementation. Use a separate
read-only researcher for uncertainty that needs independent investigation or useful parallel
work. Cite decisive paths/revisions; do not require exhaustive history or concern reports.
Search history, line dates, or default-branch precedent only to resolve a concrete
unanswered implementation question, never as routine startup bookkeeping.
Prefer applicable current project patterns. Resolve conflicting precedent from policy and
context, recording only the material decision. Prior unsuccessful drafts are not approval.
Distinguish routine engineering choices from unresolved user outcomes or authority; decide
the former from evidence and surface the latter promptly instead of burying them in further research.

For a reported defect, reproduce the reachable failure with a fast focused regression test or
actual entry point where available. If setup prevents reproduction, investigate supported
routes. Do not invent a failure or fix; record the missing evidence and ask only when it
prevents a sound correction. For a suspected vulnerability, establish reachability and
realistic prerequisites without unauthorized live exploitation.

## Specification

The supplied request and concise story criteria are the specification for clear work.
Use a separate spec author only to resolve material product ambiguity. A separate `spec.md`, when useful, contains the requested outcome, included
scope, observable criteria, customer scenarios, decisive evidence, and unresolved questions.
Do not create exclusions, assumptions, estimates, or fields merely to fill a template.

Cover affected contracts, failure states, permissions, data, and rollout requirements only
where the change needs them. Health, safety, financial, privacy, rights, and essential-service
consequences depend on the actual task, not an assumed industry. Use task-derived specialist
validation and approval requirements where applicable. Do not invent them for ordinary work.
For command-line and library tasks, use the actual public entry point; do not invent a UI.

A clear user request does not need renewed approval as a spec. Reuse approved decisions;
ask when changing their meaning or when material user intent remains unresolved. Record a
concrete question and sources in the story, then use `spec-review` if that decision blocks
remaining work. Continue independent implementation while awaiting a genuine decision.
Ordinary implementation choices and fixable defects do not trigger renewed requirements
approval. Preserve approved requirements rather than strengthening them.

## Design

Use the existing interface, project components, and request to implement bounded visual
changes directly. A changed visual interface alone does not require a designer, prototype,
reference captures, or a separate review gate. Assign a designer when unresolved layout,
interaction, accessibility, or state decisions need it.
Produce only the decisions and references implementation needs. A working prototype is
optional unless requested. Verify all changed user-visible states
against the settled request and any actual design targets at final customer verification.

## Cards and planning

Create the fewest cards that cover the requested work, normally one for a bounded change.
Each card needs its story ID, repository/workspace, requested change and scope, permitted
files or bounded areas, dependencies if any, necessary checks, and result/evidence links.
Keep exact test cases with the Worker rather than prescribing every assertion in advance.
Scope includes necessary source, callers, tests, and configuration; it grants no unrelated
cleanup or feature expansion. Record ordinary scope omissions on the same card and return
them to the original Worker. Use a planner only for genuinely new scope or coordination.

For complex work, a planner may map criteria to cards and order dependencies in `plan.md`.
Use separate implementation cards when they enable safe independent work or bound a real
coordination need. Do not split records or create critic gates because research, design,
tests, or verification occur. Critics run at the end of each card. The Worker normally
follows serious advice and settles every finding by fixing or explicitly skipping it
with a specific reason. Critics have no approval authority.

Never run long tests or full suites before starting or resuming work. Card checks must
be fast and targeted. Only after all story cards, critic rounds, and Worker fixes/skips
are settled, run the complete required suites/root checks and available production-code
coverage, then independent customer
verification of all added/changed features, behaviours, and fixes. Link their results from
existing records; full verification is a story-end activity, not a card-level check. Critics do
not pass or fail cards. A verification failure returns to the responsible Worker. Pause only actual dependents,
not independent implementation; no planner or critic gate is implied.
