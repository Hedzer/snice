---
id: SNICE-187
title: "Add snice create-app support for Yew"
epic: rust-support
priority: 187
created: 2026-08-12
deps: [SNICE-179, SNICE-181, SNICE-182, SNICE-185, SNICE-186]
---

## Goal

Make `snice create-app --template=yew` produce a polished, strongly typed application that builds and runs immediately.

## Notes

The generated app should use the published-style crates and the exact Snice asset artifact under test, with no production dependency on a live CDN.

## Acceptance criteria

- [ ] `npx snice create-app my-app --template=yew` creates a placeholder-free Cargo/WASM project with pinned toolchain policy, committed dependency lock, generated AI guidance, and correct ignore rules.
- [ ] Documented install, check, test, dev, and production build commands work from a clean scaffold.
- [ ] The starter uses generated Yew wrappers and version-matched local Snice assets rather than raw untyped event listeners.
- [ ] The starter demonstrates a controlled form value, boolean state, structured property, typed custom event, native event, slot, theme, focus or method handle, and readiness.
- [ ] Rerenders and unmounts produce no duplicate listeners, page errors, console errors, or failed asset requests.
- [ ] Invalid Rust project names, occupied targets, unknown templates, missing tools, and asset version mismatch have stable tested diagnostics.

## Worklog

- 2026-08-12: Planned as the first-class Yew entry point requested for the CLI.
