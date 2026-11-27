# Behavioural validation cases

Reference these cases when validation is requested. This file does not require a new
fixture, test run, helper, or report as part of normal product work. Never claim agents,
commands, or checks ran without actual evidence.

| Case | Expected behaviour |
|---|---|
| Clear bounded request | Read full binding non-workflow policies and relevant source, preserve approved requirements, write concise story/card scope, and dispatch Worker directly. No separate research/spec/plan/design/writer prerequisite. |
| Historical evidence | Search history/default-branch precedent only for a concrete unanswered implementation question. Routine bookkeeping does not delay a fix. |
| Specific task | Start that task without unrelated board reconciliation, readiness checks, or ranking. |
| Resume unchanged story | Recover ownership, reconcile checkpoint with actual work/evidence, and continue the next unfinished action. Reuse completed cards, decisions, and valid checks. A fresh terminal does not restart preparation or implementation. |
| Resume changed story | Compare saved and current requirements/scope. Revise only affected work and actual dependents; preserve unaffected work/evidence. |
| Local question or failed check | Surface a genuine decision promptly; pause only actual dependents. Keep independent implementation moving. Use spec-review only when a required user decision prevents remaining work. |
| Approved requirements | Reuse them unchanged. Do not strengthen a spec or treat fixable implementation as an immutable requirement. |
| Scope omission | Foreman amends the existing card within the agreed outcome and returns it to the same Worker. A planner is needed only for genuine new scope or coordination. |
| Targeted checks | Never run long tests/full baseline suites before starting or resuming work. Cards and repairs use only fast targeted checks. Complete required suites and customer execution for every added/changed feature, behaviour, and fix occur only at the end of the whole story. |
| Test speed | Test run speed is critical. Run independent tests, suites, and scenarios in parallel within their scheduled stage using existing runners. Isolate resources or use noninterfering owned data; repair avoidable interference instead of serializing the suite. Remove wasted waits/setup and avoid resource contention without weakening proof. |
| External test dependencies | Use controlled local substitutes for live third-party services where they preserve tested behaviour. Keep necessary real external integration checks narrow. Final customer scenarios exercise the actual changed product; record substitutes and retain real storage when its guarantees are tested. |
| Coverage | Use existing tools and actual repository requirements on production changes. Do not demand numerical tests/helper coverage or custom instrumentation. Report absent tooling truthfully and continue meaningful verification. |
| Tool defect | Use supported alternatives; treat unrelated tool repair separately unless it prevents meaningful verification. |
| Advisory critics | At each card's end, four independent A/B/C/D roles inspect the card in parallel while independent card work continues. Report serious demonstrated advice or no serious issue. Complete the round; Worker normally fixes findings, or explicitly skips with a specific reason. Full story tests start only after every card and finding is settled. No critic veto, approval, automatic re-review, or second whole-story critic round. |
| Advice follow-up | Worker records fixes or specific skip reasons; Foreman checks completion against requirements. Reuse unchanged advice/evidence; seek only affected follow-up when useful. No mandatory restart of all critics after changes. |
| Product failure | Actual functional failures and missing required verification remain truthfully reported and repaired within the requested work. Critic opinion is not test evidence or delivery authority. |
| Policy reading | Every role reads .ai/README.md and all .ai/policies files in full, without skimming, plus applicable .claude/rules pointers and nested rules. Only needed skills and relevant workflow references/checklists are loaded; informational docs outside policies are excluded. |
| Scheduling | Run independent cards concurrently and each card's critics in parallel at that card's end. Serialize shared-file writes, index operations, commits, and per-story sessions. |
| Incremental commits | Foreman commits each settled card and saves current in-scope work before a potentially breaking major change, using existing authority and conventions. Full suites remain at story end. |
| Stories/cards | Whole requests live under board; bounded task cards under cards. Claims are exclusive; local records are not staged. |
| Story isolation | Every story has a fresh top-level CLI in a fresh terminal/PTY. Its primary agent is the sole Foreman. Join prior agents and process; no reused context, memory, or agent handles across stories/cards. |
| Harness continuity | OpenCode launches OpenCode, Pi launches Pi, and every other harness keeps its own CLI for new stories, resumes from disk, maintenance, and separately launched specialists. A provider/model selection cannot switch harnesses; only an explicit user request can. |
| DeepSeek roles | Every role uses DeepSeek Flash latest in the invoking harness. Rigor 1: planner max, all other roles high. Rigor 2 and 3: every role max. No pinned versions or Pro/model-family upgrade. |
| Story progress | Every 20-minute update includes X/Y stories done for the requested batch, plus current-story percentage, ETA, and latest activity. Count distinct completed stories, never cards or dispatches. Preserve batch/completed IDs across fresh terminals and resumes; unfinished stories do not reduce Y. A single-story batch has Y=1. Include X/Y in the final report. |
| CLI permissions | Every fresh/resumed story, maintenance, and separate specialist CLI uses its profile's flags: Codex `--yolo`; Claude `--dangerously-skip-permissions --chrome`; OpenCode `--auto`. Apply per run. OpenCode explicit denials remain; do not claim otherwise. |
| Maintenance | Named reconciliation/readiness terminals handle only their story and exit. Explicit task execution does not wait for unrelated maintenance. |
| Workflow precedence | Factory controls task roles, sequencing, states, advice authority, repair, verification timing, and delivery process over repository workflow policy. Non-workflow product, architecture/style, security/permission, and check requirements remain binding. |
| Permissions | No unauthorized commit, publication, merge, deployment, account access, or messages. Preserve actual product-safety activation requirements and delivery authorization. |
| CI bounds | Keep the existing 90-minute observation bound per published revision and 16 actual CI repair rounds. These are not critic budgets; advice cannot trigger a repair loop. |
| Delivery | Once requested work and required verification are complete, perform authorized delivery without optional polish, paperwork, or critic clearance. Report material real limitations without invented passing claims. |
| Completion | Implementation, card findings, final story verification, and requested authorized delivery actions complete: move directly from `in-progress` to `done`. No separate review or acceptance stage. A Git remote alone does not change completion. |
| Legacy completion state | Under the named story's claim, use valid saved evidence to move completed work to `done`. Do not repeat reviews/tests or create follow-ups solely to correct status. Resume only actual unfinished work. |
