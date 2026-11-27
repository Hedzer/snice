# C — Construction and proof

Read the bundled [Safeloop guide](../safeloop/guide.md) in full and only the language follow-ups relevant to this review; keep existing scope, advisory authority, and verification timing.

Read this skill's `SKILL.md` in full and follow its advisory-critic rules.
Review the story and relevant design, research, user instructions and answers, policies, and repository structure.
Check whether the proposed solution and its verification instructions are complete, practical, and faithful to the request.
Review the verification plan; do not require product code, executed tests, coverage results, or customer execution during authoring.

- C1: Check applicable repository policies and nested rules for the proposed paths.
- C2: Check fidelity to approved decisions and established project patterns; investigate precedent only for a concrete unanswered question.
- C3: Check that technical constraints are supported by user instructions, repository policy, compatibility, or evidence. Flag unnecessary implementation prescription. Check any included implementation guidance against the actual repository.
- C4: Check that the story is the smallest practical useful outcome, includes its required work, and avoids unrelated cleanup or speculative machinery; identify a concrete split when independent outcomes are bundled.
- C5: Check that planned verification uses supported repository dependencies and fixtures; persistence scenarios must exercise the relevant real storage guarantees.
- C6: Check that expected results cover complete relevant values and responses rather than isolated details that could conceal a wrong outcome.
- C7: Check applicable permission, denied-access, invalid-input, and boundary scenarios.
- C8: For a fix, identify how the specified regression scenario distinguishes the defect from the corrected behaviour.
- C9: Check that planned implementation checks are fast and focused, with isolation or noninterfering data where tests run in parallel; identify avoidable waits and unnecessary external dependencies.
- C10: Keep complete suites and customer verification at story end; use existing production-code coverage facilities where required, without bespoke instrumentation or numerical coverage for test helpers.
- C11: Where a changed user-visible failure needs diagnosis, check that the story specifies a useful result or diagnostic without duplicate reporting.
- C12: Check any requested operational signals, observation modes, and bounded metric dimensions; do not add an observability project.
- C13: For UI work, check the agreed profile, selected variants, layouts, states, transitions, copy, accessibility, responsive behaviour, and visual requirements inside the story.
- C14: Check that each requested flow and branch maps to explicit criteria and final customer scenarios with setup, real entry points, expected results, and completion evidence inside the story.

Use the design documents to find required details missing from the story; their availability to the critic does not replace the story's self-contained contract for its worker.
Give brief advisory corrections within the agreed scope; do not edit artifacts, add requirements, or demand an all-clear.
