---
id: SNICE-129
title: "validate event runtime and type contracts"
epic: quality
priority: 129
created: 2026-07-14
deps: []
---

## Goal
Ensure every component event name, detail shape, flags, ordering, and generated type matches what actually fires.

## Notes
- The button-click mismatch proves source types alone are insufficient.
- Event naming normalization is a separate product decision; this card validates whichever names are currently public.

## Acceptance criteria
- [ ] every `@dispatch` event has a runtime fixture and is mapped to source types, docs, metadata, and React event props
- [ ] tests inspect detail fields/types, bubbles, composed, cancelable, default prevention, ordering, and exact event count
- [ ] planted name/detail/flag/order mismatches fail source and built-customer gates

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
