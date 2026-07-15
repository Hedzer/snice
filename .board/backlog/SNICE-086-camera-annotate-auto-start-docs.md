---
id: SNICE-086
title: "document camera-annotate autoStart"
epic: docs
priority: 86
created: 2026-07-14
deps: []
---

## Goal
Document the shipped camera-annotate `autoStart` property accurately in both documentation audiences.

## Notes
- The property exists in `packages/components/src/camera-annotate/snice-camera-annotate.ts` but is absent from human and AI docs.
- Documentation must retain the project policy that showcases never request camera permission on page load.

## Acceptance criteria
- [ ] property, attribute, type, default, camera-mode restriction, permission timing, and failure behavior match source
- [ ] examples require an intentional user action and lazy element creation where the public showcase policy requires it
- [ ] human docs, AI docs, metadata, stories, and source pass the docs contract validator

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
