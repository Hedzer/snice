---
id: SNICE-168
title: "switch state labels clipped by the thumb"
epic: quality
priority: 168
created: 2026-08-07
deps: []
---

## Goal
Stop `snice-switch` from clipping `label-on`/`label-off`: size the track to its widest state label and derive the checked thumb travel from the actual track width.

## Notes
- External report: GitLab issue #1 (Arthur Veres, against 6.0.0). `label-off="Off"` at medium rendered as "FF" — the track had a hardcoded per-size width, the thumb (`z-index: 2`) painted over the label (`z-index: 1`), and the checked offset was a fixed `translateX` per size.
- The 7.5.0 tree had a partial mitigation (fixed widened widths when labels are authored) that still clipped any label longer than ~3 characters and left `::part(track)` width overrides desynchronised from thumb travel, so the report's two suggested changes remained open.
- Fix: tracks declare `min-width`; an invisible in-flow sizer (`.switch-track-sizer`, both labels stacked in one grid cell with identical typography plus thumb/inset padding) gives the track an intrinsic width of thumb + clearance + widest label + inset; checked thumb position is `left: calc(100% - <thumb> - 2px)` (transition moved from `transform` to `left`), which matches the old geometry exactly at default track widths.
- Small size keeps hiding state labels and no longer widens (the sizer is `display: none` there), reverting the dead widening from the partial mitigation.
- The state labels are now exposed as CSS parts (`label-on`, `label-off`) — the report noted consumers had no restyling channel.

## Acceptance criteria
- [x] Browser test reproduces the report red before the patch (label under thumb, label past track edge, part-override desync) — `tests/live/components/switch/switch-state-labels.spec.ts` + fixture, 5 of 7 cases failed pre-patch
- [x] All cases green in Chromium, Firefox, and WebKit after the patch (21/21)
- [x] Unit contract updated: sizer rendered/omitted, parts exposed, CSS contracts (min-width, calc travel, no hardcoded widening)
- [x] Docs updated in both `docs/components/switch.md` and `docs/ai/components/switch.md` (parts table, auto-sizing behavior)
- [x] Showcase and Storybook state-label sections demo long labels at medium and large

## Worklog
- 2026-08-07: created from GitLab issue #1; mechanism verified against source (evidence in Notes). Wrote failing Playwright repro first (5 red), implemented content-derived track sizing + track-width-derived thumb travel + state-label parts, green across all three engines; unit suite 35/35.
- 2026-08-07: state label text contrast fixed (reported against the components page): dropped `mix-blend-mode: overlay` on the on-label and raised visible-state opacity 0.7 → 1. Measured on the built site: dark 6.71:1 off / 4.93:1 on; light 11.74:1 off / 4.38:1 on (the on pair is the system's standard `text-inverse`-on-`primary`, identical to the primary button). Verified visually in both themes; `dark-mode-colors` contrast guard green in all three engines.
