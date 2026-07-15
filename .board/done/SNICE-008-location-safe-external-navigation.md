---
id: SNICE-008
title: "harden location external navigation"
epic: security
priority: 8
created: 2026-07-14
deps: []
---

## Goal
Make location-card navigation scheme-safe and prevent opened pages from receiving an opener reference.

## Notes
- Affected implementation: `packages/components/src/location/snice-location.ts`, which calls `window.open(url, '_blank')`.
- The same component also exposes a clickable-card UX, so mouse and keyboard paths must share the exact navigation policy.
- This ticket is separate from general location accessibility.

## Acceptance criteria
- [x] unsafe schemes are rejected and allowed external destinations use `noopener` behavior
- [x] mouse, keyboard, and programmatic activation have identical outcomes and event ordering
- [x] browser tests inspect the opened target parameters and exercise the shared adversarial URL matrix

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-15: accepted for implementation; retain core `isSafeUrl()` as the sole URL-policy implementation, preserve `location-click` before navigation, and keep direct `openMap()` distinct from click activation.
- 2026-07-15: centralized location URL resolution for navigation and embeds, added strict runtime-value handling, isolated `_blank` opens with `noopener`, and aligned pointer, Enter, and host `click()` activation with accessible link semantics.
- 2026-07-15: added 68 focused component tests plus source/distribution/CDN browser matrices across Chromium, Firefox, and WebKit, including real popup opener checks, hostile attributes/properties, dynamic mutation, exact event ordering, keyboard behavior, and focus presentation.
- 2026-07-15: updated human and AI references, Storybook, the source full showcase, and the deployed public website; drove all three surfaces at desktop/mobile and light/dark/no-theme settings without execution, overflow, console errors, or rendering failures.
- 2026-07-15: isolated website/deploy builder tests in temporary outputs after the full parallel gate exposed shared-output races; concurrent source and built reproducers and CLI customer install/build flows then passed.
- 2026-07-15: final release matrix passed in 195.62s: 7,494 source tests, 7,494 built tests, 1,220 React tests, 102 framework-browser tests, 24 production-website browser tests, CDN/runtime suites, all builds, and 93.4% statement / 90.87% branch core coverage.
