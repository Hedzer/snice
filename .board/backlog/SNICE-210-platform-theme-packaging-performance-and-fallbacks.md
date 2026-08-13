---
id: SNICE-210
title: "Package platform themes with production-grade performance"
epic: platform-themes
priority: 210
created: 2026-08-12
deps: [SNICE-200, SNICE-207]
---

## Goal

Ship platform profiles as versioned, selectable assets with deterministic loading, strong fallbacks, and acceptable runtime cost.

## Acceptance criteria

- [ ] Applications can load only the platform profiles they use, while multiple loaded profiles can coexist in nested providers without duplicated runtime logic.
- [ ] Theme assets work offline, under CSP, from npm/CDN/local copies, during SSR/hydration, and without flash-of-wrong-theme or layout shift.
- [ ] Unsupported `backdrop-filter`, color, animation, and other rendering capabilities receive profile-specific progressive enhancement and accessible fallbacks.
- [ ] Glass compositing, shadows, filters, dynamic color calculation, and animated state layers meet explicit bundle-size, style-recalculation, memory, and frame-time budgets.
- [ ] Theme switches preserve component state and do not leak stylesheets, observers, listeners, animations, or GPU-heavy layers.
- [ ] Version skew between runtime, elements, recipes, and theme assets produces actionable diagnostics.
- [ ] Packed npm, CDN, generated-app, and Rust asset workflows test the exact shipped files.

## Worklog

- 2026-08-12: Added performance and progressive enhancement as fidelity constraints, especially for glass materials.
