---
id: SNICE-084
title: "initialize podcast sleep timer from its public property"
epic: behavior
priority: 84
created: 2026-07-14
deps: []
---

## Goal
Make the public `sleepTimer` value initialize and update the actual countdown instead of remaining disconnected internal state.

## Notes
- Source audit found `sleepTimer` separate from `sleepTimerRemaining`, which drives behavior.
- Affected implementation: `packages/components/src/podcast-player/snice-podcast-player.ts`.

## Acceptance criteria
- [ ] initial attribute/property values, runtime changes, user menu changes, zero/invalid values, pause/end, and reconnect have defined semantics
- [ ] only one interval exists and teardown never leaks or fires after removal
- [ ] fake-time unit tests and real-browser interaction tests assert countdown, events, playback stop, and cleanup

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
