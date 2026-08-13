---
id: SNICE-186
title: "Make create-app use an extensible template catalog"
epic: rust-support
priority: 186
created: 2026-08-12
deps: [SNICE-169]
---

## Goal

Replace CLI assumptions about only default and React templates with one safe, extensible catalog.

## Notes

Today template names, npm project validation, help, next steps, package checks, tests, and version sync are hard-coded in several places.

## Acceptance criteria

- [ ] One canonical catalog drives accepted names, help text, labels, project-name rules, copy behavior, prerequisites, next commands, package checks, and version sync.
- [ ] Default and React scaffold behavior remains backward compatible.
- [ ] Cargo-valid and npm-valid naming rules are applied per template before creating or modifying the target directory.
- [ ] Template-specific text files, dotfile substitutes, placeholders, permissions, and ignore rules survive npm pack.
- [ ] Failures are transactional or explain how to recover from a partial scaffold.
- [ ] Unit, layout, packed-content, and version-sync tests derive their supported-template matrix from the catalog.

## Worklog

- 2026-08-12: Planned from the CLI audit before adding two Rust templates.
