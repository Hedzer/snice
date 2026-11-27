# Local state

Use one controlling repository root for each story. All paths below are relative to it.
Do not create a second story record inside a worktree. Workers receive absolute paths.
If an existing board has a different schema, preserve it and record a mapping before use;
do not silently move existing stories or task cards.
An absent `.local/` tree is normal before first use; validate ignores before recording
board/card execution state. Durable `.local/design/` artifacts are tracked and committed.

```text
.local/
  design/                    # durable personas, flows, research, and specifications; committed
  board/
    todo/ ready/ in-progress/ spec-review/ stuck/ done/
      <story-id>.md           # complete story record; exactly one status location
    .claims/<story-id>/owner.md # exclusive claim, created by atomic directory creation
    .work/<story-id>/         # stable story artifact root; does not move with status
      research/               # optional investigation artifacts
      spec.md                 # optional when story criteria suffice
      design/                 # conditional: design.md, references, prototype, target states
      plan.md                 # optional complex-work coordination
      reviews/                # optional saved advisory results
      prompts/<dispatch-id>.md
      evidence/
      delivery.md             # optional result summary
      checkpoint.md
      events.md               # append-only transitions and run outcomes
  cards/<story-id>/
    backlog/ doing/ review/ done/ dropped/
      <task-id>.md            # bounded task card; exactly one status location
```

`board/` contains whole stories, not pointers to stories stored in `cards/`. Each story
record preserves the user's request, scope, acceptance criteria, decisions, and completion
rule; link durable design under `.local/design/` and execution artifacts under
`.work/<story-id>/` when needed. Reuse approved design; do not recreate it in `.work/`.
`cards/` contains the bounded task cards for each story; a separate planning assignment is not required. A task card is
also called an item in this workflow. Each card identifies its parent story by ID.
Use root-relative links for story artifacts and card paths. Resolve the current story
path by ID/status after transitions; do not retain a stale absolute story filename.
Artifact paths remain stable across story transitions and worktrees.

Use path-safe unique story IDs, such as `story-<UTC timestamp>-<random suffix>`; preserve an
existing safe ID. Reject path traversal and absolute IDs. Create records exclusively;
never replace an existing story or task card to resolve an ID collision.

Ensure `.local/board/` and `.local/cards/` are ignored through repository policy or the
local Git exclude file. Resolve the exclude file through Git; `.git` may be a worktree
pointer. A blanket `/.local/` ignore must allow a narrow exception for `.local/design/`
when durable design is present. Verify board/cards are ignored before recording content;
when design is present, verify it is addable. Tracked design is expected; never untrack it.
For other tracked local files, preserve them and resolve any execution-state conflict before mutation.
Never stage board/card execution records.

## Story record

Record: ID, title, original request verbatim, repositories, priority, dependencies,
profile, run ID, base revisions, worktree/branch paths, delivery authorization, and
completion rule. Include scope and acceptance criteria; add research/spec/plan/review/evidence links, decisions with sources,
open questions, and external review links when relevant. An agent's implementation
choice is not a human approval. Preserve the original request and approval history.

Once implementation, card findings, final story verification, and requested authorized
delivery actions are complete, move directly from `in-progress` to `done`. Do not add
a separate review or acceptance stage. An inherited workflow rule cannot add that wait;
a Git remote alone does not create an external completion requirement.

## States

| State | Entry and exit |
|---|---|
| `todo` | Unstarted request. Eligible if dependencies and any readiness condition permit. |
| `ready` | Request is actionable, or a blocked prerequisite has been resolved. No separate spec approval is implied. |
| `in-progress` | This run holds the claim and is executing the pipeline. |
| `spec-review` | A genuine user-intent or authority decision prevents remaining work; record the question. Critic advice cannot cause this state. |
| `stuck` | A genuine execution or verification limitation prevents completion. Critic advice cannot cause this state. |
| `done` | Requested work, settled card findings, final story verification, and requested authorized delivery actions are complete. Enter directly from `in-progress`. |

Select only stories in `todo` and `ready` in automatic modes. In automatic selection, apply the ranker
and readiness procedure in [flow rules](flow.md); explicit user ordering has precedence.
Rank only supported impact, risk reduction, deadlines, dependency relief, and effort.
Unmet/uncheckable follow-ups stay waiting. A satisfied activation condition moves the
story to `spec-review` with its evidence; human approval is required before `ready`.
Resume another state only for the named story with a resolved blocker or checkpoint.

## Claim and transition

1. Create `.local/board/.claims/<story-id>/` atomically with non-recursive directory creation after creating
   its parent. Failure means claimed; do not work it. Record run/session identity and
   UTC start time in `owner.md`. Re-read status and dependencies after acquiring the claim.
2. Only the claim holder moves the whole story file to `in-progress`. Move by same-filesystem
   rename; do not overwrite a destination. Log from/to, run ID, time, and reason.
3. Keep the claim through all worker/reviewer activity. Before release, stop or join
   dispatched agents, save their state, write the checkpoint, and record the terminal
   transition. Remove only this run's claim. Preserve story and task-card content.
4. A claim age is not proof of abandonment. After a crash, establish that its session
   and workers have stopped before explicit recovery. Never steal a live claim.

Only Foreman moves story files and cards. A card enters `doing` when assigned and `review`
after implementation and fast targeted checks. Run its advisory critic round, then let
the Worker fix or explicitly skip each finding. Move to `done` once the round and those
decisions are settled, including fast targeted checks for fixes. Critics do not approve
these transitions. Full verification starts only after all story cards are settled.
Preserve existing legacy `deferred` records without treating them as a critic gate.
Keep dependencies directed and acyclic. Failed required checks and unanswered decisions
pause only their actual dependents; continue independent work. Reserve files while an
active assignment can write them. Serialize shared-file writes, index and commit operations.

## Resume from saved work

Inspect the story, events, claim, checkpoint, cards, workspace, evidence, and actual
agent state. Recover ownership as above. Repair interrupted transitions from evidence
while holding the claim. Resolve conflicting story locations or unknown live writers
before mutation. Account for work completed after the checkpoint; do not repeat it.

Compare the current story and requirements with the saved scope/revision. If unchanged,
continue the next unfinished action in the existing workspace and cards. Preserve
completed work, decisions, and valid evidence. Do not repeat research, specification,
planning, card creation, implementation, settled critic rounds/decisions, or tests merely because the
terminal or Foreman is new. A failed check remains unfinished work to repair.

If the story or requirements changed, record the change and revise only affected work
and its actual dependents. Reuse everything unaffected. Continue required checks that
remain unfinished; refresh evidence only where an actual change invalidates it, using
fast targeted checks during card work and full verification at story end.

## Checkpoint

Record intent and constraints; stage and run/profile; batch story IDs and completed IDs
for X/Y progress; owners and agent IDs; approved
story/requirements revision or saved scope reference; item states; base/current revisions and uncommitted files; evidence paths;
decisions; failed attempts; critic-round progress, fixed/skipped findings and reasons; next command or dispatch; resources to clean
up; permissions still needed. Store no credentials. Link artifacts instead of copying them.
