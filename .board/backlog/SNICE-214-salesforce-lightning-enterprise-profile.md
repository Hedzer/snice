---
id: SNICE-214
title: "Add a Salesforce Lightning enterprise profile"
epic: platform-themes
priority: 214
created: 2026-08-12
deps: [SNICE-200, SNICE-201, SNICE-202, SNICE-216]
---

## Goal

Implement `theme="lightning" platform="salesforce"` for Salesforce-adjacent applications, portals, embedded experiences, and integration products.

## Notes

The target is the current generally available Salesforce Lightning Design System 2, not a legacy SLDS 1 snapshot. This is an ecosystem compatibility profile and does not imply that Snice elements become Lightning Web Components.

This is a conditional portfolio profile. Full implementation starts only after SNICE-216 records a theme-specific `GO`; a high-cost result returns this story to product ROI review without weakening its fidelity requirements.

Official references: https://www.salesforce.com/design/ and https://developer.salesforce.com/docs/platform/lwc/guide/create-components-css-slds1-slds2.html

## Acceptance criteria

- [ ] SNICE-216 records a `GO` for Lightning within the approved product, runtime, testing, and maintenance cost envelopes.
- [ ] The profile pins a supported SLDS 2 release and has a complete element-equivalence/fallback map.
- [ ] App chrome, records, lists, forms, tables, cards, actions, utility surfaces, notifications, flows, dialogs, and dense CRM workflows match approved Lightning references.
- [ ] SLDS 2 color, typography, spacing, shape, icon metrics, states, motion, light/dark behavior, accessibility, and responsive compositions are covered.
- [ ] Keyboard-heavy data work, validation, localization, long records, dense layouts, and assistive-technology behavior receive production fixtures.
- [ ] All released Snice elements receive direct, composite, or guideline-derived treatment and pass the common conformance harness.
- [ ] Licensing, trademarks, compatibility claims, and the boundary between visual compatibility and Salesforce runtime integration receive legal and product review.

## Worklog

- 2026-08-12: Added current SLDS 2 as a high-value enterprise ecosystem profile.
- 2026-08-12: Made full implementation conditional on its measured marginal theme cost.
