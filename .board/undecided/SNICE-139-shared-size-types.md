---
id: SNICE-139
title: "standardize component size types"
epic: dx
priority: 139
created: 2026-07-14
deps: []
---

## Goal
Decide whether common component sizes should use shared base types with explicit component extensions.

## Notes
- Audit found repeated near-duplicate size unions that drift in names and supported values.
- A shared type must not imply every component renders every size.

## Acceptance criteria
- [ ] all size properties and defaults are inventoried and intentional differences are documented
- [ ] a base-plus-extension type design preserves per-component discoverability and declaration output
- [ ] if accepted, migration changes no runtime size behavior and tests/types/docs catch future drift

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
