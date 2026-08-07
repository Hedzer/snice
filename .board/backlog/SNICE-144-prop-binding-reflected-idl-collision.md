---
id: SNICE-144
title: "guard .prop bindings against reflected IDL attribute collisions"
epic: rendering
priority: 144
created: 2026-08-07
deps: []
---

## Goal
Warn (dev mode or lint) when a `.prop` binding targets a known reflected ARIA/IDL attribute with a non-string value, so objects are not stringified into content attributes like `role="[object Object]"`.

## Notes
- `commitPropertyValue` (`packages/core/src/parts.ts:38-41`) assigns `element[name] = value`; for names colliding with reflected ARIA/IDL attributes (e.g. `role`) the object is stringified into the content attribute.
- Result: `.role=${obj}` yields `getAttribute('role') === '[object Object]'` and `element.role === null`, corrupting accessibility.
- Pre-upgrade parking exists (:44-54) but post-upgrade assignments hit the IDL setter.
- Confirmed behavior from external 7.4.0 field report; verified against source.

## Acceptance criteria
- [ ] dev-mode warning (or lint rule) fires when a `.prop` binding targets a known reflected IDL attribute with a non-string value
- [ ] the warning names the property
- [ ] test proves the diagnostic fires

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
