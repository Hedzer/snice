---
id: SNICE-009
title: "prevent opener access from targeted button navigation"
epic: security
priority: 9
created: 2026-07-14
deps: []
---

## Goal
Ensure button navigation to a new browsing context cannot retain a live `window.opener` reference.

## Notes
- Affected implementation: `packages/components/src/button/snice-button.ts`, which currently calls `window.open(this.href, this.target)`.
- This remains relevant even if SNICE-059 later changes `href` mode to render a real anchor.

## Acceptance criteria
- [ ] new-context navigation applies `noopener` semantics for every supported target path
- [ ] same-context targets and download behavior remain native and unaffected
- [ ] real-browser tests verify opener isolation rather than only inspecting markup

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
