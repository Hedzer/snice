---
id: SNICE-145
title: "require every public property to have current behavior"
epic: dx
priority: 145
created: 2026-07-14
deps: []
---

## Goal
Adopt a product rule that public documented properties must do something observable now or be explicitly removed/marked as metadata by design.

## Notes
- The audit found numerous future placeholders and inert advertised features.
- SNICE-123 owns automated behavioral enforcement; this card is the public API policy decision.

## Acceptance criteria
- [ ] observable behavior, metadata-only behavior, deprecated compatibility, and experimental surface are precisely defined
- [ ] a review process covers source decorators, types, metadata, docs, stories, showcases, and generated artifacts before release
- [ ] if accepted, existing inert-property tickets are triaged under the rule and no future placeholder ships silently

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
