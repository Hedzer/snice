---
id: SNICE-103
title: "make podcast progress, chapters, and episodes keyboard operable"
epic: accessibility
priority: 103
created: 2026-07-14
deps: []
---

## Goal
Provide complete keyboard and accessible semantics for podcast seeking, chapters, and episode selection.

## Notes
- Audit identified pointer-only progress, chapter, and episode surfaces in `packages/components/src/podcast-player/`.

## Acceptance criteria
- [ ] seek uses range semantics and chapters/episodes expose names, current/selected state, focus, and activation
- [ ] playback updates, sleep timer, unavailable media, dynamic episodes, and focus retention are deterministic
- [ ] all-browser tests cover keyboard-only use, values/labels, event counts, and current-item announcements

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
