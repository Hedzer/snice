---
id: SNICE-122
title: "test every string and URL sink adversarially"
epic: quality
priority: 122
created: 2026-07-14
deps: []
---

## Goal
Create a complete adversarial matrix for caller-controlled HTML, SVG, style, URL, image, and navigation channels.

## Notes
- Browser probes found real injection in select, file-gallery, tree-item, link, and button.
- The test must inventory sinks rather than only pinning those five examples.

## Acceptance criteria
- [ ] every `innerHTML`, SVG-string, URL assignment, window navigation, dynamic style, and trusted-rich-content channel is classified
- [ ] tests cover markup, scripts, event handlers, SVG, CSS escapes, encoded/obfuscated schemes, malformed Unicode, rerender, and built/minified behavior
- [ ] source, distribution, CDN, React where applicable, and all browsers fail closed while documented trusted composition still works

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
