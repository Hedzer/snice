---
id: SNICE-047
title: "decide empty-query fallback when recent commands are empty"
epic: ux
priority: 47
created: 2026-07-14
deps: []
---

## Goal
Decide whether an empty command-palette query with no recents should show all commands, a curated subset, or an explicit empty state.

## Notes
- Current behavior can show no commands even though commands exist when the recent list is empty.
- Affected implementation and docs: `packages/components/src/command-palette/` and both component doc sets.

## Acceptance criteria
- [ ] one behavior is chosen for first use, cleared history, unavailable storage, and populated history
- [ ] keyboard selection and result announcements remain coherent under the chosen fallback
- [ ] stories, docs, source, and browser tests demonstrate the accepted behavior

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
