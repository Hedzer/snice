---
id: SNICE-213
title: "Add an SAP Fiori Horizon enterprise profile"
epic: platform-themes
priority: 213
created: 2026-08-12
deps: [SNICE-200, SNICE-201, SNICE-202, SNICE-216]
---

## Goal

Implement `theme="horizon" platform="sap"` for teams building SAP-adjacent business applications and extensions.

## Notes

SAP identifies Horizon as the current standard visual theme for Fiori applications. This is a product-ecosystem profile rather than an operating-system profile, but it addresses high-budget enterprise software where visual integration has direct procurement value.

This is a conditional portfolio profile. Full implementation starts only after SNICE-216 records a theme-specific `GO`; a high-cost result returns this story to product ROI review without weakening its fidelity requirements.

Official reference: https://www.sap.com/design-system/fiori-design-web/

## Acceptance criteria

- [ ] SNICE-216 records a `GO` for Horizon within the approved product, runtime, testing, and maintenance cost envelopes.
- [ ] The profile pins a supported SAP Fiori/Horizon version and has a complete element-equivalence/fallback map.
- [ ] Shell, navigation, worklist, object-page, table, form, analytical, approval, notification, dialog, and dense business-workflow patterns match approved Horizon references.
- [ ] Morning/Evening Horizon and required high-contrast modes have explicit scope, naming, and conformance coverage.
- [ ] Keyboard-heavy workflows, localization, RTL, long enterprise data, compact density, validation, accessibility, and responsive behavior match Fiori guidance.
- [ ] All released Snice elements receive direct, composite, or guideline-derived treatment and pass the common conformance harness.
- [ ] Licensing, trademarks, compatibility claims, and the boundary between visual compatibility and actual SAP runtime integration receive legal and product review.

## Worklog

- 2026-08-12: Added SAP Horizon as the strongest specialized enterprise-suite opportunity after Fluent.
- 2026-08-12: Made full implementation conditional on its measured marginal theme cost.
