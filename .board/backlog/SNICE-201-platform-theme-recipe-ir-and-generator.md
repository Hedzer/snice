---
id: SNICE-201
title: "Generate platform themes from a canonical recipe IR"
epic: platform-themes
priority: 201
created: 2026-08-12
deps: [SNICE-199]
---

## Goal

Create a canonical, typed theme-recipe format and generator capable of expressing platform-perfect treatment across the complete element catalog.

## Notes

Hand-maintaining hundreds of component selectors per profile will drift. The recipe must describe semantic tokens, component anatomy, variants, states, motion, responsive behavior, and platform compositions while preserving the same Snice element implementations.

## Acceptance criteria

- [ ] The recipe schema represents platform primitives, semantic roles, component parts, variants, state layers, motion, density, typography, elevation/materials, icon metrics, and accessibility adaptations.
- [ ] Recipes can target existing CSS parts and custom properties, and the generator reports component internals that cannot yet express the required platform treatment.
- [ ] Generated CSS and support artifacts are deterministic, formatted, reviewable, and rejected when stale.
- [ ] Common mechanics can be shared without forcing Apple, Android, Windows, or enterprise profiles into one lowest-common-denominator design.
- [ ] Theme recipes cannot alter public element/event contracts or replace Snice elements with third-party implementations.
- [ ] The schema supports versioned platform references and migration when an operating system or design system changes.
- [ ] Source, generated output, package contents, and documentation have one declared source of truth.

## Worklog

- 2026-08-12: Required generation as the only sustainable route to full-catalog fidelity.
