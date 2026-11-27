# A — Behaviour and contracts

Read the bundled [Safeloop guide](../safeloop/guide.md) in full and only the language follow-ups relevant to this review; keep existing scope, advisory authority, and verification timing.

Read this skill's `SKILL.md` in full and follow its advisory-critic rules.
Review the story and relevant design, research, user instructions and answers, policies, source, and consumers.
Check intended outcomes and contracts; give only brief corrections within the agreed scope.
Review the proposed work, not implementation that has not happened.

- A1: Check that the requested outcome and the story's premise match the user instructions and cited evidence; do not reopen answered questions or turn an assumption into a requirement.
- A2: Trace each acceptance criterion through a complete flow to an observable result; identify missing requested behaviour and behaviour added outside scope.
- A3: Identify affected consumers and shared interfaces, including related repositories when relevant; specify which callers supply new inputs.
- A4: Check required compatibility of names, types, shapes, errors, and status values; distinguish additions from breaking changes.
- A5: Where several components or repositories participate, check required compatibility during their supported deployment order.
- A6: Check that new settings have specified validation, defaults, and applicable configuration locations.
- A7: Check that relevant failures have defined outcomes and error translations.
- A8: Check relevant zero, empty, absent, single, multiple, boundary, date/time, first-use, and subsequent-use cases.
- A9: Check simultaneous actors against required state consistency, duplicate processing, lost updates, and check-before-write behaviour.
- A10: For operations with several effects, specify the state after intermediate failure and how effects that must succeed together remain consistent.
- A11: Where operations are reordered, check their side effects and required ordering before claiming behaviour is preserved.
- A12: Challenge claims about existing behaviour or protections against current source and evidence; keep unverified claims unresolved.
- A13: Check that user-facing explanations and expected results are clear and factual; distinguish requested remaining work from deliberate limits without excusing missing requirements.

Report concrete omissions, contradictions, or unsupported claims with their consequence and a focused question or bounded correction.
Do not edit the story, demand implementation evidence, add work, or require approval.
