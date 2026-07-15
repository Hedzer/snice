---
id: SNICE-002
title: "render file-gallery metadata without HTML injection"
epic: security
priority: 2
created: 2026-07-14
deps: []
---

## Goal
Prevent filenames, badges, icons, and action metadata from becoming executable markup inside file-gallery.

## Notes
- A real-browser probe confirmed that caller-controlled file metadata inserted by `innerHTML` becomes live DOM.
- Affected implementation: `packages/components/src/file-gallery/snice-file-gallery.ts`.
- The fix must cover initial items, added files, custom actions, error badges, and every layout mode.

## Acceptance criteria
- [x] all untrusted text is inserted with text-safe DOM APIs or escaped by the rendering engine
- [x] documented icon and custom-action composition remains functional through an explicit trusted channel
- [x] adversarial source, built, CDN, and browser tests cover filenames, MIME text, badges, icons, and action labels

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-14: accepted for implementation; replaced imperative `innerHTML` rendering with Snice state, keyed `repeat()`, virtual conditionals, and safe binding channels.
- 2026-07-15: plain badge/action strings now render as text; explicit `unsafeHTML()` preserves trusted, sanitized HTML/SVG composition.
- 2026-07-15: verified 39 focused tests against source and built distribution plus source, ESM, and CDN customer paths in Chromium, Firefox, and WebKit.
- 2026-07-15: visually drove populated grid/list states on the public website and Storybook with progress, completed/error states, badges, actions, and no errors or overflow.
- 2026-07-15: complete release-grade matrix passed: 7,301 source tests, 7,301 built tests, CDN/runtime, React, 48 framework-browser tests, and 18 deployed-website tests in 193.20s; core statement coverage 93.4%.
