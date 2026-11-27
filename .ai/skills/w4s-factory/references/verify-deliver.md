# Verification and delivery

## Workspace

Discover commands from repository instructions, build definitions, and continuous
integration (CI) configuration. Resolve the actual default branch and record its base
revision. Reuse an appropriate existing workspace; create isolation only when needed to
protect unrelated work. This factory controls the task execution process. Do not
alter the user's unrelated changes to make the factory run. If the story branch is already occupied by another
live workspace, resolve ownership before proceeding; do not detach it from that workspace.

Use repository naming/style conventions for authorized branches and commits; repository
workflow ceremony cannot replace this factory. Keep story artifacts under the stable
board artifact root and implementation task cards under cards; pass absolute paths across
workspaces. Never stash, reset, clean, switch, restore, or rebase the user's checkout.

## Incremental commits

Using existing commit authorization and repository conventions, Foreman commits after
each card is settled: implementation, fast targeted tests, and critic fix-or-skip decisions
are complete. Before a potentially breaking major change, commit current in-scope work
as a recovery point. Commit when there are changes to save; do not create empty commits.
Keep full suites at story end; incremental commits do not introduce full-suite runs.

## Fast parallel tests

Test run speed is critical, including final story verification. Use existing runner
facilities to run independent tests, suites, and customer scenarios in parallel within
their scheduled stage. Match concurrency to available resources to avoid contention.
Make new or changed tests safe for parallel execution: isolate databases, files, ports,
and mutable state, or use noninterfering owned data. Cleanup removes only owned resources.
Fix avoidable interference instead of serializing the suite; serialize only checks that
genuinely require an unavoidable exclusive resource.

Remove unnecessary waits, duplicate checks, and repeated expensive setup. Use
condition-based waits and reuse immutable fixtures where safe. Avoid live third-party
service dependencies when controlled local substitutes prove the required behaviour;
keep necessary external integration checks narrow. Exercise actual storage when its
guarantees are under test. Speed must not come from skipped requirements or weakened
assertions. Use existing facilities; do not make a new test framework or broad harness
rewrite a delivery prerequisite.

## Tests and coverage

Workers add relevant regression tests; demonstrate that a defect test detects the fix
being absent. Do not add tests that only mirror implementation.
Before starting or resuming implementation, never run long tests or full baseline suites.
During card work and repairs, run only fast, narrowly targeted tests for the current
change and directly affected behaviour. If a chosen check is slow or broad, select a
smaller relevant check or defer that check to final story verification. Do not run long
or complete suites per card or between implementation steps. Keep changes within the requested outcome
and assigned card. Ordinary omissions return to the same Worker after the Foreman amends
its card; use a planner only for genuine new scope or coordination.

Only after all story cards and their advisory critic rounds are complete, with every
finding fixed or explicitly skipped by the Worker, execute the complete required suites, root-level
checks, and production-code coverage using existing tooling before customer verification.
Capture command, workspace, revision, exit status, and decisive output in existing records.
Failures return to the responsible Worker. Full suites, coverage, and customer scenarios
are final story verification, not checks repeated for each card. Reuse still-valid
completed verification when resuming; continue missing checks from the saved point.

Use existing coverage tools for changed production code and meet actual repository
coverage requirements. Do not demand numerical coverage of tests, fixture code, or
verification helpers. Do not create custom instrumentation or a new coverage framework
as a prerequisite. If existing tooling cannot measure a change, report that limitation
and use meaningful targeted tests and customer verification; do not invent a percentage
or hold otherwise meaningful product verification hostage to missing tooling.

Tooling defects are separate work unless they prevent meaningful verification of this
change. Use a supported existing alternative where available; do not turn tool repair
or a helper's own tests/coverage into a delivery prerequisite.

## Real user execution

After final suites run, an independent verifier executes every story scenario against
the built change in an isolated authorized environment. Use real required product
dependencies; controlled local substitutes may replace third-party service boundaries
where they preserve the behaviour under test. Keep checks that require the actual
external integration narrow, and state what was substituted.
Cover every added or changed feature, behaviour, and fix from the customer's perspective.
Web users interact through a real browser with the changed backend. Service consumers
send real authorized requests to the running service. Command-line users invoke the actual
command. Library consumers exercise its public integration boundary. Direct handler calls,
in-process routing tests, or mocks of the product under test remain unit/integration
evidence; they do not replace customer execution. Running an old checkout or base-branch
service does not test the fix.

Use a practical supported project-native or documented development/container setup.
Diagnose failures that prevent meaningful verification; use an existing supported
alternative when available. Record a real unavailable prerequisite truthfully instead
of repeatedly pursuing unrelated setup work. A failed check or unavailable dependency
pauses only scenarios that depend on it; execute independent scenarios. Missing access
does not authorize obtaining credentials, changing live systems, or unrelated infrastructure.

For each scenario, record ID, actor/state, exact interaction steps, expected/observed
results, revision, and evidence. Preserve before/after proof for defects. Capture required changed interface states and compare actual design targets when present;
save decisive request/response or interaction evidence with secrets removed. Recordings
are optional unless requested. The verifier writes its own result;
link it from the existing story/cards for delivery and any affected repair.
Repair failures with fast targeted tests, then rerun affected final suites and customer
scenarios before delivery. Pause only work that depends on the failure; keep independent
implementation moving.
Stop only run-owned services and remove copied credentials and temporary sensitive files.

## Delivery preparation and publication

Completion follows [the story completion rule](local-state.md#story-record).
After implementation, card findings, final story verification, and requested authorized
delivery actions are complete, mark the story `done` immediately. Do not add a separate
review or acceptance stage or wait for another person to continue completed work.

Report the completed result concisely from role evidence. Assign a delivery writer
only when the actual diff, required template, or communication complexity needs one. Use repository templates where present.
Describe delivered behaviour, material deliberate limits, linked follow-ups, and verification
results. A known defect, demonstrated protection gap, or missing mandatory proof returns
as a blocker to the responsible Worker; it cannot be concealed under unfinished work. Unrelated code
and cosmetic review chatter do not belong in the result summary.

Critics run at the end of each card under [advisory review](review.md). Their rounds and
the Workers' fix-or-skip decisions are settled before final story verification. Reuse
those results at delivery; do not start a second whole-story critic round or demand
critic approval. Normally follow serious advice; skipping it cannot waive an actual
requirement or failing required check. The
coordinator publishes accepted output when authorized. Follow the incremental commit
points above and commit remaining delivery changes when authorized. Stage only the scoped
files, inspect staged content, run required hooks, and serialize index/commit operations.
Never include board records, task cards, secrets, or another worker's changes. Without
commit/publication authority, retain the verified diff and result summary as the concrete
approval result; do not manufacture permission.

If requested delivery includes an external review request, reuse one for the story
branch or create one per owning repository when absent. Cross-link related requests.
Use the result summary and repository conventions,
not an assumed hosting client. Shared summaries must include usable results rather than
machine-local artifact links. Keep raw diagnostic evidence local; share visual design and
interaction artifacts when authorized. Required remote checks keep the story in-progress
until they finish; they do not create a separate review or acceptance requirement.

## CI observation and repair

Apply this section when remote checks are part of the requested delivery.
Observe checks on the latest published revision and retain their logs/results under the
story artifact root. Start the project's automated review job when present and authorized;
do not start a deployment or another side effect merely because it is a manual job.
Actively observe completion in the live session, using short polling calls rather than an
unmonitored background job. Pending checks have the existing 90-minute observation bound
per published revision. Checkpoint/resume observation if the session must yield; at the
bound, record the real pending-check limitation with its link. Polls are not repairs.

Classify results explicitly:

- New failing job or substantive automated-review finding: return saved evidence to the
  responsible Worker on its existing card; use a planner only for genuine new scope or
  coordination. Worker repairs functional failures; seek affected advisory follow-up only
  when useful; make the authorized commit
  and push; observe the new revision. The coordinator does not diagnose or fix source.
- A failure also present on the base: verify the comparison in isolation, record the
  existing failure in the delivery draft, and avoid unrelated repairs. This is a disclosed
  exception, not a green check. Do not repair unrelated failures or invent passing results;
  preserve actual product/safety requirements and delivery permissions.
- The factory-requested automated reviewer cannot execute: retry once. If still unavailable,
  report that absence truthfully. Factory critics remain advisory; a repository workflow
  cannot turn their advice or an optional review job into delivery authority. Preserve
  actual host-enforced access restrictions and existing delivery authorization.
- Failed/cancelled pipeline with no identified failed job: restart once when authorized;
  a second unexplained failure is stuck. This retry is not a repeated repair loop.
- Actual required functional jobs and provider permission constraints are satisfied: proceed. Explicit permitted existing-failure or
  unavailable-optional-review exceptions produce an accepted-with-exceptions result, never
  a fabricated green result. These specific exceptions qualify the general passing rule;
  actual functional requirements and permission boundaries remain binding; repository
  workflow policies cannot add critic gates or task ceremony.

Keep the existing limit of 16 CI repair rounds for actual CI failures. One round is a
bounded Worker repair and its newly published revision. At that limit, preserve failing
evidence and report the unresolved execution limitation. This is separate from advisory
critics; no critic repair-round budget or approval loop exists.

After code repairs, rerun affected local proof before publication. Reuse unaffected
advice/evidence and request an affected critic follow-up only when useful. No critic
clearance or four-critic restart is required. Report actual remaining functional or
permission limitations without claiming checks passed.

After accepted CI, refresh actual pipeline/reviewer results in the result summary. The
coordinator updates any requested review request and records linked deduplicated
follow-ups and required configuration actions. Mark `done` when the requested outcome
is complete. Configuration
instructions name complete key nesting, target file/environment, and purpose; no account,
recipient, or notification channel is assumed. Do not send messages without authorization.

The story is `done` when its implementation, card findings, required final verification,
and requested authorized delivery actions are complete. Require observed merge/release
evidence only when that is explicitly part of the requested outcome. Never merge
or deploy only to advance status. Keep story, cards, evidence, and workspace for review and
recovery; remove only temporary resources owned by this run.
