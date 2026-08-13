---
id: SNICE-170
title: "Create a canonical typed component contract IR"
epic: rust-support
priority: 170
created: 2026-08-12
deps: [SNICE-169]
---

## Goal

Create one deterministic, language-neutral public contract from which CEM, analyzer data, React adapters, and Rust bindings can be generated safely.

## Notes

The current custom-elements manifest loses declared TypeScript precision, represents event and method parameter types incorrectly for CEM 2.1, omits form association and some declarative child attributes, and includes internal methods. Rust generation must not amplify those defects.

## Acceptance criteria

- [ ] The versioned IR represents released tag, module, family, WIP state, documentation, deprecation, declared type, runtime converter, default, read-only state, property-versus-attribute channel, and reflection behavior.
- [ ] It represents explicitly public methods and parameters, native versus custom events and detail types, form association, slots, CSS parts, CSS custom properties, and declarative child attributes.
- [ ] Declared types and runtime converters remain separate so unions and structural types are not erased.
- [ ] CEM output validates against the official 2.1 schema, including Type objects for events and method parameters.
- [ ] CEM, analyzer contracts, React generation, and future Rust generation consume the IR or document a narrowly tested exception.
- [ ] Generation is deterministic and offers a check mode that fails on checked-in artifact drift.
- [ ] The released tag set is identical across source, IR, CEM, distribution, React, and later Rust surfaces; WIP elements are excluded consistently.

## Worklog

- 2026-08-12: Folded prior metadata, artifact, and source-contract backlog concerns into the Rust prerequisite.
