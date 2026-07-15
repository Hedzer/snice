---
id: SNICE-090
title: "document notification-center placement"
epic: docs
priority: 90
created: 2026-07-14
deps: []
---

## Goal
Document the notification-center `placement` property and its layout/RTL behavior.

## Notes
- The property exists in source, types, and stories but is absent from human and AI docs.
- Affected implementation: `packages/components/src/notification-center/snice-notification-center.ts`.

## Acceptance criteria
- [ ] type, default, attribute, start/end meaning, runtime updates, and responsive/RTL interaction match source
- [ ] examples demonstrate both values using logical language rather than fixed left/right assumptions
- [ ] human docs, AI docs, metadata, stories, and source pass automated contract checks

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
