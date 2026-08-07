---
id: SNICE-145
title: "name the component in template parse errors"
epic: rendering
priority: 145
created: 2026-08-07
deps: []
---

## Goal
Template parse errors should identify the component (tag/class) that produced the template, not just the surrounding template text.

## Notes
- `packages/core/src/parts.ts:600-607` already includes ~40 chars of surrounding template context ("Near ...") — the field report's "no context" claim is partially outdated.
- Still missing: no component/file name, and the throw happens at render time so rarely-rendered branches fail late.
- From external 7.4.0 field report; verified against source (partially outdated claim).

## Acceptance criteria
- [ ] the thrown error includes the component tag/class when known
- [ ] test asserts the message identifies the host

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source, report claim partially outdated (evidence in Notes).
