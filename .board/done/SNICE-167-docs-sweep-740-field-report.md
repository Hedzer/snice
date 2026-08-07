---
id: SNICE-167
title: "docs sweep from 7.4.0 field report"
epic: docs
priority: 167
created: 2026-08-07
deps: []
---

## Goal
Sweep the documentation corrections and additions found in the external 7.4.0 field report into the human and AI docs.

## Notes
- Each item below was verified or corroborated against source/docs on 2026-08-07.
- Aggregate story from the external 7.4.0 field report; items are doc edits, not runtime changes (except where a code change is the fix, noted per item).

## Acceptance criteria
- [x] lifecycle.md: state the relative order `@context()` → `@ready` → first render for routed pages
- [x] components/table.md:122: document that the `empty-state` slot content is CLONED on each zero-row render (snice-table.ts:~2836)
- [x] testing.md: document how to re-deliver a Context to an already-attached controller (needed to test first-delivery guards)
- [x] snice-data-card hard-codes `target="_blank" rel="noopener"` on link fields — make target opt-in or infer same-origin
- [x] components/diff.md: document that snice-diff's header is an INTERACTIVE mode toggle, how to suppress it, and emit a change event on self-assignment
- [x] routing.md:195: state `attribute: false` opts a field OUT of route-param binding
- [x] event delegation docs: retargeting across shadow boundaries breaks `@on('event', 'row-tag')` when rows move into a list component; name it with the fix (listen on container, carry identity in detail)
- [x] delegated handlers get the host as currentTarget, not the matched element; state it next to the controllers.md example (or pass matched element to handler)
- [x] state positively: an element hosts at most ONE controller; document the one-controller-per-trigger-element pattern
- [x] `snice/duplicated-stale-guard` fires on the MINIMUM correct guard (load-id + host-identity are distinct checks) — tune the rule or its message
- [x] `snice/imperative-controller-attach` should exempt test directories/fixtures
- [x] list.md: state snice-list-item has no `href` and snice-list is slot-fed with no `items` property
- [x] mark every self-mutating input property in its component doc (e.g. snice-segmented-control assigns `this.value` before dispatching); frame `live()` as covering these
- [x] components/badge.md:19: document hide rule — `count <= 0` renders nothing unless `showZero`
- [x] elements.md:92: `element.autofocus = true` is impossible under jsdom; the attribute form is the testable one
- [x] elements.md:84-92: state the autofocus pass also covers hosts first appearing in a LATER render
- [x] state snice-table limits: pagination labels ("Showing X-Y of Z" vs numbered), remote mode's hard-coded 150ms debounce, rows kept on failed load with own warning row, re-request triggers (currentPage/currentSort/pageSize only), client-side sort/search in local mode sorts one page
- [x] snice-pagination: export a typed event-detail interface (like InputInputDetail) instead of prose-only
- [x] document the pattern for a controller to observe a host property: owner `@dispatch` + controller `@on` (direct handlers listen on the host) (no host-property watcher exists)

## Worklog
- 2026-08-07: created from external 7.4.0 field report; docs sweep, each item verified or corroborated against source/docs (see Notes).
- 2026-08-07: all 19 items addressed. Doc edits: lifecycle order (with regression test `tests/lifecycle-order-probe.test.ts` — measured order is `@context()` → first render → `@ready()` with DOM queryable, NOT "@ready before first render" as reported), empty-state cloning, Context re-delivery via public `Context.update()`, `attribute: false` route-param opt-out, delegation retargeting + host currentTarget, one-controller-per-element, list no-`href`/slot-fed, autofocus jsdom + later-render notes, snice-table limits section. Code changes with tests: snice-data-card infers external vs same-origin link targets; snice-diff gains `show-mode-toggle` + `mode-change` event; `isTestFilename` now covers test directories/fixtures (rule exemption); `duplicated-stale-guard` fix message clarified (guards stay, plumbing moves). Already satisfied before this pass: badge hide rule (badge.md:31,35), segmented-control self-mutation + `live()` framing (segmented-control.md:20,42-43), `PaginationChangeDetail` export + typed examples in both pagination docs.
