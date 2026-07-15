---
id: SNICE-118
title: "add explicit types to internal buttons"
epic: semantics
priority: 118
created: 2026-07-14
deps: []
---

## Goal
Decide and enforce whether every internal native `<button>` should declare `type="button"` unless it intentionally submits or resets.

## Notes
- Audit found 157 button tags across 44 component files without an explicit type.
- Shadow DOM limits immediate outer-form submission risk, but explicit intent prevents future light-DOM/form changes and documents semantics.
- This must be an AST/template-aware change, not a blind text replacement.

## Acceptance criteria
- [ ] every internal button is classified as action, submit, or reset and receives the matching explicit type
- [ ] form-associated hosts and slotted/native buttons retain intentional submission behavior
- [ ] static validation and real-browser form tests prevent accidental submit regressions

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
