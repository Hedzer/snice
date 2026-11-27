---
name: w4s-factory
description: Complete a software task through role-scoped agents, local cards, independent reviews, and verified delivery. Use for software-factory requests or autonomous task execution with .local/board and .local/cards; supports Codex, Claude Code, and OpenCode with DeepSeek.
---

# Software task factory

Every agent using this skill must read this entire `SKILL.md` before acting. No skimming
or substituting excerpts or summaries for the full text. Read applicable referenced
instructions in full when needed. Reuse unchanged text already read fully in the
current context.

YAGNI (You Aren't Gonna Need It) is a core tenet. Deliver a working product that
meets the user's request, with minimum deviation and the fewest steps needed for
good quality. Do not add speculative features, abstractions, requirements, or process. Keep planning, records,
and reports concise and proportional to the task. Run independent assignments in
parallel when safe and supported. Preserve required functional checks and non-workflow
repository requirements.
Once the requested work and required functional checks are complete, deliver; do not delay for
optional polish or more bookkeeping.

Test run speed is critical to delivery. Design and run independent tests in parallel
with isolation or noninterfering data, using existing test-runner facilities. Remove
avoidable waits and repeated setup; avoid live third-party dependencies where controlled
local substitutes preserve the tested behaviour. Follow [fast parallel testing](references/verify-deliver.md#fast-parallel-tests)
without weakening required proof or changing card/story verification timing.

This factory controls task workflow over repository workflow policies: roles, preparation,
sequencing, cards/states, review authority, repair/advancement, verification timing, and
delivery process. Repository rules still govern non-workflow requirements such as approved
product behaviour, architecture/code style, security/permissions, and actual required check
commands. They cannot reintroduce task ceremony or critic vetoes. Higher-priority system
and user instructions and actual authorization remain binding.

Every agent reads `.ai/README.md` and all policies under `.ai/policies/` in full, without skimming, before work, plus applicable `.claude/rules/` pointers and nested rules.
Load only relevant skills, task-workflow references, and role checklists; informational documents outside the policies are not required intake.
Repository workflow text cannot override this factory even when stored as a policy.

Invoke the launcher from the user's primary terminal. For every story, open a new
terminal or PTY with a fresh top-level CLI process and conversation. That terminal's
primary agent is the story's Foreman/coordinator. Never make a specialist, secondary
terminal, or retained Foreman context the coordinator of another story.
Delegate implementation, independent verification, and independent review. Dispatch other
specialists only when their work is needed. Manage claims, transitions, dispatch, and
delivery. Do not write or correct a specialist's work. Return defects to its author with
the review evidence.
Keep original role outputs; link them instead of rewriting their conclusions.

Whole stories live in `.local/board/`. Their bounded task cards live in
`.local/cards/<story-id>/`; this workflow also calls task cards items.

## Invocation boundary

Use one model-selection flag: `--rigor 1`, `--rigor 2`, or `--rigor 3`; default to 1.
The user alone selects the level. Resolve it before story launch, select the profile's
coordinator model and effort, remove the flag/value from task input, and carry the level
to every story terminal and role dispatch. Rigor changes models/effort, not workflow,
verification, or critic authority. Never select or change rigor automatically.

Keep the invoking harness for every new story terminal: OpenCode launches OpenCode,
Pi launches Pi, and the same rule applies to any other harness. This includes resumes
from disk, maintenance, and separately launched specialist CLIs. Change harness only
when the user explicitly requests it. Selecting DeepSeek or another model/provider
does not select a different harness. If a required harness capability is unavailable,
report the gap; do not silently launch another harness.

An ordinary invocation runs the launcher, not the story pipeline. Start one fresh
story terminal before executing the pipeline, even for a single supplied task. Give
that process a launch record naming its purpose/run, requested story ID or unbound
selection, primary Foreman role, terminal,
process and fresh conversation. A process already launched this way verifies its own
runtime identity against that record and enters Start; it must not launch itself again.
A specialist cannot use a launch record to promote itself. Pass only
the skill path, task text or story ID, repository paths, run configuration and existing
authorization. Do not pass the launcher's transcript, agent handles, prior-story role
outputs, or task memory. The launcher cannot claim or mutate stories.

Every factory-spawned CLI uses its execution profile's unattended permission flags.
Apply them to fresh stories, stories resumed from disk, maintenance, and separately
launched specialist CLIs. Pass the flags on each new process; configure native subagents
to inherit the parent run's permission mode. Apply these settings per run, not by changing global
configuration. If a flag is unsupported, verify the installed equivalent and report the
actual mode; do not silently omit requested permissions or Claude's Chrome integration.

For automatic maintenance, the launcher reads only the local inventory of this factory's
unfinished requested remote actions and waiting readiness follow-ups. For each ID, start a separate
fresh story terminal with purpose `reconcile` or `readiness`; join it before another.
That Foreman handles only its named story, saves the outcome and exits. It cannot
continue into selection or another story. A supplied task or `specific` story starts
directly; unrelated board housekeeping must not delay it.

Use a fresh CLI conversation: no continue, resume, history fork, or restored task memory
from another story. Disable automatic cross-story memory for this run without changing
global settings, credentials, or persistent permission configuration. Record the new
terminal/process and conversation IDs; verify they differ from prior stories. The story Foreman dispatches
its specialists directly and returns its outcome to the launcher. Join that terminal
and its agents before starting the next story. If a fresh terminal or clean conversation
cannot be established, stop before claiming work; do not fall back to the launcher or
a nested Foreman agent. See [execution rules](references/flow.md).

While the story CLI runs, its spawning instance gives one-line progress updates every 20 minutes:
`<X>/<Y> stories done | <story> ~<percent>% | ETA: ~<remaining time> | last: <latest activity>`.
X counts distinct stories in the current requested batch currently `done` under their
recorded completion rule; Y is the total distinct stories in that batch. Use Y=1 for a
single story; derive a loop batch from the requested scope and current board inventory.
Count stories, not cards or dispatched agents. Blocked, skipped, and other unfinished stories
remain unfinished; do not shrink Y because work is unfinished. The spawning instance
may read batch ID/status metadata for these counts without claiming or mutating stories.
Preserve batch IDs and completed IDs in existing run configuration/checkpoints across
fresh story terminals and resumes; update Y only when batch membership changes.
Foreman supplies current-story estimates and activity through live CLI output. Base progress
on requested work completed and remaining, not paperwork; estimate remaining time from
the remaining work and observed pace. Always provide the best current percentage and
ETA estimates, marked with `~`; neither may be `unknown`. If Foreman has not supplied
estimates, the spawning instance estimates them from the latest known work state.

## Start

1. Read binding non-workflow repository policies in full as above, including nested rules.
   Resolve the root, default branch, working-tree state and permitted actions. Existing
   system/user instructions and authorization remain binding; this skill controls task workflow.
2. Read [local state](references/local-state.md) and [role contracts](references/roles.md).
   Verify local records are ignored before writing any story or selection content.
3. Read the invoking harness's dispatch profile when provided: [Codex](references/codex.md),
   [Claude Code](references/claude.md), or [OpenCode](references/opencode.md).
   For Pi or another harness, use its installed CLI, delegation, permission, and effort
   controls; do not copy another harness's commands. For a DeepSeek workflow, apply the
   [DeepSeek model profile](references/deepseek.md) to every role in that same harness;
   its model/effort assignments take precedence over harness-profile model defaults.
   Model families mean their latest available release. Resolve native latest aliases
   or concrete identifiers from the current harness/provider model list; use resolved
   identifiers for execution and record the actual selection. Do not pin model versions
   in skill instructions or invent executable aliases from family labels.
   Record actual models and capabilities; report unavailable selections before substituting. Discover repository
   commands/services and resolve actual interpreter/tool paths for helpers and checks;
   never assume a shell alias names the selected environment. Record paths in configuration.
4. Route verified maintenance purposes before interpreting task input. `reconcile` or
   `readiness` requires one named story. Acquire its claim, re-read state, perform only
   that maintenance under [flow rules](references/flow.md), save/release, and exit this
   terminal. A live claim means skip and exit. Never create a task, default to `auto`,
   select work, or continue into implementation in a maintenance context.
5. Interpret execution input:
   - Task text: create one local story preserving the request; work it, then exit.
   - `specific <id>`: work that story, then exit. Resume requires a valid recovered claim.
   - `auto`: select at most one eligible story, then exit.
   - `loop`: this Foreman handles at most one eligible story and exits; only the launcher
     starts another fresh terminal. Stop when none remain or the user stops work.
   Carry the attempted set as run configuration; never retry a blocked story in that run.
   Default to supplied task text, otherwise `auto`. Do not create a daemon or schedule.
6. For automatic selection apply readiness/ranking rules; otherwise bind the requested
   story directly. Acquire its atomic claim and
   re-read current state before story dispatch/mutation. Apply session and transition
   rules in every profile; a bound Foreman never selects another story.
   On resume, follow [saved-work recovery](references/local-state.md#resume-from-saved-work)
   and continue the next unfinished action. A fresh terminal does not restart the pipeline.

Use separate agents for authors and reviewers. If the harness cannot delegate, preserve
the story and report the capability gap; do not claim that self-review is independent.
Dispatch reviewers serially when concurrency is limited. Use the execution profile's
requested unattended launch settings for agents and CLI sessions.

Before each story dispatch, verify its required setup and this run's
claim, current story file, readable complete prompt, input artifacts, and writable
output directory. The read-only pre-selection ranker is the sole claim exception: use
its explicit [selection contract](references/flow.md#pre-selection-ranking). A failed setup prevents only dispatches that actually need it. A broken optional helper
is not a prerequisite; use existing tools or a direct dispatch. Record a real limitation
without delaying unrelated implementation.

## Story pipeline

Read [verification and delivery](references/verify-deliver.md) before implementation and
[advisory review](references/review.md) before review. Use [specification and planning](references/spec-plan.md)
only when the task needs a separate research, specification, design, or planning assignment.

Resume at the saved point; skip completed work and reuse valid evidence. Revise the saved
scope or plan only when the story or requirements changed, and only for affected work.
Never run long tests or full suites before starting or resuming implementation. Card
checks must be fast and targeted. Each card ends with an advisory critic round and the
Worker's fix-or-skip decisions. Full verification starts only after every story card
and its critic findings are settled.

1. **Bound the request.** Keep the requested outcome, acceptance criteria, and customer
   scenarios concise in the story. A clear request is sufficient direction; do not invent
   requirements or require a separate spec, plan, design prototype, or approval ceremony.
   Reuse approved requirements without strengthening them. A fixable implementation
   defect is work to complete, not a reason to freeze flawed behaviour as a requirement.
   Inspect enough current source and callers to establish the premise and affected scope.
   Delegate unresolved research or decisions only when they materially affect delivery.
   Ask only about unresolved user intent or authority, not routine implementation choices.
2. **Prepare and assign.** Record the base revision and use the repository's permitted
   workspace. Create the fewest bounded task cards needed, normally one for a small change.
   Give the Worker the settled request, scope, relevant evidence, and checks. Split work
   only for useful independent execution or necessary coordination. Run safe independent
   assignments concurrently; serialize shared-file writes, index operations, and commits.
   The Foreman dispatches separate Workers for ready, independent cards concurrently, using available harness capacity.
   As capacity becomes available, start the next ready, independent card without waiting for unrelated implementation, critic rounds, or repairs.
   Keep small or inseparable work together; do not create extra cards merely to increase worker count.
3. **Implement.** The Worker completes the requested behaviour and relevant regression
   tests. During implementation and repairs, run only fast, narrowly targeted tests needed
   for the current change. Keep long or complete suites for final story verification. Return
   ordinary omissions and defects to the same Worker and amend its existing card within
   the agreed outcome. A planner is needed only for genuine new scope or coordination.
   Before a potentially breaking major change, Foreman commits the current in-scope
   work as a recovery point, using existing commit authorization and conventions.
4. **Seek advice at each card's end.** Dispatch four independent critics on the card's
   changes, affected consumers, and available evidence using the applicable A/B/C/D questions.
   Run critics in parallel with each other and independent card work. Complete the round;
   the Worker normally fixes serious findings, using fast targeted tests. The Worker may
   skip a finding for a specific reason, recorded briefly in the existing card. Each
   finding must be fixed or explicitly skipped before that card is settled. Critics have
   no veto or approval authority; no all-clear or automatic re-review is required.
   Foreman checks that the round and Worker decisions are complete and requirements remain met.
   After each card is settled, Foreman commits its changes using existing authorization
   and repository conventions. These incremental commits do not require full test suites.
   Extra specialist assignments and documents are
   conditional on concrete need, not repository workflow ceremony or the story label/size.
5. **Verify the whole story at the end.** Only after all cards, their critic rounds, and
   the Workers' fixes or skips are settled, run the complete required suites,
   repository-root checks, and available production-code coverage. Then a separate verifier tests every
   added or changed feature, behaviour, and fix through real customer scenarios against
   the actual changed system. Record results in existing cards and linked evidence; separate
   full-suite or scenario cards and intermediate reviews are not prerequisites.
   Repair failures with the original Worker, using fast targeted tests, then rerun affected
   final suites and customer scenarios. A failure or question pauses only work that actually depends on it; keep
   independent implementation moving.
6. **Deliver.** Once the requested outcome and required checks pass, complete authorized
   delivery steps immediately. Stories move directly from `in-progress` to `done`
   after implementation, card findings, final story verification, and requested delivery
   actions are complete. Do not add a separate review or acceptance stage.
   Report the completed result from role evidence; use a delivery writer only when needed.
   For requested remote delivery, observe the required current-revision
   functional checks and actual provider permission constraints. Return failures to the responsible Worker and refresh affected
   verification; seek an affected critic follow-up only when useful. Mark `done` once
   the requested work and required checks are complete. Do not add optional polish or paperwork.

## Recovery and completion

- Assess consequential effects from the actual task. Health, physical safety, financial
  loss, privacy, legal rights, and essential-service access are possible impact areas,
  not assumed project features. Where applicable, record harm scenarios, required
  specialist validation, and approval/rollout constraints from the target repository
  and user. Do not invent domain policy or treat missing expertise as a passing check.
- Record the selected rigor at claim. Stay at that user-selected level (default 1);
  task size, stakes, research, failures, or critic advice do not authorize a change.
- Questions and failed required checks pause only their actual dependents. Continue
  independent work. Critics advise; their advice cannot stop or approve work.
  Record inaccessible prerequisites and attempted alternatives; do not invent evidence.
- Preserve actual product-safety activation constraints and release authorization. When a
  staged release is required for those reasons, record rollback
  and a linked follow-up with a measurable readiness condition: source, check, threshold,
  observation window, and approval owner. Readiness evidence does not grant release authority.
- During automatic selection, the launcher schedules each required reconciliation in its
  own fresh named-story maintenance terminal. Assess required remote feedback against
  the requested work; factory critics remain advisory.
  A closed remote request does not imply completion. Record observed merge/release evidence
  when the story's completion rule requires it; never merge just to clear the board.
- Checkpoint at stage boundaries, before ending the session, and at least every 30 minutes during work.
  Keep the checkpoint sufficient for another session to resume from disk.
- Report X/Y stories done, story, stage, verified task-card count, blocker, and next action during long runs.
  Report observed usage/cost only when the harness supplies it; otherwise write `unknown`.
  Finish with X/Y stories done, delivered result, verification, remaining action, and story record path.

This skill grants no additional authority to commit, publish, merge, deploy, access
accounts, or send messages. Use existing authorization; prepare a reviewable result before
requesting any missing approval. Keep story records, task cards, and evidence local unless sharing was
authorized. Do not erase completed or blocked records.
