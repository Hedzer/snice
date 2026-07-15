---
id: SNICE-061
title: "align button-click runtime and TypeScript detail"
epic: events
priority: 61
created: 2026-07-14
deps: []
---

## Goal
Make the declared `button-click` event detail exactly match the object emitted at runtime.

## Notes
- Runtime emits `{ originalEvent }`, while `ButtonClickDetail` declares `{ button }`.
- Affected files: `packages/components/src/button/snice-button.ts` and `snice-button.types.ts`.
- Human docs, AI docs, React adapter types, and custom-elements metadata must follow the chosen contract.

## Acceptance criteria
- [ ] one backward-compatible event detail is chosen and emitted with stable identity and types
- [ ] all generated and handwritten public surfaces agree exactly
- [ ] runtime contract tests typecheck consumers and inspect actual source, built, CDN, and React events

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
