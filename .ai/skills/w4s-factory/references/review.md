# Advisory critics

Run four independent critics at the end of each card: A for behaviour/contracts,
B for risk/integrity, C for construction/proof, and D for optimization. Run them in parallel when supported;
otherwise use separate contexts serially. Neither Foreman nor author supplies its own
independent review. Critics advise; they have no veto or approval authority.

## Inspection scope

- A: [behaviour checks](checklists/behaviour.md), A1–A13.
- B: [risk checks](checklists/risk.md), B1–B21.
- C: [quality checks](checklists/quality.md), C1–C14.
- D: [quick optimization sanity checks](checklists/optimization.md), D1–D13.

Include the bundled [Safeloop guide](safeloop/guide.md) in A/B/C dispatches; each reads it in full and only the language follow-ups relevant to its review. Existing scope, advisory authority, and verification timing remain binding.

Give each critic its full relevant checklist, requested outcome, card scope/revision,
existing evidence, and relevant earlier advice. Inspect applicable questions; do not
write a pass/fail answer for every check, verdict schemas, non-applicability reports, or a minor-issue
backlog. IDs organize inspection, not priority or authority. Checklist words such as
“require” and “reject” describe properties to inspect, not critic enforcement authority.

Dispatch after the card's implementation and fast targeted checks. Review its changes
and actual consumers. Independent card work continues in parallel. Full suites and full
customer verification run only at story end; their absence during card review is not
a finding. Exclude unrelated history, sibling defects, and preferred architectures.

## Advice worth reporting

Report only serious demonstrated issues affecting requested behaviour, safety, data
integrity, an actual contract, or meaningful waste in computation, memory, or data movement.
Give the causal path, affected requirement or workload, evidence,
and bounded correction. Attempt to refute the concern first. Exclude cosmetic, style,
naming, preference, minor, and hypothetical issues; do not create follow-up work for them.

Use current source, callers, constraints, and available test evidence. A confirmed
security exploit needs a safe executed reproduction; a source-only hypothesis is not
one. Do not exercise live systems without authorization. Missing required evidence is
reported truthfully, not converted into a fabricated exploit. If no serious issue is
found, say so briefly. Return advice directly or in existing artifacts; no report
generator or new review format is required.

## Worker decisions and completion

Complete each card's critic round and return its findings to the Worker. The Worker
normally follows serious advice and fixes the issue, using fast targeted tests. Skipping
is an explicit decision for a specific reason tied to the request, code, or evidence;
record that reason briefly in the existing card. “Advisory” is not a reason to ignore
advice. Skipping a recommendation does not waive an approved requirement or failed check.

A card is settled when its critic round is complete and each finding is either fixed
with the relevant fast targeted checks complete, or explicitly skipped with its reason.
A round with no serious findings needs no repair. An unfinished or missing response
is unfinished review work, not a no-findings result. Foreman checks these outcomes;
critics do not approve the Worker's decisions or demand an all-clear.

Continue independent card work while reviews and repairs proceed. Once every story
card and finding is settled, run the full story verification and fix sequence. Never
run full suites after each card. The required round and Worker decisions are completion
steps; accepting every recommendation or obtaining critic approval is not required.

Reuse unchanged advice, evidence, and settled decisions on resume. Ask an affected
critic a follow-up only when useful; do not automatically restart all four after a
fix or skip. Do not add a second whole-story critic round. Actual functional failures,
missing authority, and unavailable required verification remain real limitations;
report them truthfully. Advisory review is not a passing test.
