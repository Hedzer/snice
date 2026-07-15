---
id: SNICE-003
title: "render tree item icons without HTML injection"
epic: security
priority: 3
created: 2026-07-14
deps: []
---

## Goal
Keep tree node icon text and image metadata from creating arbitrary DOM or executable attributes.

## Notes
- A real-browser probe confirmed that `node.icon` was interpreted as HTML.
- Affected implementation: `packages/components/src/tree/snice-tree-item.ts`; both icon text and `iconImage` attribute construction used `innerHTML`.
- Text and image icons now have separate, documented channels: `icon` is literal text and `iconImage` is a validated URL.

## Acceptance criteria
- [x] text icons remain text and image URLs are assigned as URL properties rather than interpolated markup
- [x] invalid or unsafe image values fail safely without altering surrounding tree structure
- [x] adversarial tests cover HTML, SVG, event attributes, quotes, malformed URLs, rerenders, and nested nodes in all shipped builds

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-15: accepted for implementation; verified the vulnerable icon and image-markup paths against the component API, docs, stories, and recursive tree behavior.
- 2026-07-15: replaced tree-item string DOM construction with declarative Snice rendering, literal icon text, validated image-property binding, text fallback on image failure, keyed recursive children, and runtime icon visibility propagation.
- 2026-07-15: added source/built unit and source/built/CDN browser adversarial coverage; repaired the existing tree browser specs so all public showcase behaviors are exercised against current examples.
- 2026-07-15: documented the icon channels in human and AI references and added working public-site and Storybook image-icon examples.
- 2026-07-15: visually drove the public component page, public full showcase in light/dark themes, and Storybook image, deep, checkbox, and lazy stories with no runtime or layout defects.
- 2026-07-15: stabilized the table showcase's release-matrix setup by relying on its exact rendered-data readiness check instead of a redundant `networkidle` wait.
- 2026-07-15: final release matrix passed in 196.15s: 7,315 source tests, 7,315 built tests, 1,220 React tests, 57 framework-browser tests, 18 website-browser tests, CDN/runtime suites, builds, metadata, and 93.4% core statement coverage.
