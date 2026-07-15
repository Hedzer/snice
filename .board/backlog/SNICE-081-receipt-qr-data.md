---
id: SNICE-081
title: "make receipt qrData render a QR code"
epic: behavior
priority: 81
created: 2026-07-14
deps: []
---

## Goal
Make receipt `qrData` generate correct printable QR output or remove the inert property.

## Notes
- Source audit found `qrData` declared but unused.
- Affected implementation: `packages/components/src/receipt/snice-receipt.ts`, including its cloned print path.

## Acceptance criteria
- [ ] property/slot precedence and encoding are explicit and printable output preserves the QR and accessible fallback text
- [ ] empty, invalid, Unicode, large, rerender, and print-window cases behave deterministically
- [ ] tests validate the payload in live and print DOM rather than only element presence

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
