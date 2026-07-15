---
id: SNICE-054
title: "install popover global listeners only while needed"
epic: lifecycle
priority: 54
created: 2026-07-14
deps: []
---

## Goal
Avoid permanent document-level outside-click and Escape listeners for every closed popover instance.

## Notes
- Affected implementation: `packages/components/src/popover/snice-popover.ts`; listeners are installed from lifecycle setup even while closed.
- Large pages may contain many popovers, so listener ownership should scale with open instances.

## Acceptance criteria
- [ ] closed popovers own no document/window listeners that are only needed while open
- [ ] opening, closing, rapid toggles, nested popovers, reconnect, and removal attach/detach exactly once
- [ ] tests instrument listener ownership and assert topmost outside-click/Escape behavior

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
