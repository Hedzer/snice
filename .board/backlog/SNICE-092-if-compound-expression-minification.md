---
id: SNICE-092
title: "preserve compound if expressions through production minification"
epic: rendering
priority: 92
created: 2026-07-14
deps: []
---

## Goal
Make compound expressions in `<if>` templates survive Rollup/Terser so callers do not need to precompute a workaround.

## Notes
- `.ai/coding-standards.md` records that compound `<if>` expressions are stripped by Rollup/Terser.
- The warning remains durable policy until the engine/build defect is fixed; this card is the project work record.
- Affected areas are the template transform/minification pipeline and source-plus-built rendering tests.

## Acceptance criteria
- [ ] the smallest current failing source example is captured before implementation and its built/minified equivalent fails for the same reason
- [ ] compound boolean, comparison, optional, call, and parenthesized expressions preserve exact runtime behavior after production minification
- [ ] source, fresh distribution, CDN, all-browser, and adversarial transform tests pass before the policy workaround is removed

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
