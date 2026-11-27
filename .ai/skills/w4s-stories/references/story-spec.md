# Specification contract

Apply this contract to new or unfinished stories.
Finished stories remain unchanged; do not retrofit this contract or template into them.

Specify applicable details explicitly.
Omit irrelevant sections; do not invent a UI, service topology, or storage layer for a task that has none.
Each story contains its complete implementation and verification contract.
Reuse settled designs by embedding the applicable content; links are supplemental, never a substitute for required detail.
A small settled change needs its requirements and necessary existing context, not a new project design.
Assume the worker has no conversation, prior-story, or design-document context.
Make the requested outcome, requirements, constraints, and agreed contracts explicit.
Apply the technical-scope rule to implementation guidance.
This contract is written guidance for later implementation agents, not instructions for the story author to modify product code or run implementation tasks.

## Outcome and decisions

Record the requested result, personas, problem/workload model, scope, relevant policies, and existing behaviour being changed or preserved.
Explain the rationale for decisions, alternatives considered and rejected, their tradeoffs, and the source of the choice.
Label unresolved questions, assumptions, and estimates; identify their dependents.
Do not silently turn an estimate, research finding, or critic suggestion into a requirement.
Include the relevant project facts, terminology, policy constraints, and current behaviour needed to understand the work.
For each dependency, state the required resulting state and exact interface/data contract inside this story; a predecessor story ID is insufficient.

## Engineering

Include the following details only where required under the technical-scope rule.

- Topology: components/processes, responsibilities, placement, communication paths, trust boundaries, data flow, and dependency behaviour. Show a diagram when it clarifies interactions. Explain how the topology serves the workload and failure requirements.
- Interfaces: entry points, request/response or event shapes, types, validation, defaults, permissions, errors, compatibility, and consumer obligations.
- State/storage: entities, field meanings, relationships, keys, indexes, constraints, read/write paths, transaction boundaries, and migration needs. Define ownership, consistency, concurrency, retry/idempotency, and partial-failure behaviour where relevant.
- Capacity/performance: expected data sizes, growth, request mix/rates, bursts, latency, memory, and storage expectations with their evidence or estimated basis. State expected time and space complexity in Big-O notation for consequential algorithms/queries; define each variable and whether the bound is worst-case, expected, or amortized. Include relevant I/O, query/round-trip counts, indexes, pagination, batching, and bounds on queues/work.
- Recovery: expected state after interruption, dependency failure, retry, restart, resource exhaustion, or concurrent change; describe recovery without data corruption or unintended duplicate effects. Specify retention/cleanup and operational signals when the requested system needs them. Do not add unrelated infrastructure.

For each consequential path, connect the design to the requested outcome and identify how its correctness/performance will be checked.
Reuse project facilities and supported verification tools rather than making new tooling a prerequisite.
Name the source locations, existing facilities, configuration, and setup needed for the work.
State required behaviour and constraints explicitly; source paths do not replace the specification or require the worker to infer missing requirements from code.

## UI/UX

Include the applicable agreed UX/UI profile, shared rules, selected screen variants, and selection rationale inside the story.
Cite `.ai/policies/ui-policy.md` and saved inspiration as provenance; the worker must not need those links to recover required design details.
For every affected screen and distinct state, provide:

- An ASCII layout identifying content, hierarchy, controls, and feedback. For small state variations, annotate a shared layout explicitly rather than repeating it.
- Exact user-visible text, field rules/defaults, control behaviour, keyboard/focus behaviour, accessibility semantics, and responsive layout changes.
- State transitions: starting state, event/action, guard, pending feedback, resulting screen/state, persisted effects, and back/cancel/retry/recovery behaviour. Include relevant success, loading, empty, error, denied, disabled, and interrupted states.
- Specify agreed visual and interaction requirements. Require particular components, style tokens, or implementation values only under the technical-scope rule.

Connect each screen/state to its persona flow.
Do not leave a mockup disconnected from behaviour, or specify visual outcomes solely with adjectives such as “clean” or “intuitive.”

## Completion and customer scenarios

Give criteria stable IDs and observable outcomes.
For each requested flow and branch, state actor, starting conditions, actual entry point, actions, and expected visible and stored results.
Map scenarios to criteria and design references.
Include boundary, failure, recovery, and surrounding regression cases where affected.
Keep full scenario steps and expected results in the story.
State required setup, test data, available verification commands, and the exact finish condition.
Do not hide acceptance details behind links or phrases such as "as discussed" or "follow the design."

Describe the evidence that implementation must produce.
Require focused checks while implementing, then the complete required suites and customer end-to-end verification of every added/changed feature, behaviour, and fix at the end.
Use real product entry points.
This is a verification plan; do not present it as tests already run or demand implementation evidence during authoring.
Do not add numerical coverage for test helpers, bespoke instrumentation, or unrelated test infrastructure prerequisites.

## Whole-story board template

Adapt to the existing board schema.
Include all applicable details below in the story; omit irrelevant sections.
Supplemental links never replace the inline specification.
Paths are repository-root-relative.
Internal story anchors may reuse content within the story.

```markdown
# <story-id>: <requested outcome>
Repository: <owning repository>
Outcome: <who needs what result and why>

## Original request
<user's request verbatim>

## Context and rationale
<relevant project facts, terminology, personas/workload, current behaviour, purpose, and applicable policy constraints>

## Scope
<requested behaviour and agreed boundaries>

## Acceptance criteria
- AC-1: Given <state>, when <action>, then <observable result>.

## Customer scenarios
- S-1: <actor, starting conditions, full interaction steps and branches, expected visible and stored results>; proves AC-1.

## Decisions
<decisions and rationale, meaningful rejected alternatives and why; open questions and their affected work>

## Dependencies and parallel work
<actual prerequisites and why, required resulting state and exact contracts inline; independent stories; change ownership where needed>

## Implementation contract
<required behaviour, agreed contracts, compatibility, performance and recovery constraints; implementation details only where required under the technical-scope rule>

## UI/UX specification
<when applicable: selected screens and ASCII layouts, all states/transitions, exact copy, controls, responsive/accessibility behaviour, agreed visual requirements, and relevant shared rules>

## Verification
<setup, test data, available commands, expected results, regressions, and customer scenarios; distinguish targeted checks from final story verification>

## Completion
<exact requested finish condition and required evidence of functional/customer verification and delivery>

## Supplemental sources
<optional provenance links to design, research, and policy; all required content already appears above>
```
