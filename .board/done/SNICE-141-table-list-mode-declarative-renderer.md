---
id: SNICE-141
title: "declarative list-mode renderer for snice-table"
epic: behavior
priority: 141
created: 2026-08-07
deps: []
---

## Goal
Make a full-width custom row in snice-table list mode expressible declaratively — a `listRenderer` property or a row slot honored in list mode — instead of requiring imperative `setListViewRenderer(fn)` calls.

## Notes
- List mode paints plain cells unless `setListViewRenderer(fn)` is called imperatively (`packages/components/src/table/snice-table.ts:4664`).
- The renderer must return a hand-built HTMLElement (:4716-4725), forcing `document.createElement` into otherwise declarative pages.
- Confirmed gap from external 7.4.0 field report; verified against source.

## Acceptance criteria
- [x] a `listRenderer` property (or row slot honored in list mode) makes a full-width custom row expressible declaratively
- [x] test renders list mode without imperative calls

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
- 2026-08-07: failing tests first in `tests/components/table-list-renderer.test.ts` — no property path existed; only imperative `setListViewRenderer` worked.
- 2026-08-07: fix in `packages/components/src/table/snice-table.ts` — `listRenderer` is now a public `@property({ attribute: false })` with a watcher that resets the row recycler and re-renders; `setListViewRenderer(fn)` delegates to it. Added to `SniceTableElement` types and both table docs. Table suites + components tsc green.
