---
id: SNICE-216
title: "Measure and gate the marginal cost of each platform theme"
epic: platform-themes
priority: 216
created: 2026-08-12
deps: [SNICE-208, SNICE-210]
---

## Goal

Determine whether the generated theme architecture makes additional perfect-fidelity profiles cheap enough to build, ship, switch, test, and maintain as a broad portfolio.

## Notes

This is the go/no-go gate for optional profiles. It measures two separate costs:

1. Product cost: engineering, platform research, design review, component exceptions, reference capture, testing, documentation, licensing review, and continuing maintenance.
2. Runtime cost: download and cache size, parsed CSS, style recalculation, memory, compositing, switch latency, and the cost of multiple profiles coexisting on one page.

A profile is not "cheap" if savings come from incomplete element coverage, generic fallbacks, reduced state coverage, skipped device testing, or weaker fidelity. Each candidate receives its own decision because an enterprise design system can have a different mapping and legal cost from an operating-system profile.

## Acceptance criteria

- [ ] Product owners record quantitative green/yellow/red thresholds before optional-profile estimates are reviewed, including initial person-days, annual maintenance, CI/device cost, shipped bytes, runtime budgets, and acceptable manual exceptions.
- [ ] Instrumentation separates the one-time theme-platform investment from the marginal cost of a new profile and reports recipe entries, direct mappings, composed mappings, guideline fallbacks, new shared theme hooks, profile-only code, handwritten CSS, visual baselines, fixtures, and documentation.
- [ ] Measurements from Apple Glass and Android Material establish the observed first-profile and second-profile costs rather than relying only on estimates.
- [ ] A representative third-profile spike exercises primitives, forms, navigation, overlays, data-heavy components, visualization, light/dark, accessibility modes, responsive behavior, and nested switching without becoming an unreviewed partial release.
- [ ] Runtime benchmarks cover initial load, lazy profile load, whole-app switch, nested-subtree switch, repeated switching, multiple resident profiles, style recalculation, memory, layout shift, input latency, animation frames, and glass compositing on minimum supported devices.
- [ ] The cost report identifies generator or theme-contract improvements that would lower future marginal cost, and those improvements land before a candidate is labeled green.
- [ ] Each optional profile receives a dated `GO`, `ROI REVIEW`, or `NO-GO` decision with its own measured estimate, confidence range, expected customer value, and named owner.
- [ ] `GO` requires complete fidelity and conformance under SNICE-199 and SNICE-208; an inexpensive approximate skin cannot pass.
- [ ] Cost metrics are regenerated in CI and regressions beyond the agreed envelope block new optional-profile work or require explicit product approval.

## Worklog

- 2026-08-12: Added a shared product/runtime cost gate before expanding from Apple and Android into a theme portfolio.
