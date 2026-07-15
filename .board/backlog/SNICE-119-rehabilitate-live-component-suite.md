---
id: SNICE-119
title: "rehabilitate and gate the full live component browser suite"
epic: quality
priority: 119
created: 2026-07-14
deps: []
---

## Goal
Make the broad component E2E suite trustworthy and include an appropriate version in required verification.

## Notes
- The required framework browser gate currently runs only three spec files.
- Direct discovery found 240 Chromium tests in 49 `tests/live/components` files and 96 failure artifacts over about 6m04s.
- Many failures are stale tests, such as select expecting obsolete `#basic-select`, so the count must not be mislabeled as 96 product defects.

## Acceptance criteria
- [ ] every existing failure is classified as stale test, product defect with a board link, environment issue, or intentional removal
- [ ] selectors and readiness conditions target current public behavior rather than private obsolete markup
- [ ] a reliable sharded/source-plus-built/all-browser gate runs within an explicit time budget and emits no untriaged failures or artifacts

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
