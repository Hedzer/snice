---
id: SNICE-102
title: "make music-player progress and playlist fully keyboard operable"
epic: accessibility
priority: 102
created: 2026-07-14
deps: []
---

## Goal
Provide native-quality keyboard, focus, value, and selection semantics for music-player progress and playlist interactions.

## Notes
- Audit identified pointer-only progress/playlist surfaces in `packages/components/src/music-player/`.

## Acceptance criteria
- [ ] seek control exposes range value/text and keyboard increments; playlist entries expose selection and activation semantics
- [ ] loading, live playback updates, drag, keyboard seek, current track, disabled/unavailable tracks, and focus are coherent
- [ ] all-browser tests assert values, announcements, focus, playback state, and pointer/keyboard event parity

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
