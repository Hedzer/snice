---
id: SNICE-117
title: "define localization for component-owned messages"
epic: dx
priority: 117
created: 2026-07-14
deps: []
---

## Goal
Decide how applications override hard-coded user-facing component strings without adding a hidden global framework.

## Notes
- Audit found many component-owned labels, empty states, errors, status messages, and control names beyond the date family.
- The accepted API should compose with attributes/properties and normal DOM context, not React-style hooks or string-evaluated templates.

## Acceptance criteria
- [ ] the message inventory distinguishes author content, defaults, ARIA-only text, formatting, and generated errors
- [ ] one explicit locale/message-context contract supports per-instance and subtree/application use with fallback and dynamic changes
- [ ] if accepted, representative controls, overlays, data views, docs, types, SSR-free browser behavior, and tests prove the model

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
