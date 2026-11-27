# Platform Skins — Per-Component & Per-Platform Story Index (536 Stories)

- **Total Scope**: 134 released Snice components × 4 contemporary platforms (`ios`, `material`, `windows`, `macos`) = **536 individual stories**.
- **Board Directory**: `.local/board/todo/PSC-<comp>-<platform>.md` (moves to `in-progress/` → `done/` as each story is crafted, built, tested, and visually verified in light & dark modes).
- **Fidelity Mandate**: Exact 1:1 native platform style and contemporary behavior across iOS 26+ Liquid Glass, Android Material 3 Expressive, Windows 11 Fluent 2 / WinUI 3, and macOS 26+ Liquid Glass / AppKit.

## Tier 1 — Core Form Actions & Toggles (10 components / 40 stories)

| Component | Classification | iOS 26+ | Material 3 Expressive | Windows 11 Fluent 2 | macOS 26+ |
|---|---|---|---|---|---|
| `snice-button` | `direct-analogue` | `PSC-button-ios` | `PSC-button-material` | `PSC-button-windows` | `PSC-button-macos` |
| `snice-switch` | `direct-analogue` | `PSC-switch-ios` | `PSC-switch-material` | `PSC-switch-windows` | `PSC-switch-macos` |
| `snice-checkbox` | `direct-analogue` | `PSC-checkbox-ios` | `PSC-checkbox-material` | `PSC-checkbox-windows` | `PSC-checkbox-macos` |
| `snice-radio` | `direct-analogue` | `PSC-radio-ios` | `PSC-radio-material` | `PSC-radio-windows` | `PSC-radio-macos` |
| `snice-input` | `direct-analogue` | `PSC-input-ios` | `PSC-input-material` | `PSC-input-windows` | `PSC-input-macos` |
| `snice-textarea` | `direct-analogue` | `PSC-textarea-ios` | `PSC-textarea-material` | `PSC-textarea-windows` | `PSC-textarea-macos` |
| `snice-select` | `direct-analogue` | `PSC-select-ios` | `PSC-select-material` | `PSC-select-windows` | `PSC-select-macos` |
| `snice-slider` | `direct-analogue` | `PSC-slider-ios` | `PSC-slider-material` | `PSC-slider-windows` | `PSC-slider-macos` |
| `snice-range-slider` | `direct-analogue` | `PSC-range-slider-ios` | `PSC-range-slider-material` | `PSC-range-slider-windows` | `PSC-range-slider-macos` |
| `snice-step-input` | `composite` | `PSC-step-input-ios` | `PSC-step-input-material` | `PSC-step-input-windows` | `PSC-step-input-macos` |

## Tier 2 — Navigation & Layout Chrome (10 components / 40 stories)

| Component | Classification | iOS 26+ | Material 3 Expressive | Windows 11 Fluent 2 | macOS 26+ |
|---|---|---|---|---|---|
| `snice-tabs` | `direct-analogue` | `PSC-tabs-ios` | `PSC-tabs-material` | `PSC-tabs-windows` | `PSC-tabs-macos` |
| `snice-segmented-control` | `direct-analogue` | `PSC-segmented-control-ios` | `PSC-segmented-control-material` | `PSC-segmented-control-windows` | `PSC-segmented-control-macos` |
| `snice-nav` | `direct-analogue` | `PSC-nav-ios` | `PSC-nav-material` | `PSC-nav-windows` | `PSC-nav-macos` |
| `snice-breadcrumbs` | `composite` | `PSC-breadcrumbs-ios` | `PSC-breadcrumbs-material` | `PSC-breadcrumbs-windows` | `PSC-breadcrumbs-macos` |
| `snice-pagination` | `composite` | `PSC-pagination-ios` | `PSC-pagination-material` | `PSC-pagination-windows` | `PSC-pagination-macos` |
| `snice-accordion` | `composite` | `PSC-accordion-ios` | `PSC-accordion-material` | `PSC-accordion-windows` | `PSC-accordion-macos` |
| `snice-stepper` | `composite` | `PSC-stepper-ios` | `PSC-stepper-material` | `PSC-stepper-windows` | `PSC-stepper-macos` |
| `snice-link` | `direct-analogue` | `PSC-link-ios` | `PSC-link-material` | `PSC-link-windows` | `PSC-link-macos` |
| `snice-layout` | `composite` | `PSC-layout-ios` | `PSC-layout-material` | `PSC-layout-windows` | `PSC-layout-macos` |
| `snice-split-pane` | `composite` | `PSC-split-pane-ios` | `PSC-split-pane-material` | `PSC-split-pane-windows` | `PSC-split-pane-macos` |

## Tier 3 — Overlays, Menus & Dialogs (9 components / 36 stories)

| Component | Classification | iOS 26+ | Material 3 Expressive | Windows 11 Fluent 2 | macOS 26+ |
|---|---|---|---|---|---|
| `snice-modal` | `direct-analogue` | `PSC-modal-ios` | `PSC-modal-material` | `PSC-modal-windows` | `PSC-modal-macos` |
| `snice-drawer` | `direct-analogue` | `PSC-drawer-ios` | `PSC-drawer-material` | `PSC-drawer-windows` | `PSC-drawer-macos` |
| `snice-menu` | `direct-analogue` | `PSC-menu-ios` | `PSC-menu-material` | `PSC-menu-windows` | `PSC-menu-macos` |
| `snice-popover` | `direct-analogue` | `PSC-popover-ios` | `PSC-popover-material` | `PSC-popover-windows` | `PSC-popover-macos` |
| `snice-tooltip` | `direct-analogue` | `PSC-tooltip-ios` | `PSC-tooltip-material` | `PSC-tooltip-windows` | `PSC-tooltip-macos` |
| `snice-toast` | `direct-analogue` | `PSC-toast-ios` | `PSC-toast-material` | `PSC-toast-windows` | `PSC-toast-macos` |
| `snice-command-palette` | `composite` | `PSC-command-palette-ios` | `PSC-command-palette-material` | `PSC-command-palette-windows` | `PSC-command-palette-macos` |
| `snice-spotlight` | `composite` | `PSC-spotlight-ios` | `PSC-spotlight-material` | `PSC-spotlight-windows` | `PSC-spotlight-macos` |
| `snice-notification-center` | `composite` | `PSC-notification-center-ios` | `PSC-notification-center-material` | `PSC-notification-center-windows` | `PSC-notification-center-macos` |

## Tier 4 — Feedback, Badges, Chips & Actions (11 components / 44 stories)

| Component | Classification | iOS 26+ | Material 3 Expressive | Windows 11 Fluent 2 | macOS 26+ |
|---|---|---|---|---|---|
| `snice-alert` | `direct-analogue` | `PSC-alert-ios` | `PSC-alert-material` | `PSC-alert-windows` | `PSC-alert-macos` |
| `snice-banner` | `direct-analogue` | `PSC-banner-ios` | `PSC-banner-material` | `PSC-banner-windows` | `PSC-banner-macos` |
| `snice-message-strip` | `composite` | `PSC-message-strip-ios` | `PSC-message-strip-material` | `PSC-message-strip-windows` | `PSC-message-strip-macos` |
| `snice-badge` | `direct-analogue` | `PSC-badge-ios` | `PSC-badge-material` | `PSC-badge-windows` | `PSC-badge-macos` |
| `snice-chip` | `direct-analogue` | `PSC-chip-ios` | `PSC-chip-material` | `PSC-chip-windows` | `PSC-chip-macos` |
| `snice-tag` | `direct-analogue` | `PSC-tag-ios` | `PSC-tag-material` | `PSC-tag-windows` | `PSC-tag-macos` |
| `snice-tag-input` | `composite` | `PSC-tag-input-ios` | `PSC-tag-input-material` | `PSC-tag-input-windows` | `PSC-tag-input-macos` |
| `snice-split-button` | `direct-analogue` | `PSC-split-button-ios` | `PSC-split-button-material` | `PSC-split-button-windows` | `PSC-split-button-macos` |
| `snice-action-bar` | `composite` | `PSC-action-bar-ios` | `PSC-action-bar-material` | `PSC-action-bar-windows` | `PSC-action-bar-macos` |
| `snice-progress` | `direct-analogue` | `PSC-progress-ios` | `PSC-progress-material` | `PSC-progress-windows` | `PSC-progress-macos` |
| `snice-progress-ring` | `direct-analogue` | `PSC-progress-ring-ios` | `PSC-progress-ring-material` | `PSC-progress-ring-windows` | `PSC-progress-ring-macos` |

## Tier 5 — Status, Loaders, Avatars & Dividers (9 components / 36 stories)

| Component | Classification | iOS 26+ | Material 3 Expressive | Windows 11 Fluent 2 | macOS 26+ |
|---|---|---|---|---|---|
| `snice-spinner` | `direct-analogue` | `PSC-spinner-ios` | `PSC-spinner-material` | `PSC-spinner-windows` | `PSC-spinner-macos` |
| `snice-skeleton` | `composite` | `PSC-skeleton-ios` | `PSC-skeleton-material` | `PSC-skeleton-windows` | `PSC-skeleton-macos` |
| `snice-avatar` | `composite` | `PSC-avatar-ios` | `PSC-avatar-material` | `PSC-avatar-windows` | `PSC-avatar-macos` |
| `snice-avatar-group` | `composite` | `PSC-avatar-group-ios` | `PSC-avatar-group-material` | `PSC-avatar-group-windows` | `PSC-avatar-group-macos` |
| `snice-divider` | `direct-analogue` | `PSC-divider-ios` | `PSC-divider-material` | `PSC-divider-windows` | `PSC-divider-macos` |
| `snice-empty-state` | `composite` | `PSC-empty-state-ios` | `PSC-empty-state-material` | `PSC-empty-state-windows` | `PSC-empty-state-macos` |
| `snice-countdown` | `non-native-guideline` | `PSC-countdown-ios` | `PSC-countdown-material` | `PSC-countdown-windows` | `PSC-countdown-macos` |
| `snice-timer` | `non-native-guideline` | `PSC-timer-ios` | `PSC-timer-material` | `PSC-timer-windows` | `PSC-timer-macos` |
| `snice-rating` | `composite` | `PSC-rating-ios` | `PSC-rating-material` | `PSC-rating-windows` | `PSC-rating-macos` |

## Tier 6 — Pickers, Uploads & Forms (9 components / 36 stories)

| Component | Classification | iOS 26+ | Material 3 Expressive | Windows 11 Fluent 2 | macOS 26+ |
|---|---|---|---|---|---|
| `snice-date-picker` | `composite` | `PSC-date-picker-ios` | `PSC-date-picker-material` | `PSC-date-picker-windows` | `PSC-date-picker-macos` |
| `snice-date-range-picker` | `composite` | `PSC-date-range-picker-ios` | `PSC-date-range-picker-material` | `PSC-date-range-picker-windows` | `PSC-date-range-picker-macos` |
| `snice-date-time-picker` | `composite` | `PSC-date-time-picker-ios` | `PSC-date-time-picker-material` | `PSC-date-time-picker-windows` | `PSC-date-time-picker-macos` |
| `snice-time-picker` | `composite` | `PSC-time-picker-ios` | `PSC-time-picker-material` | `PSC-time-picker-windows` | `PSC-time-picker-macos` |
| `snice-time-range-picker` | `composite` | `PSC-time-range-picker-ios` | `PSC-time-range-picker-material` | `PSC-time-range-picker-windows` | `PSC-time-range-picker-macos` |
| `snice-color-picker` | `composite` | `PSC-color-picker-ios` | `PSC-color-picker-material` | `PSC-color-picker-windows` | `PSC-color-picker-macos` |
| `snice-color-display` | `composite` | `PSC-color-display-ios` | `PSC-color-display-material` | `PSC-color-display-windows` | `PSC-color-display-macos` |
| `snice-file-upload` | `composite` | `PSC-file-upload-ios` | `PSC-file-upload-material` | `PSC-file-upload-windows` | `PSC-file-upload-macos` |
| `snice-form-layout` | `composite` | `PSC-form-layout-ios` | `PSC-form-layout-material` | `PSC-form-layout-windows` | `PSC-form-layout-macos` |

## Tier 7 — Cards, Lists, Trees & Tables (10 components / 40 stories)

| Component | Classification | iOS 26+ | Material 3 Expressive | Windows 11 Fluent 2 | macOS 26+ |
|---|---|---|---|---|---|
| `snice-card` | `composite` | `PSC-card-ios` | `PSC-card-material` | `PSC-card-windows` | `PSC-card-macos` |
| `snice-list` | `direct-analogue` | `PSC-list-ios` | `PSC-list-material` | `PSC-list-windows` | `PSC-list-macos` |
| `snice-tree` | `composite` | `PSC-tree-ios` | `PSC-tree-material` | `PSC-tree-windows` | `PSC-tree-macos` |
| `snice-table` | `non-native-guideline` | `PSC-table-ios` | `PSC-table-material` | `PSC-table-windows` | `PSC-table-macos` |
| `snice-data-card` | `non-native-guideline` | `PSC-data-card-ios` | `PSC-data-card-material` | `PSC-data-card-windows` | `PSC-data-card-macos` |
| `snice-key-value` | `composite` | `PSC-key-value-ios` | `PSC-key-value-material` | `PSC-key-value-windows` | `PSC-key-value-macos` |
| `snice-kpi` | `non-native-guideline` | `PSC-kpi-ios` | `PSC-kpi-material` | `PSC-kpi-windows` | `PSC-kpi-macos` |
| `snice-stat-group` | `non-native-guideline` | `PSC-stat-group-ios` | `PSC-stat-group-material` | `PSC-stat-group-windows` | `PSC-stat-group-macos` |
| `snice-timeline` | `non-native-guideline` | `PSC-timeline-ios` | `PSC-timeline-material` | `PSC-timeline-windows` | `PSC-timeline-macos` |
| `snice-virtual-scroller` | `non-native-guideline` | `PSC-virtual-scroller-ios` | `PSC-virtual-scroller-material` | `PSC-virtual-scroller-windows` | `PSC-virtual-scroller-macos` |

## Tier 8 — Auth, People & Social (9 components / 36 stories)

| Component | Classification | iOS 26+ | Material 3 Expressive | Windows 11 Fluent 2 | macOS 26+ |
|---|---|---|---|---|---|
| `snice-login` | `composite` | `PSC-login-ios` | `PSC-login-material` | `PSC-login-windows` | `PSC-login-macos` |
| `snice-user-card` | `non-native-guideline` | `PSC-user-card-ios` | `PSC-user-card-material` | `PSC-user-card-windows` | `PSC-user-card-macos` |
| `snice-comments` | `non-native-guideline` | `PSC-comments-ios` | `PSC-comments-material` | `PSC-comments-windows` | `PSC-comments-macos` |
| `snice-chat` | `non-native-guideline` | `PSC-chat-ios` | `PSC-chat-material` | `PSC-chat-windows` | `PSC-chat-macos` |
| `snice-activity-feed` | `non-native-guideline` | `PSC-activity-feed-ios` | `PSC-activity-feed-material` | `PSC-activity-feed-windows` | `PSC-activity-feed-macos` |
| `snice-testimonial` | `non-native-guideline` | `PSC-testimonial-ios` | `PSC-testimonial-material` | `PSC-testimonial-windows` | `PSC-testimonial-macos` |
| `snice-leaderboard` | `non-native-guideline` | `PSC-leaderboard-ios` | `PSC-leaderboard-material` | `PSC-leaderboard-windows` | `PSC-leaderboard-macos` |
| `snice-org-chart` | `non-native-guideline` | `PSC-org-chart-ios` | `PSC-org-chart-material` | `PSC-org-chart-windows` | `PSC-org-chart-macos` |
| `snice-approval-flow` | `non-native-guideline` | `PSC-approval-flow-ios` | `PSC-approval-flow-material` | `PSC-approval-flow-windows` | `PSC-approval-flow-macos` |

## Tier 9 — Commerce & Business Documents (10 components / 40 stories)

| Component | Classification | iOS 26+ | Material 3 Expressive | Windows 11 Fluent 2 | macOS 26+ |
|---|---|---|---|---|---|
| `snice-cart` | `non-native-guideline` | `PSC-cart-ios` | `PSC-cart-material` | `PSC-cart-windows` | `PSC-cart-macos` |
| `snice-product-card` | `non-native-guideline` | `PSC-product-card-ios` | `PSC-product-card-material` | `PSC-product-card-windows` | `PSC-product-card-macos` |
| `snice-pricing-table` | `non-native-guideline` | `PSC-pricing-table-ios` | `PSC-pricing-table-material` | `PSC-pricing-table-windows` | `PSC-pricing-table-macos` |
| `snice-invoice` | `non-native-guideline` | `PSC-invoice-ios` | `PSC-invoice-material` | `PSC-invoice-windows` | `PSC-invoice-macos` |
| `snice-estimate` | `non-native-guideline` | `PSC-estimate-ios` | `PSC-estimate-material` | `PSC-estimate-windows` | `PSC-estimate-macos` |
| `snice-receipt` | `non-native-guideline` | `PSC-receipt-ios` | `PSC-receipt-material` | `PSC-receipt-windows` | `PSC-receipt-macos` |
| `snice-order-tracker` | `non-native-guideline` | `PSC-order-tracker-ios` | `PSC-order-tracker-material` | `PSC-order-tracker-windows` | `PSC-order-tracker-macos` |
| `snice-work-order` | `non-native-guideline` | `PSC-work-order-ios` | `PSC-work-order-material` | `PSC-work-order-windows` | `PSC-work-order-macos` |
| `snice-booking` | `non-native-guideline` | `PSC-booking-ios` | `PSC-booking-material` | `PSC-booking-windows` | `PSC-booking-macos` |
| `snice-availability` | `non-native-guideline` | `PSC-availability-ios` | `PSC-availability-material` | `PSC-availability-windows` | `PSC-availability-macos` |

## Tier 10 — Planning, Boards & Spatial Grids (9 components / 36 stories)

| Component | Classification | iOS 26+ | Material 3 Expressive | Windows 11 Fluent 2 | macOS 26+ |
|---|---|---|---|---|---|
| `snice-calendar` | `non-native-guideline` | `PSC-calendar-ios` | `PSC-calendar-material` | `PSC-calendar-windows` | `PSC-calendar-macos` |
| `snice-kanban` | `non-native-guideline` | `PSC-kanban-ios` | `PSC-kanban-material` | `PSC-kanban-windows` | `PSC-kanban-macos` |
| `snice-gantt` | `non-native-guideline` | `PSC-gantt-ios` | `PSC-gantt-material` | `PSC-gantt-windows` | `PSC-gantt-macos` |
| `snice-grid` | `non-native-guideline` | `PSC-grid-ios` | `PSC-grid-material` | `PSC-grid-windows` | `PSC-grid-macos` |
| `snice-masonry` | `non-native-guideline` | `PSC-masonry-ios` | `PSC-masonry-material` | `PSC-masonry-windows` | `PSC-masonry-macos` |
| `snice-binpack` | `non-native-guideline` | `PSC-binpack-ios` | `PSC-binpack-material` | `PSC-binpack-windows` | `PSC-binpack-macos` |
| `snice-sortable` | `non-native-guideline` | `PSC-sortable-ios` | `PSC-sortable-material` | `PSC-sortable-windows` | `PSC-sortable-macos` |
| `snice-permission-matrix` | `non-native-guideline` | `PSC-permission-matrix-ios` | `PSC-permission-matrix-material` | `PSC-permission-matrix-windows` | `PSC-permission-matrix-macos` |
| `snice-app-tiles` | `non-native-guideline` | `PSC-app-tiles-ios` | `PSC-app-tiles-material` | `PSC-app-tiles-windows` | `PSC-app-tiles-macos` |

## Tier 11 — Charts & Data Visualization (10 components / 40 stories)

| Component | Classification | iOS 26+ | Material 3 Expressive | Windows 11 Fluent 2 | macOS 26+ |
|---|---|---|---|---|---|
| `snice-chart` | `non-native-guideline` | `PSC-chart-ios` | `PSC-chart-material` | `PSC-chart-windows` | `PSC-chart-macos` |
| `snice-sparkline` | `non-native-guideline` | `PSC-sparkline-ios` | `PSC-sparkline-material` | `PSC-sparkline-windows` | `PSC-sparkline-macos` |
| `snice-candlestick` | `non-native-guideline` | `PSC-candlestick-ios` | `PSC-candlestick-material` | `PSC-candlestick-windows` | `PSC-candlestick-macos` |
| `snice-funnel` | `non-native-guideline` | `PSC-funnel-ios` | `PSC-funnel-material` | `PSC-funnel-windows` | `PSC-funnel-macos` |
| `snice-gauge` | `non-native-guideline` | `PSC-gauge-ios` | `PSC-gauge-material` | `PSC-gauge-windows` | `PSC-gauge-macos` |
| `snice-heatmap` | `non-native-guideline` | `PSC-heatmap-ios` | `PSC-heatmap-material` | `PSC-heatmap-windows` | `PSC-heatmap-macos` |
| `snice-network-graph` | `non-native-guideline` | `PSC-network-graph-ios` | `PSC-network-graph-material` | `PSC-network-graph-windows` | `PSC-network-graph-macos` |
| `snice-sankey` | `non-native-guideline` | `PSC-sankey-ios` | `PSC-sankey-material` | `PSC-sankey-windows` | `PSC-sankey-macos` |
| `snice-treemap` | `non-native-guideline` | `PSC-treemap-ios` | `PSC-treemap-material` | `PSC-treemap-windows` | `PSC-treemap-macos` |
| `snice-waterfall` | `non-native-guideline` | `PSC-waterfall-ios` | `PSC-waterfall-material` | `PSC-waterfall-windows` | `PSC-waterfall-macos` |

## Tier 12 — Media, Audio, Video & Camera (9 components / 36 stories)

| Component | Classification | iOS 26+ | Material 3 Expressive | Windows 11 Fluent 2 | macOS 26+ |
|---|---|---|---|---|---|
| `snice-image` | `composite` | `PSC-image-ios` | `PSC-image-material` | `PSC-image-windows` | `PSC-image-macos` |
| `snice-carousel` | `composite` | `PSC-carousel-ios` | `PSC-carousel-material` | `PSC-carousel-windows` | `PSC-carousel-macos` |
| `snice-file-gallery` | `non-native-guideline` | `PSC-file-gallery-ios` | `PSC-file-gallery-material` | `PSC-file-gallery-windows` | `PSC-file-gallery-macos` |
| `snice-music-player` | `non-native-guideline` | `PSC-music-player-ios` | `PSC-music-player-material` | `PSC-music-player-windows` | `PSC-music-player-macos` |
| `snice-podcast-player` | `non-native-guideline` | `PSC-podcast-player-ios` | `PSC-podcast-player-material` | `PSC-podcast-player-windows` | `PSC-podcast-player-macos` |
| `snice-video-player` | `non-native-guideline` | `PSC-video-player-ios` | `PSC-video-player-material` | `PSC-video-player-windows` | `PSC-video-player-macos` |
| `snice-audio-recorder` | `non-native-guideline` | `PSC-audio-recorder-ios` | `PSC-audio-recorder-material` | `PSC-audio-recorder-windows` | `PSC-audio-recorder-macos` |
| `snice-camera` | `non-native-guideline` | `PSC-camera-ios` | `PSC-camera-material` | `PSC-camera-windows` | `PSC-camera-macos` |
| `snice-camera-annotate` | `non-native-guideline` | `PSC-camera-annotate-ios` | `PSC-camera-annotate-material` | `PSC-camera-annotate-windows` | `PSC-camera-annotate-macos` |

## Tier 13 — Editors, Code, Docs & Canvas (10 components / 40 stories)

| Component | Classification | iOS 26+ | Material 3 Expressive | Windows 11 Fluent 2 | macOS 26+ |
|---|---|---|---|---|---|
| `snice-code-block` | `non-native-guideline` | `PSC-code-block-ios` | `PSC-code-block-material` | `PSC-code-block-windows` | `PSC-code-block-macos` |
| `snice-diff` | `non-native-guideline` | `PSC-diff-ios` | `PSC-diff-material` | `PSC-diff-windows` | `PSC-diff-macos` |
| `snice-markdown` | `non-native-guideline` | `PSC-markdown-ios` | `PSC-markdown-material` | `PSC-markdown-windows` | `PSC-markdown-macos` |
| `snice-terminal` | `non-native-guideline` | `PSC-terminal-ios` | `PSC-terminal-material` | `PSC-terminal-windows` | `PSC-terminal-macos` |
| `snice-doc` | `non-native-guideline` | `PSC-doc-ios` | `PSC-doc-material` | `PSC-doc-windows` | `PSC-doc-macos` |
| `snice-pdf-viewer` | `non-native-guideline` | `PSC-pdf-viewer-ios` | `PSC-pdf-viewer-material` | `PSC-pdf-viewer-windows` | `PSC-pdf-viewer-macos` |
| `snice-draw` | `non-native-guideline` | `PSC-draw-ios` | `PSC-draw-material` | `PSC-draw-windows` | `PSC-draw-macos` |
| `snice-paint` | `non-native-guideline` | `PSC-paint-ios` | `PSC-paint-material` | `PSC-paint-windows` | `PSC-paint-macos` |
| `snice-cropper` | `non-native-guideline` | `PSC-cropper-ios` | `PSC-cropper-material` | `PSC-cropper-windows` | `PSC-cropper-macos` |
| `snice-flow` | `non-native-guideline` | `PSC-flow-ios` | `PSC-flow-material` | `PSC-flow-windows` | `PSC-flow-macos` |

## Tier 14 — Specialty & Utilities (9 components / 36 stories)

| Component | Classification | iOS 26+ | Material 3 Expressive | Windows 11 Fluent 2 | macOS 26+ |
|---|---|---|---|---|---|
| `snice-book` | `non-native-guideline` | `PSC-book-ios` | `PSC-book-material` | `PSC-book-windows` | `PSC-book-macos` |
| `snice-flip-card` | `non-native-guideline` | `PSC-flip-card-ios` | `PSC-flip-card-material` | `PSC-flip-card-windows` | `PSC-flip-card-macos` |
| `snice-link-preview` | `non-native-guideline` | `PSC-link-preview-ios` | `PSC-link-preview-material` | `PSC-link-preview-windows` | `PSC-link-preview-macos` |
| `snice-location` | `non-native-guideline` | `PSC-location-ios` | `PSC-location-material` | `PSC-location-windows` | `PSC-location-macos` |
| `snice-map` | `non-native-guideline` | `PSC-map-ios` | `PSC-map-material` | `PSC-map-windows` | `PSC-map-macos` |
| `snice-qr-code` | `non-native-guideline` | `PSC-qr-code-ios` | `PSC-qr-code-material` | `PSC-qr-code-windows` | `PSC-qr-code-macos` |
| `snice-qr-reader` | `non-native-guideline` | `PSC-qr-reader-ios` | `PSC-qr-reader-material` | `PSC-qr-reader-windows` | `PSC-qr-reader-macos` |
| `snice-recipe` | `non-native-guideline` | `PSC-recipe-ios` | `PSC-recipe-material` | `PSC-recipe-windows` | `PSC-recipe-macos` |
| `snice-weather` | `non-native-guideline` | `PSC-weather-ios` | `PSC-weather-material` | `PSC-weather-windows` | `PSC-weather-macos` |
