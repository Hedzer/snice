# Local story records

Use one controlling repository root for each story and repository-root-relative record links.
Preserve an existing board schema and safe story IDs; record its mapping before use rather than silently moving records.
New whole stories live at `.local/board/todo/<story-id>.md`; use the [story template](story-spec.md#whole-story-board-template).
Durable design lives under `.local/design/` and is tracked and committed.
`.local/board/` and `.local/cards/` are ignored execution records; do not create implementation cards during story authoring.

```text
.local/
  design/<design-id>/
    index.md                 # personas, flows, research, decisions, and linked stories
  board/
    todo/ ready/ in-progress/ spec-review/ stuck/ done/
      <story-id>.md           # complete whole story; exactly one status location
    .claims/<story-id>/owner.md
    .work/<story-id>/         # existing implementation records, when present
  cards/<story-id>/           # existing implementation tasks, when present
```

- `todo`: an unstarted story; new authoring records are created here.
- `ready`: an actionable story under the existing board's rules.
- `in-progress`: work is actively being executed.
- `spec-review`: a genuine unresolved user-intent or authority question prevents the affected execution work.
- `stuck`: an actual execution or verification limitation prevents completion.
- `done`: the requested work and required verification are complete; finished stories are read-only to the story author.

Do not manufacture execution status, priority, dependencies, run metadata, or approvals while authoring.
Mark unresolved required details as draft content rather than claiming the story is implementation-ready.
Preserve the original request, history, and distinction between User-provided and Skill-authored details.
Keep all required implementation and verification content inside the story; design links supply supplemental provenance.

Use a path-safe unique ID for a new story and exclusive file creation; never overwrite another story to resolve an ID collision.
Reject absolute IDs and path traversal.
Resolve the current story path by ID and status before each write.
Respect live claims in `.local/board/.claims/<story-id>/`; an old timestamp does not prove the owner has stopped.
Do not take over a live claim or change implementation records merely to author a story.
Check whether a story is finished before every write and leave finished stories unchanged.

Verify effective ignore rules before writing board content: board/cards must be ignored and durable design must remain addable.
Use repository policy or the local Git exclude file for ignored records; resolve that file through Git because `.git` may be a worktree pointer.
Preserve tracked design and unrelated tracked local files; never stage board/card execution records.
