---
id: SNICE-135
title: "normalize value events across basic controls"
epic: events
priority: 135
created: 2026-07-14
deps: []
---

## Goal
Decide how input, textarea, color-picker, slider-like controls, and other value editors should expose native `input`/`change` plus component-specific events.

## Notes
- Audit found inconsistent prefixes and generic value-change patterns across controls.
- This is event/API consistency only; no two-way-binding directive or special binding syntax is proposed.
- Compatibility aliases and deprecation timing must be part of any accepted change.

## Acceptance criteria
- [ ] the proposal specifies user input versus commit semantics, programmatic changes, cancelation, detail shape, ordering, bubbles/composed flags, and native event coexistence
- [ ] representative current event surfaces are mapped to the proposed contract with nonbreaking migration paths
- [ ] if accepted, runtime/type/docs/React/browser tests prove old and new channels for the supported compatibility window

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
