---
id: SNICE-126
title: "assert WIP components are absent from npm packages"
epic: quality
priority: 126
created: 2026-07-14
deps: []
---

## Goal
Turn `.wip` exclusion into an automated npm-pack contract that cannot regress through stale generated output.

## Notes
- SNICE-063 records the current spreadsheet leak.
- The test must inspect the actual packed file manifest after a fresh build and after seeded stale outputs.

## Acceptance criteria
- [ ] every `.wip` name is absent from package files, declarations, adapters, CDN/site artifacts, docs, metadata, catalogues, and exports
- [ ] a seeded stale-output case proves cleanup/exclusion rather than relying on a pristine checkout
- [ ] the release gate reports exact leaked paths and leaves non-WIP artifacts unchanged

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
