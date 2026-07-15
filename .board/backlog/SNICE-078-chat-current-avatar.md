---
id: SNICE-078
title: "make chat currentAvatar affect outgoing messages"
epic: behavior
priority: 78
created: 2026-07-14
deps: []
---

## Goal
Use the public `currentAvatar` property in the documented current-user experience or remove it intentionally.

## Notes
- Source audit found `currentAvatar` declared but unused.
- Affected implementation: `packages/components/src/chat/snice-chat.ts`.

## Acceptance criteria
- [ ] the property has one defined relationship to outgoing, optimistic, and externally supplied messages
- [ ] runtime changes, missing avatars, failed sends, retries, and custom message slots are coherent
- [ ] docs, stories, unit, and browser tests assert observable output rather than reflection

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
