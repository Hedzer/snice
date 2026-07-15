---
id: SNICE-111
title: "add required theme token fallbacks"
epic: styling
priority: 111
created: 2026-07-14
deps: []
---

## Goal
Make every component render correctly without theme CSS by adding exact terminal fallbacks required by project policy.

## Notes
- Audit found 399 `--snice-*` reads across 76 non-theme CSS files without a terminal fallback.
- `.ai/coding-standards.md` requires each fallback to equal the concrete default in theme.css.
- Two-tier component variables may omit a second fallback only when their host definition is guaranteed.

## Acceptance criteria
- [ ] every theme-token read either has the exact theme default fallback or a verified always-defined component variable
- [ ] no arbitrary color/value drift is introduced and generated/public CSS artifacts remain consistent
- [ ] automated static checks plus no-theme visual/behavior tests cover every component in light and dark host contexts

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
