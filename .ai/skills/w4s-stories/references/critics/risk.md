# B — Risk and integrity

Read the bundled [Safeloop guide](../safeloop/guide.md) in full and only the language follow-ups relevant to this review; keep existing scope, advisory authority, and verification timing.

Read this skill's `SKILL.md` in full and follow its advisory-critic rules.
Review the story with relevant design, research, user instructions and answers, policies, source, and consumers.
Derive risks and required safeguards from the actual request, workload, and repository; do not assume an industry, ownership model, or architecture.
Apply only relevant checks to the proposed work and give brief advice within the agreed scope.

- B1: Check that proposed changes belong in their owning repository and components.
- B2: Check required identity and operation permissions at affected entry points; preserve intentional public access.
- B3: Check that permitted access paths are neither silently removed nor expanded, including legitimate cross-scope access.
- B4: Check authorization of supplied resource identifiers, including nested inputs, against trusted context and the established ownership model.
- B5: Where isolation boundaries exist, check that reads and writes use the authorized scope rather than trusting supplied scope identifiers.
- B6: Where required, specify consistent observable treatment of inaccessible and absent resources.
- B7: Check that authoritative decisions use trusted or verified values rather than untrusted caller assertions.
- B8: Trace untrusted input into queries, destinations, paths, commands, and rendered content; check the applicable binding, restriction, and escaping requirements.
- B9: Where signed callbacks exist, check the specified signature verification and missing-secret behaviour.
- B10: Check that credentials and sensitive information are protected in artifacts, logs, URLs, errors, responses, fixtures, and evidence.
- B11: Check required precision, units, rounding, range, overflow, and the effect of earlier state changes on calculations.
- B12: For retried state-changing effects, check stable operation identity and transitions against the expected prior state.
- B13: For repeated job, event, or callback execution, check that the design produces only the permitted effects.
- B14: Check dependency-failure outcomes and bounded timeout/retry behaviour; identify network work performed while holding data locks where relevant.
- B15: Check that protection fallbacks and their destinations preserve the user's requirements and repository policy; do not invent a preferred fail-open or fail-closed policy.
- B16: Where queries change, check indexes against their filters, joins, ordering, and established workload.
- B17: Check memory, storage, pagination, iteration, and backfill bounds against the established data volume and growth; do not invent a growth target.
- B18: Check expected and burst workload against query, lock, connection, worker, and dependency capacity; recommend only safeguards warranted by that workload.
- B19: Where migrations are needed, check the requested continuity, lock, interruption, recovery, and reversal requirements.
- B20: Identify applicable high-consequence effects and existing validation, authorization, activation, and rollback requirements; do not create domain policy or additional approval gates.
- B21: Trace affected existing user and consumer flows through the proposed change and its failure/recovery paths; identify violations of their required continued operation.

Report only supported risks or consequential missing decisions, with evidence, consequence, and a focused question or bounded correction.
Do not edit the story, demand implementation evidence, add requirements, or block progress.
