---
id: SNICE-176
title: "Generate typed events and safe listener lifetimes"
epic: rust-support
priority: 176
created: 2026-08-12
deps: [SNICE-171, SNICE-174, SNICE-175]
---

## Goal

Make native and Snice custom events pleasant, precise, and leak-free in Rust.

## Notes

Event names, native/custom distinctions, detail payloads, bubbling, composition, and listener ownership must come from the canonical contract.

## Acceptance criteria

- [ ] Every public event has a generated descriptor and exact event type; custom detail access is strongly typed wherever the source contract is precise.
- [ ] Native Event, InputEvent, KeyboardEvent, FocusEvent, PointerEvent, and other browser types remain native rather than being wrapped as unknown CustomEvent values.
- [ ] Dynamic details use an explicit JsValue path with checked conversion helpers and documented reasons.
- [ ] Listener subscription returns an RAII guard and handles callback replacement, rerenders, unmount, and panic/error paths without duplicate delivery.
- [ ] Tests verify capture/bubble/composed behavior and exactly one callback per activation.
- [ ] Compile-fail tests reject callbacks with the wrong event or detail type while preserving an explicit advanced escape hatch.

## Worklog

- 2026-08-12: Folded the event runtime/type contract backlog into Rust's typed event foundation.
