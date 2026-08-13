---
id: SNICE-196
title: "Verify cross-browser accessibility and lifecycle parity"
epic: rust-support
priority: 196
created: 2026-08-12
deps: [SNICE-190, SNICE-191, SNICE-194, SNICE-195]
---

## Goal

Prove Rust integration preserves Snice behavior through real framework lifecycles and accessibility interactions.

## Notes

This focuses on behaviors most likely to break at the custom-element/framework boundary rather than retesting internal rendering implementation.

## Acceptance criteria

- [ ] Yew and Leptos journeys cover conditional mount, keyed reorder, rerender, reconnect, route/view change, unmount/remount, late registration, and repeated listener replacement in all supported browsers.
- [ ] Forms cover labels, name/value, disabled/required state, validation, FormData, reset, state restore where supported, and controlled/uncontrolled transitions.
- [ ] Keyboard, focus, pointer, reduced-motion, forced-colors, RTL, and accessible name/role/state behavior match direct custom-element use for representative archetypes.
- [ ] Slots and CSS parts/themes survive framework updates and hydration without losing authored children or styles.
- [ ] Request responders and imperative handles do not outlive disposed components or deliver stale results.
- [ ] Memory/listener instrumentation establishes an agreed leak and duplicate-delivery baseline.

## Worklog

- 2026-08-12: Added as the high-risk behavior parity gate across framework lifecycles.
