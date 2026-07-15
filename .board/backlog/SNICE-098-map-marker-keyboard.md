---
id: SNICE-098
title: "make map markers keyboard discoverable and operable"
epic: accessibility
priority: 98
created: 2026-07-14
deps: []
---

## Goal
Allow keyboard users to discover, focus, identify, and activate interactive map markers.

## Notes
- Audit identified marker interaction in `packages/components/src/map/` without a complete keyboard path.

## Acceptance criteria
- [ ] interactive markers have names, focus order or spatial navigation, visible focus, selected/current state, and activation semantics
- [ ] pan/zoom, clustering, offscreen markers, dynamic data, and popup focus remain coherent
- [ ] browser tests cover keyboard-only marker discovery/activation and an accessible nonvisual location list or equivalent

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
