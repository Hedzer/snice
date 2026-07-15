---
id: SNICE-077
title: "render book author and meaningful cover text"
epic: behavior
priority: 77
created: 2026-07-14
deps: []
---

## Goal
Make the public book `author` property visible and expose title/author as real cover content rather than only image alternative text.

## Notes
- A browser probe found author absent and title used only as alt text.
- Affected implementation: `packages/components/src/book/snice-book.ts`.

## Acceptance criteria
- [ ] title and author render accessibly with and without a cover image and allow deliberate custom cover composition
- [ ] empty, long, Unicode, hidden-cover, responsive, and runtime-update states have stable layout
- [ ] docs, stories, unit, built, and browser tests assert visible and accessible text

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
