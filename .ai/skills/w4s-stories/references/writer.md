# Story writer — story authoring

Own the stories using the researcher's saved understanding, the user's request and answers, settled decisions, and applicable policies.
Send missing facts or unresolved questions through the coordinator to the researcher; use returned findings and user answers to refine the affected stories.

Once research and decisions are available, aim to write a typical complete story in a few minutes, roughly five.
This is a pace expectation, not a hard deadline, timeout, or cutoff; take longer when the work needs it and retain all required detail.
Use the prepared understanding directly; avoid unnecessary deliberation.

Produce a researched, explicit specification of the requested product.
Specify requirements, agreed decisions and rationale, relevant contracts, concrete examples, edge cases, and observable completion criteria.
Apply the technical-scope rule; do not prescribe implementation details merely to remove implementer judgment.

Every new or amended story must be self-contained.
Assume its worker has the repository and this story, but none of the authoring conversation, prior stories, or design context.
Put everything needed to implement and verify the story inside its board record: relevant context, requirements, rationale, decisions, contracts, dependencies, UI details, and verification and completion requirements.
Make each applicable detail explicit.
Links may supply provenance or optional background; they cannot substitute for required content.
Workers must not have to open another story or design document to discover what to build or what completion means.
Include applicable policy constraints in the story; workers still read binding repository policies.
Reuse settled design work by embedding its relevant content, without repeating research or adding unrelated material.

Craft and edit stories as understanding develops; do not wait until all questions and research are finished to start writing.
Complete each story when it has enough information, without waiting for the other stories.

Shared design may reference common branches; embed every branch needed for a story in that story, using internal anchors to avoid repetition within it.

## Specify the solution

Use the [specification contract](story-spec.md) to write the applicable details.
Cover every requested flow and branch.
Explain chosen decisions and meaningful rejected alternatives.
Specify required behaviour, relevant contracts, constraints, failure outcomes, and evidence of completion.
Make consequential requirements and agreed decisions explicit.
Include technical detail only under the technical-scope rule.
Distinguish binding constraints from optional implementation suggestions.

Embed all applicable details and shared policy values in each story; a policy link alone is insufficient.

## Size stories for independent delivery

Write the smallest practical whole stories: one coherent, useful outcome with an explicit finish condition, verifiable once its declared prerequisites exist.
Split independently deliverable outcomes.
Do not minimize story count or split into trivial fragments that cannot work alone.
Keep inseparable work together when splitting adds more coordination than useful parallelism.
Small scope must retain complete requirements, relevant branches, rationale, and verification details; do not defer essential behaviour to unspecified work.

Design stories for safe parallel implementation by future workers.
Settle shared contracts, identify overlapping changes and ownership, and record which stories can proceed independently.
State only real prerequisites and why they are required.
Separate shared prerequisite work only when needed; do not invent preparatory stories or architecture to create parallelism.
No story may depend on an unstated decision being made in a concurrent story.

## Advisory critics

Read and apply the [advisory-critic instructions](critics.md).

Launch A/B/C/D for each story in fresh contexts, in parallel where supported, with `SKILL.md`, the shared, researcher, writer, and advisory-critic instructions, the story, relevant design documents, research, user instructions and answers, and applicable policies; explicitly assign D to check that this skill was followed and have all critics report directly to you. Continue authoring while they review.

## Save and finish stories

Embed the relevant definitions in every affected unfinished story; this required inclusion is not repeated design work.

Read this skill's [local-state contract](local-state.md) for board format, IDs, and existing claims.
Reuse the existing schema and the specification reference's board template.
Keep the complete implementation and verification specification inside each board story, including relevant `.local/design/` content.
Links to design artifacts are supplemental.
Do not replace any required story detail with a pointer or move durable design into factory execution scratch space.

Create new stories exclusively at `.local/board/todo/<story-id>.md`; preserve IDs and history when amending a named unfinished story.
Check overlap and respect live claims.
Do not manufacture priority, run metadata, dependencies, or approvals.

Before finishing, read each new or amended story as a fresh worker with no conversation or linked design context.
Check that all required facts, contracts, decisions, steps, and expected results are explicit inside it.
Requested flows must map to inline criteria and customer scenarios; references must resolve, decisions must agree across artifacts, and open choices must be visible.
Unresolved required details make that story a draft, not implementation-ready.
Check story boundaries and dependencies for avoidable bundling or serialization.
Report saved story/design paths, commit status, and remaining user decisions.
