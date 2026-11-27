# Execution rules

Use these rules to resolve phase and state transitions. A story's board file is the
whole request; task cards are its bounded implementation and verification steps.

## Selection and sessions

For `auto`/`loop` maintenance, the launcher enumerates only stories with unfinished requested remote actions
and waiting readiness follow-up IDs. A supplied task or `specific` story starts directly,
without unrelated reconciliation, readiness checks, or ranking. It performs no reconciliation, readiness decision, claim or
board mutation itself. For each ID, launch and join a separate fresh top-level story
terminal with its maintenance purpose before starting another story terminal.
Separately, it may read the requested batch's story IDs/statuses to report X/Y stories
done; this does not authorize selection, claims, or story mutation by the launcher.

A reconciliation Foreman acquires the named story's atomic claim, re-reads its current
status/evidence. Skip another live owner's story and exit. Apply
[completion rules](local-state.md#story-record): mark `done` using still-valid saved
evidence when the work is complete, then save, release, and exit this maintenance
terminal. Do not repeat reviews or tests merely to correct the status or create an
external review or follow-up for completed work.

When requested remote work remains, dispatch the read-only reconciler.
Apply the returned decision without diagnosing code:

- All required review requests merged: mark the named story `done` only if its recorded
  completion rule is met. Create one linked verification follow-up for the permitted
  target; reuse an equivalent follow-up instead of duplicating it.
- Substantive correction or request returned to draft: save the feedback and move the
  named story to `ready` for a future fresh execution terminal.
- Unfinished requested remote action: preserve its evidence and next action.
- Passing mergeable requests: merge only with existing authorization. Otherwise retain
  the missing authorization in the checkpoint; readiness is not authority.

Create/update deduplicated follow-ups only under the parent story's claim and stable
follow-up key. Save the result, join specialists, release the claim and end this
Foreman/terminal. Never reconcile another story or continue into selection in this
context. Readiness maintenance has the same one-story terminal boundary.

### Pre-selection ranking

An execution terminal in `auto`/`loop` may dispatch one fresh read-only ranker before
binding a story. This is the sole pre-claim dispatch exception. Require successful
setup, ignore validation, a selection-run ID, an immutable eligible-story inventory,
a readable complete prompt, and writable selection artifacts under the ignored board
work area. Pass role, model, repository, evidence, permitted output paths and required
result; story/card/claim fields are explicitly not yet applicable. The ranker may read
only candidate records and binding non-workflow repository policy, write its rationale, and return
one eligible story ID. It cannot claim, mutate, implement, reconcile, or be Foreman.

Explicit user order takes precedence; otherwise compare evidenced user impact, value
for effort, risk reduction, deadlines and dependency relief. Exclude live claims and
unmet readiness conditions. Preserve the rationale. The Foreman then binds exactly
one selected story, acquires its atomic claim and re-reads state before any story
dispatch or mutation. No eligible result ends this terminal. Never rerank another
story in a context already bound to one; return to the launcher for a fresh terminal.

`specific` accepts only an eligible named story, or an explicitly resumed story whose
blocker has been resolved and whose claim can be recovered. Another live owner prevents
execution. A name in the request does not transfer ownership.

Every story, including a single explicit task, runs in a new terminal or PTY with a
fresh top-level CLI process and conversation. The invoking primary terminal is only
the launcher. The new story terminal's primary agent is its sole Foreman/coordinator;
workers, reviewers and other terminals never become Foreman or start another factory.
A top-level CLI process launched in a new terminal is not a native subagent Foreman.

Before crossing a story boundary, join or stop its specialists, save its checkpoint
and outcome, release its claim, and end its Foreman and terminal. The launcher starts
a different terminal/process/conversation for the next story. Never resume, continue,
fork conversation history, or restore automatic task memory across stories. A summary,
compaction, or instruction to ignore earlier messages is not isolation. Record actual
terminal/process and conversation IDs. If fresh launch or memory isolation fails, stop
before claiming work; never substitute the launcher's context or a nested Foreman agent.

Bootstrap from binding non-workflow repository policy, the supplied request or selected story's own disk
records, and current repository evidence. Carry only run configuration (including
existing authorization, batch story IDs and completed IDs for progress) and the
attempted-story set across stories. Do not carry
conversations, agent handles, role outputs, or Foreman decisions from another story.
Research may inspect relevant committed precedent with citations. Resuming the same
story starts another fresh story terminal from its checkpoint and saved evidence.
Apply [saved-work recovery](local-state.md#resume-from-saved-work): continue where work
stopped, preserve completed work, and revise only what changed story requirements affect.
Amendments within the active assignment may reuse its author; new cards and new independent review assignments get fresh specialists.

For `loop`, the launcher waits for each story terminal to exit before launching the
next eligible selection in another fresh terminal. A genuine unresolved prerequisite or stuck result ends
that story, not independent eligible work, but cannot waive the fresh-terminal rule.
Do not wait for future stories or retry attempted ones.

## Readiness follow-ups

Derive rollout requirements from the target repository and the change's actual effects.
If a new rule can reject previously valid operations or prevent startup, use the
repository's established staged-activation mechanism unless approved precedent permits
direct activation. Where that mechanism supports observation before activation, record
what the new rule would reject and provide a way to disable it. Specify absent-setting
behaviour and verify startup explicitly. No business domain, environment hierarchy, or
deployment system is assumed. Ordinary changes do not acquire an unnecessary rollout stage.

A staged-action follow-up has an exact observation source/check, threshold, time window
starting from actual deployment, and required approver. Evaluate it at most once per run.
This evaluation applies to waiting/unapproved follow-ups only. Acquire its claim and
re-read status before recording evidence or moving it. If unmet or uncheckable, leave it
waiting, save the result, release, and end this maintenance terminal. If met, record
the check/result/window, move it to `spec-review`, release, and end this terminal. An explicitly human-approved `ready`
follow-up needs no new readiness decision: release and exit maintenance; execute it
only in a fresh execution terminal. Do not repeat its approval transition. Only
the human can approve activation. The launcher may continue other work in another
fresh terminal; the maintenance Foreman cannot select it in this context.

## Stage boundaries

| Stage | Role and required output | Next action |
|---|---|---|
| Scope | Foreman records the requested outcome, criteria, customer scenarios, and bounded card(s) from the settled request. | Dispatch the Worker directly unless a concrete unresolved question needs another specialist. |
| Conditional preparation | Researcher, spec author, designer, or planner resolves only the uncertainty or coordination need assigned. | Use the result to unblock implementation; separate documents are needed only for that question. |
| Implementation | Worker completes its card, relevant regression tests, and fast targeted checks. | Dispatch the card's advisory critics. Continue independent card work. |
| Advisory review | At each card's end, independent A/B/C/D critics inspect that card's changes and available evidence in parallel when supported. | Complete the round. Worker normally fixes serious findings, or explicitly skips with a specific reason. Settle every finding and fast targeted checks for fixes; Foreman commits the settled card using existing authority. No critic approval or automatic re-review. |
| Final suites | Only after all story cards, critic rounds, and Worker fixes/skips are settled, run the complete required suite, root checks, and available production-code coverage. | Return failures to the responsible Worker; only dependent customer scenarios wait for repair. No separate full-suite card or critic approval is required. |
| Customer verification | Independent verifier executes all added/changed feature, behaviour, and fix scenarios against the actual changed system. | Return failures to the original Worker; rerun affected final suites and scenarios. No critic gate per scenario. |
| Delivery | Foreman completes the requested authorized delivery actions using role evidence. | Move directly to `done` once the requested work and required verification are complete. |
| Remote repair | Responsible Worker fixes a bounded defect from saved failure evidence. | Refresh affected final proof, seek useful affected advice, then complete authorized delivery. Use a planner only for genuine new scope or coordination. |

A worker returning `needs-scope` must identify the missing work. For a required omission
within the requested outcome, the Foreman amends the existing card and permitted files,
then returns it to the same Worker. Do not create a planner assignment or new card just
to repair that omission. Genuine new scope or multi-card coordination may need a planner;
changes to user intent or authority need the user's decision. Surface the question promptly
and continue independent work. Use `spec-review` only when that actual decision prevents
remaining work; critic advice cannot cause this transition. Preserve work;
publish only with existing authorization.

At story end, save the result, outstanding questions/findings, branch/review links,
usage/cost when supplied, cleanup status, and next action in the existing records.
Stop only run-owned resources. Release the claim only after its agents stop or join.
