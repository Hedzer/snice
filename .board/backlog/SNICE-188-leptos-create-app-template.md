---
id: SNICE-188
title: "Add snice create-app support for Leptos"
epic: rust-support
priority: 188
created: 2026-08-12
deps: [SNICE-179, SNICE-183, SNICE-184, SNICE-185, SNICE-186]
---

## Goal

Make `snice create-app --template=leptos` produce a polished, strongly typed application that builds and runs immediately.

## Notes

The starter should use Leptos-native reactive syntax and the same observable feature contract as the Yew template so both can share release assertions.

## Acceptance criteria

- [ ] `npx snice create-app my-app --template=leptos` creates a placeholder-free Cargo/WASM project with pinned toolchain policy, committed dependency lock, generated AI guidance, and correct ignore rules.
- [ ] Documented install, check, test, dev, and production build commands work from a clean scaffold.
- [ ] The starter uses generated Leptos wrappers and version-matched local Snice assets rather than raw untyped event listeners.
- [ ] The starter demonstrates a reactive form value, boolean state, structured property, typed custom event, native event, slot, theme, focus or method handle, readiness, and supported hydration pattern.
- [ ] Signal updates and disposal produce no duplicate listeners, hydration warnings, page errors, console errors, or failed asset requests.
- [ ] Invalid Rust project names, occupied targets, missing tools, and asset version mismatch have stable tested diagnostics.

## Worklog

- 2026-08-12: Planned as the first-class Leptos entry point requested for the CLI.
