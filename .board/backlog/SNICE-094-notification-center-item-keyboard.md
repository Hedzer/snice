---
id: SNICE-094
title: "make notification-center items keyboard operable"
epic: accessibility
priority: 94
created: 2026-07-14
deps: []
---

## Goal
Give clickable notification items complete keyboard, focus, role, name, and state behavior.

## Notes
- Audit identified notification-center items as pointer-clickable surfaces without equivalent semantics.
- Affected implementation: `packages/components/src/notification-center/snice-notification-center.ts`.

## Acceptance criteria
- [ ] actionable and nonactionable notifications are semantically distinct
- [ ] keyboard activation, mark-read behavior, nested actions, dismissal, focus movement, and empty updates are deterministic
- [ ] browser accessibility tests assert roles, names, focus, events, read state, and no double activation

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
