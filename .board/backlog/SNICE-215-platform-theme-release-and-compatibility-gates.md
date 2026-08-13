---
id: SNICE-215
title: "Release and maintain versioned platform profiles"
epic: platform-themes
priority: 215
created: 2026-08-12
deps: [SNICE-208, SNICE-209, SNICE-210, SNICE-211]
---

## Goal

Define the release, compatibility, and maintenance process for platform profiles so fidelity claims remain true after Snice and upstream platforms evolve.

## Acceptance criteria

- [ ] Apple Glass and Android Material cannot reach stable release until all required elements, states, tests, docs, assets, and design approvals pass.
- [ ] Each profile has an independent semantic version, supported Snice/runtime range, pinned guideline target, browser/device matrix, and compatibility policy.
- [ ] New Snice components and variants fail release checks when required platform mappings, recipes, references, and conformance fixtures are absent.
- [ ] Upstream Apple, Google, Microsoft, SAP, or Salesforce design changes trigger a monitored review and an explicit profile update rather than silent drift.
- [ ] Visual baselines, exceptions, browser limitations, legal approvals, and guideline interpretations have named owners and expiration/re-review rules.
- [ ] Beta adopters include at least one real application per primary profile, with tracked fidelity, performance, accessibility, and integration feedback.
- [ ] npm/CDN/Rust assets, metadata, examples, Storybook, docs, and adapters are tested from packed release artifacts before coordinated publication.

## Worklog

- 2026-08-12: Added maintenance gates so "native fidelity" remains a durable compatibility promise.
