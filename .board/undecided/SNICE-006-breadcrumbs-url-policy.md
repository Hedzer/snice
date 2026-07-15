---
id: SNICE-006
title: "define and enforce breadcrumb URL safety"
epic: security
priority: 6
created: 2026-07-14
deps: []
---

## Goal
Decide whether breadcrumb item URLs need the same centralized scheme policy as link and button, then make the behavior explicit.

## Notes
- Source audit identified breadcrumb `href` values as another caller-controlled navigation channel.
- Affected implementation: `packages/components/src/breadcrumbs/snice-breadcrumbs.ts` and its public item types.
- This is a separate decision because breadcrumbs may deliberately preserve native anchor behavior.

## Acceptance criteria
- [ ] the accepted URL and target policy is documented and consistent with standalone link behavior
- [ ] every collapsed and expanded item follows the same rule without breaking native keyboard or context-menu behavior
- [ ] an adversarial real-browser matrix proves the chosen policy

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
