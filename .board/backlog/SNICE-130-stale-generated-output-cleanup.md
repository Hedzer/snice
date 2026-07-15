---
id: SNICE-130
title: "make generators remove stale excluded output"
epic: release
priority: 130
created: 2026-07-14
deps: []
---

## Goal
Ensure every generator and website assembler converges from a dirty prior build to the exact fresh-build artifact set.

## Notes
- The WIP spreadsheet leak showed that skipping generation is insufficient when old files remain.
- Affected areas include component build output, declarations, React adapters, CDN/site bundles, docs/catalogues, legacy compatibility fragments, and website public copies.

## Acceptance criteria
- [ ] each generator owns and cleans only its output domain before regenerating, without deleting user-authored files
- [ ] fresh-tree and deliberately seeded stale-tree builds produce byte-identical manifests and bytes
- [ ] tests cover removed, renamed, WIP, and category-moved components plus interrupted prior builds

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
