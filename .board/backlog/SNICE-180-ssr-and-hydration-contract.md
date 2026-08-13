---
id: SNICE-180
title: "Define and verify SSR and hydration behavior"
epic: rust-support
priority: 180
created: 2026-08-12
deps: [SNICE-174, SNICE-175, SNICE-176, SNICE-179]
---

## Goal

Give server-rendered Yew and Leptos applications an explicit custom-element contract with no hydration surprises.

## Notes

Servers can emit tags and serializable attributes, while property assignment, event listeners, registration, and upgrade happen in the browser. Unsupported combinations must be documented and enforced rather than implied.

## Acceptance criteria

- [ ] The contract classifies each value as server-serializable attribute, client-only property, or hydration-time effect.
- [ ] Server rendering compiles without browser-only calls and emits stable markup for supported component usage.
- [ ] Hydration applies structured properties and listeners exactly once after registration without replacing authored children or causing framework mismatch warnings.
- [ ] Late upgrade, streamed or delayed assets, conditional elements, keyed lists, and unmount/remount paths are tested.
- [ ] Unsupported SSR features fail at compile time where practical or emit an actionable development diagnostic.
- [ ] Both framework docs state the verified modes and expected flash/upgrade behavior.

## Worklog

- 2026-08-12: Planned as a shared contract, with framework-specific conformance later.
