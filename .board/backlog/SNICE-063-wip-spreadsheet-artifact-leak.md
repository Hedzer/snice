---
id: SNICE-063
title: "exclude WIP spreadsheet from every shipped artifact"
epic: release
priority: 63
created: 2026-07-14
deps: []
---

## Goal
Make the `.wip` contract true for source builds, distribution, CDN/site, React adapters, docs, and npm packages.

## Notes
- `packages/components/.wip` marks spreadsheet excluded, but `npm pack --dry-run` listed 11 spreadsheet files across adapters, dist types, site bundles/showcase, and human/AI docs.
- Generators skip creation but do not remove stale output; website assembly also copies legacy/stale fragments.
- No unrelated shipped artifact may change while closing this leak.

## Acceptance criteria
- [ ] fresh and dirty-tree builds both remove or exclude every spreadsheet artifact from all shipped surfaces
- [ ] npm pack, website output, CDN, declarations, React exports, custom-elements metadata, MCP catalogue, and docs contain no WIP component
- [ ] a deterministic pre/post artifact manifest proves all non-WIP package bytes and public website outputs remain identical where expected

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
