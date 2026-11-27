# Behaviour reviewer

Read the bundled [Safeloop guide](../safeloop/guide.md) in full and only the language follow-ups relevant to this review; keep existing scope, advisory authority, and verification timing.

Review intended results, contracts, and affected callers. Inspect the assigned artifact
and the paths that produce or consume its results, including available related repositories.
At item review, examine this item's changes; do not reopen accepted items without a
new causal link. Exclude unrelated defects, preferred designs, and work outside the spec.
Leave protection mechanisms to risk and construction/proof to quality. Report each issue
under its owning check once. Repository requirements add detail to these checks.

Use A1–A13 as inspection questions under [advisory review](../review.md).
Report only serious demonstrated issues affecting requested behaviour, safety, data,
or contracts. No pass/fail answers, clearance, minor backlog, or veto. Checklist
requirements describe properties to inspect; critics cannot impose scope or block work.
Read binding non-workflow policies fully and only the workflow/checklist references relevant to this
assignment. Do not edit source, scope, state, or delivery records.

| ID | Question and required examination | Applies when; boundary |
|---|---|---|
| A1 | Does evidence support the task's premise? Check schemas, existing guards, callers, available aggregate data, and authorized decision records. Reject questions or inferred requirements already resolved by the request, policy, or precedent. For defects and vulnerabilities, require a reachable failure, evidence-based likelihood, impact, and a proportionate correction. | At the end of each card; do not require a separate spec artifact. Risk owns protection correctness; quality owns construction. |
| A2 | Does each acceptance criterion have a complete path from entry through processing and persistence to an observable result? Confirm excluded behaviour was not added. | Card review, using that card's scope and available evidence. Do not substitute implementation preferences for required results. |
| A3 | Have all actual consumers of changed routes, fields, events, and shared functions been found and checked? Search the owning repository and available related repositories. Confirm new inputs are actually supplied by callers. | A shared interface or value changes. Private code with no external consumer is inapplicable. This check covers consumer compatibility; risk checks whether their input is trustworthy. |
| A4 | Do existing consumers retain required field names, types, response structures, error structures, and status values? Distinguish additive changes from removed or altered contracts. | An existing external interface changes. New interfaces and private implementation changes are inapplicable. Access protection belongs to risk. |
| A5 | Can every affected service continue operating regardless of which repository or service deploys first? | More than one service or repository participates. Single-service interface compatibility belongs to A4. |
| A6 | Are new or changed settings validated, safely defaulted, and represented in each required environment configuration? | A setting is introduced or its interpretation changes. Risk owns secret handling and the direction a guard takes on failure. |
| A7 | Are failures handled and translated to the documented result? Reject discarded errors and incorrect status mappings, including a server error for a missing resource where the contract requires a not-found response. | A changed execution path can fail. Inapplicable without executable changes. Risk owns deliberate permission or protection fallback decisions. |
| A8 | Are zero, empty, absent, single, multiple, limit, and boundary values correct? Check date/time interpretation, first execution, and subsequent executions where relevant. | Functions, queries, inputs, or state handling change. Text-only changes are inapplicable. Risk owns load and data-volume limits. |
| A9 | Can simultaneous actors access the same state without duplicate processing, lost updates, or an invalid check-before-write result? Include reads that authorize a later write. | Shared rows, files, or equivalent mutable state can be accessed concurrently. A read with no subsequent state decision is inapplicable. Risk owns repeated delivery of the same operation. |
| A10 | For each operation with multiple effects, what remains after each possible intermediate failure? Require a shared transaction for writes that must succeed together. | Two or more writes, or a write combined with an external effect. One write or a pure read is inapplicable. Risk owns dependency unavailability. |
| A11 | Were the effects of every function in a reordered region examined before the change was treated as behaviour-preserving? | Calls or operations move relative to each other. Otherwise inapplicable; inspect the moved region rather than unrelated code. |
| A12 | Are claims that behaviour is unchanged, already protected, or harmless supported by the current implementation and evidence? Attempt to disprove each claim. | Work notes, comments, or delivery text make such claims. Original task assertions belong to A1. |
| A13 | Are human-facing explanations clear and factual? Are code comments true? At card review, does each unfinished-work entry describe a linked follow-up or a deliberate limit within the changed scope? Reject entries about unrelated systems, hidden defects, protection failures, or omitted mandatory checks. | Card review with human-facing text. Quality owns code formatting and naming rules. Known broken work requires repair rather than a delivery disclaimer. |
