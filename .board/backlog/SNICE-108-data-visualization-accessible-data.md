---
id: SNICE-108
title: "add accessible data channels to visualizations"
epic: accessibility
priority: 108
created: 2026-07-14
deps: []
---

## Goal
Ensure charts and data visualizations communicate their data, trends, and interactive state beyond pixels and color.

## Notes
- Audit found generic labels without a consistent meaningful description, summary, or optional tabular data channel.
- Affected family includes chart, candlestick, waterfall, sankey, treemap, network-graph, org-chart, Gantt, and related visualizations.

## Acceptance criteria
- [ ] each visualization defines a meaningful name/description and a machine-readable summary or data-table alternative appropriate to its model
- [ ] interactive points/series have keyboard navigation and non-color state cues where accepted
- [ ] browser accessibility tests cover screen-readable output, hidden/changed series, empty/error data, forced colors, and high contrast

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
