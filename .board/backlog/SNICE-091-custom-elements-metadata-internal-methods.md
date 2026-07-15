---
id: SNICE-091
title: "stop exposing internal lifecycle methods as public API"
epic: metadata
priority: 91
created: 2026-07-14
deps: []
---

## Goal
Remove framework lifecycle, watchers, cleanup helpers, and implementation-only methods from generated public component metadata.

## Notes
- Audit found custom-elements metadata listing methods such as accordion initialization/cleanup, command-palette watchers, and select callbacks.
- Affected sources include component visibility modifiers and `tooling/generators/generate-component-metadata.js`.
- Actual intentional public methods must remain discoverable.

## Acceptance criteria
- [ ] a documented public/private/protected rule determines metadata inclusion
- [ ] all shipped component methods are audited and internal lifecycle/decorator helpers disappear without hiding intentional APIs
- [ ] custom-elements JSON, editor completion, React/types, human docs, AI docs, and MCP catalogue agree under automated tests

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
