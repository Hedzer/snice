# Windows 11 Fluent 2 / WinUI 3 — Full 134-Component Equivalence & Provenance Ledger

- **Platform ID**: `windows`
- **Pinned Contemporary Spec**: Windows 11 Fluent 2 / WinUI 3 (`https://fluent2.microsoft.design/` and `https://learn.microsoft.com/en-us/windows/apps/design/`)
- **Verified Date**: `2026-08-20`
- **Font / Trademark / Asset Provenance**: System font stack (`"Segoe UI Variable Text", "Segoe UI Variable", "Segoe UI", system-ui, sans-serif`) only. Zero proprietary font or icon binary redistribution.
- **Browser-Imposed Limits**: OS-private desktop wallpaper Mica sampling and WinUI compositor Reveal lighting are unavailable in browsers; deterministic subtle brand-tinted Mica/Mica Alt surface hierarchy, transient Acrylic `backdrop-filter` on flyouts/menus/popovers, 1px top-lit elevation strokes, bottom-accent input borders, keyboard-only dual-stroke focus visuals, and first-class `forced-colors` support provide full browser-expressible parity.

## Full Released Catalog Classification (134 Components)

| Component | Classification | Treatment Layer |
|---|---|---|
| `snice-accordion` | `composite` | Layer 1 tokens + colocated `accordion/windows.css` |
| `snice-action-bar` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-activity-feed` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-alert` | `direct-analogue` | Layer 1 tokens + colocated `alert/windows.css` |
| `snice-app-tiles` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-approval-flow` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-audio-recorder` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-availability` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-avatar` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-avatar-group` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-badge` | `direct-analogue` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-banner` | `direct-analogue` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-binpack` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-book` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-booking` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-breadcrumbs` | `composite` | Layer 1 tokens + colocated `breadcrumbs/windows.css` |
| `snice-button` | `direct-analogue` | Layer 1 tokens + colocated `button/windows.css` |
| `snice-calendar` | `non-native-guideline` | Layer 1 tokens + colocated `calendar/windows.css` |
| `snice-camera` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-camera-annotate` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-candlestick` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-card` | `composite` | Layer 1 tokens + colocated `card/windows.css` |
| `snice-carousel` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-cart` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-chart` | `non-native-guideline` | Layer 1 tokens + colocated `chart/windows.css` |
| `snice-chat` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-checkbox` | `direct-analogue` | Layer 1 tokens + colocated `checkbox/windows.css` |
| `snice-chip` | `direct-analogue` | Layer 1 tokens + colocated `chip/windows.css` |
| `snice-code-block` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-color-display` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-color-picker` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-command-palette` | `composite` | Layer 1 tokens + colocated `command-palette/windows.css` |
| `snice-comments` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-countdown` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-cropper` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-data-card` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-date-picker` | `composite` | Layer 1 tokens + colocated `date-picker/windows.css` |
| `snice-date-range-picker` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-date-time-picker` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-diff` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-divider` | `direct-analogue` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-doc` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-draw` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-drawer` | `direct-analogue` | Layer 1 tokens + colocated `drawer/windows.css` |
| `snice-empty-state` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-estimate` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-file-gallery` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-file-upload` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-flip-card` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-flow` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-form-layout` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-funnel` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-gantt` | `non-native-guideline` | Layer 1 tokens + colocated `gantt/windows.css` |
| `snice-gauge` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-grid` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-heatmap` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-image` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-input` | `direct-analogue` | Layer 1 tokens + colocated `input/windows.css` |
| `snice-invoice` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-kanban` | `non-native-guideline` | Layer 1 tokens + colocated `kanban/windows.css` |
| `snice-key-value` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-kpi` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-layout` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-leaderboard` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-link` | `direct-analogue` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-link-preview` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-list` | `direct-analogue` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-location` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-login` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-map` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-markdown` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-masonry` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-menu` | `direct-analogue` | Layer 1 tokens + colocated `menu/windows.css` |
| `snice-message-strip` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-modal` | `direct-analogue` | Layer 1 tokens + colocated `modal/windows.css` |
| `snice-music-player` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-nav` | `direct-analogue` | Layer 1 tokens + colocated `nav/windows.css` |
| `snice-network-graph` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-notification-center` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-order-tracker` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-org-chart` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-pagination` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-paint` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-pdf-viewer` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-permission-matrix` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-podcast-player` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-popover` | `direct-analogue` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-pricing-table` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-product-card` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-progress` | `direct-analogue` | Layer 1 tokens + colocated `progress/windows.css` |
| `snice-progress-ring` | `direct-analogue` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-qr-code` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-qr-reader` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-radio` | `direct-analogue` | Layer 1 tokens + colocated `radio/windows.css` |
| `snice-range-slider` | `direct-analogue` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-rating` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-receipt` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-recipe` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-sankey` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-segmented-control` | `direct-analogue` | Layer 1 tokens + colocated `segmented-control/windows.css` |
| `snice-select` | `direct-analogue` | Layer 1 tokens + colocated `select/windows.css` |
| `snice-skeleton` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-slider` | `direct-analogue` | Layer 1 tokens + colocated `slider/windows.css` |
| `snice-sortable` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-sparkline` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-spinner` | `direct-analogue` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-split-button` | `direct-analogue` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-split-pane` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-spotlight` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-stat-group` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-step-input` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-stepper` | `composite` | Layer 1 tokens + colocated `stepper/windows.css` |
| `snice-switch` | `direct-analogue` | Layer 1 tokens + colocated `switch/windows.css` |
| `snice-table` | `non-native-guideline` | Layer 1 tokens + colocated `table/windows.css` |
| `snice-tabs` | `direct-analogue` | Layer 1 tokens + colocated `tabs/windows.css` |
| `snice-tag` | `direct-analogue` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-tag-input` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-terminal` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-testimonial` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-textarea` | `direct-analogue` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-time-picker` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-time-range-picker` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-timeline` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-timer` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-toast` | `direct-analogue` | Layer 1 tokens + colocated `toast/windows.css` |
| `snice-tooltip` | `direct-analogue` | Layer 1 tokens + colocated `tooltip/windows.css` |
| `snice-tree` | `composite` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-treemap` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-user-card` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-video-player` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-virtual-scroller` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-waterfall` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-weather` | `non-native-guideline` | Layer 1 Fluent 2 / WinUI 3 tokens (`theme/platforms/windows.css`) |
| `snice-work-order` | `non-native-guideline` | Layer 1 tokens + colocated `work-order/windows.css` |
