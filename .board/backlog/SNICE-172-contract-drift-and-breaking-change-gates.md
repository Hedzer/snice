---
id: SNICE-172
title: "Add contract drift and breaking-change gates"
epic: rust-support
priority: 172
created: 2026-08-12
deps: [SNICE-170, SNICE-171]
---

## Goal

Prevent generated adapters and published artifacts from silently drifting or introducing unclassified breaking changes.

## Notes

This is the long-term guardrail for a multi-language UI kit. A source change must produce one reviewable contract diff and predictable downstream output.

## Acceptance criteria

- [ ] A clean-checkout regeneration test completes with no diff across IR, CEM, analyzer, React, and Rust outputs.
- [ ] Contract snapshots report added, removed, renamed, narrowed, and widened elements, members, methods, events, slots, parts, and CSS properties.
- [ ] Breaking changes require an explicit compatibility decision and coordinated npm/crate version action.
- [ ] Published package tests validate CEM schema, contract artifact presence, released tag parity, WIP exclusion, and no internal method leakage.
- [ ] Generated artifact cleanup removes stale files when components or families disappear.
- [ ] Failure output names the exact source declaration and downstream artifact that disagree.

## Worklog

- 2026-08-12: Consolidated prior metadata drift and published-artifact completeness work.
