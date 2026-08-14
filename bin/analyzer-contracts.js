// GENERATED FILE — DO NOT EDIT.
// Source: tooling/generators/generate-analyzer-contracts.js
// Rebuild: node tooling/generators/generate-analyzer-contracts.js

export const ANALYZER_CONTRACTS = {
  "schemaVersion": 1,
  "generatedFrom": [
    "custom-elements.json",
    "packages/core/src/index.ts",
    "packages/core/src/types/*.ts",
    "adapters/react/index.d.ts",
    "adapters/react/components.ts",
    "adapters/react/*.tsx",
    "packages/components/.wip",
    "packages/components/src/**/*.ts",
    "packages/components/src/**/*.types.ts"
  ],
  "stats": {
    "customElements": 193,
    "componentFamilies": 134,
    "componentModules": 188,
    "componentUtilityModules": 31,
    "reactWrappers": 193,
    "rootExports": 119
  },
  "rootExports": [
    "AdoptedOptions",
    "AppContext",
    "CSSResult",
    "Context",
    "ContextAwareFetcher",
    "ContextOptions",
    "ContextProviderOptions",
    "ControllerClass",
    "CreateRequestHandlerOptions",
    "DaemonMap",
    "DispatchOptions",
    "Duration",
    "ElementOptions",
    "EventTiming",
    "Fetcher",
    "Guard",
    "IController",
    "IS_CONTROLLER_INSTANCE",
    "Layout",
    "MovedOptions",
    "NoChange",
    "Nothing",
    "ObserveOptions",
    "OnOptions",
    "OnScope",
    "PageOptions",
    "PageRouteOptions",
    "PartOptions",
    "Placard",
    "PropertyConverter",
    "PropertyOptions",
    "QueryOptions",
    "RenderOptions",
    "RepeatOptions",
    "RepeatResult",
    "RequestMiddleware",
    "RequestOptions",
    "RequestRoute",
    "RequestRouteMap",
    "RespondOptions",
    "Response",
    "ResponseMiddleware",
    "RouteParams",
    "Router",
    "RouterInstance",
    "RouterOptions",
    "SimpleArray",
    "SniceElement",
    "SniceGlobal",
    "StateOptions",
    "TemplateResult",
    "Transition",
    "TransitionMode",
    "UnsafeHTML",
    "WatchOptions",
    "adopted",
    "applyElementFunctionality",
    "attachController",
    "classMap",
    "clearDebounceTimers",
    "clearMemoizeCache",
    "clearThrottleTimers",
    "context",
    "contextProperty",
    "controller",
    "createRequestHandler",
    "css",
    "daemon",
    "debounce",
    "detachController",
    "dispatch",
    "dispose",
    "element",
    "escapeAttr",
    "escapeHtml",
    "getBodyScrollLockCount",
    "getContext",
    "getContextFetch",
    "getController",
    "getSymbol",
    "html",
    "isSafeUrl",
    "layout",
    "live",
    "lockBodyScroll",
    "memoize",
    "moved",
    "noChange",
    "nothing",
    "observe",
    "on",
    "once",
    "parseDuration",
    "property",
    "provideContext",
    "query",
    "queryAll",
    "ready",
    "reconnect",
    "render",
    "repeat",
    "request",
    "resetOnce",
    "respond",
    "setDisableElementReadyWarnings",
    "setStrictRenderErrors",
    "state",
    "styleMap",
    "styles",
    "svg",
    "throttle",
    "trackRenders",
    "unlockBodyScroll",
    "unsafeHTML",
    "useNativeElementControllers",
    "waitForAllCustomElements",
    "waitForElementDefined",
    "waitForElementReady",
    "watch"
  ],
  "componentModulePaths": [
    "snice/components/accordion/snice-accordion",
    "snice/components/accordion/snice-accordion-item",
    "snice/components/action-bar/snice-action-bar",
    "snice/components/activity-feed/snice-activity-feed",
    "snice/components/activity-feed/snice-activity-item",
    "snice/components/alert/snice-alert",
    "snice/components/app-tiles/snice-app-tiles",
    "snice/components/approval-flow/snice-approval-flow",
    "snice/components/audio-recorder/snice-audio-recorder",
    "snice/components/availability/snice-availability",
    "snice/components/avatar-group/snice-avatar-group",
    "snice/components/avatar/snice-avatar",
    "snice/components/badge/snice-badge",
    "snice/components/banner/snice-banner",
    "snice/components/binpack/snice-binpack",
    "snice/components/book/snice-book",
    "snice/components/booking/snice-booking",
    "snice/components/breadcrumbs/snice-breadcrumbs",
    "snice/components/breadcrumbs/snice-crumb",
    "snice/components/button/snice-button",
    "snice/components/calendar/snice-calendar",
    "snice/components/camera-annotate/snice-camera-annotate",
    "snice/components/camera/snice-camera",
    "snice/components/candlestick/snice-candlestick",
    "snice/components/card/snice-card",
    "snice/components/carousel/snice-carousel",
    "snice/components/cart/snice-cart",
    "snice/components/chart/snice-chart",
    "snice/components/chat/snice-chat",
    "snice/components/chat/snice-chat-message",
    "snice/components/checkbox/snice-checkbox",
    "snice/components/chip/snice-chip",
    "snice/components/code-block/snice-code-block",
    "snice/components/color-display/snice-color-display",
    "snice/components/color-picker/snice-color-picker",
    "snice/components/command-palette/snice-command-palette",
    "snice/components/comments/snice-comments",
    "snice/components/countdown/snice-countdown",
    "snice/components/cropper/snice-cropper",
    "snice/components/data-card/snice-data-card",
    "snice/components/date-picker/snice-date-picker",
    "snice/components/date-range-picker/snice-date-range-picker",
    "snice/components/date-time-picker/snice-date-time-picker",
    "snice/components/diff/snice-diff",
    "snice/components/divider/snice-divider",
    "snice/components/doc/snice-doc",
    "snice/components/draw/snice-draw",
    "snice/components/drawer/snice-drawer",
    "snice/components/drawer/snice-drawer-target",
    "snice/components/empty-state/snice-empty-state",
    "snice/components/estimate/snice-estimate",
    "snice/components/file-gallery/snice-file-gallery",
    "snice/components/file-upload/snice-file-upload",
    "snice/components/flip-card/snice-flip-card",
    "snice/components/flow/snice-flow",
    "snice/components/form-layout/snice-form-layout",
    "snice/components/funnel/snice-funnel",
    "snice/components/gantt/snice-gantt",
    "snice/components/gauge/snice-gauge",
    "snice/components/grid/snice-grid",
    "snice/components/heatmap/snice-heatmap",
    "snice/components/image/snice-image",
    "snice/components/input/snice-input",
    "snice/components/invoice/snice-invoice",
    "snice/components/kanban/snice-kanban",
    "snice/components/key-value/snice-key-value",
    "snice/components/key-value/snice-kv-pair",
    "snice/components/kpi/snice-kpi",
    "snice/components/layout/snice-layout",
    "snice/components/layout/snice-layout-auth-split",
    "snice/components/layout/snice-layout-blog",
    "snice/components/layout/snice-layout-card",
    "snice/components/layout/snice-layout-centered",
    "snice/components/layout/snice-layout-dashboard",
    "snice/components/layout/snice-layout-docs",
    "snice/components/layout/snice-layout-fullscreen",
    "snice/components/layout/snice-layout-landing",
    "snice/components/layout/snice-layout-master-detail",
    "snice/components/layout/snice-layout-minimal",
    "snice/components/layout/snice-layout-sidebar",
    "snice/components/layout/snice-layout-split",
    "snice/components/leaderboard/snice-leaderboard",
    "snice/components/leaderboard/snice-leaderboard-entry",
    "snice/components/link-preview/snice-link-preview",
    "snice/components/link/snice-link",
    "snice/components/list/snice-list",
    "snice/components/list/snice-list-item",
    "snice/components/location/snice-location",
    "snice/components/login/snice-login",
    "snice/components/map/snice-map",
    "snice/components/markdown/snice-markdown",
    "snice/components/masonry/snice-masonry",
    "snice/components/menu/snice-menu",
    "snice/components/menu/snice-menu-divider",
    "snice/components/menu/snice-menu-item",
    "snice/components/message-strip/snice-message-strip",
    "snice/components/modal/snice-modal",
    "snice/components/music-player/snice-music-player",
    "snice/components/nav/snice-nav",
    "snice/components/network-graph/snice-network-graph",
    "snice/components/notification-center/snice-notification-center",
    "snice/components/order-tracker/snice-order-tracker",
    "snice/components/org-chart/snice-org-chart",
    "snice/components/pagination/snice-pagination",
    "snice/components/paint/snice-paint",
    "snice/components/pdf-viewer/snice-pdf-viewer",
    "snice/components/permission-matrix/snice-permission-matrix",
    "snice/components/podcast-player/snice-podcast-player",
    "snice/components/popover/snice-popover",
    "snice/components/pricing-table/snice-pricing-table",
    "snice/components/product-card/snice-product-card",
    "snice/components/progress-ring/snice-progress-ring",
    "snice/components/progress/snice-progress",
    "snice/components/qr-code/snice-qr-code",
    "snice/components/qr-reader/snice-qr-reader",
    "snice/components/radio/snice-radio",
    "snice/components/range-slider/snice-range-slider",
    "snice/components/rating/snice-rating",
    "snice/components/receipt/snice-receipt",
    "snice/components/recipe/snice-recipe",
    "snice/components/sankey/snice-sankey",
    "snice/components/segmented-control/snice-segmented-control",
    "snice/components/select/snice-option",
    "snice/components/select/snice-select",
    "snice/components/skeleton/snice-skeleton",
    "snice/components/slider/snice-slider",
    "snice/components/sortable/snice-sortable",
    "snice/components/sparkline/snice-sparkline",
    "snice/components/spinner/snice-spinner",
    "snice/components/split-button/snice-split-button",
    "snice/components/split-pane/snice-split-pane",
    "snice/components/spotlight/snice-spotlight",
    "snice/components/stat-group/snice-stat-group",
    "snice/components/step-input/snice-step-input",
    "snice/components/stepper/snice-stepper",
    "snice/components/stepper/snice-stepper-panel",
    "snice/components/switch/snice-switch",
    "snice/components/table/snice-cell",
    "snice/components/table/snice-cell-actions",
    "snice/components/table/snice-cell-boolean",
    "snice/components/table/snice-cell-color",
    "snice/components/table/snice-cell-currency",
    "snice/components/table/snice-cell-date",
    "snice/components/table/snice-cell-duration",
    "snice/components/table/snice-cell-email",
    "snice/components/table/snice-cell-filesize",
    "snice/components/table/snice-cell-image",
    "snice/components/table/snice-cell-json",
    "snice/components/table/snice-cell-link",
    "snice/components/table/snice-cell-location",
    "snice/components/table/snice-cell-number",
    "snice/components/table/snice-cell-percentage",
    "snice/components/table/snice-cell-phone",
    "snice/components/table/snice-cell-progress",
    "snice/components/table/snice-cell-rating",
    "snice/components/table/snice-cell-sparkline",
    "snice/components/table/snice-cell-status",
    "snice/components/table/snice-cell-tag",
    "snice/components/table/snice-cell-text",
    "snice/components/table/snice-column",
    "snice/components/table/snice-header",
    "snice/components/table/snice-progress",
    "snice/components/table/snice-row",
    "snice/components/table/snice-table",
    "snice/components/tabs/snice-tab",
    "snice/components/tabs/snice-tab-panel",
    "snice/components/tabs/snice-tabs",
    "snice/components/tag-input/snice-tag-input",
    "snice/components/tag/snice-tag",
    "snice/components/terminal/snice-terminal",
    "snice/components/testimonial/snice-testimonial",
    "snice/components/textarea/snice-textarea",
    "snice/components/time-picker/snice-time-picker",
    "snice/components/time-range-picker/snice-time-range-picker",
    "snice/components/timeline/snice-timeline",
    "snice/components/timer/snice-timer",
    "snice/components/toast/snice-toast",
    "snice/components/toast/snice-toast-container",
    "snice/components/tooltip/snice-tooltip",
    "snice/components/tree/snice-tree",
    "snice/components/tree/snice-tree-item",
    "snice/components/treemap/snice-treemap",
    "snice/components/user-card/snice-user-card",
    "snice/components/video-player/snice-video-player",
    "snice/components/virtual-scroller/snice-virtual-scroller",
    "snice/components/waterfall/snice-waterfall",
    "snice/components/weather/snice-weather",
    "snice/components/work-order/snice-work-order"
  ],
  "componentUtilityModulePaths": [
    "snice/components/code-block/formatter",
    "snice/components/code-block/formatters/indent",
    "snice/components/code-block/formatters/json",
    "snice/components/code-block/formatters/prettier",
    "snice/components/code-block/highlighter",
    "snice/components/code-block/highlighters/highlight",
    "snice/components/code-block/highlighters/prism",
    "snice/components/form-control-validity",
    "snice/components/form-label-association",
    "snice/components/icons/index",
    "snice/components/qr-code/qrcode",
    "snice/components/qr-reader/qr-decoder",
    "snice/components/qr-reader/qr-worker",
    "snice/components/symbols",
    "snice/components/table/table-cell-presentation",
    "snice/components/table/table-column-manager",
    "snice/components/table/table-column-menu",
    "snice/components/table/table-editor",
    "snice/components/table/table-export",
    "snice/components/table/table-filter-engine",
    "snice/components/table/table-grouping",
    "snice/components/table/table-keyboard",
    "snice/components/table/table-master-detail",
    "snice/components/table/table-row-dnd",
    "snice/components/table/table-toolbar",
    "snice/components/table/table-tree-data",
    "snice/components/table/table-virtualizer",
    "snice/components/tooltip/tooltip-observer",
    "snice/components/tooltip/tooltip-positioning",
    "snice/components/transitions",
    "snice/components/utils"
  ],
  "componentTypeModulePaths": [
    "snice/components/accordion/snice-accordion.types",
    "snice/components/action-bar/snice-action-bar.types",
    "snice/components/activity-feed/snice-activity-feed.types",
    "snice/components/alert/snice-alert.types",
    "snice/components/app-tiles/snice-app-tiles.types",
    "snice/components/approval-flow/snice-approval-flow.types",
    "snice/components/audio-recorder/snice-audio-recorder.types",
    "snice/components/availability/snice-availability.types",
    "snice/components/avatar-group/snice-avatar-group.types",
    "snice/components/avatar/snice-avatar.types",
    "snice/components/badge/snice-badge.types",
    "snice/components/banner/snice-banner.types",
    "snice/components/binpack/snice-binpack.types",
    "snice/components/book/snice-book.types",
    "snice/components/booking/snice-booking.types",
    "snice/components/breadcrumbs/snice-breadcrumbs.types",
    "snice/components/button/snice-button.types",
    "snice/components/calendar/snice-calendar.types",
    "snice/components/camera-annotate/snice-camera-annotate.types",
    "snice/components/camera/snice-camera.types",
    "snice/components/candlestick/snice-candlestick.types",
    "snice/components/card/snice-card.types",
    "snice/components/carousel/snice-carousel.types",
    "snice/components/cart/snice-cart.types",
    "snice/components/chart/snice-chart.types",
    "snice/components/chat/snice-chat-message.types",
    "snice/components/chat/snice-chat.types",
    "snice/components/checkbox/snice-checkbox.types",
    "snice/components/chip/snice-chip.types",
    "snice/components/code-block/snice-code-block.types",
    "snice/components/color-display/snice-color-display.types",
    "snice/components/color-picker/snice-color-picker.types",
    "snice/components/command-palette/snice-command-palette.types",
    "snice/components/comments/snice-comments.types",
    "snice/components/countdown/snice-countdown.types",
    "snice/components/cropper/snice-cropper.types",
    "snice/components/data-card/snice-data-card.types",
    "snice/components/date-picker/snice-date-picker.types",
    "snice/components/date-range-picker/snice-date-range-picker.types",
    "snice/components/date-time-picker/snice-date-time-picker.types",
    "snice/components/diff/snice-diff.types",
    "snice/components/divider/snice-divider.types",
    "snice/components/doc/snice-doc.types",
    "snice/components/draw/snice-draw.types",
    "snice/components/drawer/snice-drawer.types",
    "snice/components/empty-state/snice-empty-state.types",
    "snice/components/estimate/snice-estimate.types",
    "snice/components/file-gallery/snice-file-gallery.types",
    "snice/components/file-upload/snice-file-upload.types",
    "snice/components/flip-card/snice-flip-card.types",
    "snice/components/flow/snice-flow.types",
    "snice/components/form-layout/snice-form-layout.types",
    "snice/components/funnel/snice-funnel.types",
    "snice/components/gantt/snice-gantt.types",
    "snice/components/gauge/snice-gauge.types",
    "snice/components/grid/snice-grid.types",
    "snice/components/heatmap/snice-heatmap.types",
    "snice/components/image/snice-image.types",
    "snice/components/input/snice-input.types",
    "snice/components/invoice/snice-invoice.types",
    "snice/components/kanban/snice-kanban.types",
    "snice/components/key-value/snice-key-value.types",
    "snice/components/kpi/snice-kpi.types",
    "snice/components/layout/snice-layout.types",
    "snice/components/leaderboard/snice-leaderboard.types",
    "snice/components/link-preview/snice-link-preview.types",
    "snice/components/link/snice-link.types",
    "snice/components/list/snice-list.types",
    "snice/components/location/snice-location.types",
    "snice/components/login/snice-login.types",
    "snice/components/map/snice-map.types",
    "snice/components/markdown/snice-markdown.types",
    "snice/components/masonry/snice-masonry.types",
    "snice/components/menu/snice-menu-item.types",
    "snice/components/menu/snice-menu.types",
    "snice/components/message-strip/snice-message-strip.types",
    "snice/components/modal/snice-modal.types",
    "snice/components/music-player/snice-music-player.types",
    "snice/components/nav/snice-nav.types",
    "snice/components/network-graph/snice-network-graph.types",
    "snice/components/notification-center/snice-notification-center.types",
    "snice/components/order-tracker/snice-order-tracker.types",
    "snice/components/org-chart/snice-org-chart.types",
    "snice/components/pagination/snice-pagination.types",
    "snice/components/paint/snice-paint.types",
    "snice/components/pdf-viewer/snice-pdf-viewer.types",
    "snice/components/permission-matrix/snice-permission-matrix.types",
    "snice/components/podcast-player/snice-podcast-player.types",
    "snice/components/popover/snice-popover.types",
    "snice/components/pricing-table/snice-pricing-table.types",
    "snice/components/product-card/snice-product-card.types",
    "snice/components/progress-ring/snice-progress-ring.types",
    "snice/components/progress/snice-progress.types",
    "snice/components/qr-code/snice-qr-code.types",
    "snice/components/qr-reader/snice-qr-reader.types",
    "snice/components/radio/snice-radio.types",
    "snice/components/range-slider/snice-range-slider.types",
    "snice/components/rating/snice-rating.types",
    "snice/components/receipt/snice-receipt.types",
    "snice/components/recipe/snice-recipe.types",
    "snice/components/sankey/snice-sankey.types",
    "snice/components/segmented-control/snice-segmented-control.types",
    "snice/components/select/snice-option.types",
    "snice/components/select/snice-select.types",
    "snice/components/skeleton/snice-skeleton.types",
    "snice/components/slider/snice-slider.types",
    "snice/components/sortable/snice-sortable.types",
    "snice/components/sparkline/snice-sparkline.types",
    "snice/components/spinner/snice-spinner.types",
    "snice/components/split-button/snice-split-button.types",
    "snice/components/split-pane/snice-split-pane.types",
    "snice/components/spotlight/snice-spotlight.types",
    "snice/components/spreadsheet/snice-spreadsheet.types",
    "snice/components/stat-group/snice-stat-group.types",
    "snice/components/step-input/snice-step-input.types",
    "snice/components/stepper/snice-stepper-panel.types",
    "snice/components/stepper/snice-stepper.types",
    "snice/components/switch/snice-switch.types",
    "snice/components/table/snice-table.types",
    "snice/components/tabs/snice-tabs.types",
    "snice/components/tag-input/snice-tag-input.types",
    "snice/components/tag/snice-tag.types",
    "snice/components/terminal/snice-terminal.types",
    "snice/components/testimonial/snice-testimonial.types",
    "snice/components/textarea/snice-textarea.types",
    "snice/components/time-picker/snice-time-picker.types",
    "snice/components/time-range-picker/snice-time-range-picker.types",
    "snice/components/timeline/snice-timeline.types",
    "snice/components/timer/snice-timer.types",
    "snice/components/toast/snice-toast.types",
    "snice/components/tooltip/snice-tooltip.types",
    "snice/components/tree/snice-tree-item.types",
    "snice/components/tree/snice-tree.types",
    "snice/components/treemap/snice-treemap.types",
    "snice/components/user-card/snice-user-card.types",
    "snice/components/video-player/snice-video-player.types",
    "snice/components/virtual-scroller/snice-virtual-scroller.types",
    "snice/components/waterfall/snice-waterfall.types",
    "snice/components/weather/snice-weather.types",
    "snice/components/work-order/snice-work-order.types"
  ],
  "components": {
    "snice-accordion": {
      "tagName": "snice-accordion",
      "className": "SniceAccordion",
      "modulePath": "snice/components/accordion/snice-accordion",
      "sourceModule": "dist/components/accordion/snice-accordion.js",
      "family": "accordion",
      "attributes": {
        "multiple": {
          "property": "multiple",
          "type": "boolean",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'bordered' | 'elevated'",
          "literals": [
            "bordered",
            "elevated"
          ]
        }
      },
      "properties": {
        "multiple": {
          "type": "boolean",
          "attribute": "multiple",
          "structured": false
        },
        "variant": {
          "type": "'bordered' | 'elevated'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "accordion-close",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "accordion-open",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        ""
      ]
    },
    "snice-accordion-item": {
      "tagName": "snice-accordion-item",
      "className": "SniceAccordionItem",
      "modulePath": "snice/components/accordion/snice-accordion-item",
      "sourceModule": "dist/components/accordion/snice-accordion-item.js",
      "family": "accordion",
      "attributes": {
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "item-id": {
          "property": "itemId",
          "type": "string",
          "literals": []
        },
        "open": {
          "property": "open",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "itemId": {
          "type": "string",
          "attribute": "item-id",
          "structured": false
        },
        "open": {
          "type": "boolean",
          "attribute": "open",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "accordion-item-toggle",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        "",
        "header"
      ]
    },
    "snice-action-bar": {
      "tagName": "snice-action-bar",
      "className": "SniceActionBar",
      "modulePath": "snice/components/action-bar/snice-action-bar",
      "sourceModule": "dist/components/action-bar/snice-action-bar.js",
      "family": "action-bar",
      "attributes": {
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "no-animation": {
          "property": "noAnimation",
          "type": "boolean",
          "literals": []
        },
        "no-escape-dismiss": {
          "property": "noEscapeDismiss",
          "type": "boolean",
          "literals": []
        },
        "open": {
          "property": "open",
          "type": "boolean",
          "literals": []
        },
        "position": {
          "property": "position",
          "type": "'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'",
          "literals": [
            "top",
            "bottom",
            "left",
            "right",
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right"
          ]
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium'",
          "literals": [
            "small",
            "medium"
          ]
        },
        "variant": {
          "property": "variant",
          "type": "'default' | 'pill'",
          "literals": [
            "default",
            "pill"
          ]
        }
      },
      "properties": {
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "noAnimation": {
          "type": "boolean",
          "attribute": "no-animation",
          "structured": false
        },
        "noEscapeDismiss": {
          "type": "boolean",
          "attribute": "no-escape-dismiss",
          "structured": false
        },
        "open": {
          "type": "boolean",
          "attribute": "open",
          "structured": false
        },
        "position": {
          "type": "'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'",
          "attribute": "position",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium'",
          "attribute": "size",
          "structured": false
        },
        "variant": {
          "type": "'default' | 'pill'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "action-bar-close",
          "type": "CustomEvent<ActionBarEventDetail>"
        },
        {
          "name": "action-bar-open",
          "type": "CustomEvent<ActionBarEventDetail>"
        }
      ],
      "slots": [
        ""
      ]
    },
    "snice-activity-feed": {
      "tagName": "snice-activity-feed",
      "className": "SniceActivityFeed",
      "modulePath": "snice/components/activity-feed/snice-activity-feed",
      "sourceModule": "dist/components/activity-feed/snice-activity-feed.js",
      "family": "activity-feed",
      "attributes": {
        "all-label": {
          "property": "allLabel",
          "type": "string",
          "literals": []
        },
        "empty-message": {
          "property": "emptyMessage",
          "type": "string",
          "literals": []
        },
        "filter": {
          "property": "filter",
          "type": "string",
          "literals": []
        },
        "group-by": {
          "property": "groupBy",
          "type": "'none' | 'date'",
          "literals": [
            "none",
            "date"
          ]
        },
        "has-more": {
          "property": "hasMore",
          "type": "boolean",
          "literals": []
        },
        "load-more-label": {
          "property": "loadMoreLabel",
          "type": "string",
          "literals": []
        },
        "refresh-interval": {
          "property": "refreshInterval",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "activities": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "allLabel": {
          "type": "string",
          "attribute": "all-label",
          "structured": false
        },
        "emptyMessage": {
          "type": "string",
          "attribute": "empty-message",
          "structured": false
        },
        "filter": {
          "type": "string",
          "attribute": "filter",
          "structured": false
        },
        "groupBy": {
          "type": "'none' | 'date'",
          "attribute": "group-by",
          "structured": false
        },
        "hasMore": {
          "type": "boolean",
          "attribute": "has-more",
          "structured": false
        },
        "loadMoreLabel": {
          "type": "string",
          "attribute": "load-more-label",
          "structured": false
        },
        "refreshInterval": {
          "type": "number",
          "attribute": "refresh-interval",
          "structured": false
        }
      },
      "structuredProperties": [
        "activities"
      ],
      "events": [
        {
          "name": "activity-click",
          "type": "CustomEvent<ActivityClickDetail>"
        },
        {
          "name": "load-more",
          "type": "CustomEvent<LoadMoreDetail>"
        }
      ],
      "slots": [
        ""
      ]
    },
    "snice-activity-item": {
      "tagName": "snice-activity-item",
      "className": "SniceActivityItem",
      "modulePath": "snice/components/activity-feed/snice-activity-item",
      "sourceModule": "dist/components/activity-feed/snice-activity-item.js",
      "family": "activity-feed",
      "attributes": {
        "action": {
          "property": "action",
          "type": "string",
          "literals": []
        },
        "actor-avatar": {
          "property": "actorAvatar",
          "type": "string",
          "literals": []
        },
        "actor-name": {
          "property": "actorName",
          "type": "string",
          "literals": []
        },
        "icon": {
          "property": "icon",
          "type": "string",
          "literals": []
        },
        "item-id": {
          "property": "itemId",
          "type": "string",
          "literals": []
        },
        "target": {
          "property": "target",
          "type": "string",
          "literals": []
        },
        "timestamp": {
          "property": "timestamp",
          "type": "string",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "action": {
          "type": "string",
          "attribute": "action",
          "structured": false
        },
        "actorAvatar": {
          "type": "string",
          "attribute": "actor-avatar",
          "structured": false
        },
        "actorName": {
          "type": "string",
          "attribute": "actor-name",
          "structured": false
        },
        "icon": {
          "type": "string",
          "attribute": "icon",
          "structured": false
        },
        "itemId": {
          "type": "string",
          "attribute": "item-id",
          "structured": false
        },
        "target": {
          "type": "string",
          "attribute": "target",
          "structured": false
        },
        "timestamp": {
          "type": "string",
          "attribute": "timestamp",
          "structured": false
        },
        "type": {
          "type": "string",
          "attribute": "type",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": []
    },
    "snice-alert": {
      "tagName": "snice-alert",
      "className": "SniceAlert",
      "modulePath": "snice/components/alert/snice-alert",
      "sourceModule": "dist/components/alert/snice-alert.js",
      "family": "alert",
      "attributes": {
        "appearance": {
          "property": "appearance",
          "type": "'filled' | 'accent'",
          "literals": [
            "filled",
            "accent"
          ]
        },
        "dismissible": {
          "property": "dismissible",
          "type": "boolean",
          "literals": []
        },
        "duration": {
          "property": "duration",
          "type": "number",
          "literals": []
        },
        "icon": {
          "property": "icon",
          "type": "string",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "title": {
          "property": "title",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'info' | 'success' | 'warning' | 'error'",
          "literals": [
            "info",
            "success",
            "warning",
            "error"
          ]
        }
      },
      "properties": {
        "appearance": {
          "type": "'filled' | 'accent'",
          "attribute": "appearance",
          "structured": false
        },
        "dismissible": {
          "type": "boolean",
          "attribute": "dismissible",
          "structured": false
        },
        "duration": {
          "type": "number",
          "attribute": "duration",
          "structured": false
        },
        "icon": {
          "type": "string",
          "attribute": "icon",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "title": {
          "type": "string",
          "attribute": "title",
          "structured": false
        },
        "variant": {
          "type": "'info' | 'success' | 'warning' | 'error'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "alert-dismiss",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "alert-hidden",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "alert-shown",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        "",
        "icon"
      ]
    },
    "snice-app-tile": {
      "tagName": "snice-app-tile",
      "className": "SniceAppTile",
      "modulePath": "snice/components/app-tiles/snice-app-tiles",
      "sourceModule": "dist/components/app-tiles/snice-app-tiles.js",
      "family": "app-tiles",
      "attributes": {},
      "properties": {},
      "structuredProperties": [],
      "events": [],
      "slots": [
        ""
      ]
    },
    "snice-app-tiles": {
      "tagName": "snice-app-tiles",
      "className": "SniceAppTiles",
      "modulePath": "snice/components/app-tiles/snice-app-tiles",
      "sourceModule": "dist/components/app-tiles/snice-app-tiles.js",
      "family": "app-tiles",
      "attributes": {
        "columns": {
          "property": "columns",
          "type": "number",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'sm' | 'md' | 'lg' | 'xl' | '2xl'",
          "literals": [
            "sm",
            "md",
            "lg",
            "xl",
            "2xl"
          ]
        },
        "variant": {
          "property": "variant",
          "type": "'grid' | 'list' | 'compact'",
          "literals": [
            "grid",
            "list",
            "compact"
          ]
        }
      },
      "properties": {
        "columns": {
          "type": "number",
          "attribute": "columns",
          "structured": false
        },
        "size": {
          "type": "'sm' | 'md' | 'lg' | 'xl' | '2xl'",
          "attribute": "size",
          "structured": false
        },
        "tiles": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "variant": {
          "type": "'grid' | 'list' | 'compact'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [
        "tiles"
      ],
      "events": [
        {
          "name": "tile-click",
          "type": "CustomEvent<TileClickDetail>"
        }
      ],
      "slots": [
        ""
      ]
    },
    "snice-approval-flow": {
      "tagName": "snice-approval-flow",
      "className": "SniceApprovalFlow",
      "modulePath": "snice/components/approval-flow/snice-approval-flow",
      "sourceModule": "dist/components/approval-flow/snice-approval-flow.js",
      "family": "approval-flow",
      "attributes": {
        "currentstep": {
          "property": "currentStep",
          "type": "string",
          "literals": []
        },
        "orientation": {
          "property": "orientation",
          "type": "'horizontal' | 'vertical'",
          "literals": [
            "horizontal",
            "vertical"
          ]
        }
      },
      "properties": {
        "currentStep": {
          "type": "string",
          "attribute": "currentstep",
          "structured": false
        },
        "orientation": {
          "type": "'horizontal' | 'vertical'",
          "attribute": "orientation",
          "structured": false
        },
        "steps": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        }
      },
      "structuredProperties": [
        "steps"
      ],
      "events": [
        {
          "name": "step-approve",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "step-comment",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "step-reject",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-audio-recorder": {
      "tagName": "snice-audio-recorder",
      "className": "SniceAudioRecorder",
      "modulePath": "snice/components/audio-recorder/snice-audio-recorder",
      "sourceModule": "dist/components/audio-recorder/snice-audio-recorder.js",
      "family": "audio-recorder",
      "attributes": {
        "auto-start": {
          "property": "autoStart",
          "type": "boolean",
          "literals": []
        },
        "bitrate": {
          "property": "bitrate",
          "type": "number",
          "literals": []
        },
        "format": {
          "property": "format",
          "type": "string",
          "literals": []
        },
        "max-duration": {
          "property": "maxDuration",
          "type": "number",
          "literals": []
        },
        "recordedurl": {
          "property": "recordedUrl",
          "type": "string",
          "literals": []
        },
        "show-controls": {
          "property": "showControls",
          "type": "boolean",
          "literals": []
        },
        "show-playback": {
          "property": "showPlayback",
          "type": "boolean",
          "literals": []
        },
        "show-timer": {
          "property": "showTimer",
          "type": "boolean",
          "literals": []
        },
        "show-visualizer": {
          "property": "showVisualizer",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "autoStart": {
          "type": "boolean",
          "attribute": "auto-start",
          "structured": false
        },
        "bitrate": {
          "type": "number",
          "attribute": "bitrate",
          "structured": false
        },
        "format": {
          "type": "string",
          "attribute": "format",
          "structured": false
        },
        "maxDuration": {
          "type": "number",
          "attribute": "max-duration",
          "structured": false
        },
        "recordedUrl": {
          "type": "string",
          "attribute": "recordedurl",
          "structured": false
        },
        "showControls": {
          "type": "boolean",
          "attribute": "show-controls",
          "structured": false
        },
        "showPlayback": {
          "type": "boolean",
          "attribute": "show-playback",
          "structured": false
        },
        "showTimer": {
          "type": "boolean",
          "attribute": "show-timer",
          "structured": false
        },
        "showVisualizer": {
          "type": "boolean",
          "attribute": "show-visualizer",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "recorder-cancel",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "recorder-error",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "recorder-pause",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "recorder-resume",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "recorder-start",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "recorder-stop",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-availability": {
      "tagName": "snice-availability",
      "className": "SniceAvailability",
      "modulePath": "snice/components/availability/snice-availability",
      "sourceModule": "dist/components/availability/snice-availability.js",
      "family": "availability",
      "attributes": {
        "end-hour": {
          "property": "endHour",
          "type": "number",
          "literals": []
        },
        "format": {
          "property": "format",
          "type": "'12h' | '24h'",
          "literals": [
            "12h",
            "24h"
          ]
        },
        "granularity": {
          "property": "granularity",
          "type": "number",
          "literals": []
        },
        "readonly": {
          "property": "readonly",
          "type": "boolean",
          "literals": []
        },
        "start-hour": {
          "property": "startHour",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "endHour": {
          "type": "number",
          "attribute": "end-hour",
          "structured": false
        },
        "format": {
          "type": "'12h' | '24h'",
          "attribute": "format",
          "structured": false
        },
        "granularity": {
          "type": "number",
          "attribute": "granularity",
          "structured": false
        },
        "readonly": {
          "type": "boolean",
          "attribute": "readonly",
          "structured": false
        },
        "startHour": {
          "type": "number",
          "attribute": "start-hour",
          "structured": false
        },
        "value": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        }
      },
      "structuredProperties": [
        "value"
      ],
      "events": [
        {
          "name": "availability-change",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-avatar": {
      "tagName": "snice-avatar",
      "className": "SniceAvatar",
      "modulePath": "snice/components/avatar/snice-avatar",
      "sourceModule": "dist/components/avatar/snice-avatar.js",
      "family": "avatar",
      "attributes": {
        "alt": {
          "property": "alt",
          "type": "string",
          "literals": []
        },
        "fallback-background": {
          "property": "fallbackBackground",
          "type": "string",
          "literals": []
        },
        "fallback-color": {
          "property": "fallbackColor",
          "type": "string",
          "literals": []
        },
        "loading": {
          "property": "loading",
          "type": "'lazy' | 'eager'",
          "literals": [
            "lazy",
            "eager"
          ]
        },
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "shape": {
          "property": "shape",
          "type": "'circle' | 'square' | 'rounded'",
          "literals": [
            "circle",
            "square",
            "rounded"
          ]
        },
        "size": {
          "property": "size",
          "type": "'xs' | 'small' | 'medium' | 'large' | 'xl' | 'xxl'",
          "literals": [
            "xs",
            "small",
            "medium",
            "large",
            "xl",
            "xxl"
          ]
        },
        "src": {
          "property": "src",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "alt": {
          "type": "string",
          "attribute": "alt",
          "structured": false
        },
        "fallbackBackground": {
          "type": "string",
          "attribute": "fallback-background",
          "structured": false
        },
        "fallbackColor": {
          "type": "string",
          "attribute": "fallback-color",
          "structured": false
        },
        "loading": {
          "type": "'lazy' | 'eager'",
          "attribute": "loading",
          "structured": false
        },
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "shape": {
          "type": "'circle' | 'square' | 'rounded'",
          "attribute": "shape",
          "structured": false
        },
        "size": {
          "type": "'xs' | 'small' | 'medium' | 'large' | 'xl' | 'xxl'",
          "attribute": "size",
          "structured": false
        },
        "src": {
          "type": "string",
          "attribute": "src",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": []
    },
    "snice-avatar-group": {
      "tagName": "snice-avatar-group",
      "className": "SniceAvatarGroup",
      "modulePath": "snice/components/avatar-group/snice-avatar-group",
      "sourceModule": "dist/components/avatar-group/snice-avatar-group.js",
      "family": "avatar-group",
      "attributes": {
        "max": {
          "property": "max",
          "type": "number",
          "literals": []
        },
        "overlap": {
          "property": "overlap",
          "type": "number",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        }
      },
      "properties": {
        "avatars": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "max": {
          "type": "number",
          "attribute": "max",
          "structured": false
        },
        "overlap": {
          "type": "number",
          "attribute": "overlap",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        }
      },
      "structuredProperties": [
        "avatars"
      ],
      "events": [
        {
          "name": "avatar-click",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "overflow-click",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        ""
      ]
    },
    "snice-badge": {
      "tagName": "snice-badge",
      "className": "SniceBadge",
      "modulePath": "snice/components/badge/snice-badge",
      "sourceModule": "dist/components/badge/snice-badge.js",
      "family": "badge",
      "attributes": {
        "content": {
          "property": "content",
          "type": "string",
          "literals": []
        },
        "count": {
          "property": "count",
          "type": "number",
          "literals": []
        },
        "dot": {
          "property": "dot",
          "type": "boolean",
          "literals": []
        },
        "inline": {
          "property": "inline",
          "type": "boolean",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "max": {
          "property": "max",
          "type": "number",
          "literals": []
        },
        "offset": {
          "property": "offset",
          "type": "number",
          "literals": []
        },
        "position": {
          "property": "position",
          "type": "'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'",
          "literals": [
            "top-right",
            "top-left",
            "bottom-right",
            "bottom-left"
          ]
        },
        "pulse": {
          "property": "pulse",
          "type": "boolean",
          "literals": []
        },
        "show-zero": {
          "property": "showZero",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "variant": {
          "property": "variant",
          "type": "'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'",
          "literals": [
            "default",
            "primary",
            "success",
            "warning",
            "error",
            "info"
          ]
        }
      },
      "properties": {
        "content": {
          "type": "string",
          "attribute": "content",
          "structured": false
        },
        "count": {
          "type": "number",
          "attribute": "count",
          "structured": false
        },
        "dot": {
          "type": "boolean",
          "attribute": "dot",
          "structured": false
        },
        "inline": {
          "type": "boolean",
          "attribute": "inline",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "max": {
          "type": "number",
          "attribute": "max",
          "structured": false
        },
        "offset": {
          "type": "number",
          "attribute": "offset",
          "structured": false
        },
        "position": {
          "type": "'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'",
          "attribute": "position",
          "structured": false
        },
        "pulse": {
          "type": "boolean",
          "attribute": "pulse",
          "structured": false
        },
        "showZero": {
          "type": "boolean",
          "attribute": "show-zero",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "variant": {
          "type": "'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": [
        ""
      ]
    },
    "snice-banner": {
      "tagName": "snice-banner",
      "className": "SniceBanner",
      "modulePath": "snice/components/banner/snice-banner",
      "sourceModule": "dist/components/banner/snice-banner.js",
      "family": "banner",
      "attributes": {
        "action-text": {
          "property": "actionText",
          "type": "string",
          "literals": []
        },
        "dismissible": {
          "property": "dismissible",
          "type": "boolean",
          "literals": []
        },
        "duration": {
          "property": "duration",
          "type": "number",
          "literals": []
        },
        "icon": {
          "property": "icon",
          "type": "string",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "message": {
          "property": "message",
          "type": "string",
          "literals": []
        },
        "open": {
          "property": "open",
          "type": "boolean",
          "literals": []
        },
        "position": {
          "property": "position",
          "type": "'top' | 'bottom'",
          "literals": [
            "top",
            "bottom"
          ]
        },
        "variant": {
          "property": "variant",
          "type": "'info' | 'success' | 'warning' | 'error'",
          "literals": [
            "info",
            "success",
            "warning",
            "error"
          ]
        }
      },
      "properties": {
        "actionText": {
          "type": "string",
          "attribute": "action-text",
          "structured": false
        },
        "dismissible": {
          "type": "boolean",
          "attribute": "dismissible",
          "structured": false
        },
        "duration": {
          "type": "number",
          "attribute": "duration",
          "structured": false
        },
        "icon": {
          "type": "string",
          "attribute": "icon",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "message": {
          "type": "string",
          "attribute": "message",
          "structured": false
        },
        "open": {
          "type": "boolean",
          "attribute": "open",
          "structured": false
        },
        "position": {
          "type": "'top' | 'bottom'",
          "attribute": "position",
          "structured": false
        },
        "variant": {
          "type": "'info' | 'success' | 'warning' | 'error'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "banner-action",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "banner-close",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "banner-open",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        "",
        "icon"
      ]
    },
    "snice-binpack": {
      "tagName": "snice-binpack",
      "className": "SniceBinpack",
      "modulePath": "snice/components/binpack/snice-binpack",
      "sourceModule": "dist/components/binpack/snice-binpack.js",
      "family": "binpack",
      "attributes": {
        "column-width": {
          "property": "columnWidth",
          "type": "number",
          "literals": []
        },
        "drag-throttle": {
          "property": "dragThrottle",
          "type": "number",
          "literals": []
        },
        "draggable": {
          "property": "draggable",
          "type": "boolean",
          "literals": []
        },
        "gap": {
          "property": "gap",
          "type": "string",
          "literals": []
        },
        "horizontal": {
          "property": "horizontal",
          "type": "boolean",
          "literals": []
        },
        "origin-left": {
          "property": "originLeft",
          "type": "boolean",
          "literals": []
        },
        "origin-top": {
          "property": "originTop",
          "type": "boolean",
          "literals": []
        },
        "resize": {
          "property": "resize",
          "type": "boolean",
          "literals": []
        },
        "row-height": {
          "property": "rowHeight",
          "type": "number",
          "literals": []
        },
        "stagger": {
          "property": "stagger",
          "type": "number",
          "literals": []
        },
        "transition-duration": {
          "property": "transitionDuration",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "columnWidth": {
          "type": "number",
          "attribute": "column-width",
          "structured": false
        },
        "draggable": {
          "type": "boolean",
          "attribute": "draggable",
          "structured": false
        },
        "dragThrottle": {
          "type": "number",
          "attribute": "drag-throttle",
          "structured": false
        },
        "gap": {
          "type": "string",
          "attribute": "gap",
          "structured": false
        },
        "horizontal": {
          "type": "boolean",
          "attribute": "horizontal",
          "structured": false
        },
        "originLeft": {
          "type": "boolean",
          "attribute": "origin-left",
          "structured": false
        },
        "originTop": {
          "type": "boolean",
          "attribute": "origin-top",
          "structured": false
        },
        "resize": {
          "type": "boolean",
          "attribute": "resize",
          "structured": false
        },
        "rowHeight": {
          "type": "number",
          "attribute": "row-height",
          "structured": false
        },
        "stagger": {
          "type": "number",
          "attribute": "stagger",
          "structured": false
        },
        "transitionDuration": {
          "type": "string",
          "attribute": "transition-duration",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "binpack-drag-item-positioned",
          "type": "CustomEvent<BinpackDragItemPositionedDetail>"
        },
        {
          "name": "binpack-fit-complete",
          "type": "CustomEvent<BinpackFitCompleteDetail>"
        },
        {
          "name": "binpack-layout-complete",
          "type": "CustomEvent<BinpackLayoutCompleteDetail>"
        }
      ],
      "slots": [
        ""
      ]
    },
    "snice-book": {
      "tagName": "snice-book",
      "className": "SniceBook",
      "modulePath": "snice/components/book/snice-book",
      "sourceModule": "dist/components/book/snice-book.js",
      "family": "book",
      "attributes": {
        "author": {
          "property": "author",
          "type": "string",
          "literals": []
        },
        "cover-image": {
          "property": "coverImage",
          "type": "string",
          "literals": []
        },
        "current-page": {
          "property": "currentPage",
          "type": "number",
          "literals": []
        },
        "title": {
          "property": "title",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "author": {
          "type": "string",
          "attribute": "author",
          "structured": false
        },
        "coverImage": {
          "type": "string",
          "attribute": "cover-image",
          "structured": false
        },
        "currentPage": {
          "type": "number",
          "attribute": "current-page",
          "structured": false
        },
        "title": {
          "type": "string",
          "attribute": "title",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "page-flip-end",
          "type": "CustomEvent<PageTurnDetail>"
        },
        {
          "name": "page-flip-start",
          "type": "CustomEvent<PageFlipStartDetail>"
        },
        {
          "name": "page-turn",
          "type": "CustomEvent<PageTurnDetail>"
        }
      ],
      "slots": [
        ""
      ]
    },
    "snice-book-page": {
      "tagName": "snice-book-page",
      "className": "SniceBookPage",
      "modulePath": "snice/components/book/snice-book",
      "sourceModule": "dist/components/book/snice-book.js",
      "family": "book",
      "attributes": {},
      "properties": {},
      "structuredProperties": [],
      "events": [],
      "slots": [
        ""
      ]
    },
    "snice-booking": {
      "tagName": "snice-booking",
      "className": "SniceBooking",
      "modulePath": "snice/components/booking/snice-booking",
      "sourceModule": "dist/components/booking/snice-booking.js",
      "family": "booking",
      "attributes": {
        "duration": {
          "property": "duration",
          "type": "number",
          "literals": []
        },
        "max-date": {
          "property": "maxDate",
          "type": "Date",
          "literals": []
        },
        "min-date": {
          "property": "minDate",
          "type": "Date",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'stepper' | 'inline'",
          "literals": [
            "stepper",
            "inline"
          ]
        }
      },
      "properties": {
        "availableDates": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "availableSlots": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "duration": {
          "type": "number",
          "attribute": "duration",
          "structured": false
        },
        "fields": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "maxDate": {
          "type": "Date",
          "attribute": "max-date",
          "structured": false
        },
        "minDate": {
          "type": "Date",
          "attribute": "min-date",
          "structured": false
        },
        "variant": {
          "type": "'stepper' | 'inline'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [
        "availableDates",
        "availableSlots",
        "fields"
      ],
      "events": [
        {
          "name": "booking-cancel",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "booking-confirm",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "date-select",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "slot-select",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-breadcrumbs": {
      "tagName": "snice-breadcrumbs",
      "className": "SniceBreadcrumbs",
      "modulePath": "snice/components/breadcrumbs/snice-breadcrumbs",
      "sourceModule": "dist/components/breadcrumbs/snice-breadcrumbs.js",
      "family": "breadcrumbs",
      "attributes": {
        "collapsed": {
          "property": "collapsed",
          "type": "boolean",
          "literals": []
        },
        "max-items": {
          "property": "maxItems",
          "type": "number",
          "literals": []
        },
        "separator": {
          "property": "separator",
          "type": "'/' | '>' | '»' | '•' | '|'",
          "literals": [
            "/",
            ">",
            "»",
            "•",
            "|"
          ]
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        }
      },
      "properties": {
        "collapsed": {
          "type": "boolean",
          "attribute": "collapsed",
          "structured": false
        },
        "items": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "maxItems": {
          "type": "number",
          "attribute": "max-items",
          "structured": false
        },
        "separator": {
          "type": "'/' | '>' | '»' | '•' | '|'",
          "attribute": "separator",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        }
      },
      "structuredProperties": [
        "items"
      ],
      "events": [
        {
          "name": "breadcrumb-click",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        ""
      ]
    },
    "snice-button": {
      "tagName": "snice-button",
      "className": "SniceButton",
      "modulePath": "snice/components/button/snice-button",
      "sourceModule": "dist/components/button/snice-button.js",
      "family": "button",
      "attributes": {
        "circle": {
          "property": "circle",
          "type": "boolean",
          "literals": []
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "download": {
          "property": "download",
          "type": "string",
          "literals": []
        },
        "href": {
          "property": "href",
          "type": "string",
          "literals": []
        },
        "icon": {
          "property": "icon",
          "type": "string",
          "literals": []
        },
        "icon-placement": {
          "property": "iconPlacement",
          "type": "'start' | 'end'",
          "literals": [
            "start",
            "end"
          ]
        },
        "justify-text": {
          "property": "justifyText",
          "type": "'start' | 'center' | 'end'",
          "literals": [
            "start",
            "center",
            "end"
          ]
        },
        "loading": {
          "property": "loading",
          "type": "boolean",
          "literals": []
        },
        "outline": {
          "property": "outline",
          "type": "boolean",
          "literals": []
        },
        "pill": {
          "property": "pill",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "target": {
          "property": "target",
          "type": "string",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "'button' | 'submit' | 'reset'",
          "literals": [
            "button",
            "submit",
            "reset"
          ]
        },
        "variant": {
          "property": "variant",
          "type": "'default' | 'primary' | 'success' | 'warning' | 'danger' | 'text'",
          "literals": [
            "default",
            "primary",
            "success",
            "warning",
            "danger",
            "text"
          ]
        }
      },
      "properties": {
        "circle": {
          "type": "boolean",
          "attribute": "circle",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "download": {
          "type": "string",
          "attribute": "download",
          "structured": false
        },
        "form": {
          "type": "HTMLFormElement | null",
          "attribute": null,
          "structured": false
        },
        "href": {
          "type": "string",
          "attribute": "href",
          "structured": false
        },
        "icon": {
          "type": "string",
          "attribute": "icon",
          "structured": false
        },
        "iconPlacement": {
          "type": "'start' | 'end'",
          "attribute": "icon-placement",
          "structured": false
        },
        "justifyText": {
          "type": "'start' | 'center' | 'end'",
          "attribute": "justify-text",
          "structured": false
        },
        "labels": {
          "type": "NodeList | null",
          "attribute": null,
          "structured": false
        },
        "loading": {
          "type": "boolean",
          "attribute": "loading",
          "structured": false
        },
        "outline": {
          "type": "boolean",
          "attribute": "outline",
          "structured": false
        },
        "pill": {
          "type": "boolean",
          "attribute": "pill",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "target": {
          "type": "string",
          "attribute": "target",
          "structured": false
        },
        "type": {
          "type": "'button' | 'submit' | 'reset'",
          "attribute": "type",
          "structured": false
        },
        "variant": {
          "type": "'default' | 'primary' | 'success' | 'warning' | 'danger' | 'text'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "button-click",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        "",
        "icon"
      ]
    },
    "snice-calendar": {
      "tagName": "snice-calendar",
      "className": "SniceCalendar",
      "modulePath": "snice/components/calendar/snice-calendar",
      "sourceModule": "dist/components/calendar/snice-calendar.js",
      "family": "calendar",
      "attributes": {
        "cell-sizing": {
          "property": "cellSizing",
          "type": "'square' | 'stretch'",
          "literals": [
            "square",
            "stretch"
          ]
        },
        "first-day-of-week": {
          "property": "firstDayOfWeek",
          "type": "number",
          "literals": []
        },
        "highlight-today": {
          "property": "highlightToday",
          "type": "boolean",
          "literals": []
        },
        "locale": {
          "property": "locale",
          "type": "string",
          "literals": []
        },
        "max-date": {
          "property": "maxDate",
          "type": "Date",
          "literals": []
        },
        "min-date": {
          "property": "minDate",
          "type": "Date",
          "literals": []
        },
        "no-day-select": {
          "property": "noDaySelect",
          "type": "boolean",
          "literals": []
        },
        "show-week-numbers": {
          "property": "showWeekNumbers",
          "type": "boolean",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "Date",
          "literals": []
        },
        "view": {
          "property": "view",
          "type": "'month' | 'week' | 'day'",
          "literals": [
            "month",
            "week",
            "day"
          ]
        }
      },
      "properties": {
        "cellSizing": {
          "type": "'square' | 'stretch'",
          "attribute": "cell-sizing",
          "structured": false
        },
        "disabledDates": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "eventPopover": {
          "type": "CalendarEventPopoverProvider | null",
          "attribute": null,
          "structured": false
        },
        "events": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "eventTooltip": {
          "type": "CalendarEventTooltip | null",
          "attribute": null,
          "structured": false
        },
        "firstDayOfWeek": {
          "type": "number",
          "attribute": "first-day-of-week",
          "structured": false
        },
        "highlightToday": {
          "type": "boolean",
          "attribute": "highlight-today",
          "structured": false
        },
        "locale": {
          "type": "string",
          "attribute": "locale",
          "structured": false
        },
        "maxDate": {
          "type": "Date",
          "attribute": "max-date",
          "structured": false
        },
        "minDate": {
          "type": "Date",
          "attribute": "min-date",
          "structured": false
        },
        "noDaySelect": {
          "type": "boolean",
          "attribute": "no-day-select",
          "structured": false
        },
        "showWeekNumbers": {
          "type": "boolean",
          "attribute": "show-week-numbers",
          "structured": false
        },
        "value": {
          "type": "Date",
          "attribute": "value",
          "structured": false
        },
        "view": {
          "type": "'month' | 'week' | 'day'",
          "attribute": "view",
          "structured": false
        }
      },
      "structuredProperties": [
        "disabledDates",
        "events"
      ],
      "events": [
        {
          "name": "calendar-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "calendar-event-click",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-camera": {
      "tagName": "snice-camera",
      "className": "SniceCamera",
      "modulePath": "snice/components/camera/snice-camera",
      "sourceModule": "dist/components/camera/snice-camera.js",
      "family": "camera",
      "attributes": {
        "aspect-ratio": {
          "property": "aspectRatio",
          "type": "string",
          "literals": []
        },
        "auto-start": {
          "property": "autoStart",
          "type": "boolean",
          "literals": []
        },
        "controls-position": {
          "property": "controlsPosition",
          "type": "string",
          "literals": []
        },
        "facing-mode": {
          "property": "facingMode",
          "type": "string",
          "literals": []
        },
        "height": {
          "property": "height",
          "type": "number",
          "literals": []
        },
        "mirror": {
          "property": "mirror",
          "type": "boolean",
          "literals": []
        },
        "object-fit": {
          "property": "objectFit",
          "type": "string",
          "literals": []
        },
        "show-controls": {
          "property": "showControls",
          "type": "boolean",
          "literals": []
        },
        "width": {
          "property": "width",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "aspectRatio": {
          "type": "string",
          "attribute": "aspect-ratio",
          "structured": false
        },
        "autoStart": {
          "type": "boolean",
          "attribute": "auto-start",
          "structured": false
        },
        "controlsPosition": {
          "type": "string",
          "attribute": "controls-position",
          "structured": false
        },
        "facingMode": {
          "type": "string",
          "attribute": "facing-mode",
          "structured": false
        },
        "height": {
          "type": "number",
          "attribute": "height",
          "structured": false
        },
        "mirror": {
          "type": "boolean",
          "attribute": "mirror",
          "structured": false
        },
        "objectFit": {
          "type": "string",
          "attribute": "object-fit",
          "structured": false
        },
        "showControls": {
          "type": "boolean",
          "attribute": "show-controls",
          "structured": false
        },
        "width": {
          "type": "number",
          "attribute": "width",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "camera-capture",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "camera-error",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "camera-start",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "camera-stop",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        "controls"
      ]
    },
    "snice-camera-annotate": {
      "tagName": "snice-camera-annotate",
      "className": "SniceCameraAnnotate",
      "modulePath": "snice/components/camera-annotate/snice-camera-annotate",
      "sourceModule": "dist/components/camera-annotate/snice-camera-annotate.js",
      "family": "camera-annotate",
      "attributes": {
        "auto-rotate-colors": {
          "property": "autoRotateColors",
          "type": "boolean",
          "literals": []
        },
        "auto-start": {
          "property": "autoStart",
          "type": "boolean",
          "literals": []
        },
        "mode": {
          "property": "mode",
          "type": "'camera' | 'annotate'",
          "literals": [
            "camera",
            "annotate"
          ]
        },
        "show-labels-panel": {
          "property": "showLabelsPanel",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "autoRotateColors": {
          "type": "boolean",
          "attribute": "auto-rotate-colors",
          "structured": false
        },
        "autoStart": {
          "type": "boolean",
          "attribute": "auto-start",
          "structured": false
        },
        "mode": {
          "type": "'camera' | 'annotate'",
          "attribute": "mode",
          "structured": false
        },
        "showLabelsPanel": {
          "type": "boolean",
          "attribute": "show-labels-panel",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "annotate",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "annotation-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "capture",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-candlestick": {
      "tagName": "snice-candlestick",
      "className": "SniceCandlestick",
      "modulePath": "snice/components/candlestick/snice-candlestick",
      "sourceModule": "dist/components/candlestick/snice-candlestick.js",
      "family": "candlestick",
      "attributes": {
        "animation": {
          "property": "animation",
          "type": "boolean",
          "literals": []
        },
        "bearishcolor": {
          "property": "bearishColor",
          "type": "string",
          "literals": []
        },
        "bullishcolor": {
          "property": "bullishColor",
          "type": "string",
          "literals": []
        },
        "showcrosshair": {
          "property": "showCrosshair",
          "type": "boolean",
          "literals": []
        },
        "showgrid": {
          "property": "showGrid",
          "type": "boolean",
          "literals": []
        },
        "showvolume": {
          "property": "showVolume",
          "type": "boolean",
          "literals": []
        },
        "timeformat": {
          "property": "timeFormat",
          "type": "'auto' | 'date' | 'time' | 'datetime' | 'month' | 'year'",
          "literals": [
            "auto",
            "date",
            "time",
            "datetime",
            "month",
            "year"
          ]
        },
        "yaxisformat": {
          "property": "yAxisFormat",
          "type": "'number' | 'currency' | 'percent'",
          "literals": [
            "number",
            "currency",
            "percent"
          ]
        },
        "zoomenabled": {
          "property": "zoomEnabled",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "animation": {
          "type": "boolean",
          "attribute": "animation",
          "structured": false
        },
        "bearishColor": {
          "type": "string",
          "attribute": "bearishcolor",
          "structured": false
        },
        "bullishColor": {
          "type": "string",
          "attribute": "bullishcolor",
          "structured": false
        },
        "data": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "showCrosshair": {
          "type": "boolean",
          "attribute": "showcrosshair",
          "structured": false
        },
        "showGrid": {
          "type": "boolean",
          "attribute": "showgrid",
          "structured": false
        },
        "showVolume": {
          "type": "boolean",
          "attribute": "showvolume",
          "structured": false
        },
        "timeFormat": {
          "type": "'auto' | 'date' | 'time' | 'datetime' | 'month' | 'year'",
          "attribute": "timeformat",
          "structured": false
        },
        "yAxisFormat": {
          "type": "'number' | 'currency' | 'percent'",
          "attribute": "yaxisformat",
          "structured": false
        },
        "zoomEnabled": {
          "type": "boolean",
          "attribute": "zoomenabled",
          "structured": false
        }
      },
      "structuredProperties": [
        "data"
      ],
      "events": [
        {
          "name": "candle-click",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "candle-hover",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "crosshair-move",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-card": {
      "tagName": "snice-card",
      "className": "SniceCard",
      "modulePath": "snice/components/card/snice-card",
      "sourceModule": "dist/components/card/snice-card.js",
      "family": "card",
      "attributes": {
        "clickable": {
          "property": "clickable",
          "type": "boolean",
          "literals": []
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "selected": {
          "property": "selected",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "variant": {
          "property": "variant",
          "type": "'elevated' | 'bordered' | 'flat'",
          "literals": [
            "elevated",
            "bordered",
            "flat"
          ]
        }
      },
      "properties": {
        "clickable": {
          "type": "boolean",
          "attribute": "clickable",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "selected": {
          "type": "boolean",
          "attribute": "selected",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "variant": {
          "type": "'elevated' | 'bordered' | 'flat'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "card-click",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        "",
        "footer",
        "header",
        "image"
      ]
    },
    "snice-carousel": {
      "tagName": "snice-carousel",
      "className": "SniceCarousel",
      "modulePath": "snice/components/carousel/snice-carousel",
      "sourceModule": "dist/components/carousel/snice-carousel.js",
      "family": "carousel",
      "attributes": {
        "active-index": {
          "property": "activeIndex",
          "type": "number",
          "literals": []
        },
        "autoplay": {
          "property": "autoplay",
          "type": "boolean",
          "literals": []
        },
        "autoplay-direction": {
          "property": "autoplayDirection",
          "type": "'forward' | 'backward'",
          "literals": [
            "forward",
            "backward"
          ]
        },
        "autoplay-interval": {
          "property": "autoplayInterval",
          "type": "number",
          "literals": []
        },
        "loop": {
          "property": "loop",
          "type": "boolean",
          "literals": []
        },
        "show-controls": {
          "property": "showControls",
          "type": "boolean",
          "literals": []
        },
        "show-indicators": {
          "property": "showIndicators",
          "type": "boolean",
          "literals": []
        },
        "slides-per-view": {
          "property": "slidesPerView",
          "type": "number",
          "literals": []
        },
        "space-between": {
          "property": "spaceBetween",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "activeIndex": {
          "type": "number",
          "attribute": "active-index",
          "structured": false
        },
        "autoplay": {
          "type": "boolean",
          "attribute": "autoplay",
          "structured": false
        },
        "autoplayDirection": {
          "type": "'forward' | 'backward'",
          "attribute": "autoplay-direction",
          "structured": false
        },
        "autoplayInterval": {
          "type": "number",
          "attribute": "autoplay-interval",
          "structured": false
        },
        "loop": {
          "type": "boolean",
          "attribute": "loop",
          "structured": false
        },
        "showControls": {
          "type": "boolean",
          "attribute": "show-controls",
          "structured": false
        },
        "showIndicators": {
          "type": "boolean",
          "attribute": "show-indicators",
          "structured": false
        },
        "slidesPerView": {
          "type": "number",
          "attribute": "slides-per-view",
          "structured": false
        },
        "spaceBetween": {
          "type": "number",
          "attribute": "space-between",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "carousel-slide-change",
          "type": "CustomEvent<CarouselSlideChangeDetail>"
        }
      ],
      "slots": [
        ""
      ]
    },
    "snice-cart": {
      "tagName": "snice-cart",
      "className": "SniceCart",
      "modulePath": "snice/components/cart/snice-cart",
      "sourceModule": "dist/components/cart/snice-cart.js",
      "family": "cart",
      "attributes": {
        "coupon-code": {
          "property": "couponCode",
          "type": "string",
          "literals": []
        },
        "currency": {
          "property": "currency",
          "type": "string",
          "literals": []
        },
        "discount": {
          "property": "discount",
          "type": "number",
          "literals": []
        },
        "tax-rate": {
          "property": "taxRate",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "couponCode": {
          "type": "string",
          "attribute": "coupon-code",
          "structured": false
        },
        "currency": {
          "type": "string",
          "attribute": "currency",
          "structured": false
        },
        "discount": {
          "type": "number",
          "attribute": "discount",
          "structured": false
        },
        "items": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "taxRate": {
          "type": "number",
          "attribute": "tax-rate",
          "structured": false
        }
      },
      "structuredProperties": [
        "items"
      ],
      "events": [
        {
          "name": "checkout",
          "type": "CustomEvent<CheckoutDetail>"
        },
        {
          "name": "coupon-apply",
          "type": "CustomEvent<CouponApplyDetail>"
        },
        {
          "name": "item-add",
          "type": "CustomEvent<ItemAddDetail>"
        },
        {
          "name": "item-remove",
          "type": "CustomEvent<ItemRemoveDetail>"
        },
        {
          "name": "quantity-change",
          "type": "CustomEvent<QuantityChangeDetail>"
        }
      ],
      "slots": []
    },
    "snice-cell": {
      "tagName": "snice-cell",
      "className": "SniceCell",
      "modulePath": "snice/components/table/snice-cell",
      "sourceModule": "dist/components/table/snice-cell.js",
      "family": "table",
      "attributes": {
        "align": {
          "property": "align",
          "type": "ColumnAlign",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "ColumnType",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "any",
          "literals": []
        }
      },
      "properties": {
        "align": {
          "type": "ColumnAlign",
          "attribute": "align",
          "structured": false
        },
        "column": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "rowData": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "type": {
          "type": "ColumnType",
          "attribute": "type",
          "structured": false
        },
        "value": {
          "type": "any",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [
        "column",
        "rowData"
      ],
      "events": [],
      "slots": []
    },
    "snice-cell-actions": {
      "tagName": "snice-cell-actions",
      "className": "SniceCellActions",
      "modulePath": "snice/components/table/snice-cell-actions",
      "sourceModule": "dist/components/table/snice-cell-actions.js",
      "family": "table",
      "attributes": {
        "align": {
          "property": "align",
          "type": "string",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "string",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "actions": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "align": {
          "type": "string",
          "attribute": "align",
          "structured": false
        },
        "column": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "rowData": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "type": {
          "type": "string",
          "attribute": "type",
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [
        "actions",
        "column",
        "rowData"
      ],
      "events": [
        {
          "name": "cell-action",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-cell-boolean": {
      "tagName": "snice-cell-boolean",
      "className": "SniceCellBoolean",
      "modulePath": "snice/components/table/snice-cell-boolean",
      "sourceModule": "dist/components/table/snice-cell-boolean.js",
      "family": "table",
      "attributes": {
        "align": {
          "property": "align",
          "type": "ColumnAlign",
          "literals": []
        },
        "false-symbol": {
          "property": "falseSymbol",
          "type": "string",
          "literals": []
        },
        "false-value": {
          "property": "falseValue",
          "type": "string",
          "literals": []
        },
        "true-symbol": {
          "property": "trueSymbol",
          "type": "string",
          "literals": []
        },
        "true-value": {
          "property": "trueValue",
          "type": "string",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "ColumnType",
          "literals": []
        },
        "use-symbols": {
          "property": "useSymbols",
          "type": "boolean",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "any",
          "literals": []
        }
      },
      "properties": {
        "align": {
          "type": "ColumnAlign",
          "attribute": "align",
          "structured": false
        },
        "column": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "falseSymbol": {
          "type": "string",
          "attribute": "false-symbol",
          "structured": false
        },
        "falseValue": {
          "type": "string",
          "attribute": "false-value",
          "structured": false
        },
        "rowData": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "trueSymbol": {
          "type": "string",
          "attribute": "true-symbol",
          "structured": false
        },
        "trueValue": {
          "type": "string",
          "attribute": "true-value",
          "structured": false
        },
        "type": {
          "type": "ColumnType",
          "attribute": "type",
          "structured": false
        },
        "useSymbols": {
          "type": "boolean",
          "attribute": "use-symbols",
          "structured": false
        },
        "value": {
          "type": "any",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [
        "column",
        "rowData"
      ],
      "events": [],
      "slots": []
    },
    "snice-cell-color": {
      "tagName": "snice-cell-color",
      "className": "SniceCellColor",
      "modulePath": "snice/components/table/snice-cell-color",
      "sourceModule": "dist/components/table/snice-cell-color.js",
      "family": "table",
      "attributes": {
        "align": {
          "property": "align",
          "type": "string",
          "literals": []
        },
        "color": {
          "property": "color",
          "type": "string",
          "literals": []
        },
        "showhex": {
          "property": "showHex",
          "type": "boolean",
          "literals": []
        },
        "showrgb": {
          "property": "showRgb",
          "type": "boolean",
          "literals": []
        },
        "showswatch": {
          "property": "showSwatch",
          "type": "boolean",
          "literals": []
        },
        "swatchsize": {
          "property": "swatchSize",
          "type": "string",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "string",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "align": {
          "type": "string",
          "attribute": "align",
          "structured": false
        },
        "color": {
          "type": "string",
          "attribute": "color",
          "structured": false
        },
        "column": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "rowData": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "showHex": {
          "type": "boolean",
          "attribute": "showhex",
          "structured": false
        },
        "showRgb": {
          "type": "boolean",
          "attribute": "showrgb",
          "structured": false
        },
        "showSwatch": {
          "type": "boolean",
          "attribute": "showswatch",
          "structured": false
        },
        "swatchSize": {
          "type": "string",
          "attribute": "swatchsize",
          "structured": false
        },
        "type": {
          "type": "string",
          "attribute": "type",
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [
        "column",
        "rowData"
      ],
      "events": [],
      "slots": []
    },
    "snice-cell-currency": {
      "tagName": "snice-cell-currency",
      "className": "SniceCellCurrency",
      "modulePath": "snice/components/table/snice-cell-currency",
      "sourceModule": "dist/components/table/snice-cell-currency.js",
      "family": "table",
      "attributes": {
        "align": {
          "property": "align",
          "type": "string",
          "literals": []
        },
        "currency": {
          "property": "currency",
          "type": "string",
          "literals": []
        },
        "currencydisplay": {
          "property": "currencyDisplay",
          "type": "string",
          "literals": []
        },
        "decimals": {
          "property": "decimals",
          "type": "number",
          "literals": []
        },
        "highlight": {
          "property": "highlight",
          "type": "boolean",
          "literals": []
        },
        "locale": {
          "property": "locale",
          "type": "string",
          "literals": []
        },
        "negative-style": {
          "property": "negativeStyle",
          "type": "string",
          "literals": []
        },
        "thousands-separator": {
          "property": "thousandsSeparator",
          "type": "boolean",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "string",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "any",
          "literals": []
        }
      },
      "properties": {
        "align": {
          "type": "string",
          "attribute": "align",
          "structured": false
        },
        "column": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "currency": {
          "type": "string",
          "attribute": "currency",
          "structured": false
        },
        "currencyDisplay": {
          "type": "string",
          "attribute": "currencydisplay",
          "structured": false
        },
        "decimals": {
          "type": "number",
          "attribute": "decimals",
          "structured": false
        },
        "highlight": {
          "type": "boolean",
          "attribute": "highlight",
          "structured": false
        },
        "locale": {
          "type": "string",
          "attribute": "locale",
          "structured": false
        },
        "negativeStyle": {
          "type": "string",
          "attribute": "negative-style",
          "structured": false
        },
        "rowData": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "thousandsSeparator": {
          "type": "boolean",
          "attribute": "thousands-separator",
          "structured": false
        },
        "type": {
          "type": "string",
          "attribute": "type",
          "structured": false
        },
        "value": {
          "type": "any",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [
        "column",
        "rowData"
      ],
      "events": [],
      "slots": []
    },
    "snice-cell-date": {
      "tagName": "snice-cell-date",
      "className": "SniceCellDate",
      "modulePath": "snice/components/table/snice-cell-date",
      "sourceModule": "dist/components/table/snice-cell-date.js",
      "family": "table",
      "attributes": {
        "align": {
          "property": "align",
          "type": "ColumnAlign",
          "literals": []
        },
        "custom-format": {
          "property": "customFormat",
          "type": "string",
          "literals": []
        },
        "date-format": {
          "property": "dateFormat",
          "type": "'short' | 'medium' | 'long' | 'full' | 'custom'",
          "literals": [
            "short",
            "medium",
            "long",
            "full",
            "custom"
          ]
        },
        "locale": {
          "property": "locale",
          "type": "string",
          "literals": []
        },
        "relative-time": {
          "property": "relativeTime",
          "type": "boolean",
          "literals": []
        },
        "show-time": {
          "property": "showTime",
          "type": "boolean",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "ColumnType",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "any",
          "literals": []
        }
      },
      "properties": {
        "align": {
          "type": "ColumnAlign",
          "attribute": "align",
          "structured": false
        },
        "column": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "customFormat": {
          "type": "string",
          "attribute": "custom-format",
          "structured": false
        },
        "dateFormat": {
          "type": "'short' | 'medium' | 'long' | 'full' | 'custom'",
          "attribute": "date-format",
          "structured": false
        },
        "locale": {
          "type": "string",
          "attribute": "locale",
          "structured": false
        },
        "relativeTime": {
          "type": "boolean",
          "attribute": "relative-time",
          "structured": false
        },
        "rowData": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "showTime": {
          "type": "boolean",
          "attribute": "show-time",
          "structured": false
        },
        "type": {
          "type": "ColumnType",
          "attribute": "type",
          "structured": false
        },
        "value": {
          "type": "any",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [
        "column",
        "rowData"
      ],
      "events": [],
      "slots": []
    },
    "snice-cell-duration": {
      "tagName": "snice-cell-duration",
      "className": "SniceCellDuration",
      "modulePath": "snice/components/table/snice-cell-duration",
      "sourceModule": "dist/components/table/snice-cell-duration.js",
      "family": "table",
      "attributes": {
        "align": {
          "property": "align",
          "type": "ColumnAlign",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "ColumnType",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "any",
          "literals": []
        }
      },
      "properties": {
        "align": {
          "type": "ColumnAlign",
          "attribute": "align",
          "structured": false
        },
        "column": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "rowData": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "type": {
          "type": "ColumnType",
          "attribute": "type",
          "structured": false
        },
        "value": {
          "type": "any",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [
        "column",
        "rowData"
      ],
      "events": [],
      "slots": []
    },
    "snice-cell-email": {
      "tagName": "snice-cell-email",
      "className": "SniceCellEmail",
      "modulePath": "snice/components/table/snice-cell-email",
      "sourceModule": "dist/components/table/snice-cell-email.js",
      "family": "table",
      "attributes": {
        "align": {
          "property": "align",
          "type": "string",
          "literals": []
        },
        "displaytext": {
          "property": "displayText",
          "type": "string",
          "literals": []
        },
        "email": {
          "property": "email",
          "type": "string",
          "literals": []
        },
        "showicon": {
          "property": "showIcon",
          "type": "boolean",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "string",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "align": {
          "type": "string",
          "attribute": "align",
          "structured": false
        },
        "column": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "displayText": {
          "type": "string",
          "attribute": "displaytext",
          "structured": false
        },
        "email": {
          "type": "string",
          "attribute": "email",
          "structured": false
        },
        "rowData": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "showIcon": {
          "type": "boolean",
          "attribute": "showicon",
          "structured": false
        },
        "type": {
          "type": "string",
          "attribute": "type",
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [
        "column",
        "rowData"
      ],
      "events": [],
      "slots": []
    },
    "snice-cell-filesize": {
      "tagName": "snice-cell-filesize",
      "className": "SniceCellFilesize",
      "modulePath": "snice/components/table/snice-cell-filesize",
      "sourceModule": "dist/components/table/snice-cell-filesize.js",
      "family": "table",
      "attributes": {
        "align": {
          "property": "align",
          "type": "ColumnAlign",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "ColumnType",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "any",
          "literals": []
        }
      },
      "properties": {
        "align": {
          "type": "ColumnAlign",
          "attribute": "align",
          "structured": false
        },
        "column": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "rowData": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "type": {
          "type": "ColumnType",
          "attribute": "type",
          "structured": false
        },
        "value": {
          "type": "any",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [
        "column",
        "rowData"
      ],
      "events": [],
      "slots": []
    },
    "snice-cell-image": {
      "tagName": "snice-cell-image",
      "className": "SniceCellImage",
      "modulePath": "snice/components/table/snice-cell-image",
      "sourceModule": "dist/components/table/snice-cell-image.js",
      "family": "table",
      "attributes": {
        "align": {
          "property": "align",
          "type": "string",
          "literals": []
        },
        "alt": {
          "property": "alt",
          "type": "string",
          "literals": []
        },
        "fallback": {
          "property": "fallback",
          "type": "string",
          "literals": []
        },
        "imageerror": {
          "property": "imageError",
          "type": "boolean",
          "literals": []
        },
        "lazy": {
          "property": "lazy",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "string",
          "literals": []
        },
        "src": {
          "property": "src",
          "type": "string",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "string",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "align": {
          "type": "string",
          "attribute": "align",
          "structured": false
        },
        "alt": {
          "type": "string",
          "attribute": "alt",
          "structured": false
        },
        "column": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "fallback": {
          "type": "string",
          "attribute": "fallback",
          "structured": false
        },
        "imageError": {
          "type": "boolean",
          "attribute": "imageerror",
          "structured": false
        },
        "lazy": {
          "type": "boolean",
          "attribute": "lazy",
          "structured": false
        },
        "rowData": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "size": {
          "type": "string",
          "attribute": "size",
          "structured": false
        },
        "src": {
          "type": "string",
          "attribute": "src",
          "structured": false
        },
        "type": {
          "type": "string",
          "attribute": "type",
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": "value",
          "structured": false
        },
        "variant": {
          "type": "string",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [
        "column",
        "rowData"
      ],
      "events": [],
      "slots": []
    },
    "snice-cell-json": {
      "tagName": "snice-cell-json",
      "className": "SniceCellJson",
      "modulePath": "snice/components/table/snice-cell-json",
      "sourceModule": "dist/components/table/snice-cell-json.js",
      "family": "table",
      "attributes": {
        "align": {
          "property": "align",
          "type": "string",
          "literals": []
        },
        "collapsed": {
          "property": "collapsed",
          "type": "boolean",
          "literals": []
        },
        "maxdepth": {
          "property": "maxDepth",
          "type": "number",
          "literals": []
        },
        "showtoggle": {
          "property": "showToggle",
          "type": "boolean",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "string",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "Record<string, unknown>",
          "literals": []
        }
      },
      "properties": {
        "align": {
          "type": "string",
          "attribute": "align",
          "structured": false
        },
        "collapsed": {
          "type": "boolean",
          "attribute": "collapsed",
          "structured": false
        },
        "column": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "maxDepth": {
          "type": "number",
          "attribute": "maxdepth",
          "structured": false
        },
        "rowData": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "showToggle": {
          "type": "boolean",
          "attribute": "showtoggle",
          "structured": false
        },
        "type": {
          "type": "string",
          "attribute": "type",
          "structured": false
        },
        "value": {
          "type": "Record<string, unknown>",
          "attribute": "value",
          "structured": true
        }
      },
      "structuredProperties": [
        "column",
        "rowData",
        "value"
      ],
      "events": [],
      "slots": []
    },
    "snice-cell-link": {
      "tagName": "snice-cell-link",
      "className": "SniceCellLink",
      "modulePath": "snice/components/table/snice-cell-link",
      "sourceModule": "dist/components/table/snice-cell-link.js",
      "family": "table",
      "attributes": {
        "align": {
          "property": "align",
          "type": "string",
          "literals": []
        },
        "external": {
          "property": "external",
          "type": "boolean",
          "literals": []
        },
        "href": {
          "property": "href",
          "type": "string",
          "literals": []
        },
        "icon": {
          "property": "icon",
          "type": "string",
          "literals": []
        },
        "target": {
          "property": "target",
          "type": "string",
          "literals": []
        },
        "text": {
          "property": "text",
          "type": "string",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "string",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "align": {
          "type": "string",
          "attribute": "align",
          "structured": false
        },
        "column": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "external": {
          "type": "boolean",
          "attribute": "external",
          "structured": false
        },
        "href": {
          "type": "string",
          "attribute": "href",
          "structured": false
        },
        "icon": {
          "type": "string",
          "attribute": "icon",
          "structured": false
        },
        "rowData": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "target": {
          "type": "string",
          "attribute": "target",
          "structured": false
        },
        "text": {
          "type": "string",
          "attribute": "text",
          "structured": false
        },
        "type": {
          "type": "string",
          "attribute": "type",
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [
        "column",
        "rowData"
      ],
      "events": [],
      "slots": []
    },
    "snice-cell-location": {
      "tagName": "snice-cell-location",
      "className": "SniceCellLocation",
      "modulePath": "snice/components/table/snice-cell-location",
      "sourceModule": "dist/components/table/snice-cell-location.js",
      "family": "table",
      "attributes": {
        "address": {
          "property": "address",
          "type": "string",
          "literals": []
        },
        "align": {
          "property": "align",
          "type": "string",
          "literals": []
        },
        "latitude": {
          "property": "latitude",
          "type": "string",
          "literals": []
        },
        "longitude": {
          "property": "longitude",
          "type": "string",
          "literals": []
        },
        "mapprovider": {
          "property": "mapProvider",
          "type": "string",
          "literals": []
        },
        "showicon": {
          "property": "showIcon",
          "type": "boolean",
          "literals": []
        },
        "showmaplink": {
          "property": "showMapLink",
          "type": "boolean",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "string",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "address": {
          "type": "string",
          "attribute": "address",
          "structured": false
        },
        "align": {
          "type": "string",
          "attribute": "align",
          "structured": false
        },
        "column": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "latitude": {
          "type": "string",
          "attribute": "latitude",
          "structured": false
        },
        "longitude": {
          "type": "string",
          "attribute": "longitude",
          "structured": false
        },
        "mapProvider": {
          "type": "string",
          "attribute": "mapprovider",
          "structured": false
        },
        "rowData": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "showIcon": {
          "type": "boolean",
          "attribute": "showicon",
          "structured": false
        },
        "showMapLink": {
          "type": "boolean",
          "attribute": "showmaplink",
          "structured": false
        },
        "type": {
          "type": "string",
          "attribute": "type",
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [
        "column",
        "rowData"
      ],
      "events": [],
      "slots": []
    },
    "snice-cell-number": {
      "tagName": "snice-cell-number",
      "className": "SniceCellNumber",
      "modulePath": "snice/components/table/snice-cell-number",
      "sourceModule": "dist/components/table/snice-cell-number.js",
      "family": "table",
      "attributes": {
        "align": {
          "property": "align",
          "type": "ColumnAlign",
          "literals": []
        },
        "decimals": {
          "property": "decimals",
          "type": "number",
          "literals": []
        },
        "highlight": {
          "property": "highlight",
          "type": "boolean",
          "literals": []
        },
        "negative-style": {
          "property": "negativeStyle",
          "type": "'parentheses' | 'red' | 'minus'",
          "literals": [
            "parentheses",
            "red",
            "minus"
          ]
        },
        "prefix": {
          "property": "prefix",
          "type": "string",
          "literals": []
        },
        "suffix": {
          "property": "suffix",
          "type": "string",
          "literals": []
        },
        "thousands-separator": {
          "property": "thousandsSeparator",
          "type": "boolean",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "ColumnType",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "any",
          "literals": []
        }
      },
      "properties": {
        "align": {
          "type": "ColumnAlign",
          "attribute": "align",
          "structured": false
        },
        "column": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "decimals": {
          "type": "number",
          "attribute": "decimals",
          "structured": false
        },
        "highlight": {
          "type": "boolean",
          "attribute": "highlight",
          "structured": false
        },
        "negativeStyle": {
          "type": "'parentheses' | 'red' | 'minus'",
          "attribute": "negative-style",
          "structured": false
        },
        "prefix": {
          "type": "string",
          "attribute": "prefix",
          "structured": false
        },
        "rowData": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "suffix": {
          "type": "string",
          "attribute": "suffix",
          "structured": false
        },
        "thousandsSeparator": {
          "type": "boolean",
          "attribute": "thousands-separator",
          "structured": false
        },
        "type": {
          "type": "ColumnType",
          "attribute": "type",
          "structured": false
        },
        "value": {
          "type": "any",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [
        "column",
        "rowData"
      ],
      "events": [],
      "slots": []
    },
    "snice-cell-percentage": {
      "tagName": "snice-cell-percentage",
      "className": "SniceCellPercentage",
      "modulePath": "snice/components/table/snice-cell-percentage",
      "sourceModule": "dist/components/table/snice-cell-percentage.js",
      "family": "table",
      "attributes": {
        "align": {
          "property": "align",
          "type": "string",
          "literals": []
        },
        "colorize": {
          "property": "colorize",
          "type": "boolean",
          "literals": []
        },
        "decimals": {
          "property": "decimals",
          "type": "number",
          "literals": []
        },
        "showtrend": {
          "property": "showTrend",
          "type": "boolean",
          "literals": []
        },
        "trendvalue": {
          "property": "trendValue",
          "type": "number",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "string",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "any",
          "literals": []
        }
      },
      "properties": {
        "align": {
          "type": "string",
          "attribute": "align",
          "structured": false
        },
        "colorize": {
          "type": "boolean",
          "attribute": "colorize",
          "structured": false
        },
        "column": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "decimals": {
          "type": "number",
          "attribute": "decimals",
          "structured": false
        },
        "rowData": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "showTrend": {
          "type": "boolean",
          "attribute": "showtrend",
          "structured": false
        },
        "trendValue": {
          "type": "number",
          "attribute": "trendvalue",
          "structured": false
        },
        "type": {
          "type": "string",
          "attribute": "type",
          "structured": false
        },
        "value": {
          "type": "any",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [
        "column",
        "rowData"
      ],
      "events": [],
      "slots": []
    },
    "snice-cell-phone": {
      "tagName": "snice-cell-phone",
      "className": "SniceCellPhone",
      "modulePath": "snice/components/table/snice-cell-phone",
      "sourceModule": "dist/components/table/snice-cell-phone.js",
      "family": "table",
      "attributes": {
        "align": {
          "property": "align",
          "type": "string",
          "literals": []
        },
        "country": {
          "property": "country",
          "type": "string",
          "literals": []
        },
        "displaytext": {
          "property": "displayText",
          "type": "string",
          "literals": []
        },
        "format": {
          "property": "format",
          "type": "boolean",
          "literals": []
        },
        "phone": {
          "property": "phone",
          "type": "string",
          "literals": []
        },
        "showicon": {
          "property": "showIcon",
          "type": "boolean",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "string",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "align": {
          "type": "string",
          "attribute": "align",
          "structured": false
        },
        "column": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "country": {
          "type": "string",
          "attribute": "country",
          "structured": false
        },
        "displayText": {
          "type": "string",
          "attribute": "displaytext",
          "structured": false
        },
        "format": {
          "type": "boolean",
          "attribute": "format",
          "structured": false
        },
        "phone": {
          "type": "string",
          "attribute": "phone",
          "structured": false
        },
        "rowData": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "showIcon": {
          "type": "boolean",
          "attribute": "showicon",
          "structured": false
        },
        "type": {
          "type": "string",
          "attribute": "type",
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [
        "column",
        "rowData"
      ],
      "events": [],
      "slots": []
    },
    "snice-cell-progress": {
      "tagName": "snice-cell-progress",
      "className": "SniceCellProgress",
      "modulePath": "snice/components/table/snice-cell-progress",
      "sourceModule": "dist/components/table/snice-cell-progress.js",
      "family": "table",
      "attributes": {
        "align": {
          "property": "align",
          "type": "ColumnAlign",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "ColumnType",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "Record<string, unknown>",
          "literals": []
        }
      },
      "properties": {
        "align": {
          "type": "ColumnAlign",
          "attribute": "align",
          "structured": false
        },
        "column": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "rowData": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "type": {
          "type": "ColumnType",
          "attribute": "type",
          "structured": false
        },
        "value": {
          "type": "Record<string, unknown>",
          "attribute": "value",
          "structured": true
        }
      },
      "structuredProperties": [
        "column",
        "rowData",
        "value"
      ],
      "events": [],
      "slots": []
    },
    "snice-cell-rating": {
      "tagName": "snice-cell-rating",
      "className": "SniceCellRating",
      "modulePath": "snice/components/table/snice-cell-rating",
      "sourceModule": "dist/components/table/snice-cell-rating.js",
      "family": "table",
      "attributes": {
        "align": {
          "property": "align",
          "type": "ColumnAlign",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "ColumnType",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "any",
          "literals": []
        }
      },
      "properties": {
        "align": {
          "type": "ColumnAlign",
          "attribute": "align",
          "structured": false
        },
        "column": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "rowData": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "type": {
          "type": "ColumnType",
          "attribute": "type",
          "structured": false
        },
        "value": {
          "type": "any",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [
        "column",
        "rowData"
      ],
      "events": [],
      "slots": []
    },
    "snice-cell-sparkline": {
      "tagName": "snice-cell-sparkline",
      "className": "SniceCellSparkline",
      "modulePath": "snice/components/table/snice-cell-sparkline",
      "sourceModule": "dist/components/table/snice-cell-sparkline.js",
      "family": "table",
      "attributes": {
        "align": {
          "property": "align",
          "type": "ColumnAlign",
          "literals": []
        },
        "chart-type": {
          "property": "chartType",
          "type": "'line' | 'bar' | 'area'",
          "literals": [
            "line",
            "bar",
            "area"
          ]
        },
        "color": {
          "property": "color",
          "type": "string",
          "literals": []
        },
        "data": {
          "property": "data",
          "type": "number[]",
          "literals": []
        },
        "height": {
          "property": "height",
          "type": "number",
          "literals": []
        },
        "max-value": {
          "property": "maxValue",
          "type": "number",
          "literals": []
        },
        "min-value": {
          "property": "minValue",
          "type": "number",
          "literals": []
        },
        "show-baseline": {
          "property": "showBaseline",
          "type": "boolean",
          "literals": []
        },
        "show-dots": {
          "property": "showDots",
          "type": "boolean",
          "literals": []
        },
        "stroke-width": {
          "property": "strokeWidth",
          "type": "number",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "ColumnType",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "any",
          "literals": []
        },
        "width": {
          "property": "width",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "align": {
          "type": "ColumnAlign",
          "attribute": "align",
          "structured": false
        },
        "chartType": {
          "type": "'line' | 'bar' | 'area'",
          "attribute": "chart-type",
          "structured": false
        },
        "color": {
          "type": "string",
          "attribute": "color",
          "structured": false
        },
        "column": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "data": {
          "type": "number[]",
          "attribute": "data",
          "structured": true
        },
        "height": {
          "type": "number",
          "attribute": "height",
          "structured": false
        },
        "maxValue": {
          "type": "number",
          "attribute": "max-value",
          "structured": false
        },
        "minValue": {
          "type": "number",
          "attribute": "min-value",
          "structured": false
        },
        "rowData": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "showBaseline": {
          "type": "boolean",
          "attribute": "show-baseline",
          "structured": false
        },
        "showDots": {
          "type": "boolean",
          "attribute": "show-dots",
          "structured": false
        },
        "strokeWidth": {
          "type": "number",
          "attribute": "stroke-width",
          "structured": false
        },
        "type": {
          "type": "ColumnType",
          "attribute": "type",
          "structured": false
        },
        "value": {
          "type": "any",
          "attribute": "value",
          "structured": false
        },
        "width": {
          "type": "number",
          "attribute": "width",
          "structured": false
        }
      },
      "structuredProperties": [
        "column",
        "data",
        "rowData"
      ],
      "events": [],
      "slots": []
    },
    "snice-cell-status": {
      "tagName": "snice-cell-status",
      "className": "SniceCellStatus",
      "modulePath": "snice/components/table/snice-cell-status",
      "sourceModule": "dist/components/table/snice-cell-status.js",
      "family": "table",
      "attributes": {
        "align": {
          "property": "align",
          "type": "string",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "showdot": {
          "property": "showDot",
          "type": "boolean",
          "literals": []
        },
        "status": {
          "property": "status",
          "type": "string",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "string",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "align": {
          "type": "string",
          "attribute": "align",
          "structured": false
        },
        "column": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "rowData": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "showDot": {
          "type": "boolean",
          "attribute": "showdot",
          "structured": false
        },
        "status": {
          "type": "string",
          "attribute": "status",
          "structured": false
        },
        "type": {
          "type": "string",
          "attribute": "type",
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": "value",
          "structured": false
        },
        "variant": {
          "type": "string",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [
        "column",
        "rowData"
      ],
      "events": [],
      "slots": []
    },
    "snice-cell-tag": {
      "tagName": "snice-cell-tag",
      "className": "SniceCellTag",
      "modulePath": "snice/components/table/snice-cell-tag",
      "sourceModule": "dist/components/table/snice-cell-tag.js",
      "family": "table",
      "attributes": {
        "align": {
          "property": "align",
          "type": "string",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "string",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "align": {
          "type": "string",
          "attribute": "align",
          "structured": false
        },
        "column": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "rowData": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "tags": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "type": {
          "type": "string",
          "attribute": "type",
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": "value",
          "structured": false
        },
        "variant": {
          "type": "string",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [
        "column",
        "rowData",
        "tags"
      ],
      "events": [],
      "slots": []
    },
    "snice-cell-text": {
      "tagName": "snice-cell-text",
      "className": "SniceCellText",
      "modulePath": "snice/components/table/snice-cell-text",
      "sourceModule": "dist/components/table/snice-cell-text.js",
      "family": "table",
      "attributes": {
        "align": {
          "property": "align",
          "type": "ColumnAlign",
          "literals": []
        },
        "max-lines": {
          "property": "maxLines",
          "type": "number",
          "literals": []
        },
        "multiline": {
          "property": "multiline",
          "type": "boolean",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "ColumnType",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "any",
          "literals": []
        }
      },
      "properties": {
        "align": {
          "type": "ColumnAlign",
          "attribute": "align",
          "structured": false
        },
        "column": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "maxLines": {
          "type": "number",
          "attribute": "max-lines",
          "structured": false
        },
        "multiline": {
          "type": "boolean",
          "attribute": "multiline",
          "structured": false
        },
        "rowData": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "type": {
          "type": "ColumnType",
          "attribute": "type",
          "structured": false
        },
        "value": {
          "type": "any",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [
        "column",
        "rowData"
      ],
      "events": [],
      "slots": []
    },
    "snice-chart": {
      "tagName": "snice-chart",
      "className": "SniceChart",
      "modulePath": "snice/components/chart/snice-chart",
      "sourceModule": "dist/components/chart/snice-chart.js",
      "family": "chart",
      "attributes": {
        "height": {
          "property": "height",
          "type": "number",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "string",
          "literals": []
        },
        "width": {
          "property": "width",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "datasets": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "height": {
          "type": "number",
          "attribute": "height",
          "structured": false
        },
        "labels": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "options": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "type": {
          "type": "string",
          "attribute": "type",
          "structured": false
        },
        "width": {
          "type": "number",
          "attribute": "width",
          "structured": false
        }
      },
      "structuredProperties": [
        "datasets",
        "labels",
        "options"
      ],
      "events": [],
      "slots": []
    },
    "snice-chat": {
      "tagName": "snice-chat",
      "className": "SniceChat",
      "modulePath": "snice/components/chat/snice-chat",
      "sourceModule": "dist/components/chat/snice-chat.js",
      "family": "chat",
      "attributes": {
        "allow-files": {
          "property": "allowFiles",
          "type": "boolean",
          "literals": []
        },
        "color-authors": {
          "property": "colorAuthors",
          "type": "boolean",
          "literals": []
        },
        "current-avatar": {
          "property": "currentAvatar",
          "type": "string",
          "literals": []
        },
        "current-user": {
          "property": "currentUser",
          "type": "string",
          "literals": []
        },
        "layout": {
          "property": "layout",
          "type": "ChatLayout",
          "literals": []
        },
        "markdown": {
          "property": "markdown",
          "type": "boolean",
          "literals": []
        },
        "placeholder": {
          "property": "placeholder",
          "type": "string",
          "literals": []
        },
        "show-avatars": {
          "property": "showAvatars",
          "type": "boolean",
          "literals": []
        },
        "show-timestamps": {
          "property": "showTimestamps",
          "type": "boolean",
          "literals": []
        },
        "show-typing": {
          "property": "showTyping",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "allowFiles": {
          "type": "boolean",
          "attribute": "allow-files",
          "structured": false
        },
        "authorColors": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "colorAuthors": {
          "type": "boolean",
          "attribute": "color-authors",
          "structured": false
        },
        "currentAvatar": {
          "type": "string",
          "attribute": "current-avatar",
          "structured": false
        },
        "currentUser": {
          "type": "string",
          "attribute": "current-user",
          "structured": false
        },
        "layout": {
          "type": "ChatLayout",
          "attribute": "layout",
          "structured": false
        },
        "markdown": {
          "type": "boolean",
          "attribute": "markdown",
          "structured": false
        },
        "messages": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "placeholder": {
          "type": "string",
          "attribute": "placeholder",
          "structured": false
        },
        "showAvatars": {
          "type": "boolean",
          "attribute": "show-avatars",
          "structured": false
        },
        "showTimestamps": {
          "type": "boolean",
          "attribute": "show-timestamps",
          "structured": false
        },
        "showTyping": {
          "type": "boolean",
          "attribute": "show-typing",
          "structured": false
        }
      },
      "structuredProperties": [
        "authorColors",
        "messages"
      ],
      "events": [
        {
          "name": "message-delete",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "message-edit",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "message-react",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "message-send",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "typing-start",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "typing-stop",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-chat-message": {
      "tagName": "snice-chat-message",
      "className": "SniceChatMessage",
      "modulePath": "snice/components/chat/snice-chat-message",
      "sourceModule": "dist/components/chat/snice-chat-message.js",
      "family": "chat",
      "attributes": {
        "author": {
          "property": "author",
          "type": "string",
          "literals": []
        },
        "author-color": {
          "property": "authorColor",
          "type": "string",
          "literals": []
        },
        "avatar": {
          "property": "avatar",
          "type": "string",
          "literals": []
        },
        "edited": {
          "property": "edited",
          "type": "boolean",
          "literals": []
        },
        "format": {
          "property": "format",
          "type": "MessageFormat",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "MessageType",
          "literals": []
        }
      },
      "properties": {
        "attachment": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "author": {
          "type": "string",
          "attribute": "author",
          "structured": false
        },
        "authorColor": {
          "type": "string",
          "attribute": "author-color",
          "structured": false
        },
        "avatar": {
          "type": "string",
          "attribute": "avatar",
          "structured": false
        },
        "edited": {
          "type": "boolean",
          "attribute": "edited",
          "structured": false
        },
        "format": {
          "type": "MessageFormat",
          "attribute": "format",
          "structured": false
        },
        "reactions": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "thread": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "type": {
          "type": "MessageType",
          "attribute": "type",
          "structured": false
        }
      },
      "structuredProperties": [
        "attachment",
        "reactions",
        "thread"
      ],
      "events": [],
      "slots": [
        ""
      ]
    },
    "snice-checkbox": {
      "tagName": "snice-checkbox",
      "className": "SniceCheckbox",
      "modulePath": "snice/components/checkbox/snice-checkbox",
      "sourceModule": "dist/components/checkbox/snice-checkbox.js",
      "family": "checkbox",
      "attributes": {
        "checked": {
          "property": "defaultChecked",
          "type": "boolean",
          "literals": []
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "indeterminate": {
          "property": "indeterminate",
          "type": "boolean",
          "literals": []
        },
        "invalid": {
          "property": "invalid",
          "type": "boolean",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "loading": {
          "property": "loading",
          "type": "boolean",
          "literals": []
        },
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "required": {
          "property": "required",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "value": {
          "property": "value",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "checked": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        },
        "defaultChecked": {
          "type": "boolean",
          "attribute": "checked",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "form": {
          "type": "HTMLFormElement | null",
          "attribute": null,
          "structured": false
        },
        "indeterminate": {
          "type": "boolean",
          "attribute": "indeterminate",
          "structured": false
        },
        "invalid": {
          "type": "boolean",
          "attribute": "invalid",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "labels": {
          "type": "NodeList | null",
          "attribute": null,
          "structured": false
        },
        "loading": {
          "type": "boolean",
          "attribute": "loading",
          "structured": false
        },
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "required": {
          "type": "boolean",
          "attribute": "required",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "type": {
          "type": "'checkbox'",
          "attribute": null,
          "structured": false
        },
        "validationMessage": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "validity": {
          "type": "ValidityState",
          "attribute": null,
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": "value",
          "structured": false
        },
        "willValidate": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "checkbox-change",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-chip": {
      "tagName": "snice-chip",
      "className": "SniceChip",
      "modulePath": "snice/components/chip/snice-chip",
      "sourceModule": "dist/components/chip/snice-chip.js",
      "family": "chip",
      "attributes": {
        "avatar": {
          "property": "avatar",
          "type": "string",
          "literals": []
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "icon": {
          "property": "icon",
          "type": "string",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "removable": {
          "property": "removable",
          "type": "boolean",
          "literals": []
        },
        "selectable": {
          "property": "selectable",
          "type": "boolean",
          "literals": []
        },
        "selected": {
          "property": "selected",
          "type": "boolean",
          "literals": []
        },
        "shape": {
          "property": "shape",
          "type": "'pill' | 'rounded' | 'square'",
          "literals": [
            "pill",
            "rounded",
            "square"
          ]
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "variant": {
          "property": "variant",
          "type": "'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'",
          "literals": [
            "default",
            "primary",
            "success",
            "warning",
            "error",
            "info"
          ]
        }
      },
      "properties": {
        "avatar": {
          "type": "string",
          "attribute": "avatar",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "icon": {
          "type": "string",
          "attribute": "icon",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "removable": {
          "type": "boolean",
          "attribute": "removable",
          "structured": false
        },
        "selectable": {
          "type": "boolean",
          "attribute": "selectable",
          "structured": false
        },
        "selected": {
          "type": "boolean",
          "attribute": "selected",
          "structured": false
        },
        "shape": {
          "type": "'pill' | 'rounded' | 'square'",
          "attribute": "shape",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "variant": {
          "type": "'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "chip-click",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "chip-remove",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        "",
        "icon"
      ]
    },
    "snice-code-block": {
      "tagName": "snice-code-block",
      "className": "SniceCodeBlock",
      "modulePath": "snice/components/code-block/snice-code-block",
      "sourceModule": "dist/components/code-block/snice-code-block.js",
      "family": "code-block",
      "attributes": {
        "copyable": {
          "property": "copyable",
          "type": "boolean",
          "literals": []
        },
        "fetch-mode": {
          "property": "fetchMode",
          "type": "'native' | 'virtual' | 'event'",
          "literals": [
            "native",
            "virtual",
            "event"
          ]
        },
        "filename": {
          "property": "filename",
          "type": "string",
          "literals": []
        },
        "format": {
          "property": "format",
          "type": "string",
          "literals": []
        },
        "grammar": {
          "property": "grammar",
          "type": "string",
          "literals": []
        },
        "language": {
          "property": "language",
          "type": "'javascript' | 'typescript' | 'html' | 'css' | 'json' | 'python' | 'bash' | 'plaintext' | string",
          "literals": []
        },
        "show-line-numbers": {
          "property": "showLineNumbers",
          "type": "boolean",
          "literals": []
        },
        "start-line": {
          "property": "startLine",
          "type": "number",
          "literals": []
        },
        "theme": {
          "property": "theme",
          "type": "'' | 'dark' | 'light'",
          "literals": [
            "",
            "dark",
            "light"
          ]
        }
      },
      "properties": {
        "copyable": {
          "type": "boolean",
          "attribute": "copyable",
          "structured": false
        },
        "fetchMode": {
          "type": "'native' | 'virtual' | 'event'",
          "attribute": "fetch-mode",
          "structured": false
        },
        "filename": {
          "type": "string",
          "attribute": "filename",
          "structured": false
        },
        "format": {
          "type": "string",
          "attribute": "format",
          "structured": false
        },
        "grammar": {
          "type": "string",
          "attribute": "grammar",
          "structured": false
        },
        "highlightLines": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "language": {
          "type": "'javascript' | 'typescript' | 'html' | 'css' | 'json' | 'python' | 'bash' | 'plaintext' | string",
          "attribute": "language",
          "structured": false
        },
        "showLineNumbers": {
          "type": "boolean",
          "attribute": "show-line-numbers",
          "structured": false
        },
        "startLine": {
          "type": "number",
          "attribute": "start-line",
          "structured": false
        },
        "theme": {
          "type": "'' | 'dark' | 'light'",
          "attribute": "theme",
          "structured": false
        }
      },
      "structuredProperties": [
        "highlightLines"
      ],
      "events": [
        {
          "name": "code-after-format",
          "type": "CustomEvent<CodeFormatDetail>"
        },
        {
          "name": "code-after-highlight",
          "type": "CustomEvent<CodeHighlightDetail>"
        },
        {
          "name": "code-before-format",
          "type": "CustomEvent<CodeFormatDetail>"
        },
        {
          "name": "code-before-highlight",
          "type": "CustomEvent<CodeHighlightDetail>"
        },
        {
          "name": "code-copy",
          "type": "CustomEvent<CodeCopyDetail>"
        },
        {
          "name": "grammar-loaded",
          "type": "CustomEvent<GrammarLoadedDetail>"
        },
        {
          "name": "grammar-request",
          "type": "CustomEvent<GrammarRequestDetail>"
        }
      ],
      "slots": [
        ""
      ]
    },
    "snice-color-display": {
      "tagName": "snice-color-display",
      "className": "SniceColorDisplay",
      "modulePath": "snice/components/color-display/snice-color-display",
      "sourceModule": "dist/components/color-display/snice-color-display.js",
      "family": "color-display",
      "attributes": {
        "format": {
          "property": "format",
          "type": "'hex' | 'rgb' | 'hsl'",
          "literals": [
            "hex",
            "rgb",
            "hsl"
          ]
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "show-label": {
          "property": "showLabel",
          "type": "boolean",
          "literals": []
        },
        "show-swatch": {
          "property": "showSwatch",
          "type": "boolean",
          "literals": []
        },
        "swatch-size": {
          "property": "swatchSize",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "value": {
          "property": "value",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "format": {
          "type": "'hex' | 'rgb' | 'hsl'",
          "attribute": "format",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "showLabel": {
          "type": "boolean",
          "attribute": "show-label",
          "structured": false
        },
        "showSwatch": {
          "type": "boolean",
          "attribute": "show-swatch",
          "structured": false
        },
        "swatchSize": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "swatch-size",
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": []
    },
    "snice-color-picker": {
      "tagName": "snice-color-picker",
      "className": "SniceColorPicker",
      "modulePath": "snice/components/color-picker/snice-color-picker",
      "sourceModule": "dist/components/color-picker/snice-color-picker.js",
      "family": "color-picker",
      "attributes": {
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "error-text": {
          "property": "errorText",
          "type": "string",
          "literals": []
        },
        "format": {
          "property": "format",
          "type": "'hex' | 'rgb' | 'hsl'",
          "literals": [
            "hex",
            "rgb",
            "hsl"
          ]
        },
        "helper-text": {
          "property": "helperText",
          "type": "string",
          "literals": []
        },
        "invalid": {
          "property": "invalid",
          "type": "boolean",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "loading": {
          "property": "loading",
          "type": "boolean",
          "literals": []
        },
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "required": {
          "property": "required",
          "type": "boolean",
          "literals": []
        },
        "show-input": {
          "property": "showInput",
          "type": "boolean",
          "literals": []
        },
        "show-presets": {
          "property": "showPresets",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "value": {
          "property": "defaultValue",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "defaultValue": {
          "type": "string",
          "attribute": "value",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "errorText": {
          "type": "string",
          "attribute": "error-text",
          "structured": false
        },
        "form": {
          "type": "HTMLFormElement | null",
          "attribute": null,
          "structured": false
        },
        "format": {
          "type": "'hex' | 'rgb' | 'hsl'",
          "attribute": "format",
          "structured": false
        },
        "helperText": {
          "type": "string",
          "attribute": "helper-text",
          "structured": false
        },
        "invalid": {
          "type": "boolean",
          "attribute": "invalid",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "labels": {
          "type": "NodeList | null",
          "attribute": null,
          "structured": false
        },
        "loading": {
          "type": "boolean",
          "attribute": "loading",
          "structured": false
        },
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "presets": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "required": {
          "type": "boolean",
          "attribute": "required",
          "structured": false
        },
        "showInput": {
          "type": "boolean",
          "attribute": "show-input",
          "structured": false
        },
        "showPresets": {
          "type": "boolean",
          "attribute": "show-presets",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "type": {
          "type": "'color'",
          "attribute": null,
          "structured": false
        },
        "validationMessage": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "validity": {
          "type": "ValidityState",
          "attribute": null,
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "willValidate": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        }
      },
      "structuredProperties": [
        "presets"
      ],
      "events": [
        {
          "name": "color-picker-blur",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "color-picker-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "color-picker-focus",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "color-picker-input",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-column": {
      "tagName": "snice-column",
      "className": "SniceColumn",
      "modulePath": "snice/components/table/snice-column",
      "sourceModule": "dist/components/table/snice-column.js",
      "family": "table",
      "attributes": {
        "align": {
          "property": "align",
          "type": "ColumnAlign",
          "literals": []
        },
        "cell-bg-color": {
          "property": "cellBgColor",
          "type": "string",
          "literals": []
        },
        "cell-color": {
          "property": "cellColor",
          "type": "string",
          "literals": []
        },
        "cell-font-size": {
          "property": "cellFontSize",
          "type": "string",
          "literals": []
        },
        "cell-font-style": {
          "property": "cellFontStyle",
          "type": "'normal' | 'italic'",
          "literals": [
            "normal",
            "italic"
          ]
        },
        "cell-font-weight": {
          "property": "cellFontWeight",
          "type": "'normal' | 'bold' | 'lighter'",
          "literals": [
            "normal",
            "bold",
            "lighter"
          ]
        },
        "cell-text-decoration": {
          "property": "cellTextDecoration",
          "type": "'none' | 'underline' | 'line-through'",
          "literals": [
            "none",
            "underline",
            "line-through"
          ]
        },
        "custom-date-format": {
          "property": "customDateFormat",
          "type": "string",
          "literals": []
        },
        "date-format": {
          "property": "dateFormat",
          "type": "'short' | 'medium' | 'long' | 'full' | 'custom'",
          "literals": [
            "short",
            "medium",
            "long",
            "full",
            "custom"
          ]
        },
        "date-locale": {
          "property": "dateLocale",
          "type": "string",
          "literals": []
        },
        "decimals": {
          "property": "decimals",
          "type": "number",
          "literals": []
        },
        "ellipsis": {
          "property": "ellipsis",
          "type": "boolean",
          "literals": []
        },
        "false-symbol": {
          "property": "falseSymbol",
          "type": "string",
          "literals": []
        },
        "false-value": {
          "property": "falseValue",
          "type": "string",
          "literals": []
        },
        "filterable": {
          "property": "filterable",
          "type": "boolean",
          "literals": []
        },
        "key": {
          "property": "key",
          "type": "string",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "negative-style": {
          "property": "negativeStyle",
          "type": "'parentheses' | 'red' | 'minus'",
          "literals": [
            "parentheses",
            "red",
            "minus"
          ]
        },
        "number-prefix": {
          "property": "numberPrefix",
          "type": "string",
          "literals": []
        },
        "number-suffix": {
          "property": "numberSuffix",
          "type": "string",
          "literals": []
        },
        "progress-bg-color": {
          "property": "progressBgColor",
          "type": "string",
          "literals": []
        },
        "progress-color": {
          "property": "progressColor",
          "type": "string",
          "literals": []
        },
        "progress-height": {
          "property": "progressHeight",
          "type": "string",
          "literals": []
        },
        "progress-max": {
          "property": "progressMax",
          "type": "number",
          "literals": []
        },
        "rating-color": {
          "property": "ratingColor",
          "type": "string",
          "literals": []
        },
        "rating-empty-symbol": {
          "property": "ratingEmptySymbol",
          "type": "string",
          "literals": []
        },
        "rating-max": {
          "property": "ratingMax",
          "type": "number",
          "literals": []
        },
        "rating-symbol": {
          "property": "ratingSymbol",
          "type": "string",
          "literals": []
        },
        "show-percentage": {
          "property": "showPercentage",
          "type": "boolean",
          "literals": []
        },
        "sortable": {
          "property": "sortable",
          "type": "boolean",
          "literals": []
        },
        "sparkline-color": {
          "property": "sparklineColor",
          "type": "string",
          "literals": []
        },
        "sparkline-height": {
          "property": "sparklineHeight",
          "type": "number",
          "literals": []
        },
        "sparkline-type": {
          "property": "sparklineType",
          "type": "'line' | 'bar' | 'area'",
          "literals": [
            "line",
            "bar",
            "area"
          ]
        },
        "sparkline-width": {
          "property": "sparklineWidth",
          "type": "number",
          "literals": []
        },
        "thousands-separator": {
          "property": "thousandsSeparator",
          "type": "boolean",
          "literals": []
        },
        "tooltip": {
          "property": "tooltip",
          "type": "boolean",
          "literals": []
        },
        "true-symbol": {
          "property": "trueSymbol",
          "type": "string",
          "literals": []
        },
        "true-value": {
          "property": "trueValue",
          "type": "string",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "ColumnType",
          "literals": []
        },
        "use-symbols": {
          "property": "useSymbols",
          "type": "boolean",
          "literals": []
        },
        "width": {
          "property": "width",
          "type": "string",
          "literals": []
        },
        "wrap": {
          "property": "wrap",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "align": {
          "type": "ColumnAlign",
          "attribute": "align",
          "structured": false
        },
        "cellBgColor": {
          "type": "string",
          "attribute": "cell-bg-color",
          "structured": false
        },
        "cellColor": {
          "type": "string",
          "attribute": "cell-color",
          "structured": false
        },
        "cellFontSize": {
          "type": "string",
          "attribute": "cell-font-size",
          "structured": false
        },
        "cellFontStyle": {
          "type": "'normal' | 'italic'",
          "attribute": "cell-font-style",
          "structured": false
        },
        "cellFontWeight": {
          "type": "'normal' | 'bold' | 'lighter'",
          "attribute": "cell-font-weight",
          "structured": false
        },
        "cellTextDecoration": {
          "type": "'none' | 'underline' | 'line-through'",
          "attribute": "cell-text-decoration",
          "structured": false
        },
        "customDateFormat": {
          "type": "string",
          "attribute": "custom-date-format",
          "structured": false
        },
        "dateFormat": {
          "type": "'short' | 'medium' | 'long' | 'full' | 'custom'",
          "attribute": "date-format",
          "structured": false
        },
        "dateLocale": {
          "type": "string",
          "attribute": "date-locale",
          "structured": false
        },
        "decimals": {
          "type": "number",
          "attribute": "decimals",
          "structured": false
        },
        "ellipsis": {
          "type": "boolean",
          "attribute": "ellipsis",
          "structured": false
        },
        "falseSymbol": {
          "type": "string",
          "attribute": "false-symbol",
          "structured": false
        },
        "falseValue": {
          "type": "string",
          "attribute": "false-value",
          "structured": false
        },
        "filterable": {
          "type": "boolean",
          "attribute": "filterable",
          "structured": false
        },
        "key": {
          "type": "string",
          "attribute": "key",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "negativeStyle": {
          "type": "'parentheses' | 'red' | 'minus'",
          "attribute": "negative-style",
          "structured": false
        },
        "numberPrefix": {
          "type": "string",
          "attribute": "number-prefix",
          "structured": false
        },
        "numberSuffix": {
          "type": "string",
          "attribute": "number-suffix",
          "structured": false
        },
        "progressBgColor": {
          "type": "string",
          "attribute": "progress-bg-color",
          "structured": false
        },
        "progressColor": {
          "type": "string",
          "attribute": "progress-color",
          "structured": false
        },
        "progressHeight": {
          "type": "string",
          "attribute": "progress-height",
          "structured": false
        },
        "progressMax": {
          "type": "number",
          "attribute": "progress-max",
          "structured": false
        },
        "ratingColor": {
          "type": "string",
          "attribute": "rating-color",
          "structured": false
        },
        "ratingEmptySymbol": {
          "type": "string",
          "attribute": "rating-empty-symbol",
          "structured": false
        },
        "ratingMax": {
          "type": "number",
          "attribute": "rating-max",
          "structured": false
        },
        "ratingSymbol": {
          "type": "string",
          "attribute": "rating-symbol",
          "structured": false
        },
        "showPercentage": {
          "type": "boolean",
          "attribute": "show-percentage",
          "structured": false
        },
        "sortable": {
          "type": "boolean",
          "attribute": "sortable",
          "structured": false
        },
        "sparklineColor": {
          "type": "string",
          "attribute": "sparkline-color",
          "structured": false
        },
        "sparklineHeight": {
          "type": "number",
          "attribute": "sparkline-height",
          "structured": false
        },
        "sparklineType": {
          "type": "'line' | 'bar' | 'area'",
          "attribute": "sparkline-type",
          "structured": false
        },
        "sparklineWidth": {
          "type": "number",
          "attribute": "sparkline-width",
          "structured": false
        },
        "thousandsSeparator": {
          "type": "boolean",
          "attribute": "thousands-separator",
          "structured": false
        },
        "tooltip": {
          "type": "boolean",
          "attribute": "tooltip",
          "structured": false
        },
        "trueSymbol": {
          "type": "string",
          "attribute": "true-symbol",
          "structured": false
        },
        "trueValue": {
          "type": "string",
          "attribute": "true-value",
          "structured": false
        },
        "type": {
          "type": "ColumnType",
          "attribute": "type",
          "structured": false
        },
        "useSymbols": {
          "type": "boolean",
          "attribute": "use-symbols",
          "structured": false
        },
        "width": {
          "type": "string",
          "attribute": "width",
          "structured": false
        },
        "wrap": {
          "type": "boolean",
          "attribute": "wrap",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "column-changed",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        ""
      ]
    },
    "snice-command-palette": {
      "tagName": "snice-command-palette",
      "className": "SniceCommandPalette",
      "modulePath": "snice/components/command-palette/snice-command-palette",
      "sourceModule": "dist/components/command-palette/snice-command-palette.js",
      "family": "command-palette",
      "attributes": {
        "case-sensitive": {
          "property": "caseSensitive",
          "type": "boolean",
          "literals": []
        },
        "max-results": {
          "property": "maxResults",
          "type": "number",
          "literals": []
        },
        "no-results-text": {
          "property": "noResultsText",
          "type": "string",
          "literals": []
        },
        "open": {
          "property": "open",
          "type": "boolean",
          "literals": []
        },
        "placeholder": {
          "property": "placeholder",
          "type": "string",
          "literals": []
        },
        "recent-commands-limit": {
          "property": "recentCommandsLimit",
          "type": "number",
          "literals": []
        },
        "show-recent-commands": {
          "property": "showRecentCommands",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "caseSensitive": {
          "type": "boolean",
          "attribute": "case-sensitive",
          "structured": false
        },
        "commands": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "maxResults": {
          "type": "number",
          "attribute": "max-results",
          "structured": false
        },
        "noResultsText": {
          "type": "string",
          "attribute": "no-results-text",
          "structured": false
        },
        "open": {
          "type": "boolean",
          "attribute": "open",
          "structured": false
        },
        "placeholder": {
          "type": "string",
          "attribute": "placeholder",
          "structured": false
        },
        "recentCommandsLimit": {
          "type": "number",
          "attribute": "recent-commands-limit",
          "structured": false
        },
        "showRecentCommands": {
          "type": "boolean",
          "attribute": "show-recent-commands",
          "structured": false
        }
      },
      "structuredProperties": [
        "commands"
      ],
      "events": [
        {
          "name": "command-execute",
          "type": "CustomEvent<CommandExecuteDetail>"
        },
        {
          "name": "command-palette-close",
          "type": "CustomEvent<CommandPaletteCloseDetail>"
        },
        {
          "name": "command-palette-open",
          "type": "CustomEvent<CommandPaletteOpenDetail>"
        },
        {
          "name": "command-search",
          "type": "CustomEvent<CommandSearchDetail>"
        },
        {
          "name": "command-select",
          "type": "CustomEvent<CommandSelectDetail>"
        }
      ],
      "slots": []
    },
    "snice-comment": {
      "tagName": "snice-comment",
      "className": "SniceComment",
      "modulePath": "snice/components/comments/snice-comments",
      "sourceModule": "dist/components/comments/snice-comments.js",
      "family": "comments",
      "attributes": {},
      "properties": {},
      "structuredProperties": [],
      "events": [],
      "slots": [
        ""
      ]
    },
    "snice-comments": {
      "tagName": "snice-comments",
      "className": "SniceComments",
      "modulePath": "snice/components/comments/snice-comments",
      "sourceModule": "dist/components/comments/snice-comments.js",
      "family": "comments",
      "attributes": {
        "allow-likes": {
          "property": "allowLikes",
          "type": "boolean",
          "literals": []
        },
        "allow-replies": {
          "property": "allowReplies",
          "type": "boolean",
          "literals": []
        },
        "current-user": {
          "property": "currentUser",
          "type": "string",
          "literals": []
        },
        "max-depth": {
          "property": "maxDepth",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "allowLikes": {
          "type": "boolean",
          "attribute": "allow-likes",
          "structured": false
        },
        "allowReplies": {
          "type": "boolean",
          "attribute": "allow-replies",
          "structured": false
        },
        "comments": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "currentUser": {
          "type": "string",
          "attribute": "current-user",
          "structured": false
        },
        "maxDepth": {
          "type": "number",
          "attribute": "max-depth",
          "structured": false
        }
      },
      "structuredProperties": [
        "comments"
      ],
      "events": [
        {
          "name": "comment-add",
          "type": "CustomEvent<CommentAddDetail>"
        },
        {
          "name": "comment-delete",
          "type": "CustomEvent<CommentDeleteDetail>"
        },
        {
          "name": "comment-like",
          "type": "CustomEvent<CommentLikeDetail>"
        },
        {
          "name": "comment-reply",
          "type": "CustomEvent<CommentReplyDetail>"
        }
      ],
      "slots": [
        ""
      ]
    },
    "snice-countdown": {
      "tagName": "snice-countdown",
      "className": "SniceCountdown",
      "modulePath": "snice/components/countdown/snice-countdown",
      "sourceModule": "dist/components/countdown/snice-countdown.js",
      "family": "countdown",
      "attributes": {
        "format": {
          "property": "format",
          "type": "'dhms' | 'hms' | 'ms'",
          "literals": [
            "dhms",
            "hms",
            "ms"
          ]
        },
        "target": {
          "property": "target",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'flip' | 'simple' | 'circular'",
          "literals": [
            "flip",
            "simple",
            "circular"
          ]
        }
      },
      "properties": {
        "format": {
          "type": "'dhms' | 'hms' | 'ms'",
          "attribute": "format",
          "structured": false
        },
        "target": {
          "type": "string",
          "attribute": "target",
          "structured": false
        },
        "variant": {
          "type": "'flip' | 'simple' | 'circular'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "countdown-complete",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "countdown-tick",
          "type": "CustomEvent<CountdownValues>"
        }
      ],
      "slots": []
    },
    "snice-cropper": {
      "tagName": "snice-cropper",
      "className": "SniceCropper",
      "modulePath": "snice/components/cropper/snice-cropper",
      "sourceModule": "dist/components/cropper/snice-cropper.js",
      "family": "cropper",
      "attributes": {
        "aspect-ratio": {
          "property": "aspectRatio",
          "type": "number",
          "literals": []
        },
        "min-height": {
          "property": "minHeight",
          "type": "number",
          "literals": []
        },
        "min-width": {
          "property": "minWidth",
          "type": "number",
          "literals": []
        },
        "output-type": {
          "property": "outputType",
          "type": "'png' | 'jpeg' | 'webp'",
          "literals": [
            "png",
            "jpeg",
            "webp"
          ]
        },
        "src": {
          "property": "src",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "aspectRatio": {
          "type": "number",
          "attribute": "aspect-ratio",
          "structured": false
        },
        "minHeight": {
          "type": "number",
          "attribute": "min-height",
          "structured": false
        },
        "minWidth": {
          "type": "number",
          "attribute": "min-width",
          "structured": false
        },
        "outputType": {
          "type": "'png' | 'jpeg' | 'webp'",
          "attribute": "output-type",
          "structured": false
        },
        "src": {
          "type": "string",
          "attribute": "src",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "crop-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "crop-complete",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-crumb": {
      "tagName": "snice-crumb",
      "className": "SniceCrumb",
      "modulePath": "snice/components/breadcrumbs/snice-crumb",
      "sourceModule": "dist/components/breadcrumbs/snice-crumb.js",
      "family": "breadcrumbs",
      "attributes": {
        "active": {
          "property": "active",
          "type": "boolean",
          "literals": []
        },
        "href": {
          "property": "href",
          "type": "string",
          "literals": []
        },
        "icon": {
          "property": "icon",
          "type": "string",
          "literals": []
        },
        "icon-image": {
          "property": "iconImage",
          "type": "string",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "active": {
          "type": "boolean",
          "attribute": "active",
          "structured": false
        },
        "href": {
          "type": "string",
          "attribute": "href",
          "structured": false
        },
        "icon": {
          "type": "string",
          "attribute": "icon",
          "structured": false
        },
        "iconImage": {
          "type": "string",
          "attribute": "icon-image",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": []
    },
    "snice-data-card": {
      "tagName": "snice-data-card",
      "className": "SniceDataCard",
      "modulePath": "snice/components/data-card/snice-data-card",
      "sourceModule": "dist/components/data-card/snice-data-card.js",
      "family": "data-card",
      "attributes": {
        "editable": {
          "property": "editable",
          "type": "boolean",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'default' | 'horizontal' | 'compact'",
          "literals": [
            "default",
            "horizontal",
            "compact"
          ]
        }
      },
      "properties": {
        "editable": {
          "type": "boolean",
          "attribute": "editable",
          "structured": false
        },
        "fields": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "variant": {
          "type": "'default' | 'horizontal' | 'compact'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [
        "fields"
      ],
      "events": [
        {
          "name": "field-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "field-save",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        "header",
        "title"
      ]
    },
    "snice-date-picker": {
      "tagName": "snice-date-picker",
      "className": "SniceDatePicker",
      "modulePath": "snice/components/date-picker/snice-date-picker",
      "sourceModule": "dist/components/date-picker/snice-date-picker.js",
      "family": "date-picker",
      "attributes": {
        "clearable": {
          "property": "clearable",
          "type": "boolean",
          "literals": []
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "error-text": {
          "property": "errorText",
          "type": "string",
          "literals": []
        },
        "first-day-of-week": {
          "property": "firstDayOfWeek",
          "type": "number",
          "literals": []
        },
        "format": {
          "property": "format",
          "type": "'yyyy-mm-dd' | 'mm/dd/yyyy' | 'dd/mm/yyyy' | 'yyyy/mm/dd' | 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'mmmm dd, yyyy'",
          "literals": [
            "yyyy-mm-dd",
            "mm/dd/yyyy",
            "dd/mm/yyyy",
            "yyyy/mm/dd",
            "dd-mm-yyyy",
            "mm-dd-yyyy",
            "mmmm dd, yyyy"
          ]
        },
        "helper-text": {
          "property": "helperText",
          "type": "string",
          "literals": []
        },
        "invalid": {
          "property": "invalid",
          "type": "boolean",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "loading": {
          "property": "loading",
          "type": "boolean",
          "literals": []
        },
        "max": {
          "property": "max",
          "type": "string",
          "literals": []
        },
        "min": {
          "property": "min",
          "type": "string",
          "literals": []
        },
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "open": {
          "property": "open",
          "type": "boolean",
          "literals": []
        },
        "placeholder": {
          "property": "placeholder",
          "type": "string",
          "literals": []
        },
        "readonly": {
          "property": "readonly",
          "type": "boolean",
          "literals": []
        },
        "required": {
          "property": "required",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "value": {
          "property": "defaultValue",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'outlined' | 'filled' | 'underlined'",
          "literals": [
            "outlined",
            "filled",
            "underlined"
          ]
        }
      },
      "properties": {
        "clearable": {
          "type": "boolean",
          "attribute": "clearable",
          "structured": false
        },
        "defaultValue": {
          "type": "string",
          "attribute": "value",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "errorText": {
          "type": "string",
          "attribute": "error-text",
          "structured": false
        },
        "firstDayOfWeek": {
          "type": "number",
          "attribute": "first-day-of-week",
          "structured": false
        },
        "form": {
          "type": "HTMLFormElement | null",
          "attribute": null,
          "structured": false
        },
        "format": {
          "type": "'yyyy-mm-dd' | 'mm/dd/yyyy' | 'dd/mm/yyyy' | 'yyyy/mm/dd' | 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'mmmm dd, yyyy'",
          "attribute": "format",
          "structured": false
        },
        "helperText": {
          "type": "string",
          "attribute": "helper-text",
          "structured": false
        },
        "invalid": {
          "type": "boolean",
          "attribute": "invalid",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "labels": {
          "type": "NodeList | null",
          "attribute": null,
          "structured": false
        },
        "loading": {
          "type": "boolean",
          "attribute": "loading",
          "structured": false
        },
        "max": {
          "type": "string",
          "attribute": "max",
          "structured": false
        },
        "min": {
          "type": "string",
          "attribute": "min",
          "structured": false
        },
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "open": {
          "type": "boolean",
          "attribute": "open",
          "structured": false
        },
        "placeholder": {
          "type": "string",
          "attribute": "placeholder",
          "structured": false
        },
        "readonly": {
          "type": "boolean",
          "attribute": "readonly",
          "structured": false
        },
        "required": {
          "type": "boolean",
          "attribute": "required",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "type": {
          "type": "'date'",
          "attribute": null,
          "structured": false
        },
        "validationMessage": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "validity": {
          "type": "ValidityState",
          "attribute": null,
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "variant": {
          "type": "'outlined' | 'filled' | 'underlined'",
          "attribute": "variant",
          "structured": false
        },
        "willValidate": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "datepicker-blur",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "datepicker-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "datepicker-clear",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "datepicker-close",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "datepicker-focus",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "datepicker-input",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "datepicker-open",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "datepicker-select",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-date-range-picker": {
      "tagName": "snice-date-range-picker",
      "className": "SniceDateRangePicker",
      "modulePath": "snice/components/date-range-picker/snice-date-range-picker",
      "sourceModule": "dist/components/date-range-picker/snice-date-range-picker.js",
      "family": "date-range-picker",
      "attributes": {
        "clearable": {
          "property": "clearable",
          "type": "boolean",
          "literals": []
        },
        "columns": {
          "property": "columns",
          "type": "number",
          "literals": []
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "end": {
          "property": "defaultEnd",
          "type": "string",
          "literals": []
        },
        "error-text": {
          "property": "errorText",
          "type": "string",
          "literals": []
        },
        "first-day-of-week": {
          "property": "firstDayOfWeek",
          "type": "number",
          "literals": []
        },
        "format": {
          "property": "format",
          "type": "'yyyy-mm-dd' | 'mm/dd/yyyy' | 'dd/mm/yyyy' | 'yyyy/mm/dd' | 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'mmmm dd, yyyy'",
          "literals": [
            "yyyy-mm-dd",
            "mm/dd/yyyy",
            "dd/mm/yyyy",
            "yyyy/mm/dd",
            "dd-mm-yyyy",
            "mm-dd-yyyy",
            "mmmm dd, yyyy"
          ]
        },
        "helper-text": {
          "property": "helperText",
          "type": "string",
          "literals": []
        },
        "invalid": {
          "property": "invalid",
          "type": "boolean",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "loading": {
          "property": "loading",
          "type": "boolean",
          "literals": []
        },
        "max": {
          "property": "max",
          "type": "string",
          "literals": []
        },
        "min": {
          "property": "min",
          "type": "string",
          "literals": []
        },
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "placeholder": {
          "property": "placeholder",
          "type": "string",
          "literals": []
        },
        "readonly": {
          "property": "readonly",
          "type": "boolean",
          "literals": []
        },
        "required": {
          "property": "required",
          "type": "boolean",
          "literals": []
        },
        "show-calendar": {
          "property": "showCalendar",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "start": {
          "property": "defaultStart",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'outlined' | 'filled' | 'underlined'",
          "literals": [
            "outlined",
            "filled",
            "underlined"
          ]
        }
      },
      "properties": {
        "clearable": {
          "type": "boolean",
          "attribute": "clearable",
          "structured": false
        },
        "columns": {
          "type": "number",
          "attribute": "columns",
          "structured": false
        },
        "defaultEnd": {
          "type": "string",
          "attribute": "end",
          "structured": false
        },
        "defaultStart": {
          "type": "string",
          "attribute": "start",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "end": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "errorText": {
          "type": "string",
          "attribute": "error-text",
          "structured": false
        },
        "firstDayOfWeek": {
          "type": "number",
          "attribute": "first-day-of-week",
          "structured": false
        },
        "form": {
          "type": "HTMLFormElement | null",
          "attribute": null,
          "structured": false
        },
        "format": {
          "type": "'yyyy-mm-dd' | 'mm/dd/yyyy' | 'dd/mm/yyyy' | 'yyyy/mm/dd' | 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'mmmm dd, yyyy'",
          "attribute": "format",
          "structured": false
        },
        "helperText": {
          "type": "string",
          "attribute": "helper-text",
          "structured": false
        },
        "invalid": {
          "type": "boolean",
          "attribute": "invalid",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "labels": {
          "type": "NodeList | null",
          "attribute": null,
          "structured": false
        },
        "loading": {
          "type": "boolean",
          "attribute": "loading",
          "structured": false
        },
        "max": {
          "type": "string",
          "attribute": "max",
          "structured": false
        },
        "min": {
          "type": "string",
          "attribute": "min",
          "structured": false
        },
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "placeholder": {
          "type": "string",
          "attribute": "placeholder",
          "structured": false
        },
        "presets": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "readonly": {
          "type": "boolean",
          "attribute": "readonly",
          "structured": false
        },
        "required": {
          "type": "boolean",
          "attribute": "required",
          "structured": false
        },
        "showCalendar": {
          "type": "boolean",
          "attribute": "show-calendar",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "start": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "validationMessage": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "validity": {
          "type": "ValidityState",
          "attribute": null,
          "structured": false
        },
        "variant": {
          "type": "'outlined' | 'filled' | 'underlined'",
          "attribute": "variant",
          "structured": false
        },
        "willValidate": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        }
      },
      "structuredProperties": [
        "presets"
      ],
      "events": [
        {
          "name": "daterange-blur",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "daterange-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "daterange-clear",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "daterange-close",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "daterange-focus",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "daterange-open",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "daterange-preset",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-date-time-picker": {
      "tagName": "snice-date-time-picker",
      "className": "SniceDateTimePicker",
      "modulePath": "snice/components/date-time-picker/snice-date-time-picker",
      "sourceModule": "dist/components/date-time-picker/snice-date-time-picker.js",
      "family": "date-time-picker",
      "attributes": {
        "clearable": {
          "property": "clearable",
          "type": "boolean",
          "literals": []
        },
        "date-format": {
          "property": "dateFormat",
          "type": "'yyyy-mm-dd' | 'mm/dd/yyyy' | 'dd/mm/yyyy' | 'yyyy/mm/dd' | 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'mmmm dd, yyyy'",
          "literals": [
            "yyyy-mm-dd",
            "mm/dd/yyyy",
            "dd/mm/yyyy",
            "yyyy/mm/dd",
            "dd-mm-yyyy",
            "mm-dd-yyyy",
            "mmmm dd, yyyy"
          ]
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "error-text": {
          "property": "errorText",
          "type": "string",
          "literals": []
        },
        "helper-text": {
          "property": "helperText",
          "type": "string",
          "literals": []
        },
        "invalid": {
          "property": "invalid",
          "type": "boolean",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "loading": {
          "property": "loading",
          "type": "boolean",
          "literals": []
        },
        "max": {
          "property": "max",
          "type": "string",
          "literals": []
        },
        "min": {
          "property": "min",
          "type": "string",
          "literals": []
        },
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "placeholder": {
          "property": "placeholder",
          "type": "string",
          "literals": []
        },
        "readonly": {
          "property": "readonly",
          "type": "boolean",
          "literals": []
        },
        "required": {
          "property": "required",
          "type": "boolean",
          "literals": []
        },
        "show-seconds": {
          "property": "showSeconds",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "time-format": {
          "property": "timeFormat",
          "type": "'12h' | '24h'",
          "literals": [
            "12h",
            "24h"
          ]
        },
        "value": {
          "property": "defaultValue",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'dropdown' | 'inline'",
          "literals": [
            "dropdown",
            "inline"
          ]
        }
      },
      "properties": {
        "clearable": {
          "type": "boolean",
          "attribute": "clearable",
          "structured": false
        },
        "dateFormat": {
          "type": "'yyyy-mm-dd' | 'mm/dd/yyyy' | 'dd/mm/yyyy' | 'yyyy/mm/dd' | 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'mmmm dd, yyyy'",
          "attribute": "date-format",
          "structured": false
        },
        "defaultValue": {
          "type": "string",
          "attribute": "value",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "errorText": {
          "type": "string",
          "attribute": "error-text",
          "structured": false
        },
        "form": {
          "type": "HTMLFormElement | null",
          "attribute": null,
          "structured": false
        },
        "helperText": {
          "type": "string",
          "attribute": "helper-text",
          "structured": false
        },
        "invalid": {
          "type": "boolean",
          "attribute": "invalid",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "labels": {
          "type": "NodeList | null",
          "attribute": null,
          "structured": false
        },
        "loading": {
          "type": "boolean",
          "attribute": "loading",
          "structured": false
        },
        "max": {
          "type": "string",
          "attribute": "max",
          "structured": false
        },
        "min": {
          "type": "string",
          "attribute": "min",
          "structured": false
        },
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "placeholder": {
          "type": "string",
          "attribute": "placeholder",
          "structured": false
        },
        "readonly": {
          "type": "boolean",
          "attribute": "readonly",
          "structured": false
        },
        "required": {
          "type": "boolean",
          "attribute": "required",
          "structured": false
        },
        "showSeconds": {
          "type": "boolean",
          "attribute": "show-seconds",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "timeFormat": {
          "type": "'12h' | '24h'",
          "attribute": "time-format",
          "structured": false
        },
        "type": {
          "type": "'datetime-local'",
          "attribute": null,
          "structured": false
        },
        "validationMessage": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "validity": {
          "type": "ValidityState",
          "attribute": null,
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "variant": {
          "type": "'dropdown' | 'inline'",
          "attribute": "variant",
          "structured": false
        },
        "willValidate": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "datetime-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "datetimepicker-blur",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "datetimepicker-clear",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "datetimepicker-close",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "datetimepicker-focus",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "datetimepicker-open",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-diff": {
      "tagName": "snice-diff",
      "className": "SniceDiff",
      "modulePath": "snice/components/diff/snice-diff",
      "sourceModule": "dist/components/diff/snice-diff.js",
      "family": "diff",
      "attributes": {
        "context-lines": {
          "property": "contextLines",
          "type": "number",
          "literals": []
        },
        "language": {
          "property": "language",
          "type": "string",
          "literals": []
        },
        "line-numbers": {
          "property": "lineNumbers",
          "type": "boolean",
          "literals": []
        },
        "markers": {
          "property": "markers",
          "type": "boolean",
          "literals": []
        },
        "mode": {
          "property": "mode",
          "type": "'split' | 'unified'",
          "literals": [
            "split",
            "unified"
          ]
        },
        "new-text": {
          "property": "newText",
          "type": "string",
          "literals": []
        },
        "old-text": {
          "property": "oldText",
          "type": "string",
          "literals": []
        },
        "show-mode-toggle": {
          "property": "showModeToggle",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "contextLines": {
          "type": "number",
          "attribute": "context-lines",
          "structured": false
        },
        "language": {
          "type": "string",
          "attribute": "language",
          "structured": false
        },
        "lineNumbers": {
          "type": "boolean",
          "attribute": "line-numbers",
          "structured": false
        },
        "markers": {
          "type": "boolean",
          "attribute": "markers",
          "structured": false
        },
        "mode": {
          "type": "'split' | 'unified'",
          "attribute": "mode",
          "structured": false
        },
        "newText": {
          "type": "string",
          "attribute": "new-text",
          "structured": false
        },
        "oldText": {
          "type": "string",
          "attribute": "old-text",
          "structured": false
        },
        "showModeToggle": {
          "type": "boolean",
          "attribute": "show-mode-toggle",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "diff-computed",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "mode-change",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-divider": {
      "tagName": "snice-divider",
      "className": "SniceDivider",
      "modulePath": "snice/components/divider/snice-divider",
      "sourceModule": "dist/components/divider/snice-divider.js",
      "family": "divider",
      "attributes": {
        "align": {
          "property": "align",
          "type": "'start' | 'center' | 'end'",
          "literals": [
            "start",
            "center",
            "end"
          ]
        },
        "capped": {
          "property": "capped",
          "type": "boolean",
          "literals": []
        },
        "color": {
          "property": "color",
          "type": "string",
          "literals": []
        },
        "orientation": {
          "property": "orientation",
          "type": "'horizontal' | 'vertical'",
          "literals": [
            "horizontal",
            "vertical"
          ]
        },
        "spacing": {
          "property": "spacing",
          "type": "'none' | 'small' | 'medium' | 'large'",
          "literals": [
            "none",
            "small",
            "medium",
            "large"
          ]
        },
        "text": {
          "property": "text",
          "type": "string",
          "literals": []
        },
        "text-background": {
          "property": "textBackground",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'solid' | 'dashed' | 'dotted'",
          "literals": [
            "solid",
            "dashed",
            "dotted"
          ]
        }
      },
      "properties": {
        "align": {
          "type": "'start' | 'center' | 'end'",
          "attribute": "align",
          "structured": false
        },
        "capped": {
          "type": "boolean",
          "attribute": "capped",
          "structured": false
        },
        "color": {
          "type": "string",
          "attribute": "color",
          "structured": false
        },
        "orientation": {
          "type": "'horizontal' | 'vertical'",
          "attribute": "orientation",
          "structured": false
        },
        "spacing": {
          "type": "'none' | 'small' | 'medium' | 'large'",
          "attribute": "spacing",
          "structured": false
        },
        "text": {
          "type": "string",
          "attribute": "text",
          "structured": false
        },
        "textBackground": {
          "type": "string",
          "attribute": "text-background",
          "structured": false
        },
        "variant": {
          "type": "'solid' | 'dashed' | 'dotted'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": []
    },
    "snice-doc": {
      "tagName": "snice-doc",
      "className": "SniceDoc",
      "modulePath": "snice/components/doc/snice-doc",
      "sourceModule": "dist/components/doc/snice-doc.js",
      "family": "doc",
      "attributes": {
        "icons": {
          "property": "icons",
          "type": "string",
          "literals": []
        },
        "placeholder": {
          "property": "placeholder",
          "type": "string",
          "literals": []
        },
        "readonly": {
          "property": "readonly",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "icons": {
          "type": "string",
          "attribute": "icons",
          "structured": false
        },
        "placeholder": {
          "type": "string",
          "attribute": "placeholder",
          "structured": false
        },
        "readonly": {
          "type": "boolean",
          "attribute": "readonly",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": []
    },
    "snice-draw": {
      "tagName": "snice-draw",
      "className": "SniceDraw",
      "modulePath": "snice/components/draw/snice-draw",
      "sourceModule": "dist/components/draw/snice-draw.js",
      "family": "draw",
      "attributes": {
        "auto-circle": {
          "property": "autoCircle",
          "type": "boolean",
          "literals": []
        },
        "auto-polygon": {
          "property": "autoPolygon",
          "type": "boolean",
          "literals": []
        },
        "background-color": {
          "property": "backgroundColor",
          "type": "string",
          "literals": []
        },
        "circle-points": {
          "property": "circlePoints",
          "type": "number",
          "literals": []
        },
        "color": {
          "property": "color",
          "type": "string",
          "literals": []
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "friction": {
          "property": "friction",
          "type": "number",
          "literals": []
        },
        "height": {
          "property": "height",
          "type": "number",
          "literals": []
        },
        "lazy": {
          "property": "lazy",
          "type": "boolean",
          "literals": []
        },
        "lazy-radius": {
          "property": "lazyRadius",
          "type": "number",
          "literals": []
        },
        "polygon-curve-points": {
          "property": "polygonCurvePoints",
          "type": "number",
          "literals": []
        },
        "smoothing": {
          "property": "smoothing",
          "type": "number",
          "literals": []
        },
        "stroke-width": {
          "property": "strokeWidth",
          "type": "number",
          "literals": []
        },
        "tool": {
          "property": "tool",
          "type": "string",
          "literals": []
        },
        "width": {
          "property": "width",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "autoCircle": {
          "type": "boolean",
          "attribute": "auto-circle",
          "structured": false
        },
        "autoPolygon": {
          "type": "boolean",
          "attribute": "auto-polygon",
          "structured": false
        },
        "backgroundColor": {
          "type": "string",
          "attribute": "background-color",
          "structured": false
        },
        "circlePoints": {
          "type": "number",
          "attribute": "circle-points",
          "structured": false
        },
        "color": {
          "type": "string",
          "attribute": "color",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "friction": {
          "type": "number",
          "attribute": "friction",
          "structured": false
        },
        "height": {
          "type": "number",
          "attribute": "height",
          "structured": false
        },
        "lazy": {
          "type": "boolean",
          "attribute": "lazy",
          "structured": false
        },
        "lazyRadius": {
          "type": "number",
          "attribute": "lazy-radius",
          "structured": false
        },
        "polygonCurvePoints": {
          "type": "number",
          "attribute": "polygon-curve-points",
          "structured": false
        },
        "smoothing": {
          "type": "number",
          "attribute": "smoothing",
          "structured": false
        },
        "strokeWidth": {
          "type": "number",
          "attribute": "stroke-width",
          "structured": false
        },
        "tool": {
          "type": "string",
          "attribute": "tool",
          "structured": false
        },
        "width": {
          "type": "number",
          "attribute": "width",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "draw-clear",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "draw-end",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "draw-redo",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "draw-start",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "draw-undo",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-drawer": {
      "tagName": "snice-drawer",
      "className": "SniceDrawer",
      "modulePath": "snice/components/drawer/snice-drawer",
      "sourceModule": "dist/components/drawer/snice-drawer.js",
      "family": "drawer",
      "attributes": {
        "breakpoint": {
          "property": "breakpoint",
          "type": "number",
          "literals": []
        },
        "contained": {
          "property": "contained",
          "type": "boolean",
          "literals": []
        },
        "inline": {
          "property": "inline",
          "type": "boolean",
          "literals": []
        },
        "no-backdrop": {
          "property": "noBackdrop",
          "type": "boolean",
          "literals": []
        },
        "no-backdrop-dismiss": {
          "property": "noBackdropDismiss",
          "type": "boolean",
          "literals": []
        },
        "no-escape-dismiss": {
          "property": "noEscapeDismiss",
          "type": "boolean",
          "literals": []
        },
        "no-focus-trap": {
          "property": "noFocusTrap",
          "type": "boolean",
          "literals": []
        },
        "no-footer": {
          "property": "noFooter",
          "type": "boolean",
          "literals": []
        },
        "no-header": {
          "property": "noHeader",
          "type": "boolean",
          "literals": []
        },
        "open": {
          "property": "open",
          "type": "boolean",
          "literals": []
        },
        "persistent": {
          "property": "persistent",
          "type": "boolean",
          "literals": []
        },
        "position": {
          "property": "position",
          "type": "'left' | 'right' | 'top' | 'bottom'",
          "literals": [
            "left",
            "right",
            "top",
            "bottom"
          ]
        },
        "push-content": {
          "property": "pushContent",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large' | 'xl' | 'xxl' | 'xxxl' | 'full'",
          "literals": [
            "small",
            "medium",
            "large",
            "xl",
            "xxl",
            "xxxl",
            "full"
          ]
        }
      },
      "properties": {
        "breakpoint": {
          "type": "number",
          "attribute": "breakpoint",
          "structured": false
        },
        "contained": {
          "type": "boolean",
          "attribute": "contained",
          "structured": false
        },
        "inline": {
          "type": "boolean",
          "attribute": "inline",
          "structured": false
        },
        "noBackdrop": {
          "type": "boolean",
          "attribute": "no-backdrop",
          "structured": false
        },
        "noBackdropDismiss": {
          "type": "boolean",
          "attribute": "no-backdrop-dismiss",
          "structured": false
        },
        "noEscapeDismiss": {
          "type": "boolean",
          "attribute": "no-escape-dismiss",
          "structured": false
        },
        "noFocusTrap": {
          "type": "boolean",
          "attribute": "no-focus-trap",
          "structured": false
        },
        "noFooter": {
          "type": "boolean",
          "attribute": "no-footer",
          "structured": false
        },
        "noHeader": {
          "type": "boolean",
          "attribute": "no-header",
          "structured": false
        },
        "open": {
          "type": "boolean",
          "attribute": "open",
          "structured": false
        },
        "persistent": {
          "type": "boolean",
          "attribute": "persistent",
          "structured": false
        },
        "position": {
          "type": "'left' | 'right' | 'top' | 'bottom'",
          "attribute": "position",
          "structured": false
        },
        "pushContent": {
          "type": "boolean",
          "attribute": "push-content",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large' | 'xl' | 'xxl' | 'xxxl' | 'full'",
          "attribute": "size",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "drawer-close",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "drawer-open",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        "",
        "footer",
        "title"
      ]
    },
    "snice-drawer-target": {
      "tagName": "snice-drawer-target",
      "className": "SniceDrawerTarget",
      "modulePath": "snice/components/drawer/snice-drawer-target",
      "sourceModule": "dist/components/drawer/snice-drawer-target.js",
      "family": "drawer",
      "attributes": {
        "for": {
          "property": "for",
          "type": "string",
          "literals": []
        },
        "push": {
          "property": "push",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "for": {
          "type": "string",
          "attribute": "for",
          "structured": false
        },
        "push": {
          "type": "string",
          "attribute": "push",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": [
        ""
      ]
    },
    "snice-empty-state": {
      "tagName": "snice-empty-state",
      "className": "SniceEmptyState",
      "modulePath": "snice/components/empty-state/snice-empty-state",
      "sourceModule": "dist/components/empty-state/snice-empty-state.js",
      "family": "empty-state",
      "attributes": {
        "action-href": {
          "property": "actionHref",
          "type": "string",
          "literals": []
        },
        "action-text": {
          "property": "actionText",
          "type": "string",
          "literals": []
        },
        "description": {
          "property": "description",
          "type": "string",
          "literals": []
        },
        "icon": {
          "property": "icon",
          "type": "string",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "title": {
          "property": "title",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "actionHref": {
          "type": "string",
          "attribute": "action-href",
          "structured": false
        },
        "actionText": {
          "type": "string",
          "attribute": "action-text",
          "structured": false
        },
        "description": {
          "type": "string",
          "attribute": "description",
          "structured": false
        },
        "icon": {
          "type": "string",
          "attribute": "icon",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "title": {
          "type": "string",
          "attribute": "title",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "empty-state-action",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        "",
        "icon"
      ]
    },
    "snice-estimate": {
      "tagName": "snice-estimate",
      "className": "SniceEstimate",
      "modulePath": "snice/components/estimate/snice-estimate",
      "sourceModule": "dist/components/estimate/snice-estimate.js",
      "family": "estimate",
      "attributes": {
        "currency": {
          "property": "currency",
          "type": "string",
          "literals": []
        },
        "date": {
          "property": "date",
          "type": "string",
          "literals": []
        },
        "discount": {
          "property": "discount",
          "type": "number",
          "literals": []
        },
        "estimatenumber": {
          "property": "estimateNumber",
          "type": "string",
          "literals": []
        },
        "expirydate": {
          "property": "expiryDate",
          "type": "string",
          "literals": []
        },
        "notes": {
          "property": "notes",
          "type": "string",
          "literals": []
        },
        "qr-data": {
          "property": "qrData",
          "type": "string",
          "literals": []
        },
        "qr-position": {
          "property": "qrPosition",
          "type": "'top-right' | 'bottom-right' | 'footer'",
          "literals": [
            "top-right",
            "bottom-right",
            "footer"
          ]
        },
        "show-qr": {
          "property": "showQr",
          "type": "boolean",
          "literals": []
        },
        "status": {
          "property": "status",
          "type": "'draft' | 'sent' | 'accepted' | 'declined' | 'expired'",
          "literals": [
            "draft",
            "sent",
            "accepted",
            "declined",
            "expired"
          ]
        },
        "taxrate": {
          "property": "taxRate",
          "type": "number",
          "literals": []
        },
        "terms": {
          "property": "terms",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'standard' | 'comparison' | 'professional' | 'creative' | 'minimal'",
          "literals": [
            "standard",
            "comparison",
            "professional",
            "creative",
            "minimal"
          ]
        }
      },
      "properties": {
        "currency": {
          "type": "string",
          "attribute": "currency",
          "structured": false
        },
        "date": {
          "type": "string",
          "attribute": "date",
          "structured": false
        },
        "discount": {
          "type": "number",
          "attribute": "discount",
          "structured": false
        },
        "estimateNumber": {
          "type": "string",
          "attribute": "estimatenumber",
          "structured": false
        },
        "expiryDate": {
          "type": "string",
          "attribute": "expirydate",
          "structured": false
        },
        "from": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "items": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "notes": {
          "type": "string",
          "attribute": "notes",
          "structured": false
        },
        "qrData": {
          "type": "string",
          "attribute": "qr-data",
          "structured": false
        },
        "qrPosition": {
          "type": "'top-right' | 'bottom-right' | 'footer'",
          "attribute": "qr-position",
          "structured": false
        },
        "showQr": {
          "type": "boolean",
          "attribute": "show-qr",
          "structured": false
        },
        "status": {
          "type": "'draft' | 'sent' | 'accepted' | 'declined' | 'expired'",
          "attribute": "status",
          "structured": false
        },
        "taxRate": {
          "type": "number",
          "attribute": "taxrate",
          "structured": false
        },
        "terms": {
          "type": "string",
          "attribute": "terms",
          "structured": false
        },
        "to": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "variant": {
          "type": "'standard' | 'comparison' | 'professional' | 'creative' | 'minimal'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [
        "from",
        "items",
        "to"
      ],
      "events": [
        {
          "name": "estimate-accept",
          "type": "CustomEvent<EstimateAcceptDetail>"
        },
        {
          "name": "estimate-decline",
          "type": "CustomEvent<EstimateDeclineDetail>"
        },
        {
          "name": "item-toggle",
          "type": "CustomEvent<ItemToggleDetail>"
        }
      ],
      "slots": [
        "footer",
        "logo",
        "qr"
      ]
    },
    "snice-feature": {
      "tagName": "snice-feature",
      "className": "SniceFeature",
      "modulePath": "snice/components/pricing-table/snice-pricing-table",
      "sourceModule": "dist/components/pricing-table/snice-pricing-table.js",
      "family": "pricing-table",
      "attributes": {},
      "properties": {},
      "structuredProperties": [],
      "events": [],
      "slots": [
        ""
      ]
    },
    "snice-file-gallery": {
      "tagName": "snice-file-gallery",
      "className": "SniceFileGallery",
      "modulePath": "snice/components/file-gallery/snice-file-gallery",
      "sourceModule": "dist/components/file-gallery/snice-file-gallery.js",
      "family": "file-gallery",
      "attributes": {
        "accept": {
          "property": "accept",
          "type": "string",
          "literals": []
        },
        "allow-delete": {
          "property": "allowDelete",
          "type": "boolean",
          "literals": []
        },
        "allow-pause": {
          "property": "allowPause",
          "type": "boolean",
          "literals": []
        },
        "auto-upload": {
          "property": "autoUpload",
          "type": "boolean",
          "literals": []
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "max-files": {
          "property": "maxFiles",
          "type": "number",
          "literals": []
        },
        "max-size": {
          "property": "maxSize",
          "type": "number",
          "literals": []
        },
        "multiple": {
          "property": "multiple",
          "type": "boolean",
          "literals": []
        },
        "show-add-button": {
          "property": "showAddButton",
          "type": "boolean",
          "literals": []
        },
        "show-dropzone": {
          "property": "showDropzone",
          "type": "boolean",
          "literals": []
        },
        "show-header": {
          "property": "showHeader",
          "type": "boolean",
          "literals": []
        },
        "show-progress": {
          "property": "showProgress",
          "type": "boolean",
          "literals": []
        },
        "view": {
          "property": "view",
          "type": "'grid' | 'list'",
          "literals": [
            "grid",
            "list"
          ]
        }
      },
      "properties": {
        "accept": {
          "type": "string",
          "attribute": "accept",
          "structured": false
        },
        "allowDelete": {
          "type": "boolean",
          "attribute": "allow-delete",
          "structured": false
        },
        "allowPause": {
          "type": "boolean",
          "attribute": "allow-pause",
          "structured": false
        },
        "autoUpload": {
          "type": "boolean",
          "attribute": "auto-upload",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "maxFiles": {
          "type": "number",
          "attribute": "max-files",
          "structured": false
        },
        "maxSize": {
          "type": "number",
          "attribute": "max-size",
          "structured": false
        },
        "multiple": {
          "type": "boolean",
          "attribute": "multiple",
          "structured": false
        },
        "showAddButton": {
          "type": "boolean",
          "attribute": "show-add-button",
          "structured": false
        },
        "showDropzone": {
          "type": "boolean",
          "attribute": "show-dropzone",
          "structured": false
        },
        "showHeader": {
          "type": "boolean",
          "attribute": "show-header",
          "structured": false
        },
        "showProgress": {
          "type": "boolean",
          "attribute": "show-progress",
          "structured": false
        },
        "view": {
          "type": "'grid' | 'list'",
          "attribute": "view",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "custom-action-click",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "file-remove",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "files-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "gallery-error",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "upload-complete",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "upload-error",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "upload-pause",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "upload-progress",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-file-upload": {
      "tagName": "snice-file-upload",
      "className": "SniceFileUpload",
      "modulePath": "snice/components/file-upload/snice-file-upload",
      "sourceModule": "dist/components/file-upload/snice-file-upload.js",
      "family": "file-upload",
      "attributes": {
        "accept": {
          "property": "accept",
          "type": "string",
          "literals": []
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "drag-drop": {
          "property": "dragDrop",
          "type": "boolean",
          "literals": []
        },
        "error-text": {
          "property": "errorText",
          "type": "string",
          "literals": []
        },
        "helper-text": {
          "property": "helperText",
          "type": "string",
          "literals": []
        },
        "invalid": {
          "property": "invalid",
          "type": "boolean",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "max-files": {
          "property": "maxFiles",
          "type": "number",
          "literals": []
        },
        "max-size": {
          "property": "maxSize",
          "type": "number",
          "literals": []
        },
        "multiple": {
          "property": "multiple",
          "type": "boolean",
          "literals": []
        },
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "required": {
          "property": "required",
          "type": "boolean",
          "literals": []
        },
        "show-preview": {
          "property": "showPreview",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "variant": {
          "property": "variant",
          "type": "'outlined' | 'filled'",
          "literals": [
            "outlined",
            "filled"
          ]
        }
      },
      "properties": {
        "accept": {
          "type": "string",
          "attribute": "accept",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "dragDrop": {
          "type": "boolean",
          "attribute": "drag-drop",
          "structured": false
        },
        "errorText": {
          "type": "string",
          "attribute": "error-text",
          "structured": false
        },
        "files": {
          "type": "FileList | null",
          "attribute": null,
          "structured": false
        },
        "form": {
          "type": "HTMLFormElement | null",
          "attribute": null,
          "structured": false
        },
        "helperText": {
          "type": "string",
          "attribute": "helper-text",
          "structured": false
        },
        "invalid": {
          "type": "boolean",
          "attribute": "invalid",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "labels": {
          "type": "NodeList | null",
          "attribute": null,
          "structured": false
        },
        "maxFiles": {
          "type": "number",
          "attribute": "max-files",
          "structured": false
        },
        "maxSize": {
          "type": "number",
          "attribute": "max-size",
          "structured": false
        },
        "multiple": {
          "type": "boolean",
          "attribute": "multiple",
          "structured": false
        },
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "required": {
          "type": "boolean",
          "attribute": "required",
          "structured": false
        },
        "showPreview": {
          "type": "boolean",
          "attribute": "show-preview",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "type": {
          "type": "'file'",
          "attribute": null,
          "structured": false
        },
        "validationMessage": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "validity": {
          "type": "ValidityState",
          "attribute": null,
          "structured": false
        },
        "variant": {
          "type": "'outlined' | 'filled'",
          "attribute": "variant",
          "structured": false
        },
        "willValidate": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "file-upload-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "file-upload-error",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-flip-card": {
      "tagName": "snice-flip-card",
      "className": "SniceFlipCard",
      "modulePath": "snice/components/flip-card/snice-flip-card",
      "sourceModule": "dist/components/flip-card/snice-flip-card.js",
      "family": "flip-card",
      "attributes": {
        "click-to-flip": {
          "property": "clickToFlip",
          "type": "boolean",
          "literals": []
        },
        "direction": {
          "property": "direction",
          "type": "'horizontal' | 'vertical'",
          "literals": [
            "horizontal",
            "vertical"
          ]
        },
        "duration": {
          "property": "duration",
          "type": "number",
          "literals": []
        },
        "flipped": {
          "property": "flipped",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "clickToFlip": {
          "type": "boolean",
          "attribute": "click-to-flip",
          "structured": false
        },
        "direction": {
          "type": "'horizontal' | 'vertical'",
          "attribute": "direction",
          "structured": false
        },
        "duration": {
          "type": "number",
          "attribute": "duration",
          "structured": false
        },
        "flipped": {
          "type": "boolean",
          "attribute": "flipped",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "flip-change",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        "back",
        "front"
      ]
    },
    "snice-flow": {
      "tagName": "snice-flow",
      "className": "SniceFlow",
      "modulePath": "snice/components/flow/snice-flow",
      "sourceModule": "dist/components/flow/snice-flow.js",
      "family": "flow",
      "attributes": {
        "editable": {
          "property": "editable",
          "type": "boolean",
          "literals": []
        },
        "grid-size": {
          "property": "gridSize",
          "type": "number",
          "literals": []
        },
        "minimap": {
          "property": "minimap",
          "type": "boolean",
          "literals": []
        },
        "pan-enabled": {
          "property": "panEnabled",
          "type": "boolean",
          "literals": []
        },
        "snap-to-grid": {
          "property": "snapToGrid",
          "type": "boolean",
          "literals": []
        },
        "zoom-enabled": {
          "property": "zoomEnabled",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "edges": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "editable": {
          "type": "boolean",
          "attribute": "editable",
          "structured": false
        },
        "gridSize": {
          "type": "number",
          "attribute": "grid-size",
          "structured": false
        },
        "minimap": {
          "type": "boolean",
          "attribute": "minimap",
          "structured": false
        },
        "nodes": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "panEnabled": {
          "type": "boolean",
          "attribute": "pan-enabled",
          "structured": false
        },
        "snapToGrid": {
          "type": "boolean",
          "attribute": "snap-to-grid",
          "structured": false
        },
        "zoomEnabled": {
          "type": "boolean",
          "attribute": "zoom-enabled",
          "structured": false
        }
      },
      "structuredProperties": [
        "edges",
        "nodes"
      ],
      "events": [
        {
          "name": "canvas-click",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "edge-connect",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "edge-disconnect",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "node-drag",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "node-select",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-form-layout": {
      "tagName": "snice-form-layout",
      "className": "SniceFormLayout",
      "modulePath": "snice/components/form-layout/snice-form-layout",
      "sourceModule": "dist/components/form-layout/snice-form-layout.js",
      "family": "form-layout",
      "attributes": {
        "columns": {
          "property": "columns",
          "type": "number",
          "literals": []
        },
        "gap": {
          "property": "gap",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "label-position": {
          "property": "labelPosition",
          "type": "'top' | 'left' | 'right'",
          "literals": [
            "top",
            "left",
            "right"
          ]
        },
        "label-width": {
          "property": "labelWidth",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'default' | 'compact' | 'inline'",
          "literals": [
            "default",
            "compact",
            "inline"
          ]
        }
      },
      "properties": {
        "columns": {
          "type": "number",
          "attribute": "columns",
          "structured": false
        },
        "gap": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "gap",
          "structured": false
        },
        "labelPosition": {
          "type": "'top' | 'left' | 'right'",
          "attribute": "label-position",
          "structured": false
        },
        "labelWidth": {
          "type": "string",
          "attribute": "label-width",
          "structured": false
        },
        "variant": {
          "type": "'default' | 'compact' | 'inline'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": [
        ""
      ]
    },
    "snice-funnel": {
      "tagName": "snice-funnel",
      "className": "SniceFunnel",
      "modulePath": "snice/components/funnel/snice-funnel",
      "sourceModule": "dist/components/funnel/snice-funnel.js",
      "family": "funnel",
      "attributes": {
        "animation": {
          "property": "animation",
          "type": "boolean",
          "literals": []
        },
        "orientation": {
          "property": "orientation",
          "type": "'vertical' | 'horizontal'",
          "literals": [
            "vertical",
            "horizontal"
          ]
        },
        "show-labels": {
          "property": "showLabels",
          "type": "boolean",
          "literals": []
        },
        "show-percentages": {
          "property": "showPercentages",
          "type": "boolean",
          "literals": []
        },
        "show-values": {
          "property": "showValues",
          "type": "boolean",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'default' | 'gradient'",
          "literals": [
            "default",
            "gradient"
          ]
        }
      },
      "properties": {
        "animation": {
          "type": "boolean",
          "attribute": "animation",
          "structured": false
        },
        "data": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "orientation": {
          "type": "'vertical' | 'horizontal'",
          "attribute": "orientation",
          "structured": false
        },
        "showLabels": {
          "type": "boolean",
          "attribute": "show-labels",
          "structured": false
        },
        "showPercentages": {
          "type": "boolean",
          "attribute": "show-percentages",
          "structured": false
        },
        "showValues": {
          "type": "boolean",
          "attribute": "show-values",
          "structured": false
        },
        "variant": {
          "type": "'default' | 'gradient'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [
        "data"
      ],
      "events": [
        {
          "name": "funnel-click",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "funnel-hover",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-gantt": {
      "tagName": "snice-gantt",
      "className": "SniceGantt",
      "modulePath": "snice/components/gantt/snice-gantt",
      "sourceModule": "dist/components/gantt/snice-gantt.js",
      "family": "gantt",
      "attributes": {
        "show-dependencies": {
          "property": "showDependencies",
          "type": "boolean",
          "literals": []
        },
        "zoom": {
          "property": "zoom",
          "type": "'day' | 'week' | 'month'",
          "literals": [
            "day",
            "week",
            "month"
          ]
        }
      },
      "properties": {
        "showDependencies": {
          "type": "boolean",
          "attribute": "show-dependencies",
          "structured": false
        },
        "tasks": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "zoom": {
          "type": "'day' | 'week' | 'month'",
          "attribute": "zoom",
          "structured": false
        }
      },
      "structuredProperties": [
        "tasks"
      ],
      "events": [
        {
          "name": "task-click",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "task-link",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "task-move",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "task-resize",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-gauge": {
      "tagName": "snice-gauge",
      "className": "SniceGauge",
      "modulePath": "snice/components/gauge/snice-gauge",
      "sourceModule": "dist/components/gauge/snice-gauge.js",
      "family": "gauge",
      "attributes": {
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "max": {
          "property": "max",
          "type": "number",
          "literals": []
        },
        "min": {
          "property": "min",
          "type": "number",
          "literals": []
        },
        "showvalue": {
          "property": "showValue",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "thickness": {
          "property": "thickness",
          "type": "number",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "number",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'",
          "literals": [
            "default",
            "primary",
            "success",
            "warning",
            "error",
            "info"
          ]
        }
      },
      "properties": {
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "max": {
          "type": "number",
          "attribute": "max",
          "structured": false
        },
        "min": {
          "type": "number",
          "attribute": "min",
          "structured": false
        },
        "showValue": {
          "type": "boolean",
          "attribute": "showvalue",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "thickness": {
          "type": "number",
          "attribute": "thickness",
          "structured": false
        },
        "value": {
          "type": "number",
          "attribute": "value",
          "structured": false
        },
        "variant": {
          "type": "'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": []
    },
    "snice-grid": {
      "tagName": "snice-grid",
      "className": "SniceGrid",
      "modulePath": "snice/components/grid/snice-grid",
      "sourceModule": "dist/components/grid/snice-grid.js",
      "family": "grid",
      "attributes": {
        "column-width": {
          "property": "columnWidth",
          "type": "number",
          "literals": []
        },
        "columns": {
          "property": "columns",
          "type": "number",
          "literals": []
        },
        "drag-throttle": {
          "property": "dragThrottle",
          "type": "number",
          "literals": []
        },
        "draggable": {
          "property": "draggable",
          "type": "boolean",
          "literals": []
        },
        "gap": {
          "property": "gap",
          "type": "string",
          "literals": []
        },
        "origin-left": {
          "property": "originLeft",
          "type": "boolean",
          "literals": []
        },
        "origin-top": {
          "property": "originTop",
          "type": "boolean",
          "literals": []
        },
        "resize": {
          "property": "resize",
          "type": "boolean",
          "literals": []
        },
        "row-height": {
          "property": "rowHeight",
          "type": "number",
          "literals": []
        },
        "rows": {
          "property": "rows",
          "type": "number",
          "literals": []
        },
        "stagger": {
          "property": "stagger",
          "type": "number",
          "literals": []
        },
        "transition-duration": {
          "property": "transitionDuration",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "columns": {
          "type": "number",
          "attribute": "columns",
          "structured": false
        },
        "columnWidth": {
          "type": "number",
          "attribute": "column-width",
          "structured": false
        },
        "draggable": {
          "type": "boolean",
          "attribute": "draggable",
          "structured": false
        },
        "dragThrottle": {
          "type": "number",
          "attribute": "drag-throttle",
          "structured": false
        },
        "gap": {
          "type": "string",
          "attribute": "gap",
          "structured": false
        },
        "originLeft": {
          "type": "boolean",
          "attribute": "origin-left",
          "structured": false
        },
        "originTop": {
          "type": "boolean",
          "attribute": "origin-top",
          "structured": false
        },
        "resize": {
          "type": "boolean",
          "attribute": "resize",
          "structured": false
        },
        "rowHeight": {
          "type": "number",
          "attribute": "row-height",
          "structured": false
        },
        "rows": {
          "type": "number",
          "attribute": "rows",
          "structured": false
        },
        "stagger": {
          "type": "number",
          "attribute": "stagger",
          "structured": false
        },
        "transitionDuration": {
          "type": "string",
          "attribute": "transition-duration",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "grid-drag-item-positioned",
          "type": "CustomEvent<GridDragItemPositionedDetail>"
        },
        {
          "name": "grid-layout-complete",
          "type": "CustomEvent<GridLayoutCompleteDetail>"
        }
      ],
      "slots": [
        ""
      ]
    },
    "snice-header": {
      "tagName": "snice-header",
      "className": "SniceHeader",
      "modulePath": "snice/components/table/snice-header",
      "sourceModule": "dist/components/table/snice-header.js",
      "family": "table",
      "attributes": {
        "all-selected": {
          "property": "allSelected",
          "type": "boolean",
          "literals": []
        },
        "selectable": {
          "property": "selectable",
          "type": "boolean",
          "literals": []
        },
        "some-selected": {
          "property": "someSelected",
          "type": "boolean",
          "literals": []
        },
        "sortable": {
          "property": "sortable",
          "type": "boolean",
          "literals": []
        },
        "sticky": {
          "property": "sticky",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "allSelected": {
          "type": "boolean",
          "attribute": "all-selected",
          "structured": false
        },
        "columns": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "currentSort": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "selectable": {
          "type": "boolean",
          "attribute": "selectable",
          "structured": false
        },
        "someSelected": {
          "type": "boolean",
          "attribute": "some-selected",
          "structured": false
        },
        "sortable": {
          "type": "boolean",
          "attribute": "sortable",
          "structured": false
        },
        "sticky": {
          "type": "boolean",
          "attribute": "sticky",
          "structured": false
        }
      },
      "structuredProperties": [
        "columns",
        "currentSort"
      ],
      "events": [
        {
          "name": "header-filter",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "header-select-all",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "header-sort",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-heatmap": {
      "tagName": "snice-heatmap",
      "className": "SniceHeatmap",
      "modulePath": "snice/components/heatmap/snice-heatmap",
      "sourceModule": "dist/components/heatmap/snice-heatmap.js",
      "family": "heatmap",
      "attributes": {
        "cell-gap": {
          "property": "cellGap",
          "type": "number",
          "literals": []
        },
        "cell-size": {
          "property": "cellSize",
          "type": "number",
          "literals": []
        },
        "color-scheme": {
          "property": "colorScheme",
          "type": "'green' | 'blue' | 'purple' | 'orange' | 'red'",
          "literals": [
            "green",
            "blue",
            "purple",
            "orange",
            "red"
          ]
        },
        "show-labels": {
          "property": "showLabels",
          "type": "boolean",
          "literals": []
        },
        "show-tooltip": {
          "property": "showTooltip",
          "type": "boolean",
          "literals": []
        },
        "weeks": {
          "property": "weeks",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "cellGap": {
          "type": "number",
          "attribute": "cell-gap",
          "structured": false
        },
        "cellSize": {
          "type": "number",
          "attribute": "cell-size",
          "structured": false
        },
        "colorScheme": {
          "type": "'green' | 'blue' | 'purple' | 'orange' | 'red'",
          "attribute": "color-scheme",
          "structured": false
        },
        "data": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "showLabels": {
          "type": "boolean",
          "attribute": "show-labels",
          "structured": false
        },
        "showTooltip": {
          "type": "boolean",
          "attribute": "show-tooltip",
          "structured": false
        },
        "weeks": {
          "type": "number",
          "attribute": "weeks",
          "structured": false
        }
      },
      "structuredProperties": [
        "data"
      ],
      "events": [
        {
          "name": "cell-click",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-image": {
      "tagName": "snice-image",
      "className": "SniceImage",
      "modulePath": "snice/components/image/snice-image",
      "sourceModule": "dist/components/image/snice-image.js",
      "family": "image",
      "attributes": {
        "alt": {
          "property": "alt",
          "type": "string",
          "literals": []
        },
        "fallback": {
          "property": "fallback",
          "type": "string",
          "literals": []
        },
        "fit": {
          "property": "fit",
          "type": "'cover' | 'contain' | 'fill' | 'none' | 'scale-down'",
          "literals": [
            "cover",
            "contain",
            "fill",
            "none",
            "scale-down"
          ]
        },
        "height": {
          "property": "height",
          "type": "string",
          "literals": []
        },
        "lazy": {
          "property": "lazy",
          "type": "boolean",
          "literals": []
        },
        "placeholder": {
          "property": "placeholder",
          "type": "string",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "sizes": {
          "property": "sizes",
          "type": "string",
          "literals": []
        },
        "src": {
          "property": "src",
          "type": "string",
          "literals": []
        },
        "srcset": {
          "property": "srcset",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'rounded' | 'square' | 'circle'",
          "literals": [
            "rounded",
            "square",
            "circle"
          ]
        },
        "width": {
          "property": "width",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "alt": {
          "type": "string",
          "attribute": "alt",
          "structured": false
        },
        "fallback": {
          "type": "string",
          "attribute": "fallback",
          "structured": false
        },
        "fit": {
          "type": "'cover' | 'contain' | 'fill' | 'none' | 'scale-down'",
          "attribute": "fit",
          "structured": false
        },
        "height": {
          "type": "string",
          "attribute": "height",
          "structured": false
        },
        "lazy": {
          "type": "boolean",
          "attribute": "lazy",
          "structured": false
        },
        "placeholder": {
          "type": "string",
          "attribute": "placeholder",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "sizes": {
          "type": "string",
          "attribute": "sizes",
          "structured": false
        },
        "src": {
          "type": "string",
          "attribute": "src",
          "structured": false
        },
        "srcset": {
          "type": "string",
          "attribute": "srcset",
          "structured": false
        },
        "variant": {
          "type": "'rounded' | 'square' | 'circle'",
          "attribute": "variant",
          "structured": false
        },
        "width": {
          "type": "string",
          "attribute": "width",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": [
        "placeholder"
      ]
    },
    "snice-input": {
      "tagName": "snice-input",
      "className": "SniceInput",
      "modulePath": "snice/components/input/snice-input",
      "sourceModule": "dist/components/input/snice-input.js",
      "family": "input",
      "attributes": {
        "align": {
          "property": "align",
          "type": "'top' | 'center' | 'bottom' | ''",
          "literals": [
            "top",
            "center",
            "bottom",
            ""
          ]
        },
        "autocomplete": {
          "property": "autocomplete",
          "type": "string",
          "literals": []
        },
        "clearable": {
          "property": "clearable",
          "type": "boolean",
          "literals": []
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "error-text": {
          "property": "errorText",
          "type": "string",
          "literals": []
        },
        "helper-text": {
          "property": "helperText",
          "type": "string",
          "literals": []
        },
        "invalid": {
          "property": "invalid",
          "type": "boolean",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "label-align": {
          "property": "labelAlign",
          "type": "'left' | 'center' | 'right'",
          "literals": [
            "left",
            "center",
            "right"
          ]
        },
        "loading": {
          "property": "loading",
          "type": "boolean",
          "literals": []
        },
        "max": {
          "property": "max",
          "type": "string",
          "literals": []
        },
        "maxlength": {
          "property": "maxlength",
          "type": "number",
          "literals": []
        },
        "min": {
          "property": "min",
          "type": "string",
          "literals": []
        },
        "minlength": {
          "property": "minlength",
          "type": "number",
          "literals": []
        },
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "password": {
          "property": "password",
          "type": "boolean",
          "literals": []
        },
        "pattern": {
          "property": "pattern",
          "type": "string",
          "literals": []
        },
        "placeholder": {
          "property": "placeholder",
          "type": "string",
          "literals": []
        },
        "prefix-icon": {
          "property": "prefixIcon",
          "type": "string",
          "literals": []
        },
        "readonly": {
          "property": "readonly",
          "type": "boolean",
          "literals": []
        },
        "required": {
          "property": "required",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "step": {
          "property": "step",
          "type": "string",
          "literals": []
        },
        "stretch": {
          "property": "stretch",
          "type": "boolean",
          "literals": []
        },
        "suffix-icon": {
          "property": "suffixIcon",
          "type": "string",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local'",
          "literals": [
            "text",
            "email",
            "password",
            "number",
            "tel",
            "url",
            "search",
            "date",
            "time",
            "datetime-local"
          ]
        },
        "value": {
          "property": "defaultValue",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'outlined' | 'filled' | 'underlined'",
          "literals": [
            "outlined",
            "filled",
            "underlined"
          ]
        }
      },
      "properties": {
        "align": {
          "type": "'top' | 'center' | 'bottom' | ''",
          "attribute": "align",
          "structured": false
        },
        "autocomplete": {
          "type": "string",
          "attribute": "autocomplete",
          "structured": false
        },
        "clearable": {
          "type": "boolean",
          "attribute": "clearable",
          "structured": false
        },
        "defaultValue": {
          "type": "string",
          "attribute": "value",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "errorText": {
          "type": "string",
          "attribute": "error-text",
          "structured": false
        },
        "form": {
          "type": "HTMLFormElement | null",
          "attribute": null,
          "structured": false
        },
        "helperText": {
          "type": "string",
          "attribute": "helper-text",
          "structured": false
        },
        "invalid": {
          "type": "boolean",
          "attribute": "invalid",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "labelAlign": {
          "type": "'left' | 'center' | 'right'",
          "attribute": "label-align",
          "structured": false
        },
        "labels": {
          "type": "NodeList | null",
          "attribute": null,
          "structured": false
        },
        "loading": {
          "type": "boolean",
          "attribute": "loading",
          "structured": false
        },
        "max": {
          "type": "string",
          "attribute": "max",
          "structured": false
        },
        "maxlength": {
          "type": "number",
          "attribute": "maxlength",
          "structured": false
        },
        "min": {
          "type": "string",
          "attribute": "min",
          "structured": false
        },
        "minlength": {
          "type": "number",
          "attribute": "minlength",
          "structured": false
        },
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "password": {
          "type": "boolean",
          "attribute": "password",
          "structured": false
        },
        "pattern": {
          "type": "string",
          "attribute": "pattern",
          "structured": false
        },
        "placeholder": {
          "type": "string",
          "attribute": "placeholder",
          "structured": false
        },
        "prefixIcon": {
          "type": "string",
          "attribute": "prefix-icon",
          "structured": false
        },
        "readonly": {
          "type": "boolean",
          "attribute": "readonly",
          "structured": false
        },
        "required": {
          "type": "boolean",
          "attribute": "required",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "step": {
          "type": "string",
          "attribute": "step",
          "structured": false
        },
        "stretch": {
          "type": "boolean",
          "attribute": "stretch",
          "structured": false
        },
        "suffixIcon": {
          "type": "string",
          "attribute": "suffix-icon",
          "structured": false
        },
        "type": {
          "type": "'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local'",
          "attribute": "type",
          "structured": false
        },
        "validationMessage": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "validity": {
          "type": "ValidityState",
          "attribute": null,
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "variant": {
          "type": "'outlined' | 'filled' | 'underlined'",
          "attribute": "variant",
          "structured": false
        },
        "willValidate": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "input-blur",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "input-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "input-clear",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "input-focus",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "input-input",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        "prefix-icon",
        "suffix-icon"
      ]
    },
    "snice-invoice": {
      "tagName": "snice-invoice",
      "className": "SniceInvoice",
      "modulePath": "snice/components/invoice/snice-invoice",
      "sourceModule": "dist/components/invoice/snice-invoice.js",
      "family": "invoice",
      "attributes": {
        "currency": {
          "property": "currency",
          "type": "string",
          "literals": []
        },
        "date": {
          "property": "date",
          "type": "string",
          "literals": []
        },
        "discount": {
          "property": "discount",
          "type": "number",
          "literals": []
        },
        "due-date": {
          "property": "dueDate",
          "type": "string",
          "literals": []
        },
        "invoice-number": {
          "property": "invoiceNumber",
          "type": "string",
          "literals": []
        },
        "notes": {
          "property": "notes",
          "type": "string",
          "literals": []
        },
        "qr-data": {
          "property": "qrData",
          "type": "string",
          "literals": []
        },
        "qr-position": {
          "property": "qrPosition",
          "type": "'top-right' | 'bottom-right' | 'bottom-left' | 'footer'",
          "literals": [
            "top-right",
            "bottom-right",
            "bottom-left",
            "footer"
          ]
        },
        "show-qr": {
          "property": "showQr",
          "type": "boolean",
          "literals": []
        },
        "status": {
          "property": "status",
          "type": "'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'",
          "literals": [
            "draft",
            "sent",
            "paid",
            "overdue",
            "cancelled"
          ]
        },
        "tax-rate": {
          "property": "taxRate",
          "type": "number",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'standard' | 'modern' | 'classic' | 'minimal' | 'detailed' | 'paper' | 'ink' | 'ledger' | 'ticket'",
          "literals": [
            "standard",
            "modern",
            "classic",
            "minimal",
            "detailed",
            "paper",
            "ink",
            "ledger",
            "ticket"
          ]
        }
      },
      "properties": {
        "currency": {
          "type": "string",
          "attribute": "currency",
          "structured": false
        },
        "date": {
          "type": "string",
          "attribute": "date",
          "structured": false
        },
        "discount": {
          "type": "number",
          "attribute": "discount",
          "structured": false
        },
        "dueDate": {
          "type": "string",
          "attribute": "due-date",
          "structured": false
        },
        "from": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "invoiceNumber": {
          "type": "string",
          "attribute": "invoice-number",
          "structured": false
        },
        "items": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "notes": {
          "type": "string",
          "attribute": "notes",
          "structured": false
        },
        "qrData": {
          "type": "string",
          "attribute": "qr-data",
          "structured": false
        },
        "qrPosition": {
          "type": "'top-right' | 'bottom-right' | 'bottom-left' | 'footer'",
          "attribute": "qr-position",
          "structured": false
        },
        "showQr": {
          "type": "boolean",
          "attribute": "show-qr",
          "structured": false
        },
        "status": {
          "type": "'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'",
          "attribute": "status",
          "structured": false
        },
        "taxRate": {
          "type": "number",
          "attribute": "tax-rate",
          "structured": false
        },
        "to": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "variant": {
          "type": "'standard' | 'modern' | 'classic' | 'minimal' | 'detailed' | 'paper' | 'ink' | 'ledger' | 'ticket'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [
        "from",
        "items",
        "to"
      ],
      "events": [
        {
          "name": "invoice-item-change",
          "type": "CustomEvent<InvoiceItemChangeDetail>"
        },
        {
          "name": "invoice-status-change",
          "type": "CustomEvent<InvoiceStatusChangeDetail>"
        }
      ],
      "slots": [
        "",
        "after-items",
        "before-items",
        "logo",
        "notes",
        "parties",
        "qr",
        "status",
        "title"
      ]
    },
    "snice-kanban": {
      "tagName": "snice-kanban",
      "className": "SniceKanban",
      "modulePath": "snice/components/kanban/snice-kanban",
      "sourceModule": "dist/components/kanban/snice-kanban.js",
      "family": "kanban",
      "attributes": {
        "allow-drag-drop": {
          "property": "allowDragDrop",
          "type": "boolean",
          "literals": []
        },
        "show-card-count": {
          "property": "showCardCount",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "allowDragDrop": {
          "type": "boolean",
          "attribute": "allow-drag-drop",
          "structured": false
        },
        "columns": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "showCardCount": {
          "type": "boolean",
          "attribute": "show-card-count",
          "structured": false
        }
      },
      "structuredProperties": [
        "columns"
      ],
      "events": [
        {
          "name": "kanban-card-click",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "kanban-card-move",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-key-value": {
      "tagName": "snice-key-value",
      "className": "SniceKeyValue",
      "modulePath": "snice/components/key-value/snice-key-value",
      "sourceModule": "dist/components/key-value/snice-key-value.js",
      "family": "key-value",
      "attributes": {
        "auto-expand": {
          "property": "autoExpand",
          "type": "boolean",
          "literals": []
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "key-placeholder": {
          "property": "keyPlaceholder",
          "type": "string",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "mode": {
          "property": "mode",
          "type": "'edit' | 'view'",
          "literals": [
            "edit",
            "view"
          ]
        },
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "readonly": {
          "property": "readonly",
          "type": "boolean",
          "literals": []
        },
        "required": {
          "property": "required",
          "type": "boolean",
          "literals": []
        },
        "rows": {
          "property": "rows",
          "type": "number",
          "literals": []
        },
        "show-copy": {
          "property": "showCopy",
          "type": "boolean",
          "literals": []
        },
        "show-description": {
          "property": "showDescription",
          "type": "boolean",
          "literals": []
        },
        "value": {
          "property": "defaultValue",
          "type": "string",
          "literals": []
        },
        "value-placeholder": {
          "property": "valuePlaceholder",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'default' | 'compact'",
          "literals": [
            "default",
            "compact"
          ]
        }
      },
      "properties": {
        "autoExpand": {
          "type": "boolean",
          "attribute": "auto-expand",
          "structured": false
        },
        "defaultValue": {
          "type": "string",
          "attribute": "value",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "form": {
          "type": "HTMLFormElement | null",
          "attribute": null,
          "structured": false
        },
        "keyPlaceholder": {
          "type": "string",
          "attribute": "key-placeholder",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "labels": {
          "type": "NodeList | null",
          "attribute": null,
          "structured": false
        },
        "mode": {
          "type": "'edit' | 'view'",
          "attribute": "mode",
          "structured": false
        },
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "placeholders": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "readonly": {
          "type": "boolean",
          "attribute": "readonly",
          "structured": false
        },
        "required": {
          "type": "boolean",
          "attribute": "required",
          "structured": false
        },
        "rows": {
          "type": "number",
          "attribute": "rows",
          "structured": false
        },
        "showCopy": {
          "type": "boolean",
          "attribute": "show-copy",
          "structured": false
        },
        "showDescription": {
          "type": "boolean",
          "attribute": "show-description",
          "structured": false
        },
        "type": {
          "type": "'key-value'",
          "attribute": null,
          "structured": false
        },
        "validationMessage": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "validity": {
          "type": "ValidityState",
          "attribute": null,
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "valuePlaceholder": {
          "type": "string",
          "attribute": "value-placeholder",
          "structured": false
        },
        "variant": {
          "type": "'default' | 'compact'",
          "attribute": "variant",
          "structured": false
        },
        "willValidate": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        }
      },
      "structuredProperties": [
        "placeholders"
      ],
      "events": [
        {
          "name": "kv-add",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "kv-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "kv-copy",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "kv-remove",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        ""
      ]
    },
    "snice-kpi": {
      "tagName": "snice-kpi",
      "className": "SniceKpi",
      "modulePath": "snice/components/kpi/snice-kpi",
      "sourceModule": "dist/components/kpi/snice-kpi.js",
      "family": "kpi",
      "attributes": {
        "colorvalue": {
          "property": "colorValue",
          "type": "boolean",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "sentiment": {
          "property": "sentiment",
          "type": "'up' | 'down' | 'neutral'",
          "literals": [
            "up",
            "down",
            "neutral"
          ]
        },
        "showsparkline": {
          "property": "showSparkline",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "trendvalue": {
          "property": "trendValue",
          "type": "string | number",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "string | number",
          "literals": []
        }
      },
      "properties": {
        "colorValue": {
          "type": "boolean",
          "attribute": "colorvalue",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "sentiment": {
          "type": "'up' | 'down' | 'neutral'",
          "attribute": "sentiment",
          "structured": false
        },
        "showSparkline": {
          "type": "boolean",
          "attribute": "showsparkline",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "trendData": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "trendValue": {
          "type": "string | number",
          "attribute": "trendvalue",
          "structured": false
        },
        "value": {
          "type": "string | number",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [
        "trendData"
      ],
      "events": [],
      "slots": [
        "after",
        "before"
      ]
    },
    "snice-kv-pair": {
      "tagName": "snice-kv-pair",
      "className": "SniceKvPair",
      "modulePath": "snice/components/key-value/snice-kv-pair",
      "sourceModule": "dist/components/key-value/snice-kv-pair.js",
      "family": "key-value",
      "attributes": {
        "description": {
          "property": "description",
          "type": "string",
          "literals": []
        },
        "key": {
          "property": "key",
          "type": "string",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "description": {
          "type": "string",
          "attribute": "description",
          "structured": false
        },
        "key": {
          "type": "string",
          "attribute": "key",
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": []
    },
    "snice-layout": {
      "tagName": "snice-layout",
      "className": "SniceLayout",
      "modulePath": "snice/components/layout/snice-layout",
      "sourceModule": "dist/components/layout/snice-layout.js",
      "family": "layout",
      "attributes": {},
      "properties": {},
      "structuredProperties": [],
      "events": [],
      "slots": [
        "brand",
        "footer",
        "page"
      ]
    },
    "snice-layout-auth-split": {
      "tagName": "snice-layout-auth-split",
      "className": "SniceLayoutAuthSplit",
      "modulePath": "snice/components/layout/snice-layout-auth-split",
      "sourceModule": "dist/components/layout/snice-layout-auth-split.js",
      "family": "layout",
      "attributes": {
        "contained": {
          "property": "contained",
          "type": "boolean",
          "literals": []
        },
        "panel-position": {
          "property": "panelPosition",
          "type": "'start' | 'end'",
          "literals": [
            "start",
            "end"
          ]
        }
      },
      "properties": {
        "contained": {
          "type": "boolean",
          "attribute": "contained",
          "structured": false
        },
        "panelPosition": {
          "type": "'start' | 'end'",
          "attribute": "panel-position",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": [
        "brand",
        "footer",
        "page",
        "panel"
      ]
    },
    "snice-layout-blog": {
      "tagName": "snice-layout-blog",
      "className": "SniceLayoutBlog",
      "modulePath": "snice/components/layout/snice-layout-blog",
      "sourceModule": "dist/components/layout/snice-layout-blog.js",
      "family": "layout",
      "attributes": {
        "use-nav": {
          "property": "useNav",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "hasSidebar": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        },
        "useNav": {
          "type": "boolean",
          "attribute": "use-nav",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": [
        "brand",
        "footer",
        "nav",
        "page",
        "sidebar"
      ]
    },
    "snice-layout-card": {
      "tagName": "snice-layout-card",
      "className": "SniceLayoutCard",
      "modulePath": "snice/components/layout/snice-layout-card",
      "sourceModule": "dist/components/layout/snice-layout-card.js",
      "family": "layout",
      "attributes": {
        "columns": {
          "property": "columns",
          "type": "'1' | '2' | '3' | '4' | '6'",
          "literals": [
            "1",
            "2",
            "3",
            "4",
            "6"
          ]
        },
        "gap": {
          "property": "gap",
          "type": "'sm' | 'md' | 'lg' | 'xl'",
          "literals": [
            "sm",
            "md",
            "lg",
            "xl"
          ]
        }
      },
      "properties": {
        "columns": {
          "type": "'1' | '2' | '3' | '4' | '6'",
          "attribute": "columns",
          "structured": false
        },
        "gap": {
          "type": "'sm' | 'md' | 'lg' | 'xl'",
          "attribute": "gap",
          "structured": false
        },
        "hasFooter": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        },
        "hasHeader": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": [
        "footer",
        "header",
        "page"
      ]
    },
    "snice-layout-centered": {
      "tagName": "snice-layout-centered",
      "className": "SniceLayoutCentered",
      "modulePath": "snice/components/layout/snice-layout-centered",
      "sourceModule": "dist/components/layout/snice-layout-centered.js",
      "family": "layout",
      "attributes": {
        "width": {
          "property": "width",
          "type": "'sm' | 'md' | 'lg' | 'xl'",
          "literals": [
            "sm",
            "md",
            "lg",
            "xl"
          ]
        }
      },
      "properties": {
        "hasBrand": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        },
        "hasFooter": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        },
        "width": {
          "type": "'sm' | 'md' | 'lg' | 'xl'",
          "attribute": "width",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": [
        "brand",
        "footer",
        "page"
      ]
    },
    "snice-layout-dashboard": {
      "tagName": "snice-layout-dashboard",
      "className": "SniceLayoutDashboard",
      "modulePath": "snice/components/layout/snice-layout-dashboard",
      "sourceModule": "dist/components/layout/snice-layout-dashboard.js",
      "family": "layout",
      "attributes": {
        "collapsed": {
          "property": "collapsed",
          "type": "boolean",
          "literals": []
        },
        "contained": {
          "property": "contained",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "collapsed": {
          "type": "boolean",
          "attribute": "collapsed",
          "structured": false
        },
        "contained": {
          "type": "boolean",
          "attribute": "contained",
          "structured": false
        },
        "hasRail": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        },
        "hasToolbarContent": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        },
        "mobileOpen": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": [
        "brand",
        "header",
        "page",
        "right-sidebar",
        "sidebar",
        "toolbar"
      ]
    },
    "snice-layout-docs": {
      "tagName": "snice-layout-docs",
      "className": "SniceLayoutDocs",
      "modulePath": "snice/components/layout/snice-layout-docs",
      "sourceModule": "dist/components/layout/snice-layout-docs.js",
      "family": "layout",
      "attributes": {
        "contained": {
          "property": "contained",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "contained": {
          "type": "boolean",
          "attribute": "contained",
          "structured": false
        },
        "sidebarOpen": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": [
        "brand",
        "footer",
        "header",
        "page",
        "sidebar",
        "toc"
      ]
    },
    "snice-layout-fullscreen": {
      "tagName": "snice-layout-fullscreen",
      "className": "SniceLayoutFullscreen",
      "modulePath": "snice/components/layout/snice-layout-fullscreen",
      "sourceModule": "dist/components/layout/snice-layout-fullscreen.js",
      "family": "layout",
      "attributes": {
        "contained": {
          "property": "contained",
          "type": "boolean",
          "literals": []
        },
        "overlay": {
          "property": "overlay",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "contained": {
          "type": "boolean",
          "attribute": "contained",
          "structured": false
        },
        "overlay": {
          "type": "boolean",
          "attribute": "overlay",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": [
        "background",
        "controls",
        "overlay",
        "page"
      ]
    },
    "snice-layout-landing": {
      "tagName": "snice-layout-landing",
      "className": "SniceLayoutLanding",
      "modulePath": "snice/components/layout/snice-layout-landing",
      "sourceModule": "dist/components/layout/snice-layout-landing.js",
      "family": "layout",
      "attributes": {
        "use-nav": {
          "property": "useNav",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "useNav": {
          "type": "boolean",
          "attribute": "use-nav",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": [
        "brand",
        "cta",
        "footer",
        "hero",
        "nav",
        "page"
      ]
    },
    "snice-layout-master-detail": {
      "tagName": "snice-layout-master-detail",
      "className": "SniceLayoutMasterDetail",
      "modulePath": "snice/components/layout/snice-layout-master-detail",
      "sourceModule": "dist/components/layout/snice-layout-master-detail.js",
      "family": "layout",
      "attributes": {
        "contained": {
          "property": "contained",
          "type": "boolean",
          "literals": []
        },
        "selected": {
          "property": "selected",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "contained": {
          "type": "boolean",
          "attribute": "contained",
          "structured": false
        },
        "selected": {
          "type": "boolean",
          "attribute": "selected",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "detail-closed",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        "brand",
        "detail",
        "empty",
        "header",
        "list"
      ]
    },
    "snice-layout-minimal": {
      "tagName": "snice-layout-minimal",
      "className": "SniceLayoutMinimal",
      "modulePath": "snice/components/layout/snice-layout-minimal",
      "sourceModule": "dist/components/layout/snice-layout-minimal.js",
      "family": "layout",
      "attributes": {},
      "properties": {},
      "structuredProperties": [],
      "events": [],
      "slots": [
        "page"
      ]
    },
    "snice-layout-sidebar": {
      "tagName": "snice-layout-sidebar",
      "className": "SniceLayoutSidebar",
      "modulePath": "snice/components/layout/snice-layout-sidebar",
      "sourceModule": "dist/components/layout/snice-layout-sidebar.js",
      "family": "layout",
      "attributes": {
        "collapse-mode": {
          "property": "collapseMode",
          "type": "SidebarCollapseMode",
          "literals": []
        },
        "collapsed": {
          "property": "collapsed",
          "type": "boolean",
          "literals": []
        },
        "contained": {
          "property": "contained",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "collapsed": {
          "type": "boolean",
          "attribute": "collapsed",
          "structured": false
        },
        "collapseMode": {
          "type": "SidebarCollapseMode",
          "attribute": "collapse-mode",
          "structured": false
        },
        "contained": {
          "type": "boolean",
          "attribute": "contained",
          "structured": false
        },
        "mobileOpen": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": [
        "brand",
        "footer",
        "header",
        "page",
        "sidebar"
      ]
    },
    "snice-layout-split": {
      "tagName": "snice-layout-split",
      "className": "SniceLayoutSplit",
      "modulePath": "snice/components/layout/snice-layout-split",
      "sourceModule": "dist/components/layout/snice-layout-split.js",
      "family": "layout",
      "attributes": {
        "direction": {
          "property": "direction",
          "type": "'horizontal' | 'vertical'",
          "literals": [
            "horizontal",
            "vertical"
          ]
        },
        "ratio": {
          "property": "ratio",
          "type": "'50-50' | '60-40' | '70-30' | '33-67' | '67-33'",
          "literals": [
            "50-50",
            "60-40",
            "70-30",
            "33-67",
            "67-33"
          ]
        }
      },
      "properties": {
        "direction": {
          "type": "'horizontal' | 'vertical'",
          "attribute": "direction",
          "structured": false
        },
        "ratio": {
          "type": "'50-50' | '60-40' | '70-30' | '33-67' | '67-33'",
          "attribute": "ratio",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": [
        "left",
        "right"
      ]
    },
    "snice-leaderboard": {
      "tagName": "snice-leaderboard",
      "className": "SniceLeaderboard",
      "modulePath": "snice/components/leaderboard/snice-leaderboard",
      "sourceModule": "dist/components/leaderboard/snice-leaderboard.js",
      "family": "leaderboard",
      "attributes": {
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "variant": {
          "property": "variant",
          "type": "'default' | 'podium' | 'compact'",
          "literals": [
            "default",
            "podium",
            "compact"
          ]
        }
      },
      "properties": {
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "title": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "variant": {
          "type": "'default' | 'podium' | 'compact'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "entry-click",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        ""
      ]
    },
    "snice-leaderboard-entry": {
      "tagName": "snice-leaderboard-entry",
      "className": "SniceLeaderboardEntry",
      "modulePath": "snice/components/leaderboard/snice-leaderboard-entry",
      "sourceModule": "dist/components/leaderboard/snice-leaderboard-entry.js",
      "family": "leaderboard",
      "attributes": {
        "avatar": {
          "property": "avatar",
          "type": "string",
          "literals": []
        },
        "change": {
          "property": "change",
          "type": "number",
          "literals": []
        },
        "highlighted": {
          "property": "highlighted",
          "type": "boolean",
          "literals": []
        },
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "rank": {
          "property": "rank",
          "type": "number",
          "literals": []
        },
        "score": {
          "property": "score",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "avatar": {
          "type": "string",
          "attribute": "avatar",
          "structured": false
        },
        "change": {
          "type": "number",
          "attribute": "change",
          "structured": false
        },
        "highlighted": {
          "type": "boolean",
          "attribute": "highlighted",
          "structured": false
        },
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "rank": {
          "type": "number",
          "attribute": "rank",
          "structured": false
        },
        "score": {
          "type": "string",
          "attribute": "score",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": []
    },
    "snice-link": {
      "tagName": "snice-link",
      "className": "SniceLink",
      "modulePath": "snice/components/link/snice-link",
      "sourceModule": "dist/components/link/snice-link.js",
      "family": "link",
      "attributes": {
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "external": {
          "property": "external",
          "type": "boolean",
          "literals": []
        },
        "hash": {
          "property": "hash",
          "type": "boolean",
          "literals": []
        },
        "href": {
          "property": "href",
          "type": "string",
          "literals": []
        },
        "target": {
          "property": "target",
          "type": "'_self' | '_blank' | '_parent' | '_top'",
          "literals": [
            "_self",
            "_blank",
            "_parent",
            "_top"
          ]
        },
        "underline": {
          "property": "underline",
          "type": "boolean",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'default' | 'primary' | 'secondary' | 'muted'",
          "literals": [
            "default",
            "primary",
            "secondary",
            "muted"
          ]
        }
      },
      "properties": {
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "external": {
          "type": "boolean",
          "attribute": "external",
          "structured": false
        },
        "hash": {
          "type": "boolean",
          "attribute": "hash",
          "structured": false
        },
        "href": {
          "type": "string",
          "attribute": "href",
          "structured": false
        },
        "target": {
          "type": "'_self' | '_blank' | '_parent' | '_top'",
          "attribute": "target",
          "structured": false
        },
        "underline": {
          "type": "boolean",
          "attribute": "underline",
          "structured": false
        },
        "variant": {
          "type": "'default' | 'primary' | 'secondary' | 'muted'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": [
        ""
      ]
    },
    "snice-link-preview": {
      "tagName": "snice-link-preview",
      "className": "SniceLinkPreview",
      "modulePath": "snice/components/link-preview/snice-link-preview",
      "sourceModule": "dist/components/link-preview/snice-link-preview.js",
      "family": "link-preview",
      "attributes": {
        "description": {
          "property": "description",
          "type": "string",
          "literals": []
        },
        "favicon": {
          "property": "favicon",
          "type": "string",
          "literals": []
        },
        "image": {
          "property": "image",
          "type": "string",
          "literals": []
        },
        "site-name": {
          "property": "siteName",
          "type": "string",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "url": {
          "property": "url",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'horizontal' | 'vertical'",
          "literals": [
            "horizontal",
            "vertical"
          ]
        }
      },
      "properties": {
        "description": {
          "type": "string",
          "attribute": "description",
          "structured": false
        },
        "favicon": {
          "type": "string",
          "attribute": "favicon",
          "structured": false
        },
        "image": {
          "type": "string",
          "attribute": "image",
          "structured": false
        },
        "siteName": {
          "type": "string",
          "attribute": "site-name",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "title": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "url": {
          "type": "string",
          "attribute": "url",
          "structured": false
        },
        "variant": {
          "type": "'horizontal' | 'vertical'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "link-click",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-list": {
      "tagName": "snice-list",
      "className": "SniceList",
      "modulePath": "snice/components/list/snice-list",
      "sourceModule": "dist/components/list/snice-list.js",
      "family": "list",
      "attributes": {
        "dividers": {
          "property": "dividers",
          "type": "boolean",
          "literals": []
        },
        "infinite": {
          "property": "infinite",
          "type": "boolean",
          "literals": []
        },
        "loading": {
          "property": "loading",
          "type": "boolean",
          "literals": []
        },
        "noresults": {
          "property": "noResults",
          "type": "boolean",
          "literals": []
        },
        "search": {
          "property": "search",
          "type": "string",
          "literals": []
        },
        "searchable": {
          "property": "searchable",
          "type": "boolean",
          "literals": []
        },
        "skeletoncount": {
          "property": "skeletonCount",
          "type": "number",
          "literals": []
        },
        "threshold": {
          "property": "threshold",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "dividers": {
          "type": "boolean",
          "attribute": "dividers",
          "structured": false
        },
        "infinite": {
          "type": "boolean",
          "attribute": "infinite",
          "structured": false
        },
        "loading": {
          "type": "boolean",
          "attribute": "loading",
          "structured": false
        },
        "noResults": {
          "type": "boolean",
          "attribute": "noresults",
          "structured": false
        },
        "search": {
          "type": "string",
          "attribute": "search",
          "structured": false
        },
        "searchable": {
          "type": "boolean",
          "attribute": "searchable",
          "structured": false
        },
        "skeletonCount": {
          "type": "number",
          "attribute": "skeletoncount",
          "structured": false
        },
        "threshold": {
          "type": "number",
          "attribute": "threshold",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": [
        "",
        "after",
        "before",
        "loading",
        "no-results"
      ]
    },
    "snice-list-item": {
      "tagName": "snice-list-item",
      "className": "SniceListItem",
      "modulePath": "snice/components/list/snice-list-item",
      "sourceModule": "dist/components/list/snice-list-item.js",
      "family": "list",
      "attributes": {
        "description": {
          "property": "description",
          "type": "string",
          "literals": []
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "heading": {
          "property": "heading",
          "type": "string",
          "literals": []
        },
        "selected": {
          "property": "selected",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "description": {
          "type": "string",
          "attribute": "description",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "heading": {
          "type": "string",
          "attribute": "heading",
          "structured": false
        },
        "selected": {
          "type": "boolean",
          "attribute": "selected",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": [
        "",
        "after",
        "before"
      ]
    },
    "snice-location": {
      "tagName": "snice-location",
      "className": "SniceLocation",
      "modulePath": "snice/components/location/snice-location",
      "sourceModule": "dist/components/location/snice-location.js",
      "family": "location",
      "attributes": {
        "address": {
          "property": "address",
          "type": "string",
          "literals": []
        },
        "city": {
          "property": "city",
          "type": "string",
          "literals": []
        },
        "clickable": {
          "property": "clickable",
          "type": "boolean",
          "literals": []
        },
        "country": {
          "property": "country",
          "type": "string",
          "literals": []
        },
        "icon": {
          "property": "icon",
          "type": "string",
          "literals": []
        },
        "icon-image": {
          "property": "iconImage",
          "type": "string",
          "literals": []
        },
        "latitude": {
          "property": "latitude",
          "type": "number",
          "literals": []
        },
        "longitude": {
          "property": "longitude",
          "type": "number",
          "literals": []
        },
        "map-url": {
          "property": "mapUrl",
          "type": "string",
          "literals": []
        },
        "mode": {
          "property": "mode",
          "type": "'full' | 'compact' | 'coordinates' | 'address'",
          "literals": [
            "full",
            "compact",
            "coordinates",
            "address"
          ]
        },
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "show-icon": {
          "property": "showIcon",
          "type": "boolean",
          "literals": []
        },
        "show-map": {
          "property": "showMap",
          "type": "boolean",
          "literals": []
        },
        "state": {
          "property": "state",
          "type": "string",
          "literals": []
        },
        "zip-code": {
          "property": "zipCode",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "address": {
          "type": "string",
          "attribute": "address",
          "structured": false
        },
        "city": {
          "type": "string",
          "attribute": "city",
          "structured": false
        },
        "clickable": {
          "type": "boolean",
          "attribute": "clickable",
          "structured": false
        },
        "country": {
          "type": "string",
          "attribute": "country",
          "structured": false
        },
        "icon": {
          "type": "string",
          "attribute": "icon",
          "structured": false
        },
        "iconImage": {
          "type": "string",
          "attribute": "icon-image",
          "structured": false
        },
        "latitude": {
          "type": "number",
          "attribute": "latitude",
          "structured": false
        },
        "longitude": {
          "type": "number",
          "attribute": "longitude",
          "structured": false
        },
        "mapUrl": {
          "type": "string",
          "attribute": "map-url",
          "structured": false
        },
        "mode": {
          "type": "'full' | 'compact' | 'coordinates' | 'address'",
          "attribute": "mode",
          "structured": false
        },
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "showIcon": {
          "type": "boolean",
          "attribute": "show-icon",
          "structured": false
        },
        "showMap": {
          "type": "boolean",
          "attribute": "show-map",
          "structured": false
        },
        "state": {
          "type": "string",
          "attribute": "state",
          "structured": false
        },
        "zipCode": {
          "type": "string",
          "attribute": "zip-code",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "location-click",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        "icon"
      ]
    },
    "snice-login": {
      "tagName": "snice-login",
      "className": "SniceLogin",
      "modulePath": "snice/components/login/snice-login",
      "sourceModule": "dist/components/login/snice-login.js",
      "family": "login",
      "attributes": {
        "action-text": {
          "property": "actionText",
          "type": "string",
          "literals": []
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "loading": {
          "property": "loading",
          "type": "boolean",
          "literals": []
        },
        "show-forgot-password": {
          "property": "showForgotPassword",
          "type": "boolean",
          "literals": []
        },
        "show-remember-me": {
          "property": "showRememberMe",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "title": {
          "property": "title",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'default' | 'card' | 'minimal'",
          "literals": [
            "default",
            "card",
            "minimal"
          ]
        }
      },
      "properties": {
        "actionText": {
          "type": "string",
          "attribute": "action-text",
          "structured": false
        },
        "alertMessage": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "alertVariant": {
          "type": "'error' | 'success' | ''",
          "attribute": null,
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "loading": {
          "type": "boolean",
          "attribute": "loading",
          "structured": false
        },
        "showForgotPassword": {
          "type": "boolean",
          "attribute": "show-forgot-password",
          "structured": false
        },
        "showRememberMe": {
          "type": "boolean",
          "attribute": "show-remember-me",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "title": {
          "type": "string",
          "attribute": "title",
          "structured": false
        },
        "variant": {
          "type": "'default' | 'card' | 'minimal'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "login-attempt",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "login-error",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "login-forgot-password",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "login-success",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        "after-form",
        "after-header",
        "after-submit",
        "before-form",
        "before-header",
        "before-submit",
        "between-fields",
        "footer",
        "form-top",
        "subtitle"
      ]
    },
    "snice-map": {
      "tagName": "snice-map",
      "className": "SniceMap",
      "modulePath": "snice/components/map/snice-map",
      "sourceModule": "dist/components/map/snice-map.js",
      "family": "map",
      "attributes": {
        "max-zoom": {
          "property": "maxZoom",
          "type": "number",
          "literals": []
        },
        "min-zoom": {
          "property": "minZoom",
          "type": "number",
          "literals": []
        },
        "tile-url": {
          "property": "tileUrl",
          "type": "string",
          "literals": []
        },
        "zoom": {
          "property": "zoom",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "center": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "markers": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "maxZoom": {
          "type": "number",
          "attribute": "max-zoom",
          "structured": false
        },
        "minZoom": {
          "type": "number",
          "attribute": "min-zoom",
          "structured": false
        },
        "tileUrl": {
          "type": "string",
          "attribute": "tile-url",
          "structured": false
        },
        "zoom": {
          "type": "number",
          "attribute": "zoom",
          "structured": false
        }
      },
      "structuredProperties": [
        "center",
        "markers"
      ],
      "events": [
        {
          "name": "map-click",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "map-move",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "map-zoom",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "marker-click",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-markdown": {
      "tagName": "snice-markdown",
      "className": "SniceMarkdown",
      "modulePath": "snice/components/markdown/snice-markdown",
      "sourceModule": "dist/components/markdown/snice-markdown.js",
      "family": "markdown",
      "attributes": {
        "sanitize": {
          "property": "sanitize",
          "type": "boolean",
          "literals": []
        },
        "theme": {
          "property": "theme",
          "type": "'default' | 'github'",
          "literals": [
            "default",
            "github"
          ]
        }
      },
      "properties": {
        "content": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "sanitize": {
          "type": "boolean",
          "attribute": "sanitize",
          "structured": false
        },
        "theme": {
          "type": "'default' | 'github'",
          "attribute": "theme",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "link-click",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "markdown-render",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        ""
      ]
    },
    "snice-masonry": {
      "tagName": "snice-masonry",
      "className": "SniceMasonry",
      "modulePath": "snice/components/masonry/snice-masonry",
      "sourceModule": "dist/components/masonry/snice-masonry.js",
      "family": "masonry",
      "attributes": {
        "columns": {
          "property": "columns",
          "type": "number",
          "literals": []
        },
        "gap": {
          "property": "gap",
          "type": "string",
          "literals": []
        },
        "mincolumnwidth": {
          "property": "minColumnWidth",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "columns": {
          "type": "number",
          "attribute": "columns",
          "structured": false
        },
        "gap": {
          "type": "string",
          "attribute": "gap",
          "structured": false
        },
        "minColumnWidth": {
          "type": "string",
          "attribute": "mincolumnwidth",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": [
        ""
      ]
    },
    "snice-menu": {
      "tagName": "snice-menu",
      "className": "SniceMenu",
      "modulePath": "snice/components/menu/snice-menu",
      "sourceModule": "dist/components/menu/snice-menu.js",
      "family": "menu",
      "attributes": {
        "close-on-select": {
          "property": "closeOnSelect",
          "type": "boolean",
          "literals": []
        },
        "distance": {
          "property": "distance",
          "type": "number",
          "literals": []
        },
        "open": {
          "property": "open",
          "type": "boolean",
          "literals": []
        },
        "placement": {
          "property": "placement",
          "type": "'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'right-start' | 'right-end' | 'left-start' | 'left-end'",
          "literals": [
            "bottom-start",
            "bottom-end",
            "top-start",
            "top-end",
            "right-start",
            "right-end",
            "left-start",
            "left-end"
          ]
        },
        "trigger": {
          "property": "trigger",
          "type": "'click' | 'hover' | 'manual'",
          "literals": [
            "click",
            "hover",
            "manual"
          ]
        }
      },
      "properties": {
        "closeOnSelect": {
          "type": "boolean",
          "attribute": "close-on-select",
          "structured": false
        },
        "distance": {
          "type": "number",
          "attribute": "distance",
          "structured": false
        },
        "open": {
          "type": "boolean",
          "attribute": "open",
          "structured": false
        },
        "placement": {
          "type": "'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'right-start' | 'right-end' | 'left-start' | 'left-end'",
          "attribute": "placement",
          "structured": false
        },
        "trigger": {
          "type": "'click' | 'hover' | 'manual'",
          "attribute": "trigger",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "menu-close",
          "type": "CustomEvent<MenuCloseDetail>"
        },
        {
          "name": "menu-open",
          "type": "CustomEvent<MenuOpenDetail>"
        }
      ],
      "slots": [
        "",
        "image-left",
        "image-right",
        "trigger"
      ]
    },
    "snice-menu-divider": {
      "tagName": "snice-menu-divider",
      "className": "SniceMenuDivider",
      "modulePath": "snice/components/menu/snice-menu-divider",
      "sourceModule": "dist/components/menu/snice-menu-divider.js",
      "family": "menu",
      "attributes": {},
      "properties": {},
      "structuredProperties": [],
      "events": [],
      "slots": []
    },
    "snice-menu-item": {
      "tagName": "snice-menu-item",
      "className": "SniceMenuItem",
      "modulePath": "snice/components/menu/snice-menu-item",
      "sourceModule": "dist/components/menu/snice-menu-item.js",
      "family": "menu",
      "attributes": {
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "selected": {
          "property": "selected",
          "type": "boolean",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "selected": {
          "type": "boolean",
          "attribute": "selected",
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "menu-item-select",
          "type": "CustomEvent<MenuItemSelectDetail>"
        }
      ],
      "slots": [
        "",
        "icon",
        "shortcut"
      ]
    },
    "snice-message-strip": {
      "tagName": "snice-message-strip",
      "className": "SniceMessageStrip",
      "modulePath": "snice/components/message-strip/snice-message-strip",
      "sourceModule": "dist/components/message-strip/snice-message-strip.js",
      "family": "message-strip",
      "attributes": {
        "dismissible": {
          "property": "dismissible",
          "type": "boolean",
          "literals": []
        },
        "icon": {
          "property": "icon",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'info' | 'success' | 'warning' | 'danger'",
          "literals": [
            "info",
            "success",
            "warning",
            "danger"
          ]
        }
      },
      "properties": {
        "dismissible": {
          "type": "boolean",
          "attribute": "dismissible",
          "structured": false
        },
        "icon": {
          "type": "string",
          "attribute": "icon",
          "structured": false
        },
        "variant": {
          "type": "'info' | 'success' | 'warning' | 'danger'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "dismiss",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        "",
        "icon"
      ]
    },
    "snice-modal": {
      "tagName": "snice-modal",
      "className": "SniceModal",
      "modulePath": "snice/components/modal/snice-modal",
      "sourceModule": "dist/components/modal/snice-modal.js",
      "family": "modal",
      "attributes": {
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "no-backdrop-dismiss": {
          "property": "noBackdropDismiss",
          "type": "boolean",
          "literals": []
        },
        "no-close-button": {
          "property": "noCloseButton",
          "type": "boolean",
          "literals": []
        },
        "no-escape-dismiss": {
          "property": "noEscapeDismiss",
          "type": "boolean",
          "literals": []
        },
        "no-focus-trap": {
          "property": "noFocusTrap",
          "type": "boolean",
          "literals": []
        },
        "no-footer": {
          "property": "noFooter",
          "type": "boolean",
          "literals": []
        },
        "no-header": {
          "property": "noHeader",
          "type": "boolean",
          "literals": []
        },
        "open": {
          "property": "open",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large' | 'fullscreen'",
          "literals": [
            "small",
            "medium",
            "large",
            "fullscreen"
          ]
        }
      },
      "properties": {
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "noBackdropDismiss": {
          "type": "boolean",
          "attribute": "no-backdrop-dismiss",
          "structured": false
        },
        "noCloseButton": {
          "type": "boolean",
          "attribute": "no-close-button",
          "structured": false
        },
        "noEscapeDismiss": {
          "type": "boolean",
          "attribute": "no-escape-dismiss",
          "structured": false
        },
        "noFocusTrap": {
          "type": "boolean",
          "attribute": "no-focus-trap",
          "structured": false
        },
        "noFooter": {
          "type": "boolean",
          "attribute": "no-footer",
          "structured": false
        },
        "noHeader": {
          "type": "boolean",
          "attribute": "no-header",
          "structured": false
        },
        "open": {
          "type": "boolean",
          "attribute": "open",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large' | 'fullscreen'",
          "attribute": "size",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "modal-close",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "modal-open",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        "",
        "footer",
        "header"
      ]
    },
    "snice-music-player": {
      "tagName": "snice-music-player",
      "className": "SniceMusicPlayer",
      "modulePath": "snice/components/music-player/snice-music-player",
      "sourceModule": "dist/components/music-player/snice-music-player.js",
      "family": "music-player",
      "attributes": {
        "autoplay": {
          "property": "autoplay",
          "type": "boolean",
          "literals": []
        },
        "compact": {
          "property": "compact",
          "type": "boolean",
          "literals": []
        },
        "current-track": {
          "property": "currentTrack",
          "type": "string",
          "literals": []
        },
        "current-track-index": {
          "property": "currentTrackIndex",
          "type": "number",
          "literals": []
        },
        "muted": {
          "property": "muted",
          "type": "boolean",
          "literals": []
        },
        "repeat": {
          "property": "repeat",
          "type": "string",
          "literals": []
        },
        "show-artwork": {
          "property": "showArtwork",
          "type": "boolean",
          "literals": []
        },
        "show-controls": {
          "property": "showControls",
          "type": "boolean",
          "literals": []
        },
        "show-playlist": {
          "property": "showPlaylist",
          "type": "boolean",
          "literals": []
        },
        "show-track-info": {
          "property": "showTrackInfo",
          "type": "boolean",
          "literals": []
        },
        "show-volume": {
          "property": "showVolume",
          "type": "boolean",
          "literals": []
        },
        "shuffle": {
          "property": "shuffle",
          "type": "boolean",
          "literals": []
        },
        "state": {
          "property": "state",
          "type": "string",
          "literals": []
        },
        "volume": {
          "property": "volume",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "autoplay": {
          "type": "boolean",
          "attribute": "autoplay",
          "structured": false
        },
        "compact": {
          "type": "boolean",
          "attribute": "compact",
          "structured": false
        },
        "currentTime": {
          "type": "number",
          "attribute": null,
          "structured": false
        },
        "currentTrack": {
          "type": "string",
          "attribute": "current-track",
          "structured": false
        },
        "currentTrackIndex": {
          "type": "number",
          "attribute": "current-track-index",
          "structured": false
        },
        "duration": {
          "type": "number",
          "attribute": null,
          "structured": false
        },
        "muted": {
          "type": "boolean",
          "attribute": "muted",
          "structured": false
        },
        "repeat": {
          "type": "string",
          "attribute": "repeat",
          "structured": false
        },
        "showArtwork": {
          "type": "boolean",
          "attribute": "show-artwork",
          "structured": false
        },
        "showControls": {
          "type": "boolean",
          "attribute": "show-controls",
          "structured": false
        },
        "showPlaylist": {
          "type": "boolean",
          "attribute": "show-playlist",
          "structured": false
        },
        "showTrackInfo": {
          "type": "boolean",
          "attribute": "show-track-info",
          "structured": false
        },
        "showVolume": {
          "type": "boolean",
          "attribute": "show-volume",
          "structured": false
        },
        "shuffle": {
          "type": "boolean",
          "attribute": "shuffle",
          "structured": false
        },
        "state": {
          "type": "string",
          "attribute": "state",
          "structured": false
        },
        "tracks": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "volume": {
          "type": "number",
          "attribute": "volume",
          "structured": false
        }
      },
      "structuredProperties": [
        "tracks"
      ],
      "events": [
        {
          "name": "player-error",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "player-pause",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "player-play",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "player-repeat-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "player-seek",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "player-shuffle-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "player-stop",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "player-time-update",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "player-track-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "player-track-ended",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "player-volume-change",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-nav": {
      "tagName": "snice-nav",
      "className": "SniceNav",
      "modulePath": "snice/components/nav/snice-nav",
      "sourceModule": "dist/components/nav/snice-nav.js",
      "family": "nav",
      "attributes": {
        "active-style": {
          "property": "activeStyle",
          "type": "'fill' | 'text'",
          "literals": [
            "fill",
            "text"
          ]
        },
        "is-top-level": {
          "property": "isTopLevel",
          "type": "boolean",
          "literals": []
        },
        "orientation": {
          "property": "orientation",
          "type": "'horizontal' | 'vertical'",
          "literals": [
            "horizontal",
            "vertical"
          ]
        },
        "variant": {
          "property": "variant",
          "type": "'flat' | 'hierarchical' | 'grouped'",
          "literals": [
            "flat",
            "hierarchical",
            "grouped"
          ]
        }
      },
      "properties": {
        "activeStyle": {
          "type": "'fill' | 'text'",
          "attribute": "active-style",
          "structured": false
        },
        "isTopLevel": {
          "type": "boolean",
          "attribute": "is-top-level",
          "structured": false
        },
        "orientation": {
          "type": "'horizontal' | 'vertical'",
          "attribute": "orientation",
          "structured": false
        },
        "variant": {
          "type": "'flat' | 'hierarchical' | 'grouped'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": []
    },
    "snice-network-graph": {
      "tagName": "snice-network-graph",
      "className": "SniceNetworkGraph",
      "modulePath": "snice/components/network-graph/snice-network-graph",
      "sourceModule": "dist/components/network-graph/snice-network-graph.js",
      "family": "network-graph",
      "attributes": {
        "animation": {
          "property": "animation",
          "type": "boolean",
          "literals": []
        },
        "charge-strength": {
          "property": "chargeStrength",
          "type": "number",
          "literals": []
        },
        "drag-enabled": {
          "property": "dragEnabled",
          "type": "boolean",
          "literals": []
        },
        "layout": {
          "property": "layout",
          "type": "'force' | 'circular' | 'grid'",
          "literals": [
            "force",
            "circular",
            "grid"
          ]
        },
        "link-distance": {
          "property": "linkDistance",
          "type": "number",
          "literals": []
        },
        "show-labels": {
          "property": "showLabels",
          "type": "boolean",
          "literals": []
        },
        "zoom-enabled": {
          "property": "zoomEnabled",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "animation": {
          "type": "boolean",
          "attribute": "animation",
          "structured": false
        },
        "chargeStrength": {
          "type": "number",
          "attribute": "charge-strength",
          "structured": false
        },
        "data": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "dragEnabled": {
          "type": "boolean",
          "attribute": "drag-enabled",
          "structured": false
        },
        "layout": {
          "type": "'force' | 'circular' | 'grid'",
          "attribute": "layout",
          "structured": false
        },
        "linkDistance": {
          "type": "number",
          "attribute": "link-distance",
          "structured": false
        },
        "showLabels": {
          "type": "boolean",
          "attribute": "show-labels",
          "structured": false
        },
        "zoomEnabled": {
          "type": "boolean",
          "attribute": "zoom-enabled",
          "structured": false
        }
      },
      "structuredProperties": [
        "data"
      ],
      "events": [
        {
          "name": "edge-click",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "graph-zoom",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "node-click",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "node-drag",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-notification-center": {
      "tagName": "snice-notification-center",
      "className": "SniceNotificationCenter",
      "modulePath": "snice/components/notification-center/snice-notification-center",
      "sourceModule": "dist/components/notification-center/snice-notification-center.js",
      "family": "notification-center",
      "attributes": {
        "icon": {
          "property": "icon",
          "type": "string",
          "literals": []
        },
        "open": {
          "property": "open",
          "type": "boolean",
          "literals": []
        },
        "placement": {
          "property": "placement",
          "type": "'start' | 'end'",
          "literals": [
            "start",
            "end"
          ]
        }
      },
      "properties": {
        "icon": {
          "type": "string",
          "attribute": "icon",
          "structured": false
        },
        "notifications": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "open": {
          "type": "boolean",
          "attribute": "open",
          "structured": false
        },
        "placement": {
          "type": "'start' | 'end'",
          "attribute": "placement",
          "structured": false
        }
      },
      "structuredProperties": [
        "notifications"
      ],
      "events": [
        {
          "name": "notification-click",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "notification-dismiss",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "notification-read-all",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        "icon"
      ]
    },
    "snice-option": {
      "tagName": "snice-option",
      "className": "SniceOption",
      "modulePath": "snice/components/select/snice-option",
      "sourceModule": "dist/components/select/snice-option.js",
      "family": "select",
      "attributes": {
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "icon": {
          "property": "icon",
          "type": "string",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "selected": {
          "property": "selected",
          "type": "boolean",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "icon": {
          "type": "string",
          "attribute": "icon",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "selected": {
          "type": "boolean",
          "attribute": "selected",
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": []
    },
    "snice-order-tracker": {
      "tagName": "snice-order-tracker",
      "className": "SniceOrderTracker",
      "modulePath": "snice/components/order-tracker/snice-order-tracker",
      "sourceModule": "dist/components/order-tracker/snice-order-tracker.js",
      "family": "order-tracker",
      "attributes": {
        "carrier": {
          "property": "carrier",
          "type": "string",
          "literals": []
        },
        "tracking-number": {
          "property": "trackingNumber",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'horizontal' | 'vertical'",
          "literals": [
            "horizontal",
            "vertical"
          ]
        }
      },
      "properties": {
        "carrier": {
          "type": "string",
          "attribute": "carrier",
          "structured": false
        },
        "steps": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "trackingNumber": {
          "type": "string",
          "attribute": "tracking-number",
          "structured": false
        },
        "variant": {
          "type": "'horizontal' | 'vertical'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [
        "steps"
      ],
      "events": [
        {
          "name": "step-click",
          "type": "CustomEvent<StepClickDetail>"
        }
      ],
      "slots": []
    },
    "snice-org-chart": {
      "tagName": "snice-org-chart",
      "className": "SniceOrgChart",
      "modulePath": "snice/components/org-chart/snice-org-chart",
      "sourceModule": "dist/components/org-chart/snice-org-chart.js",
      "family": "org-chart",
      "attributes": {
        "compact": {
          "property": "compact",
          "type": "boolean",
          "literals": []
        },
        "direction": {
          "property": "direction",
          "type": "'top-down' | 'left-right'",
          "literals": [
            "top-down",
            "left-right"
          ]
        }
      },
      "properties": {
        "compact": {
          "type": "boolean",
          "attribute": "compact",
          "structured": false
        },
        "data": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "direction": {
          "type": "'top-down' | 'left-right'",
          "attribute": "direction",
          "structured": false
        }
      },
      "structuredProperties": [
        "data"
      ],
      "events": [
        {
          "name": "node-click",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "node-collapse",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "node-expand",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-pagination": {
      "tagName": "snice-pagination",
      "className": "SnicePagination",
      "modulePath": "snice/components/pagination/snice-pagination",
      "sourceModule": "dist/components/pagination/snice-pagination.js",
      "family": "pagination",
      "attributes": {
        "current": {
          "property": "current",
          "type": "number",
          "literals": []
        },
        "show-first": {
          "property": "showFirst",
          "type": "boolean",
          "literals": []
        },
        "show-last": {
          "property": "showLast",
          "type": "boolean",
          "literals": []
        },
        "show-next": {
          "property": "showNext",
          "type": "boolean",
          "literals": []
        },
        "show-prev": {
          "property": "showPrev",
          "type": "boolean",
          "literals": []
        },
        "siblings": {
          "property": "siblings",
          "type": "number",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "total": {
          "property": "total",
          "type": "number",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'default' | 'rounded' | 'text'",
          "literals": [
            "default",
            "rounded",
            "text"
          ]
        }
      },
      "properties": {
        "current": {
          "type": "number",
          "attribute": "current",
          "structured": false
        },
        "showFirst": {
          "type": "boolean",
          "attribute": "show-first",
          "structured": false
        },
        "showLast": {
          "type": "boolean",
          "attribute": "show-last",
          "structured": false
        },
        "showNext": {
          "type": "boolean",
          "attribute": "show-next",
          "structured": false
        },
        "showPrev": {
          "type": "boolean",
          "attribute": "show-prev",
          "structured": false
        },
        "siblings": {
          "type": "number",
          "attribute": "siblings",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "total": {
          "type": "number",
          "attribute": "total",
          "structured": false
        },
        "variant": {
          "type": "'default' | 'rounded' | 'text'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "pagination-change",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-paint": {
      "tagName": "snice-paint",
      "className": "SnicePaint",
      "modulePath": "snice/components/paint/snice-paint",
      "sourceModule": "dist/components/paint/snice-paint.js",
      "family": "paint",
      "attributes": {
        "background-color": {
          "property": "backgroundColor",
          "type": "string",
          "literals": []
        },
        "color": {
          "property": "color",
          "type": "string",
          "literals": []
        },
        "color-selects": {
          "property": "colorSelects",
          "type": "number",
          "literals": []
        },
        "controls": {
          "property": "controls",
          "type": "string",
          "literals": []
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "max-stroke-width": {
          "property": "maxStrokeWidth",
          "type": "number",
          "literals": []
        },
        "min-stroke-width": {
          "property": "minStrokeWidth",
          "type": "number",
          "literals": []
        },
        "stroke-width": {
          "property": "strokeWidth",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "backgroundColor": {
          "type": "string",
          "attribute": "background-color",
          "structured": false
        },
        "color": {
          "type": "string",
          "attribute": "color",
          "structured": false
        },
        "colorSelects": {
          "type": "number",
          "attribute": "color-selects",
          "structured": false
        },
        "controls": {
          "type": "string",
          "attribute": "controls",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "maxStrokeWidth": {
          "type": "number",
          "attribute": "max-stroke-width",
          "structured": false
        },
        "minStrokeWidth": {
          "type": "number",
          "attribute": "min-stroke-width",
          "structured": false
        },
        "strokeWidth": {
          "type": "number",
          "attribute": "stroke-width",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "color-select",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "paint-clear",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "paint-end",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "paint-redo",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "paint-start",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "paint-undo",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        "colors",
        "size",
        "toolbar-end",
        "toolbar-start",
        "tools"
      ]
    },
    "snice-pdf-viewer": {
      "tagName": "snice-pdf-viewer",
      "className": "SnicePdfViewer",
      "modulePath": "snice/components/pdf-viewer/snice-pdf-viewer",
      "sourceModule": "dist/components/pdf-viewer/snice-pdf-viewer.js",
      "family": "pdf-viewer",
      "attributes": {
        "fit": {
          "property": "fit",
          "type": "'width' | 'height' | 'page'",
          "literals": [
            "width",
            "height",
            "page"
          ]
        },
        "page": {
          "property": "page",
          "type": "number",
          "literals": []
        },
        "src": {
          "property": "src",
          "type": "string",
          "literals": []
        },
        "zoom": {
          "property": "zoom",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "fit": {
          "type": "'width' | 'height' | 'page'",
          "attribute": "fit",
          "structured": false
        },
        "page": {
          "type": "number",
          "attribute": "page",
          "structured": false
        },
        "src": {
          "type": "string",
          "attribute": "src",
          "structured": false
        },
        "zoom": {
          "type": "number",
          "attribute": "zoom",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "page-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "pdf-error",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "pdf-loaded",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-permission-matrix": {
      "tagName": "snice-permission-matrix",
      "className": "SnicePermissionMatrix",
      "modulePath": "snice/components/permission-matrix/snice-permission-matrix",
      "sourceModule": "dist/components/permission-matrix/snice-permission-matrix.js",
      "family": "permission-matrix",
      "attributes": {
        "readonly": {
          "property": "readonly",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "matrix": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "permissions": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "readonly": {
          "type": "boolean",
          "attribute": "readonly",
          "structured": false
        },
        "roles": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        }
      },
      "structuredProperties": [
        "matrix",
        "permissions",
        "roles"
      ],
      "events": [
        {
          "name": "matrix-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "permission-toggle",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-plan": {
      "tagName": "snice-plan",
      "className": "SnicePlan",
      "modulePath": "snice/components/pricing-table/snice-pricing-table",
      "sourceModule": "dist/components/pricing-table/snice-pricing-table.js",
      "family": "pricing-table",
      "attributes": {},
      "properties": {},
      "structuredProperties": [],
      "events": [],
      "slots": [
        ""
      ]
    },
    "snice-podcast-player": {
      "tagName": "snice-podcast-player",
      "className": "SnicePodcastPlayer",
      "modulePath": "snice/components/podcast-player/snice-podcast-player",
      "sourceModule": "dist/components/podcast-player/snice-podcast-player.js",
      "family": "podcast-player",
      "attributes": {
        "artwork": {
          "property": "artwork",
          "type": "string",
          "literals": []
        },
        "current-episode-index": {
          "property": "currentEpisodeIndex",
          "type": "number",
          "literals": []
        },
        "current-time": {
          "property": "currentTime",
          "type": "number",
          "literals": []
        },
        "description": {
          "property": "description",
          "type": "string",
          "literals": []
        },
        "duration": {
          "property": "duration",
          "type": "number",
          "literals": []
        },
        "episode-title": {
          "property": "title",
          "type": "string",
          "literals": []
        },
        "from-rss": {
          "property": "fromRss",
          "type": "string",
          "literals": []
        },
        "muted": {
          "property": "muted",
          "type": "boolean",
          "literals": []
        },
        "playback-rate": {
          "property": "playbackRate",
          "type": "number",
          "literals": []
        },
        "show": {
          "property": "show",
          "type": "string",
          "literals": []
        },
        "skip-back": {
          "property": "skipBack",
          "type": "number",
          "literals": []
        },
        "skip-forward": {
          "property": "skipForward",
          "type": "number",
          "literals": []
        },
        "sleep-timer": {
          "property": "sleepTimer",
          "type": "number",
          "literals": []
        },
        "src": {
          "property": "src",
          "type": "string",
          "literals": []
        },
        "volume": {
          "property": "volume",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "artwork": {
          "type": "string",
          "attribute": "artwork",
          "structured": false
        },
        "currentEpisodeIndex": {
          "type": "number",
          "attribute": "current-episode-index",
          "structured": false
        },
        "currentTime": {
          "type": "number",
          "attribute": "current-time",
          "structured": false
        },
        "description": {
          "type": "string",
          "attribute": "description",
          "structured": false
        },
        "duration": {
          "type": "number",
          "attribute": "duration",
          "structured": false
        },
        "episodes": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "fromRss": {
          "type": "string",
          "attribute": "from-rss",
          "structured": false
        },
        "muted": {
          "type": "boolean",
          "attribute": "muted",
          "structured": false
        },
        "playbackRate": {
          "type": "number",
          "attribute": "playback-rate",
          "structured": false
        },
        "show": {
          "type": "string",
          "attribute": "show",
          "structured": false
        },
        "skipBack": {
          "type": "number",
          "attribute": "skip-back",
          "structured": false
        },
        "skipForward": {
          "type": "number",
          "attribute": "skip-forward",
          "structured": false
        },
        "sleepTimer": {
          "type": "number",
          "attribute": "sleep-timer",
          "structured": false
        },
        "src": {
          "type": "string",
          "attribute": "src",
          "structured": false
        },
        "state": {
          "type": "'playing' | 'paused' | 'stopped' | 'loading' | 'error'",
          "attribute": null,
          "structured": false
        },
        "title": {
          "type": "string",
          "attribute": "episode-title",
          "structured": false
        },
        "volume": {
          "type": "number",
          "attribute": "volume",
          "structured": false
        }
      },
      "structuredProperties": [
        "episodes"
      ],
      "events": [
        {
          "name": "podcast-ended",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "podcast-episode-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "podcast-feed-loaded",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "podcast-pause",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "podcast-play",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "podcast-rate-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "podcast-time-update",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-popover": {
      "tagName": "snice-popover",
      "className": "SnicePopover",
      "modulePath": "snice/components/popover/snice-popover",
      "sourceModule": "dist/components/popover/snice-popover.js",
      "family": "popover",
      "attributes": {
        "distance": {
          "property": "distance",
          "type": "number",
          "literals": []
        },
        "no-escape-dismiss": {
          "property": "noEscapeDismiss",
          "type": "boolean",
          "literals": []
        },
        "no-outside-dismiss": {
          "property": "noOutsideDismiss",
          "type": "boolean",
          "literals": []
        },
        "open": {
          "property": "open",
          "type": "boolean",
          "literals": []
        },
        "placement": {
          "property": "placement",
          "type": "| 'top'\n  | 'top-start'\n  | 'top-end'\n  | 'bottom'\n  | 'bottom-start'\n  | 'bottom-end'\n  | 'left'\n  | 'left-start'\n  | 'left-end'\n  | 'right'\n  | 'right-start'\n  | 'right-end'",
          "literals": [
            "top",
            "top-start",
            "top-end",
            "bottom",
            "bottom-start",
            "bottom-end",
            "left",
            "left-start",
            "left-end",
            "right",
            "right-start",
            "right-end"
          ]
        }
      },
      "properties": {
        "distance": {
          "type": "number",
          "attribute": "distance",
          "structured": false
        },
        "noEscapeDismiss": {
          "type": "boolean",
          "attribute": "no-escape-dismiss",
          "structured": false
        },
        "noOutsideDismiss": {
          "type": "boolean",
          "attribute": "no-outside-dismiss",
          "structured": false
        },
        "open": {
          "type": "boolean",
          "attribute": "open",
          "structured": false
        },
        "placement": {
          "type": "| 'top'\n  | 'top-start'\n  | 'top-end'\n  | 'bottom'\n  | 'bottom-start'\n  | 'bottom-end'\n  | 'left'\n  | 'left-start'\n  | 'left-end'\n  | 'right'\n  | 'right-start'\n  | 'right-end'",
          "attribute": "placement",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "popover-close",
          "type": "CustomEvent<PopoverCloseDetail>"
        },
        {
          "name": "popover-open",
          "type": "CustomEvent<PopoverOpenDetail>"
        }
      ],
      "slots": [
        "",
        "trigger"
      ]
    },
    "snice-pricing-table": {
      "tagName": "snice-pricing-table",
      "className": "SnicePricingTable",
      "modulePath": "snice/components/pricing-table/snice-pricing-table",
      "sourceModule": "dist/components/pricing-table/snice-pricing-table.js",
      "family": "pricing-table",
      "attributes": {
        "annual": {
          "property": "annual",
          "type": "boolean",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'cards' | 'table'",
          "literals": [
            "cards",
            "table"
          ]
        }
      },
      "properties": {
        "annual": {
          "type": "boolean",
          "attribute": "annual",
          "structured": false
        },
        "plans": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "variant": {
          "type": "'cards' | 'table'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [
        "plans"
      ],
      "events": [
        {
          "name": "plan-select",
          "type": "CustomEvent<PlanSelectDetail>"
        }
      ],
      "slots": [
        ""
      ]
    },
    "snice-product-card": {
      "tagName": "snice-product-card",
      "className": "SniceProductCard",
      "modulePath": "snice/components/product-card/snice-product-card",
      "sourceModule": "dist/components/product-card/snice-product-card.js",
      "family": "product-card",
      "attributes": {
        "badge": {
          "property": "badge",
          "type": "string",
          "literals": []
        },
        "badge-variant": {
          "property": "badgeVariant",
          "type": "'sale' | 'new' | 'featured'",
          "literals": [
            "sale",
            "new",
            "featured"
          ]
        },
        "currency": {
          "property": "currency",
          "type": "string",
          "literals": []
        },
        "favorite": {
          "property": "favorite",
          "type": "boolean",
          "literals": []
        },
        "in-stock": {
          "property": "inStock",
          "type": "boolean",
          "literals": []
        },
        "loading": {
          "property": "loading",
          "type": "boolean",
          "literals": []
        },
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "price": {
          "property": "price",
          "type": "number",
          "literals": []
        },
        "rating": {
          "property": "rating",
          "type": "number",
          "literals": []
        },
        "review-count": {
          "property": "reviewCount",
          "type": "number",
          "literals": []
        },
        "sale-price": {
          "property": "salePrice",
          "type": "number",
          "literals": []
        },
        "stock-count": {
          "property": "stockCount",
          "type": "number",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'vertical' | 'horizontal' | 'compact' | 'featured' | 'minimal' | 'grid'",
          "literals": [
            "vertical",
            "horizontal",
            "compact",
            "featured",
            "minimal",
            "grid"
          ]
        }
      },
      "properties": {
        "badge": {
          "type": "string",
          "attribute": "badge",
          "structured": false
        },
        "badgeVariant": {
          "type": "'sale' | 'new' | 'featured'",
          "attribute": "badge-variant",
          "structured": false
        },
        "currency": {
          "type": "string",
          "attribute": "currency",
          "structured": false
        },
        "favorite": {
          "type": "boolean",
          "attribute": "favorite",
          "structured": false
        },
        "images": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "inStock": {
          "type": "boolean",
          "attribute": "in-stock",
          "structured": false
        },
        "loading": {
          "type": "boolean",
          "attribute": "loading",
          "structured": false
        },
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "price": {
          "type": "number",
          "attribute": "price",
          "structured": false
        },
        "rating": {
          "type": "number",
          "attribute": "rating",
          "structured": false
        },
        "reviewCount": {
          "type": "number",
          "attribute": "review-count",
          "structured": false
        },
        "salePrice": {
          "type": "number",
          "attribute": "sale-price",
          "structured": false
        },
        "stockCount": {
          "type": "number",
          "attribute": "stock-count",
          "structured": false
        },
        "variant": {
          "type": "'vertical' | 'horizontal' | 'compact' | 'featured' | 'minimal' | 'grid'",
          "attribute": "variant",
          "structured": false
        },
        "variants": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        }
      },
      "structuredProperties": [
        "images",
        "variants"
      ],
      "events": [
        {
          "name": "add-to-cart",
          "type": "CustomEvent<AddToCartDetail>"
        },
        {
          "name": "favorite",
          "type": "CustomEvent<FavoriteDetail>"
        },
        {
          "name": "image-click",
          "type": "CustomEvent<ImageClickDetail>"
        },
        {
          "name": "quick-view",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "variant-select",
          "type": "CustomEvent<VariantSelectDetail>"
        }
      ],
      "slots": []
    },
    "snice-progress": {
      "tagName": "snice-progress",
      "className": "SniceProgress",
      "modulePath": "snice/components/progress/snice-progress",
      "sourceModule": "dist/components/progress/snice-progress.js",
      "family": "progress",
      "attributes": {
        "animated": {
          "property": "animated",
          "type": "boolean",
          "literals": []
        },
        "color": {
          "property": "color",
          "type": "ProgressColor | string",
          "literals": []
        },
        "indeterminate": {
          "property": "indeterminate",
          "type": "boolean",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "max": {
          "property": "max",
          "type": "number",
          "literals": []
        },
        "show-label": {
          "property": "showLabel",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large' | 'xl' | 'xxl' | 'xxxl'",
          "literals": [
            "small",
            "medium",
            "large",
            "xl",
            "xxl",
            "xxxl"
          ]
        },
        "striped": {
          "property": "striped",
          "type": "boolean",
          "literals": []
        },
        "thickness": {
          "property": "thickness",
          "type": "number",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "number",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'linear' | 'circular'",
          "literals": [
            "linear",
            "circular"
          ]
        }
      },
      "properties": {
        "animated": {
          "type": "boolean",
          "attribute": "animated",
          "structured": false
        },
        "color": {
          "type": "ProgressColor | string",
          "attribute": "color",
          "structured": false
        },
        "indeterminate": {
          "type": "boolean",
          "attribute": "indeterminate",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "max": {
          "type": "number",
          "attribute": "max",
          "structured": false
        },
        "showLabel": {
          "type": "boolean",
          "attribute": "show-label",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large' | 'xl' | 'xxl' | 'xxxl'",
          "attribute": "size",
          "structured": false
        },
        "striped": {
          "type": "boolean",
          "attribute": "striped",
          "structured": false
        },
        "thickness": {
          "type": "number",
          "attribute": "thickness",
          "structured": false
        },
        "value": {
          "type": "number",
          "attribute": "value",
          "structured": false
        },
        "variant": {
          "type": "'linear' | 'circular'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "progress-change",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-progress-ring": {
      "tagName": "snice-progress-ring",
      "className": "SniceProgressRing",
      "modulePath": "snice/components/progress-ring/snice-progress-ring",
      "sourceModule": "dist/components/progress-ring/snice-progress-ring.js",
      "family": "progress-ring",
      "attributes": {
        "color": {
          "property": "color",
          "type": "string",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "max": {
          "property": "max",
          "type": "number",
          "literals": []
        },
        "show-value": {
          "property": "showValue",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "thickness": {
          "property": "thickness",
          "type": "number",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "color": {
          "type": "string",
          "attribute": "color",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "max": {
          "type": "number",
          "attribute": "max",
          "structured": false
        },
        "showValue": {
          "type": "boolean",
          "attribute": "show-value",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "thickness": {
          "type": "number",
          "attribute": "thickness",
          "structured": false
        },
        "value": {
          "type": "number",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "progress-complete",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-qr-code": {
      "tagName": "snice-qr-code",
      "className": "SniceQRCode",
      "modulePath": "snice/components/qr-code/snice-qr-code",
      "sourceModule": "dist/components/qr-code/snice-qr-code.js",
      "family": "qr-code",
      "attributes": {
        "bg-color": {
          "property": "bgColor",
          "type": "string",
          "literals": []
        },
        "center-text": {
          "property": "centerText",
          "type": "string",
          "literals": []
        },
        "center-text-size": {
          "property": "centerTextSize",
          "type": "number",
          "literals": []
        },
        "dot-style": {
          "property": "dotStyle",
          "type": "string",
          "literals": []
        },
        "error-correction-level": {
          "property": "errorCorrectionLevel",
          "type": "string",
          "literals": []
        },
        "fg-color": {
          "property": "fgColor",
          "type": "string",
          "literals": []
        },
        "image-size": {
          "property": "imageSize",
          "type": "number",
          "literals": []
        },
        "image-url": {
          "property": "imageUrl",
          "type": "string",
          "literals": []
        },
        "include-image": {
          "property": "includeImage",
          "type": "boolean",
          "literals": []
        },
        "margin": {
          "property": "margin",
          "type": "number",
          "literals": []
        },
        "render-mode": {
          "property": "renderMode",
          "type": "string",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "number",
          "literals": []
        },
        "text-fill-color": {
          "property": "textFillColor",
          "type": "string",
          "literals": []
        },
        "text-outline-color": {
          "property": "textOutlineColor",
          "type": "string",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "bgColor": {
          "type": "string",
          "attribute": "bg-color",
          "structured": false
        },
        "centerText": {
          "type": "string",
          "attribute": "center-text",
          "structured": false
        },
        "centerTextSize": {
          "type": "number",
          "attribute": "center-text-size",
          "structured": false
        },
        "dotStyle": {
          "type": "string",
          "attribute": "dot-style",
          "structured": false
        },
        "errorCorrectionLevel": {
          "type": "string",
          "attribute": "error-correction-level",
          "structured": false
        },
        "fgColor": {
          "type": "string",
          "attribute": "fg-color",
          "structured": false
        },
        "imageSize": {
          "type": "number",
          "attribute": "image-size",
          "structured": false
        },
        "imageUrl": {
          "type": "string",
          "attribute": "image-url",
          "structured": false
        },
        "includeImage": {
          "type": "boolean",
          "attribute": "include-image",
          "structured": false
        },
        "margin": {
          "type": "number",
          "attribute": "margin",
          "structured": false
        },
        "renderMode": {
          "type": "string",
          "attribute": "render-mode",
          "structured": false
        },
        "size": {
          "type": "number",
          "attribute": "size",
          "structured": false
        },
        "textFillColor": {
          "type": "string",
          "attribute": "text-fill-color",
          "structured": false
        },
        "textOutlineColor": {
          "type": "string",
          "attribute": "text-outline-color",
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": []
    },
    "snice-qr-reader": {
      "tagName": "snice-qr-reader",
      "className": "SniceQRReader",
      "modulePath": "snice/components/qr-reader/snice-qr-reader",
      "sourceModule": "dist/components/qr-reader/snice-qr-reader.js",
      "family": "qr-reader",
      "attributes": {
        "auto-start": {
          "property": "autoStart",
          "type": "boolean",
          "literals": []
        },
        "camera": {
          "property": "camera",
          "type": "string",
          "literals": []
        },
        "manual-snap": {
          "property": "manualSnap",
          "type": "boolean",
          "literals": []
        },
        "pick-first": {
          "property": "pickFirst",
          "type": "boolean",
          "literals": []
        },
        "scan-speed": {
          "property": "scanSpeed",
          "type": "number",
          "literals": []
        },
        "tap-start": {
          "property": "tapStart",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "autoStart": {
          "type": "boolean",
          "attribute": "auto-start",
          "structured": false
        },
        "camera": {
          "type": "string",
          "attribute": "camera",
          "structured": false
        },
        "manualSnap": {
          "type": "boolean",
          "attribute": "manual-snap",
          "structured": false
        },
        "pickFirst": {
          "type": "boolean",
          "attribute": "pick-first",
          "structured": false
        },
        "scanSpeed": {
          "type": "number",
          "attribute": "scan-speed",
          "structured": false
        },
        "tapStart": {
          "type": "boolean",
          "attribute": "tap-start",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "camera-error",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "camera-ready",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "qr-error",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "qr-scan",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-radio": {
      "tagName": "snice-radio",
      "className": "SniceRadio",
      "modulePath": "snice/components/radio/snice-radio",
      "sourceModule": "dist/components/radio/snice-radio.js",
      "family": "radio",
      "attributes": {
        "checked": {
          "property": "defaultChecked",
          "type": "boolean",
          "literals": []
        },
        "description": {
          "property": "description",
          "type": "string",
          "literals": []
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "invalid": {
          "property": "invalid",
          "type": "boolean",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "loading": {
          "property": "loading",
          "type": "boolean",
          "literals": []
        },
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "required": {
          "property": "required",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "value": {
          "property": "value",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'default' | 'block'",
          "literals": [
            "default",
            "block"
          ]
        }
      },
      "properties": {
        "checked": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        },
        "defaultChecked": {
          "type": "boolean",
          "attribute": "checked",
          "structured": false
        },
        "description": {
          "type": "string",
          "attribute": "description",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "form": {
          "type": "HTMLFormElement | null",
          "attribute": null,
          "structured": false
        },
        "invalid": {
          "type": "boolean",
          "attribute": "invalid",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "labels": {
          "type": "NodeList | null",
          "attribute": null,
          "structured": false
        },
        "loading": {
          "type": "boolean",
          "attribute": "loading",
          "structured": false
        },
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "required": {
          "type": "boolean",
          "attribute": "required",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "type": {
          "type": "'radio'",
          "attribute": null,
          "structured": false
        },
        "validationMessage": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "validity": {
          "type": "ValidityState",
          "attribute": null,
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": "value",
          "structured": false
        },
        "variant": {
          "type": "'default' | 'block'",
          "attribute": "variant",
          "structured": false
        },
        "willValidate": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "radio-change",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        "suffix"
      ]
    },
    "snice-range-slider": {
      "tagName": "snice-range-slider",
      "className": "SniceRangeSlider",
      "modulePath": "snice/components/range-slider/snice-range-slider",
      "sourceModule": "dist/components/range-slider/snice-range-slider.js",
      "family": "range-slider",
      "attributes": {
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "max": {
          "property": "max",
          "type": "number",
          "literals": []
        },
        "min": {
          "property": "min",
          "type": "number",
          "literals": []
        },
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "orientation": {
          "property": "orientation",
          "type": "'horizontal' | 'vertical'",
          "literals": [
            "horizontal",
            "vertical"
          ]
        },
        "show-labels": {
          "property": "showLabels",
          "type": "boolean",
          "literals": []
        },
        "show-tooltip": {
          "property": "showTooltip",
          "type": "boolean",
          "literals": []
        },
        "step": {
          "property": "step",
          "type": "number",
          "literals": []
        },
        "value-high": {
          "property": "defaultValueHigh",
          "type": "number",
          "literals": []
        },
        "value-low": {
          "property": "defaultValueLow",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "defaultValueHigh": {
          "type": "number",
          "attribute": "value-high",
          "structured": false
        },
        "defaultValueLow": {
          "type": "number",
          "attribute": "value-low",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "form": {
          "type": "HTMLFormElement | null",
          "attribute": null,
          "structured": false
        },
        "labels": {
          "type": "NodeList | null",
          "attribute": null,
          "structured": false
        },
        "max": {
          "type": "number",
          "attribute": "max",
          "structured": false
        },
        "min": {
          "type": "number",
          "attribute": "min",
          "structured": false
        },
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "orientation": {
          "type": "'horizontal' | 'vertical'",
          "attribute": "orientation",
          "structured": false
        },
        "showLabels": {
          "type": "boolean",
          "attribute": "show-labels",
          "structured": false
        },
        "showTooltip": {
          "type": "boolean",
          "attribute": "show-tooltip",
          "structured": false
        },
        "step": {
          "type": "number",
          "attribute": "step",
          "structured": false
        },
        "type": {
          "type": "'range'",
          "attribute": null,
          "structured": false
        },
        "validationMessage": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "validity": {
          "type": "ValidityState",
          "attribute": null,
          "structured": false
        },
        "valueHigh": {
          "type": "number",
          "attribute": null,
          "structured": false
        },
        "valueLow": {
          "type": "number",
          "attribute": null,
          "structured": false
        },
        "willValidate": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "range-change",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-rating": {
      "tagName": "snice-rating",
      "className": "SniceRating",
      "modulePath": "snice/components/rating/snice-rating",
      "sourceModule": "dist/components/rating/snice-rating.js",
      "family": "rating",
      "attributes": {
        "empty-icon": {
          "property": "emptyIcon",
          "type": "string",
          "literals": []
        },
        "icon": {
          "property": "icon",
          "type": "string",
          "literals": []
        },
        "max": {
          "property": "max",
          "type": "number",
          "literals": []
        },
        "precision": {
          "property": "precision",
          "type": "'full' | 'half'",
          "literals": [
            "full",
            "half"
          ]
        },
        "readonly": {
          "property": "readonly",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "value": {
          "property": "value",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "emptyIcon": {
          "type": "string",
          "attribute": "empty-icon",
          "structured": false
        },
        "icon": {
          "type": "string",
          "attribute": "icon",
          "structured": false
        },
        "max": {
          "type": "number",
          "attribute": "max",
          "structured": false
        },
        "precision": {
          "type": "'full' | 'half'",
          "attribute": "precision",
          "structured": false
        },
        "readonly": {
          "type": "boolean",
          "attribute": "readonly",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "value": {
          "type": "number",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "rating-change",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-receipt": {
      "tagName": "snice-receipt",
      "className": "SniceReceipt",
      "modulePath": "snice/components/receipt/snice-receipt",
      "sourceModule": "dist/components/receipt/snice-receipt.js",
      "family": "receipt",
      "attributes": {
        "cashier": {
          "property": "cashier",
          "type": "string",
          "literals": []
        },
        "currency": {
          "property": "currency",
          "type": "string",
          "literals": []
        },
        "date": {
          "property": "date",
          "type": "string",
          "literals": []
        },
        "discount": {
          "property": "discount",
          "type": "number",
          "literals": []
        },
        "discount-label": {
          "property": "discountLabel",
          "type": "string",
          "literals": []
        },
        "locale": {
          "property": "locale",
          "type": "string",
          "literals": []
        },
        "payment-details": {
          "property": "paymentDetails",
          "type": "string",
          "literals": []
        },
        "payment-method": {
          "property": "paymentMethod",
          "type": "string",
          "literals": []
        },
        "qr-data": {
          "property": "qrData",
          "type": "string",
          "literals": []
        },
        "qr-position": {
          "property": "qrPosition",
          "type": "'top' | 'bottom' | 'footer'",
          "literals": [
            "top",
            "bottom",
            "footer"
          ]
        },
        "receipt-number": {
          "property": "receiptNumber",
          "type": "string",
          "literals": []
        },
        "show-qr": {
          "property": "showQr",
          "type": "boolean",
          "literals": []
        },
        "subtotal": {
          "property": "subtotal",
          "type": "number",
          "literals": []
        },
        "tax": {
          "property": "tax",
          "type": "number",
          "literals": []
        },
        "terminal-id": {
          "property": "terminalId",
          "type": "string",
          "literals": []
        },
        "thank-you": {
          "property": "thankYou",
          "type": "string",
          "literals": []
        },
        "tip": {
          "property": "tip",
          "type": "number",
          "literals": []
        },
        "total": {
          "property": "total",
          "type": "number",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'standard' | 'thermal' | 'modern' | 'minimal' | 'detailed' | 'paper' | 'ink' | 'ledger' | 'ticket'",
          "literals": [
            "standard",
            "thermal",
            "modern",
            "minimal",
            "detailed",
            "paper",
            "ink",
            "ledger",
            "ticket"
          ]
        }
      },
      "properties": {
        "cashier": {
          "type": "string",
          "attribute": "cashier",
          "structured": false
        },
        "currency": {
          "type": "string",
          "attribute": "currency",
          "structured": false
        },
        "date": {
          "type": "string",
          "attribute": "date",
          "structured": false
        },
        "discount": {
          "type": "number",
          "attribute": "discount",
          "structured": false
        },
        "discountLabel": {
          "type": "string",
          "attribute": "discount-label",
          "structured": false
        },
        "items": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "locale": {
          "type": "string",
          "attribute": "locale",
          "structured": false
        },
        "merchant": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "paymentDetails": {
          "type": "string",
          "attribute": "payment-details",
          "structured": false
        },
        "paymentMethod": {
          "type": "string",
          "attribute": "payment-method",
          "structured": false
        },
        "qrData": {
          "type": "string",
          "attribute": "qr-data",
          "structured": false
        },
        "qrPosition": {
          "type": "'top' | 'bottom' | 'footer'",
          "attribute": "qr-position",
          "structured": false
        },
        "receiptNumber": {
          "type": "string",
          "attribute": "receipt-number",
          "structured": false
        },
        "showQr": {
          "type": "boolean",
          "attribute": "show-qr",
          "structured": false
        },
        "subtotal": {
          "type": "number",
          "attribute": "subtotal",
          "structured": false
        },
        "tax": {
          "type": "number",
          "attribute": "tax",
          "structured": false
        },
        "taxes": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "terminalId": {
          "type": "string",
          "attribute": "terminal-id",
          "structured": false
        },
        "thankYou": {
          "type": "string",
          "attribute": "thank-you",
          "structured": false
        },
        "tip": {
          "type": "number",
          "attribute": "tip",
          "structured": false
        },
        "total": {
          "type": "number",
          "attribute": "total",
          "structured": false
        },
        "variant": {
          "type": "'standard' | 'thermal' | 'modern' | 'minimal' | 'detailed' | 'paper' | 'ink' | 'ledger' | 'ticket'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [
        "items",
        "merchant",
        "taxes"
      ],
      "events": [],
      "slots": [
        "",
        "after-items",
        "barcode",
        "before-items",
        "qr",
        "thank-you"
      ]
    },
    "snice-recipe": {
      "tagName": "snice-recipe",
      "className": "SniceRecipe",
      "modulePath": "snice/components/recipe/snice-recipe",
      "sourceModule": "dist/components/recipe/snice-recipe.js",
      "family": "recipe",
      "attributes": {
        "author": {
          "property": "author",
          "type": "string",
          "literals": []
        },
        "cook-time": {
          "property": "cookTime",
          "type": "number",
          "literals": []
        },
        "cuisine": {
          "property": "cuisine",
          "type": "string",
          "literals": []
        },
        "description": {
          "property": "description",
          "type": "string",
          "literals": []
        },
        "difficulty": {
          "property": "difficulty",
          "type": "'easy' | 'medium' | 'hard'",
          "literals": [
            "easy",
            "medium",
            "hard"
          ]
        },
        "image": {
          "property": "image",
          "type": "string",
          "literals": []
        },
        "prep-time": {
          "property": "prepTime",
          "type": "number",
          "literals": []
        },
        "servings": {
          "property": "servings",
          "type": "number",
          "literals": []
        },
        "title": {
          "property": "title",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'card' | 'full'",
          "literals": [
            "card",
            "full"
          ]
        }
      },
      "properties": {
        "author": {
          "type": "string",
          "attribute": "author",
          "structured": false
        },
        "cookTime": {
          "type": "number",
          "attribute": "cook-time",
          "structured": false
        },
        "cuisine": {
          "type": "string",
          "attribute": "cuisine",
          "structured": false
        },
        "description": {
          "type": "string",
          "attribute": "description",
          "structured": false
        },
        "difficulty": {
          "type": "'easy' | 'medium' | 'hard'",
          "attribute": "difficulty",
          "structured": false
        },
        "image": {
          "type": "string",
          "attribute": "image",
          "structured": false
        },
        "ingredients": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "nutrition": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "prepTime": {
          "type": "number",
          "attribute": "prep-time",
          "structured": false
        },
        "servings": {
          "type": "number",
          "attribute": "servings",
          "structured": false
        },
        "steps": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "tags": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "title": {
          "type": "string",
          "attribute": "title",
          "structured": false
        },
        "variant": {
          "type": "'card' | 'full'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [
        "ingredients",
        "nutrition",
        "steps",
        "tags"
      ],
      "events": [
        {
          "name": "recipe-ingredient-check",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "recipe-serving-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "recipe-step-complete",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-row": {
      "tagName": "snice-row",
      "className": "SniceRow",
      "modulePath": "snice/components/table/snice-row",
      "sourceModule": "dist/components/table/snice-row.js",
      "family": "table",
      "attributes": {
        "clickable": {
          "property": "clickable",
          "type": "boolean",
          "literals": []
        },
        "hoverable": {
          "property": "hoverable",
          "type": "boolean",
          "literals": []
        },
        "index": {
          "property": "index",
          "type": "number",
          "literals": []
        },
        "selectable": {
          "property": "selectable",
          "type": "boolean",
          "literals": []
        },
        "selected": {
          "property": "selected",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "clickable": {
          "type": "boolean",
          "attribute": "clickable",
          "structured": false
        },
        "columns": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "data": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "hoverable": {
          "type": "boolean",
          "attribute": "hoverable",
          "structured": false
        },
        "index": {
          "type": "number",
          "attribute": "index",
          "structured": false
        },
        "selectable": {
          "type": "boolean",
          "attribute": "selectable",
          "structured": false
        },
        "selected": {
          "type": "boolean",
          "attribute": "selected",
          "structured": false
        },
        "selectionDisabled": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        }
      },
      "structuredProperties": [
        "columns",
        "data"
      ],
      "events": [
        {
          "name": "row-click",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "row-hover",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "row-select",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-sankey": {
      "tagName": "snice-sankey",
      "className": "SniceSankey",
      "modulePath": "snice/components/sankey/snice-sankey",
      "sourceModule": "dist/components/sankey/snice-sankey.js",
      "family": "sankey",
      "attributes": {
        "alignment": {
          "property": "alignment",
          "type": "'left' | 'right' | 'center' | 'justify'",
          "literals": [
            "left",
            "right",
            "center",
            "justify"
          ]
        },
        "animation": {
          "property": "animation",
          "type": "boolean",
          "literals": []
        },
        "node-padding": {
          "property": "nodePadding",
          "type": "number",
          "literals": []
        },
        "node-width": {
          "property": "nodeWidth",
          "type": "number",
          "literals": []
        },
        "show-labels": {
          "property": "showLabels",
          "type": "boolean",
          "literals": []
        },
        "show-values": {
          "property": "showValues",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "alignment": {
          "type": "'left' | 'right' | 'center' | 'justify'",
          "attribute": "alignment",
          "structured": false
        },
        "animation": {
          "type": "boolean",
          "attribute": "animation",
          "structured": false
        },
        "data": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "nodePadding": {
          "type": "number",
          "attribute": "node-padding",
          "structured": false
        },
        "nodeWidth": {
          "type": "number",
          "attribute": "node-width",
          "structured": false
        },
        "showLabels": {
          "type": "boolean",
          "attribute": "show-labels",
          "structured": false
        },
        "showValues": {
          "type": "boolean",
          "attribute": "show-values",
          "structured": false
        }
      },
      "structuredProperties": [
        "data"
      ],
      "events": [
        {
          "name": "sankey-hover",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "sankey-link-click",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "sankey-node-click",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-segmented-control": {
      "tagName": "snice-segmented-control",
      "className": "SniceSegmentedControl",
      "modulePath": "snice/components/segmented-control/snice-segmented-control",
      "sourceModule": "dist/components/segmented-control/snice-segmented-control.js",
      "family": "segmented-control",
      "attributes": {
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "value": {
          "property": "value",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "options": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [
        "options"
      ],
      "events": [
        {
          "name": "value-change",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-select": {
      "tagName": "snice-select",
      "className": "SniceSelect",
      "modulePath": "snice/components/select/snice-select",
      "sourceModule": "dist/components/select/snice-select.js",
      "family": "select",
      "attributes": {
        "allow-free-text": {
          "property": "allowFreeText",
          "type": "boolean",
          "literals": []
        },
        "clearable": {
          "property": "clearable",
          "type": "boolean",
          "literals": []
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "editable": {
          "property": "editable",
          "type": "boolean",
          "literals": []
        },
        "error-text": {
          "property": "errorText",
          "type": "string",
          "literals": []
        },
        "helper-text": {
          "property": "helperText",
          "type": "string",
          "literals": []
        },
        "invalid": {
          "property": "invalid",
          "type": "boolean",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "loading": {
          "property": "loading",
          "type": "boolean",
          "literals": []
        },
        "max-height": {
          "property": "maxHeight",
          "type": "string",
          "literals": []
        },
        "multiple": {
          "property": "multiple",
          "type": "boolean",
          "literals": []
        },
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "open": {
          "property": "open",
          "type": "boolean",
          "literals": []
        },
        "placeholder": {
          "property": "placeholder",
          "type": "string",
          "literals": []
        },
        "readonly": {
          "property": "readonly",
          "type": "boolean",
          "literals": []
        },
        "remote": {
          "property": "remote",
          "type": "boolean",
          "literals": []
        },
        "required": {
          "property": "required",
          "type": "boolean",
          "literals": []
        },
        "search-debounce": {
          "property": "searchDebounce",
          "type": "number",
          "literals": []
        },
        "searchable": {
          "property": "searchable",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "value": {
          "property": "defaultValue",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "allowFreeText": {
          "type": "boolean",
          "attribute": "allow-free-text",
          "structured": false
        },
        "clearable": {
          "type": "boolean",
          "attribute": "clearable",
          "structured": false
        },
        "defaultValue": {
          "type": "string",
          "attribute": "value",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "editable": {
          "type": "boolean",
          "attribute": "editable",
          "structured": false
        },
        "errorText": {
          "type": "string",
          "attribute": "error-text",
          "structured": false
        },
        "form": {
          "type": "HTMLFormElement | null",
          "attribute": null,
          "structured": false
        },
        "helperText": {
          "type": "string",
          "attribute": "helper-text",
          "structured": false
        },
        "invalid": {
          "type": "boolean",
          "attribute": "invalid",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "labels": {
          "type": "NodeList | null",
          "attribute": null,
          "structured": false
        },
        "loading": {
          "type": "boolean",
          "attribute": "loading",
          "structured": false
        },
        "maxHeight": {
          "type": "string",
          "attribute": "max-height",
          "structured": false
        },
        "multiple": {
          "type": "boolean",
          "attribute": "multiple",
          "structured": false
        },
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "open": {
          "type": "boolean",
          "attribute": "open",
          "structured": false
        },
        "options": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "placeholder": {
          "type": "string",
          "attribute": "placeholder",
          "structured": false
        },
        "readonly": {
          "type": "boolean",
          "attribute": "readonly",
          "structured": false
        },
        "remote": {
          "type": "boolean",
          "attribute": "remote",
          "structured": false
        },
        "required": {
          "type": "boolean",
          "attribute": "required",
          "structured": false
        },
        "searchable": {
          "type": "boolean",
          "attribute": "searchable",
          "structured": false
        },
        "searchDebounce": {
          "type": "number",
          "attribute": "search-debounce",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "type": {
          "type": "'select-one' | 'select-multiple'",
          "attribute": null,
          "structured": false
        },
        "validationMessage": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "validity": {
          "type": "ValidityState",
          "attribute": null,
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "willValidate": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        }
      },
      "structuredProperties": [
        "options"
      ],
      "events": [
        {
          "name": "select-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "select-close",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "select-open",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-skeleton": {
      "tagName": "snice-skeleton",
      "className": "SniceSkeleton",
      "modulePath": "snice/components/skeleton/snice-skeleton",
      "sourceModule": "dist/components/skeleton/snice-skeleton.js",
      "family": "skeleton",
      "attributes": {
        "animation": {
          "property": "animation",
          "type": "'pulse' | 'wave' | 'none'",
          "literals": [
            "pulse",
            "wave",
            "none"
          ]
        },
        "count": {
          "property": "count",
          "type": "number",
          "literals": []
        },
        "height": {
          "property": "height",
          "type": "string",
          "literals": []
        },
        "spacing": {
          "property": "spacing",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'text' | 'circular' | 'rectangular' | 'rounded'",
          "literals": [
            "text",
            "circular",
            "rectangular",
            "rounded"
          ]
        },
        "width": {
          "property": "width",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "animation": {
          "type": "'pulse' | 'wave' | 'none'",
          "attribute": "animation",
          "structured": false
        },
        "count": {
          "type": "number",
          "attribute": "count",
          "structured": false
        },
        "height": {
          "type": "string",
          "attribute": "height",
          "structured": false
        },
        "spacing": {
          "type": "string",
          "attribute": "spacing",
          "structured": false
        },
        "variant": {
          "type": "'text' | 'circular' | 'rectangular' | 'rounded'",
          "attribute": "variant",
          "structured": false
        },
        "width": {
          "type": "string",
          "attribute": "width",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": []
    },
    "snice-slider": {
      "tagName": "snice-slider",
      "className": "SniceSlider",
      "modulePath": "snice/components/slider/snice-slider",
      "sourceModule": "dist/components/slider/snice-slider.js",
      "family": "slider",
      "attributes": {
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "error-text": {
          "property": "errorText",
          "type": "string",
          "literals": []
        },
        "helper-text": {
          "property": "helperText",
          "type": "string",
          "literals": []
        },
        "invalid": {
          "property": "invalid",
          "type": "boolean",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "loading": {
          "property": "loading",
          "type": "boolean",
          "literals": []
        },
        "max": {
          "property": "max",
          "type": "number",
          "literals": []
        },
        "min": {
          "property": "min",
          "type": "number",
          "literals": []
        },
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "readonly": {
          "property": "readonly",
          "type": "boolean",
          "literals": []
        },
        "required": {
          "property": "required",
          "type": "boolean",
          "literals": []
        },
        "show-ticks": {
          "property": "showTicks",
          "type": "boolean",
          "literals": []
        },
        "show-value": {
          "property": "showValue",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "step": {
          "property": "step",
          "type": "number",
          "literals": []
        },
        "value": {
          "property": "defaultValue",
          "type": "number",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'default' | 'primary' | 'success' | 'warning' | 'danger'",
          "literals": [
            "default",
            "primary",
            "success",
            "warning",
            "danger"
          ]
        },
        "vertical": {
          "property": "vertical",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "defaultValue": {
          "type": "number",
          "attribute": "value",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "errorText": {
          "type": "string",
          "attribute": "error-text",
          "structured": false
        },
        "form": {
          "type": "HTMLFormElement | null",
          "attribute": null,
          "structured": false
        },
        "helperText": {
          "type": "string",
          "attribute": "helper-text",
          "structured": false
        },
        "invalid": {
          "type": "boolean",
          "attribute": "invalid",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "labels": {
          "type": "NodeList | null",
          "attribute": null,
          "structured": false
        },
        "loading": {
          "type": "boolean",
          "attribute": "loading",
          "structured": false
        },
        "max": {
          "type": "number",
          "attribute": "max",
          "structured": false
        },
        "min": {
          "type": "number",
          "attribute": "min",
          "structured": false
        },
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "readonly": {
          "type": "boolean",
          "attribute": "readonly",
          "structured": false
        },
        "required": {
          "type": "boolean",
          "attribute": "required",
          "structured": false
        },
        "showTicks": {
          "type": "boolean",
          "attribute": "show-ticks",
          "structured": false
        },
        "showValue": {
          "type": "boolean",
          "attribute": "show-value",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "step": {
          "type": "number",
          "attribute": "step",
          "structured": false
        },
        "type": {
          "type": "'range'",
          "attribute": null,
          "structured": false
        },
        "validationMessage": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "validity": {
          "type": "ValidityState",
          "attribute": null,
          "structured": false
        },
        "value": {
          "type": "number",
          "attribute": null,
          "structured": false
        },
        "variant": {
          "type": "'default' | 'primary' | 'success' | 'warning' | 'danger'",
          "attribute": "variant",
          "structured": false
        },
        "vertical": {
          "type": "boolean",
          "attribute": "vertical",
          "structured": false
        },
        "willValidate": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "slider-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "slider-input",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-sortable": {
      "tagName": "snice-sortable",
      "className": "SniceSortable",
      "modulePath": "snice/components/sortable/snice-sortable",
      "sourceModule": "dist/components/sortable/snice-sortable.js",
      "family": "sortable",
      "attributes": {
        "direction": {
          "property": "direction",
          "type": "'vertical' | 'horizontal'",
          "literals": [
            "vertical",
            "horizontal"
          ]
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "group": {
          "property": "group",
          "type": "string",
          "literals": []
        },
        "handle": {
          "property": "handle",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "direction": {
          "type": "'vertical' | 'horizontal'",
          "attribute": "direction",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "group": {
          "type": "string",
          "attribute": "group",
          "structured": false
        },
        "handle": {
          "type": "string",
          "attribute": "handle",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "sort-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "sort-end",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "sort-start",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        ""
      ]
    },
    "snice-sparkline": {
      "tagName": "snice-sparkline",
      "className": "SniceSparkline",
      "modulePath": "snice/components/sparkline/snice-sparkline",
      "sourceModule": "dist/components/sparkline/snice-sparkline.js",
      "family": "sparkline",
      "attributes": {
        "color": {
          "property": "color",
          "type": "'primary' | 'success' | 'warning' | 'danger' | 'muted'",
          "literals": [
            "primary",
            "success",
            "warning",
            "danger",
            "muted"
          ]
        },
        "customcolor": {
          "property": "customColor",
          "type": "string",
          "literals": []
        },
        "height": {
          "property": "height",
          "type": "number",
          "literals": []
        },
        "max": {
          "property": "max",
          "type": "number",
          "literals": []
        },
        "min": {
          "property": "min",
          "type": "number",
          "literals": []
        },
        "showarea": {
          "property": "showArea",
          "type": "boolean",
          "literals": []
        },
        "showdots": {
          "property": "showDots",
          "type": "boolean",
          "literals": []
        },
        "smooth": {
          "property": "smooth",
          "type": "boolean",
          "literals": []
        },
        "strokewidth": {
          "property": "strokeWidth",
          "type": "number",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "'line' | 'bar' | 'area'",
          "literals": [
            "line",
            "bar",
            "area"
          ]
        },
        "width": {
          "property": "width",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "color": {
          "type": "'primary' | 'success' | 'warning' | 'danger' | 'muted'",
          "attribute": "color",
          "structured": false
        },
        "customColor": {
          "type": "string",
          "attribute": "customcolor",
          "structured": false
        },
        "data": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "height": {
          "type": "number",
          "attribute": "height",
          "structured": false
        },
        "max": {
          "type": "number",
          "attribute": "max",
          "structured": false
        },
        "min": {
          "type": "number",
          "attribute": "min",
          "structured": false
        },
        "showArea": {
          "type": "boolean",
          "attribute": "showarea",
          "structured": false
        },
        "showDots": {
          "type": "boolean",
          "attribute": "showdots",
          "structured": false
        },
        "smooth": {
          "type": "boolean",
          "attribute": "smooth",
          "structured": false
        },
        "strokeWidth": {
          "type": "number",
          "attribute": "strokewidth",
          "structured": false
        },
        "type": {
          "type": "'line' | 'bar' | 'area'",
          "attribute": "type",
          "structured": false
        },
        "width": {
          "type": "number",
          "attribute": "width",
          "structured": false
        }
      },
      "structuredProperties": [
        "data"
      ],
      "events": [],
      "slots": []
    },
    "snice-spinner": {
      "tagName": "snice-spinner",
      "className": "SniceSpinner",
      "modulePath": "snice/components/spinner/snice-spinner",
      "sourceModule": "dist/components/spinner/snice-spinner.js",
      "family": "spinner",
      "attributes": {
        "color": {
          "property": "color",
          "type": "'primary' | 'success' | 'warning' | 'error' | 'info'",
          "literals": [
            "primary",
            "success",
            "warning",
            "error",
            "info"
          ]
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large' | 'xl'",
          "literals": [
            "small",
            "medium",
            "large",
            "xl"
          ]
        },
        "thickness": {
          "property": "thickness",
          "type": "number",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'arc' | 'dots' | 'pulse' | 'orbit' | 'bars'",
          "literals": [
            "arc",
            "dots",
            "pulse",
            "orbit",
            "bars"
          ]
        }
      },
      "properties": {
        "color": {
          "type": "'primary' | 'success' | 'warning' | 'error' | 'info'",
          "attribute": "color",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large' | 'xl'",
          "attribute": "size",
          "structured": false
        },
        "thickness": {
          "type": "number",
          "attribute": "thickness",
          "structured": false
        },
        "variant": {
          "type": "'arc' | 'dots' | 'pulse' | 'orbit' | 'bars'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": []
    },
    "snice-split-button": {
      "tagName": "snice-split-button",
      "className": "SniceSplitButton",
      "modulePath": "snice/components/split-button/snice-split-button",
      "sourceModule": "dist/components/split-button/snice-split-button.js",
      "family": "split-button",
      "attributes": {
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "icon": {
          "property": "icon",
          "type": "string",
          "literals": []
        },
        "icon-placement": {
          "property": "iconPlacement",
          "type": "'start' | 'end'",
          "literals": [
            "start",
            "end"
          ]
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "loading": {
          "property": "loading",
          "type": "boolean",
          "literals": []
        },
        "outline": {
          "property": "outline",
          "type": "boolean",
          "literals": []
        },
        "pill": {
          "property": "pill",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "variant": {
          "property": "variant",
          "type": "'default' | 'primary' | 'success' | 'warning' | 'danger'",
          "literals": [
            "default",
            "primary",
            "success",
            "warning",
            "danger"
          ]
        }
      },
      "properties": {
        "actions": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "icon": {
          "type": "string",
          "attribute": "icon",
          "structured": false
        },
        "iconPlacement": {
          "type": "'start' | 'end'",
          "attribute": "icon-placement",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "loading": {
          "type": "boolean",
          "attribute": "loading",
          "structured": false
        },
        "outline": {
          "type": "boolean",
          "attribute": "outline",
          "structured": false
        },
        "pill": {
          "type": "boolean",
          "attribute": "pill",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "variant": {
          "type": "'default' | 'primary' | 'success' | 'warning' | 'danger'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [
        "actions"
      ],
      "events": [
        {
          "name": "action-click",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "primary-click",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        ""
      ]
    },
    "snice-split-pane": {
      "tagName": "snice-split-pane",
      "className": "SniceResize",
      "modulePath": "snice/components/split-pane/snice-split-pane",
      "sourceModule": "dist/components/split-pane/snice-split-pane.js",
      "family": "split-pane",
      "attributes": {
        "direction": {
          "property": "direction",
          "type": "'horizontal' | 'vertical'",
          "literals": [
            "horizontal",
            "vertical"
          ]
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "min-primary-size": {
          "property": "minPrimarySize",
          "type": "number",
          "literals": []
        },
        "min-secondary-size": {
          "property": "minSecondarySize",
          "type": "number",
          "literals": []
        },
        "primary-size": {
          "property": "primarySize",
          "type": "number",
          "literals": []
        },
        "snap-size": {
          "property": "snapSize",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "direction": {
          "type": "'horizontal' | 'vertical'",
          "attribute": "direction",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "minPrimarySize": {
          "type": "number",
          "attribute": "min-primary-size",
          "structured": false
        },
        "minSecondarySize": {
          "type": "number",
          "attribute": "min-secondary-size",
          "structured": false
        },
        "primarySize": {
          "type": "number",
          "attribute": "primary-size",
          "structured": false
        },
        "snapSize": {
          "type": "number",
          "attribute": "snap-size",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "pane-resize",
          "type": "CustomEvent<SniceResizeDetail>"
        }
      ],
      "slots": [
        "primary",
        "secondary"
      ]
    },
    "snice-spotlight": {
      "tagName": "snice-spotlight",
      "className": "SniceSpotlight",
      "modulePath": "snice/components/spotlight/snice-spotlight",
      "sourceModule": "dist/components/spotlight/snice-spotlight.js",
      "family": "spotlight",
      "attributes": {},
      "properties": {
        "steps": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        }
      },
      "structuredProperties": [
        "steps"
      ],
      "events": [
        {
          "name": "spotlight-end",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "spotlight-skip",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "spotlight-start",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "spotlight-step",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "spotlight-target-missing",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-stat-group": {
      "tagName": "snice-stat-group",
      "className": "SniceStatGroup",
      "modulePath": "snice/components/stat-group/snice-stat-group",
      "sourceModule": "dist/components/stat-group/snice-stat-group.js",
      "family": "stat-group",
      "attributes": {
        "columns": {
          "property": "columns",
          "type": "number",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'card' | 'minimal' | 'bordered'",
          "literals": [
            "card",
            "minimal",
            "bordered"
          ]
        }
      },
      "properties": {
        "columns": {
          "type": "number",
          "attribute": "columns",
          "structured": false
        },
        "stats": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "variant": {
          "type": "'card' | 'minimal' | 'bordered'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [
        "stats"
      ],
      "events": [
        {
          "name": "stat-click",
          "type": "CustomEvent<StatClickDetail>"
        }
      ],
      "slots": []
    },
    "snice-step-input": {
      "tagName": "snice-step-input",
      "className": "SniceStepInput",
      "modulePath": "snice/components/step-input/snice-step-input",
      "sourceModule": "dist/components/step-input/snice-step-input.js",
      "family": "step-input",
      "attributes": {
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "max": {
          "property": "max",
          "type": "number",
          "literals": []
        },
        "min": {
          "property": "min",
          "type": "number",
          "literals": []
        },
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "readonly": {
          "property": "readonly",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "step": {
          "property": "step",
          "type": "number",
          "literals": []
        },
        "value": {
          "property": "defaultValue",
          "type": "number",
          "literals": []
        },
        "wrap": {
          "property": "wrap",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "defaultValue": {
          "type": "number",
          "attribute": "value",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "form": {
          "type": "HTMLFormElement | null",
          "attribute": null,
          "structured": false
        },
        "labels": {
          "type": "NodeList | null",
          "attribute": null,
          "structured": false
        },
        "max": {
          "type": "number",
          "attribute": "max",
          "structured": false
        },
        "min": {
          "type": "number",
          "attribute": "min",
          "structured": false
        },
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "readonly": {
          "type": "boolean",
          "attribute": "readonly",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "step": {
          "type": "number",
          "attribute": "step",
          "structured": false
        },
        "type": {
          "type": "'number'",
          "attribute": null,
          "structured": false
        },
        "validationMessage": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "validity": {
          "type": "ValidityState",
          "attribute": null,
          "structured": false
        },
        "value": {
          "type": "number",
          "attribute": null,
          "structured": false
        },
        "willValidate": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        },
        "wrap": {
          "type": "boolean",
          "attribute": "wrap",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "value-change",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-stepper": {
      "tagName": "snice-stepper",
      "className": "SniceStepper",
      "modulePath": "snice/components/stepper/snice-stepper",
      "sourceModule": "dist/components/stepper/snice-stepper.js",
      "family": "stepper",
      "attributes": {
        "clickable": {
          "property": "clickable",
          "type": "boolean",
          "literals": []
        },
        "currentstep": {
          "property": "currentStep",
          "type": "number",
          "literals": []
        },
        "orientation": {
          "property": "orientation",
          "type": "'horizontal' | 'vertical'",
          "literals": [
            "horizontal",
            "vertical"
          ]
        }
      },
      "properties": {
        "clickable": {
          "type": "boolean",
          "attribute": "clickable",
          "structured": false
        },
        "currentStep": {
          "type": "number",
          "attribute": "currentstep",
          "structured": false
        },
        "orientation": {
          "type": "'horizontal' | 'vertical'",
          "attribute": "orientation",
          "structured": false
        },
        "steps": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        }
      },
      "structuredProperties": [
        "steps"
      ],
      "events": [],
      "slots": [
        ""
      ]
    },
    "snice-stepper-panel": {
      "tagName": "snice-stepper-panel",
      "className": "SniceStepperPanel",
      "modulePath": "snice/components/stepper/snice-stepper-panel",
      "sourceModule": "dist/components/stepper/snice-stepper-panel.js",
      "family": "stepper",
      "attributes": {
        "active": {
          "property": "active",
          "type": "boolean",
          "literals": []
        },
        "index": {
          "property": "index",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "active": {
          "type": "boolean",
          "attribute": "active",
          "structured": false
        },
        "index": {
          "type": "number",
          "attribute": "index",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": [
        ""
      ]
    },
    "snice-switch": {
      "tagName": "snice-switch",
      "className": "SniceSwitch",
      "modulePath": "snice/components/switch/snice-switch",
      "sourceModule": "dist/components/switch/snice-switch.js",
      "family": "switch",
      "attributes": {
        "checked": {
          "property": "defaultChecked",
          "type": "boolean",
          "literals": []
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "invalid": {
          "property": "invalid",
          "type": "boolean",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "label-off": {
          "property": "labelOff",
          "type": "string",
          "literals": []
        },
        "label-on": {
          "property": "labelOn",
          "type": "string",
          "literals": []
        },
        "loading": {
          "property": "loading",
          "type": "boolean",
          "literals": []
        },
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "required": {
          "property": "required",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "value": {
          "property": "value",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "checked": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        },
        "defaultChecked": {
          "type": "boolean",
          "attribute": "checked",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "form": {
          "type": "HTMLFormElement | null",
          "attribute": null,
          "structured": false
        },
        "invalid": {
          "type": "boolean",
          "attribute": "invalid",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "labelOff": {
          "type": "string",
          "attribute": "label-off",
          "structured": false
        },
        "labelOn": {
          "type": "string",
          "attribute": "label-on",
          "structured": false
        },
        "labels": {
          "type": "NodeList | null",
          "attribute": null,
          "structured": false
        },
        "loading": {
          "type": "boolean",
          "attribute": "loading",
          "structured": false
        },
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "required": {
          "type": "boolean",
          "attribute": "required",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "type": {
          "type": "'checkbox'",
          "attribute": null,
          "structured": false
        },
        "validationMessage": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "validity": {
          "type": "ValidityState",
          "attribute": null,
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": "value",
          "structured": false
        },
        "willValidate": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "switch-change",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-tab": {
      "tagName": "snice-tab",
      "className": "SniceTab",
      "modulePath": "snice/components/tabs/snice-tab",
      "sourceModule": "dist/components/tabs/snice-tab.js",
      "family": "tabs",
      "attributes": {
        "closable": {
          "property": "closable",
          "type": "boolean",
          "literals": []
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "closable": {
          "type": "boolean",
          "attribute": "closable",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "tab-close",
          "type": "CustomEvent<TabCloseDetail>"
        },
        {
          "name": "tab-select",
          "type": "CustomEvent<TabSelectDetail>"
        }
      ],
      "slots": [
        ""
      ]
    },
    "snice-tab-panel": {
      "tagName": "snice-tab-panel",
      "className": "SniceTabPanel",
      "modulePath": "snice/components/tabs/snice-tab-panel",
      "sourceModule": "dist/components/tabs/snice-tab-panel.js",
      "family": "tabs",
      "attributes": {
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "transitionduration": {
          "property": "transitionDuration",
          "type": "number",
          "literals": []
        },
        "transitionin": {
          "property": "transitionIn",
          "type": "string",
          "literals": []
        },
        "transitioning": {
          "property": "transitioning",
          "type": "'in' | 'out' | ''",
          "literals": [
            "in",
            "out",
            ""
          ]
        },
        "transitionout": {
          "property": "transitionOut",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "transitionDuration": {
          "type": "number",
          "attribute": "transitionduration",
          "structured": false
        },
        "transitionIn": {
          "type": "string",
          "attribute": "transitionin",
          "structured": false
        },
        "transitioning": {
          "type": "'in' | 'out' | ''",
          "attribute": "transitioning",
          "structured": false
        },
        "transitionOut": {
          "type": "string",
          "attribute": "transitionout",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": [
        ""
      ]
    },
    "snice-table": {
      "tagName": "snice-table",
      "className": "SniceTable",
      "modulePath": "snice/components/table/snice-table",
      "sourceModule": "dist/components/table/snice-table.js",
      "family": "table",
      "attributes": {
        "clickable": {
          "property": "clickable",
          "type": "boolean",
          "literals": []
        },
        "column-menu": {
          "property": "columnMenu",
          "type": "boolean",
          "literals": []
        },
        "column-reorder": {
          "property": "columnReorder",
          "type": "boolean",
          "literals": []
        },
        "column-resize": {
          "property": "columnResize",
          "type": "boolean",
          "literals": []
        },
        "current-page": {
          "property": "currentPage",
          "type": "number",
          "literals": []
        },
        "density": {
          "property": "density",
          "type": "'compact' | 'standard' | 'comfortable'",
          "literals": [
            "compact",
            "standard",
            "comfortable"
          ]
        },
        "edit-mode": {
          "property": "editMode",
          "type": "'cell' | 'row'",
          "literals": [
            "cell",
            "row"
          ]
        },
        "editable": {
          "property": "editable",
          "type": "boolean",
          "literals": []
        },
        "filterable": {
          "property": "filterable",
          "type": "boolean",
          "literals": []
        },
        "header-filters": {
          "property": "headerFilters",
          "type": "boolean",
          "literals": []
        },
        "hoverable": {
          "property": "hoverable",
          "type": "boolean",
          "literals": []
        },
        "lazy-load": {
          "property": "lazyLoad",
          "type": "boolean",
          "literals": []
        },
        "lazy-load-threshold": {
          "property": "lazyLoadThreshold",
          "type": "number",
          "literals": []
        },
        "list": {
          "property": "list",
          "type": "boolean",
          "literals": []
        },
        "loading": {
          "property": "loading",
          "type": "boolean",
          "literals": []
        },
        "mode": {
          "property": "mode",
          "type": "'local' | 'remote'",
          "literals": [
            "local",
            "remote"
          ]
        },
        "page-size": {
          "property": "pageSize",
          "type": "number",
          "literals": []
        },
        "pagination": {
          "property": "pagination",
          "type": "boolean",
          "literals": []
        },
        "pagination-mode": {
          "property": "paginationMode",
          "type": "'client' | 'server'",
          "literals": [
            "client",
            "server"
          ]
        },
        "quick-filter": {
          "property": "quickFilter",
          "type": "boolean",
          "literals": []
        },
        "row-height": {
          "property": "rowHeight",
          "type": "number",
          "literals": []
        },
        "row-reorder": {
          "property": "rowReorder",
          "type": "boolean",
          "literals": []
        },
        "search-debounce": {
          "property": "searchDebounce",
          "type": "number",
          "literals": []
        },
        "searchable": {
          "property": "searchable",
          "type": "boolean",
          "literals": []
        },
        "selectable": {
          "property": "selectable",
          "type": "boolean",
          "literals": []
        },
        "selection-mode": {
          "property": "selectionMode",
          "type": "'none' | 'single' | 'multiple'",
          "literals": [
            "none",
            "single",
            "multiple"
          ]
        },
        "selector": {
          "property": "selector",
          "type": "string",
          "literals": []
        },
        "sortable": {
          "property": "sortable",
          "type": "boolean",
          "literals": []
        },
        "striped": {
          "property": "striped",
          "type": "boolean",
          "literals": []
        },
        "total-items": {
          "property": "totalItems",
          "type": "number",
          "literals": []
        },
        "virtual-buffer": {
          "property": "virtualBuffer",
          "type": "number",
          "literals": []
        },
        "virtualize": {
          "property": "virtualize",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "clickable": {
          "type": "boolean",
          "attribute": "clickable",
          "structured": false
        },
        "columnMenu": {
          "type": "boolean",
          "attribute": "column-menu",
          "structured": false
        },
        "columnReorder": {
          "type": "boolean",
          "attribute": "column-reorder",
          "structured": false
        },
        "columnResize": {
          "type": "boolean",
          "attribute": "column-resize",
          "structured": false
        },
        "columns": {
          "type": "any[]",
          "attribute": null,
          "structured": true
        },
        "currentPage": {
          "type": "number",
          "attribute": "current-page",
          "structured": false
        },
        "currentSort": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "data": {
          "type": "any[]",
          "attribute": null,
          "structured": true
        },
        "density": {
          "type": "'compact' | 'standard' | 'comfortable'",
          "attribute": "density",
          "structured": false
        },
        "editable": {
          "type": "boolean",
          "attribute": "editable",
          "structured": false
        },
        "editMode": {
          "type": "'cell' | 'row'",
          "attribute": "edit-mode",
          "structured": false
        },
        "filterable": {
          "type": "boolean",
          "attribute": "filterable",
          "structured": false
        },
        "groupBy": {
          "type": "string | string[]",
          "attribute": null,
          "structured": true
        },
        "groupDefaults": {
          "type": "{ expanded?: boolean }",
          "attribute": null,
          "structured": true
        },
        "headerFilters": {
          "type": "boolean",
          "attribute": "header-filters",
          "structured": false
        },
        "hoverable": {
          "type": "boolean",
          "attribute": "hoverable",
          "structured": false
        },
        "lazyLoad": {
          "type": "boolean",
          "attribute": "lazy-load",
          "structured": false
        },
        "lazyLoadThreshold": {
          "type": "number",
          "attribute": "lazy-load-threshold",
          "structured": false
        },
        "list": {
          "type": "boolean",
          "attribute": "list",
          "structured": false
        },
        "listRenderer": {
          "type": "ListViewRenderer | null",
          "attribute": null,
          "structured": false
        },
        "loading": {
          "type": "boolean",
          "attribute": "loading",
          "structured": false
        },
        "mode": {
          "type": "'local' | 'remote'",
          "attribute": "mode",
          "structured": false
        },
        "pageSize": {
          "type": "number",
          "attribute": "page-size",
          "structured": false
        },
        "pageSizes": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "pagination": {
          "type": "boolean",
          "attribute": "pagination",
          "structured": false
        },
        "paginationMode": {
          "type": "'client' | 'server'",
          "attribute": "pagination-mode",
          "structured": false
        },
        "quickFilter": {
          "type": "boolean",
          "attribute": "quick-filter",
          "structured": false
        },
        "rowHeight": {
          "type": "number",
          "attribute": "row-height",
          "structured": false
        },
        "rowReorder": {
          "type": "boolean",
          "attribute": "row-reorder",
          "structured": false
        },
        "searchable": {
          "type": "boolean",
          "attribute": "searchable",
          "structured": false
        },
        "searchDebounce": {
          "type": "number",
          "attribute": "search-debounce",
          "structured": false
        },
        "selectable": {
          "type": "boolean",
          "attribute": "selectable",
          "structured": false
        },
        "selectedRows": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "selectionMode": {
          "type": "'none' | 'single' | 'multiple'",
          "attribute": "selection-mode",
          "structured": false
        },
        "selector": {
          "type": "string",
          "attribute": "selector",
          "structured": false
        },
        "selectorOptions": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "sortable": {
          "type": "boolean",
          "attribute": "sortable",
          "structured": false
        },
        "striped": {
          "type": "boolean",
          "attribute": "striped",
          "structured": false
        },
        "totalItems": {
          "type": "number",
          "attribute": "total-items",
          "structured": false
        },
        "virtualBuffer": {
          "type": "number",
          "attribute": "virtual-buffer",
          "structured": false
        },
        "virtualize": {
          "type": "boolean",
          "attribute": "virtualize",
          "structured": false
        }
      },
      "structuredProperties": [
        "columns",
        "currentSort",
        "data",
        "groupBy",
        "groupDefaults",
        "pageSizes",
        "selectedRows",
        "selectorOptions"
      ],
      "events": [
        {
          "name": "column-order-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "column-pin-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "column-visibility-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "density-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "filter-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "group-toggle",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "lazy-load",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "page-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "row-clicked",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "selection-changed",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "sort-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "table-load-error",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "table-row-selection-changed",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "table-select-all-changed",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        "columns",
        "header",
        "rows"
      ]
    },
    "snice-table-progress": {
      "tagName": "snice-table-progress",
      "className": "SniceTableProgress",
      "modulePath": "snice/components/table/snice-progress",
      "sourceModule": "dist/components/table/snice-progress.js",
      "family": "table",
      "attributes": {
        "backgroundcolor": {
          "property": "backgroundColor",
          "type": "string",
          "literals": []
        },
        "color": {
          "property": "color",
          "type": "string",
          "literals": []
        },
        "height": {
          "property": "height",
          "type": "string",
          "literals": []
        },
        "max": {
          "property": "max",
          "type": "number",
          "literals": []
        },
        "showpercentage": {
          "property": "showPercentage",
          "type": "boolean",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "backgroundColor": {
          "type": "string",
          "attribute": "backgroundcolor",
          "structured": false
        },
        "color": {
          "type": "string",
          "attribute": "color",
          "structured": false
        },
        "height": {
          "type": "string",
          "attribute": "height",
          "structured": false
        },
        "max": {
          "type": "number",
          "attribute": "max",
          "structured": false
        },
        "showPercentage": {
          "type": "boolean",
          "attribute": "showpercentage",
          "structured": false
        },
        "value": {
          "type": "number",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": []
    },
    "snice-tabs": {
      "tagName": "snice-tabs",
      "className": "SniceTabs",
      "modulePath": "snice/components/tabs/snice-tabs",
      "sourceModule": "dist/components/tabs/snice-tabs.js",
      "family": "tabs",
      "attributes": {
        "noscrollcontrols": {
          "property": "noScrollControls",
          "type": "boolean",
          "literals": []
        },
        "placement": {
          "property": "placement",
          "type": "'top' | 'bottom' | 'start' | 'end'",
          "literals": [
            "top",
            "bottom",
            "start",
            "end"
          ]
        },
        "selected": {
          "property": "selected",
          "type": "number",
          "literals": []
        },
        "transition": {
          "property": "transition",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "noScrollControls": {
          "type": "boolean",
          "attribute": "noscrollcontrols",
          "structured": false
        },
        "placement": {
          "type": "'top' | 'bottom' | 'start' | 'end'",
          "attribute": "placement",
          "structured": false
        },
        "selected": {
          "type": "number",
          "attribute": "selected",
          "structured": false
        },
        "transition": {
          "type": "string",
          "attribute": "transition",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "tab-change",
          "type": "CustomEvent<TabChangeDetail | undefined>"
        }
      ],
      "slots": [
        "",
        "nav"
      ]
    },
    "snice-tag": {
      "tagName": "snice-tag",
      "className": "SniceTag",
      "modulePath": "snice/components/tag/snice-tag",
      "sourceModule": "dist/components/tag/snice-tag.js",
      "family": "tag",
      "attributes": {
        "outline": {
          "property": "outline",
          "type": "boolean",
          "literals": []
        },
        "pill": {
          "property": "pill",
          "type": "boolean",
          "literals": []
        },
        "removable": {
          "property": "removable",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "variant": {
          "property": "variant",
          "type": "'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'",
          "literals": [
            "default",
            "primary",
            "success",
            "warning",
            "danger",
            "info"
          ]
        }
      },
      "properties": {
        "outline": {
          "type": "boolean",
          "attribute": "outline",
          "structured": false
        },
        "pill": {
          "type": "boolean",
          "attribute": "pill",
          "structured": false
        },
        "removable": {
          "type": "boolean",
          "attribute": "removable",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "variant": {
          "type": "'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "tag-remove",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        "",
        "icon"
      ]
    },
    "snice-tag-input": {
      "tagName": "snice-tag-input",
      "className": "SniceTagInput",
      "modulePath": "snice/components/tag-input/snice-tag-input",
      "sourceModule": "dist/components/tag-input/snice-tag-input.js",
      "family": "tag-input",
      "attributes": {
        "allow-duplicates": {
          "property": "allowDuplicates",
          "type": "boolean",
          "literals": []
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "max-tags": {
          "property": "maxTags",
          "type": "number",
          "literals": []
        },
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "placeholder": {
          "property": "placeholder",
          "type": "string",
          "literals": []
        },
        "readonly": {
          "property": "readonly",
          "type": "boolean",
          "literals": []
        },
        "value": {
          "property": "defaultValue",
          "type": "unknown[]",
          "literals": []
        }
      },
      "properties": {
        "allowDuplicates": {
          "type": "boolean",
          "attribute": "allow-duplicates",
          "structured": false
        },
        "defaultValue": {
          "type": "unknown[]",
          "attribute": "value",
          "structured": true
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "form": {
          "type": "HTMLFormElement | null",
          "attribute": null,
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "labels": {
          "type": "NodeList | null",
          "attribute": null,
          "structured": false
        },
        "maxTags": {
          "type": "number",
          "attribute": "max-tags",
          "structured": false
        },
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "placeholder": {
          "type": "string",
          "attribute": "placeholder",
          "structured": false
        },
        "readonly": {
          "type": "boolean",
          "attribute": "readonly",
          "structured": false
        },
        "suggestions": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "type": {
          "type": "'text'",
          "attribute": null,
          "structured": false
        },
        "validationMessage": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "validity": {
          "type": "ValidityState",
          "attribute": null,
          "structured": false
        },
        "value": {
          "type": "string[]",
          "attribute": null,
          "structured": true
        },
        "willValidate": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        }
      },
      "structuredProperties": [
        "defaultValue",
        "suggestions"
      ],
      "events": [
        {
          "name": "tag-add",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "tag-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "tag-remove",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-terminal": {
      "tagName": "snice-terminal",
      "className": "SniceTerminal",
      "modulePath": "snice/components/terminal/snice-terminal",
      "sourceModule": "dist/components/terminal/snice-terminal.js",
      "family": "terminal",
      "attributes": {
        "cwd": {
          "property": "cwd",
          "type": "string",
          "literals": []
        },
        "max-lines": {
          "property": "maxLines",
          "type": "number",
          "literals": []
        },
        "prompt": {
          "property": "prompt",
          "type": "string",
          "literals": []
        },
        "readonly": {
          "property": "readonly",
          "type": "boolean",
          "literals": []
        },
        "show-timestamps": {
          "property": "showTimestamps",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "cwd": {
          "type": "string",
          "attribute": "cwd",
          "structured": false
        },
        "maxLines": {
          "type": "number",
          "attribute": "max-lines",
          "structured": false
        },
        "prompt": {
          "type": "string",
          "attribute": "prompt",
          "structured": false
        },
        "readonly": {
          "type": "boolean",
          "attribute": "readonly",
          "structured": false
        },
        "showTimestamps": {
          "type": "boolean",
          "attribute": "show-timestamps",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "terminal-clear",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "terminal-command",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "terminal-ready",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-testimonial": {
      "tagName": "snice-testimonial",
      "className": "SniceTestimonial",
      "modulePath": "snice/components/testimonial/snice-testimonial",
      "sourceModule": "dist/components/testimonial/snice-testimonial.js",
      "family": "testimonial",
      "attributes": {
        "author": {
          "property": "author",
          "type": "string",
          "literals": []
        },
        "avatar": {
          "property": "avatar",
          "type": "string",
          "literals": []
        },
        "company": {
          "property": "company",
          "type": "string",
          "literals": []
        },
        "quote": {
          "property": "quote",
          "type": "string",
          "literals": []
        },
        "rating": {
          "property": "rating",
          "type": "number",
          "literals": []
        },
        "role": {
          "property": "role",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'card' | 'minimal' | 'featured'",
          "literals": [
            "card",
            "minimal",
            "featured"
          ]
        }
      },
      "properties": {
        "author": {
          "type": "string",
          "attribute": "author",
          "structured": false
        },
        "avatar": {
          "type": "string",
          "attribute": "avatar",
          "structured": false
        },
        "company": {
          "type": "string",
          "attribute": "company",
          "structured": false
        },
        "quote": {
          "type": "string",
          "attribute": "quote",
          "structured": false
        },
        "rating": {
          "type": "number",
          "attribute": "rating",
          "structured": false
        },
        "role": {
          "type": "string",
          "attribute": "role",
          "structured": false
        },
        "variant": {
          "type": "'card' | 'minimal' | 'featured'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": []
    },
    "snice-textarea": {
      "tagName": "snice-textarea",
      "className": "SniceTextarea",
      "modulePath": "snice/components/textarea/snice-textarea",
      "sourceModule": "dist/components/textarea/snice-textarea.js",
      "family": "textarea",
      "attributes": {
        "auto-grow": {
          "property": "autoGrow",
          "type": "boolean",
          "literals": []
        },
        "autocomplete": {
          "property": "autocomplete",
          "type": "string",
          "literals": []
        },
        "cols": {
          "property": "cols",
          "type": "number",
          "literals": []
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "error-text": {
          "property": "errorText",
          "type": "string",
          "literals": []
        },
        "helper-text": {
          "property": "helperText",
          "type": "string",
          "literals": []
        },
        "invalid": {
          "property": "invalid",
          "type": "boolean",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "loading": {
          "property": "loading",
          "type": "boolean",
          "literals": []
        },
        "maxlength": {
          "property": "maxlength",
          "type": "number",
          "literals": []
        },
        "minlength": {
          "property": "minlength",
          "type": "number",
          "literals": []
        },
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "placeholder": {
          "property": "placeholder",
          "type": "string",
          "literals": []
        },
        "readonly": {
          "property": "readonly",
          "type": "boolean",
          "literals": []
        },
        "required": {
          "property": "required",
          "type": "boolean",
          "literals": []
        },
        "resize": {
          "property": "resize",
          "type": "'none' | 'vertical' | 'horizontal' | 'both'",
          "literals": [
            "none",
            "vertical",
            "horizontal",
            "both"
          ]
        },
        "rows": {
          "property": "rows",
          "type": "number",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "value": {
          "property": "defaultValue",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'outlined' | 'filled' | 'underlined'",
          "literals": [
            "outlined",
            "filled",
            "underlined"
          ]
        }
      },
      "properties": {
        "autocomplete": {
          "type": "string",
          "attribute": "autocomplete",
          "structured": false
        },
        "autoGrow": {
          "type": "boolean",
          "attribute": "auto-grow",
          "structured": false
        },
        "cols": {
          "type": "number",
          "attribute": "cols",
          "structured": false
        },
        "defaultValue": {
          "type": "string",
          "attribute": "value",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "errorText": {
          "type": "string",
          "attribute": "error-text",
          "structured": false
        },
        "form": {
          "type": "HTMLFormElement | null",
          "attribute": null,
          "structured": false
        },
        "helperText": {
          "type": "string",
          "attribute": "helper-text",
          "structured": false
        },
        "invalid": {
          "type": "boolean",
          "attribute": "invalid",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "labels": {
          "type": "NodeList | null",
          "attribute": null,
          "structured": false
        },
        "loading": {
          "type": "boolean",
          "attribute": "loading",
          "structured": false
        },
        "maxlength": {
          "type": "number",
          "attribute": "maxlength",
          "structured": false
        },
        "minlength": {
          "type": "number",
          "attribute": "minlength",
          "structured": false
        },
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "placeholder": {
          "type": "string",
          "attribute": "placeholder",
          "structured": false
        },
        "readonly": {
          "type": "boolean",
          "attribute": "readonly",
          "structured": false
        },
        "required": {
          "type": "boolean",
          "attribute": "required",
          "structured": false
        },
        "resize": {
          "type": "'none' | 'vertical' | 'horizontal' | 'both'",
          "attribute": "resize",
          "structured": false
        },
        "rows": {
          "type": "number",
          "attribute": "rows",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "type": {
          "type": "'textarea'",
          "attribute": null,
          "structured": false
        },
        "validationMessage": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "validity": {
          "type": "ValidityState",
          "attribute": null,
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "variant": {
          "type": "'outlined' | 'filled' | 'underlined'",
          "attribute": "variant",
          "structured": false
        },
        "willValidate": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "textarea-blur",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "textarea-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "textarea-focus",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "textarea-input",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-time-picker": {
      "tagName": "snice-time-picker",
      "className": "SniceTimePicker",
      "modulePath": "snice/components/time-picker/snice-time-picker",
      "sourceModule": "dist/components/time-picker/snice-time-picker.js",
      "family": "time-picker",
      "attributes": {
        "clearable": {
          "property": "clearable",
          "type": "boolean",
          "literals": []
        },
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "error-text": {
          "property": "errorText",
          "type": "string",
          "literals": []
        },
        "format": {
          "property": "format",
          "type": "'12h' | '24h'",
          "literals": [
            "12h",
            "24h"
          ]
        },
        "helper-text": {
          "property": "helperText",
          "type": "string",
          "literals": []
        },
        "invalid": {
          "property": "invalid",
          "type": "boolean",
          "literals": []
        },
        "label": {
          "property": "label",
          "type": "string",
          "literals": []
        },
        "loading": {
          "property": "loading",
          "type": "boolean",
          "literals": []
        },
        "max-time": {
          "property": "maxTime",
          "type": "string",
          "literals": []
        },
        "min-time": {
          "property": "minTime",
          "type": "string",
          "literals": []
        },
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "placeholder": {
          "property": "placeholder",
          "type": "string",
          "literals": []
        },
        "readonly": {
          "property": "readonly",
          "type": "boolean",
          "literals": []
        },
        "required": {
          "property": "required",
          "type": "boolean",
          "literals": []
        },
        "show-seconds": {
          "property": "showSeconds",
          "type": "boolean",
          "literals": []
        },
        "size": {
          "property": "size",
          "type": "'small' | 'medium' | 'large'",
          "literals": [
            "small",
            "medium",
            "large"
          ]
        },
        "step": {
          "property": "step",
          "type": "number",
          "literals": []
        },
        "value": {
          "property": "defaultValue",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'dropdown' | 'inline'",
          "literals": [
            "dropdown",
            "inline"
          ]
        }
      },
      "properties": {
        "clearable": {
          "type": "boolean",
          "attribute": "clearable",
          "structured": false
        },
        "defaultValue": {
          "type": "string",
          "attribute": "value",
          "structured": false
        },
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "errorText": {
          "type": "string",
          "attribute": "error-text",
          "structured": false
        },
        "form": {
          "type": "HTMLFormElement | null",
          "attribute": null,
          "structured": false
        },
        "format": {
          "type": "'12h' | '24h'",
          "attribute": "format",
          "structured": false
        },
        "helperText": {
          "type": "string",
          "attribute": "helper-text",
          "structured": false
        },
        "invalid": {
          "type": "boolean",
          "attribute": "invalid",
          "structured": false
        },
        "label": {
          "type": "string",
          "attribute": "label",
          "structured": false
        },
        "labels": {
          "type": "NodeList | null",
          "attribute": null,
          "structured": false
        },
        "loading": {
          "type": "boolean",
          "attribute": "loading",
          "structured": false
        },
        "maxTime": {
          "type": "string",
          "attribute": "max-time",
          "structured": false
        },
        "minTime": {
          "type": "string",
          "attribute": "min-time",
          "structured": false
        },
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "placeholder": {
          "type": "string",
          "attribute": "placeholder",
          "structured": false
        },
        "readonly": {
          "type": "boolean",
          "attribute": "readonly",
          "structured": false
        },
        "required": {
          "type": "boolean",
          "attribute": "required",
          "structured": false
        },
        "showSeconds": {
          "type": "boolean",
          "attribute": "show-seconds",
          "structured": false
        },
        "size": {
          "type": "'small' | 'medium' | 'large'",
          "attribute": "size",
          "structured": false
        },
        "step": {
          "type": "number",
          "attribute": "step",
          "structured": false
        },
        "type": {
          "type": "'time'",
          "attribute": null,
          "structured": false
        },
        "validationMessage": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "validity": {
          "type": "ValidityState",
          "attribute": null,
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": null,
          "structured": false
        },
        "variant": {
          "type": "'dropdown' | 'inline'",
          "attribute": "variant",
          "structured": false
        },
        "willValidate": {
          "type": "boolean",
          "attribute": null,
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "time-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "timepicker-blur",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "timepicker-clear",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "timepicker-close",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "timepicker-focus",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "timepicker-open",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-time-range-picker": {
      "tagName": "snice-time-range-picker",
      "className": "SniceTimeRangePicker",
      "modulePath": "snice/components/time-range-picker/snice-time-range-picker",
      "sourceModule": "dist/components/time-range-picker/snice-time-range-picker.js",
      "family": "time-range-picker",
      "attributes": {
        "disabled": {
          "property": "disabled",
          "type": "boolean",
          "literals": []
        },
        "disabled-ranges": {
          "property": "disabledRanges",
          "type": "string",
          "literals": []
        },
        "end-time": {
          "property": "endTime",
          "type": "string",
          "literals": []
        },
        "format": {
          "property": "format",
          "type": "'12h' | '24h'",
          "literals": [
            "12h",
            "24h"
          ]
        },
        "granularity": {
          "property": "granularity",
          "type": "number",
          "literals": []
        },
        "multiple": {
          "property": "multiple",
          "type": "boolean",
          "literals": []
        },
        "readonly": {
          "property": "readonly",
          "type": "boolean",
          "literals": []
        },
        "start-time": {
          "property": "startTime",
          "type": "string",
          "literals": []
        },
        "value": {
          "property": "value",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "disabled": {
          "type": "boolean",
          "attribute": "disabled",
          "structured": false
        },
        "disabledRanges": {
          "type": "string",
          "attribute": "disabled-ranges",
          "structured": false
        },
        "endTime": {
          "type": "string",
          "attribute": "end-time",
          "structured": false
        },
        "format": {
          "type": "'12h' | '24h'",
          "attribute": "format",
          "structured": false
        },
        "granularity": {
          "type": "number",
          "attribute": "granularity",
          "structured": false
        },
        "multiple": {
          "type": "boolean",
          "attribute": "multiple",
          "structured": false
        },
        "readonly": {
          "type": "boolean",
          "attribute": "readonly",
          "structured": false
        },
        "startTime": {
          "type": "string",
          "attribute": "start-time",
          "structured": false
        },
        "value": {
          "type": "string",
          "attribute": "value",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "time-range-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "time-range-complete",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "time-range-select",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-timeline": {
      "tagName": "snice-timeline",
      "className": "SniceTimeline",
      "modulePath": "snice/components/timeline/snice-timeline",
      "sourceModule": "dist/components/timeline/snice-timeline.js",
      "family": "timeline",
      "attributes": {
        "orientation": {
          "property": "orientation",
          "type": "'vertical' | 'horizontal'",
          "literals": [
            "vertical",
            "horizontal"
          ]
        },
        "position": {
          "property": "position",
          "type": "'left' | 'right' | 'alternate'",
          "literals": [
            "left",
            "right",
            "alternate"
          ]
        },
        "reverse": {
          "property": "reverse",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "items": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "orientation": {
          "type": "'vertical' | 'horizontal'",
          "attribute": "orientation",
          "structured": false
        },
        "position": {
          "type": "'left' | 'right' | 'alternate'",
          "attribute": "position",
          "structured": false
        },
        "reverse": {
          "type": "boolean",
          "attribute": "reverse",
          "structured": false
        }
      },
      "structuredProperties": [
        "items"
      ],
      "events": [],
      "slots": []
    },
    "snice-timer": {
      "tagName": "snice-timer",
      "className": "SniceTimer",
      "modulePath": "snice/components/timer/snice-timer",
      "sourceModule": "dist/components/timer/snice-timer.js",
      "family": "timer",
      "attributes": {
        "initial-time": {
          "property": "initialTime",
          "type": "number",
          "literals": []
        },
        "mode": {
          "property": "mode",
          "type": "string",
          "literals": []
        },
        "running": {
          "property": "running",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "initialTime": {
          "type": "number",
          "attribute": "initial-time",
          "structured": false
        },
        "mode": {
          "type": "string",
          "attribute": "mode",
          "structured": false
        },
        "running": {
          "type": "boolean",
          "attribute": "running",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "timer-complete",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "timer-reset",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "timer-start",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "timer-stop",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-toast": {
      "tagName": "snice-toast",
      "className": "SniceToast",
      "modulePath": "snice/components/toast/snice-toast",
      "sourceModule": "dist/components/toast/snice-toast.js",
      "family": "toast",
      "attributes": {
        "closable": {
          "property": "closable",
          "type": "boolean",
          "literals": []
        },
        "icon": {
          "property": "icon",
          "type": "boolean",
          "literals": []
        },
        "message": {
          "property": "message",
          "type": "string",
          "literals": []
        },
        "type": {
          "property": "type",
          "type": "'success' | 'error' | 'warning' | 'info'",
          "literals": [
            "success",
            "error",
            "warning",
            "info"
          ]
        }
      },
      "properties": {
        "closable": {
          "type": "boolean",
          "attribute": "closable",
          "structured": false
        },
        "icon": {
          "type": "boolean",
          "attribute": "icon",
          "structured": false
        },
        "message": {
          "type": "string",
          "attribute": "message",
          "structured": false
        },
        "type": {
          "type": "'success' | 'error' | 'warning' | 'info'",
          "attribute": "type",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "close-toast",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-toast-container": {
      "tagName": "snice-toast-container",
      "className": "SniceToastContainer",
      "modulePath": "snice/components/toast/snice-toast-container",
      "sourceModule": "dist/components/toast/snice-toast-container.js",
      "family": "toast",
      "attributes": {
        "position": {
          "property": "position",
          "type": "ToastPosition",
          "literals": []
        }
      },
      "properties": {
        "position": {
          "type": "ToastPosition",
          "attribute": "position",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": []
    },
    "snice-tooltip": {
      "tagName": "snice-tooltip",
      "className": "SniceTooltip",
      "modulePath": "snice/components/tooltip/snice-tooltip",
      "sourceModule": "dist/components/tooltip/snice-tooltip.js",
      "family": "tooltip",
      "attributes": {
        "arrow": {
          "property": "arrow",
          "type": "boolean",
          "literals": []
        },
        "content": {
          "property": "content",
          "type": "string",
          "literals": []
        },
        "delay": {
          "property": "delay",
          "type": "number",
          "literals": []
        },
        "hide-delay": {
          "property": "hideDelay",
          "type": "number",
          "literals": []
        },
        "max-width": {
          "property": "maxWidth",
          "type": "number",
          "literals": []
        },
        "offset": {
          "property": "offset",
          "type": "number",
          "literals": []
        },
        "open": {
          "property": "open",
          "type": "boolean",
          "literals": []
        },
        "position": {
          "property": "position",
          "type": "| 'top' \n  | 'bottom' \n  | 'left' \n  | 'right'\n  | 'top-start'\n  | 'top-end'\n  | 'bottom-start'\n  | 'bottom-end'\n  | 'left-start'\n  | 'left-end'\n  | 'right-start'\n  | 'right-end'",
          "literals": [
            "top",
            "bottom",
            "left",
            "right",
            "top-start",
            "top-end",
            "bottom-start",
            "bottom-end",
            "left-start",
            "left-end",
            "right-start",
            "right-end"
          ]
        },
        "strict-positioning": {
          "property": "strictPositioning",
          "type": "boolean",
          "literals": []
        },
        "trigger": {
          "property": "trigger",
          "type": "'hover' | 'click' | 'focus' | 'manual'",
          "literals": [
            "hover",
            "click",
            "focus",
            "manual"
          ]
        },
        "z-index": {
          "property": "zIndex",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "arrow": {
          "type": "boolean",
          "attribute": "arrow",
          "structured": false
        },
        "content": {
          "type": "string",
          "attribute": "content",
          "structured": false
        },
        "delay": {
          "type": "number",
          "attribute": "delay",
          "structured": false
        },
        "hideDelay": {
          "type": "number",
          "attribute": "hide-delay",
          "structured": false
        },
        "maxWidth": {
          "type": "number",
          "attribute": "max-width",
          "structured": false
        },
        "offset": {
          "type": "number",
          "attribute": "offset",
          "structured": false
        },
        "open": {
          "type": "boolean",
          "attribute": "open",
          "structured": false
        },
        "position": {
          "type": "| 'top' \n  | 'bottom' \n  | 'left' \n  | 'right'\n  | 'top-start'\n  | 'top-end'\n  | 'bottom-start'\n  | 'bottom-end'\n  | 'left-start'\n  | 'left-end'\n  | 'right-start'\n  | 'right-end'",
          "attribute": "position",
          "structured": false
        },
        "strictPositioning": {
          "type": "boolean",
          "attribute": "strict-positioning",
          "structured": false
        },
        "trigger": {
          "type": "'hover' | 'click' | 'focus' | 'manual'",
          "attribute": "trigger",
          "structured": false
        },
        "zIndex": {
          "type": "number",
          "attribute": "z-index",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [],
      "slots": [
        ""
      ]
    },
    "snice-tree": {
      "tagName": "snice-tree",
      "className": "SniceTree",
      "modulePath": "snice/components/tree/snice-tree",
      "sourceModule": "dist/components/tree/snice-tree.js",
      "family": "tree",
      "attributes": {
        "expand-on-click": {
          "property": "expandOnClick",
          "type": "boolean",
          "literals": []
        },
        "selectable": {
          "property": "selectable",
          "type": "boolean",
          "literals": []
        },
        "selection-mode": {
          "property": "selectionMode",
          "type": "'single' | 'multiple' | 'none'",
          "literals": [
            "single",
            "multiple",
            "none"
          ]
        },
        "show-checkboxes": {
          "property": "showCheckboxes",
          "type": "boolean",
          "literals": []
        },
        "show-icons": {
          "property": "showIcons",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "checkedNodes": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "expandOnClick": {
          "type": "boolean",
          "attribute": "expand-on-click",
          "structured": false
        },
        "nodes": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "selectable": {
          "type": "boolean",
          "attribute": "selectable",
          "structured": false
        },
        "selectedNodes": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "selectionMode": {
          "type": "'single' | 'multiple' | 'none'",
          "attribute": "selection-mode",
          "structured": false
        },
        "showCheckboxes": {
          "type": "boolean",
          "attribute": "show-checkboxes",
          "structured": false
        },
        "showIcons": {
          "type": "boolean",
          "attribute": "show-icons",
          "structured": false
        }
      },
      "structuredProperties": [
        "checkedNodes",
        "nodes",
        "selectedNodes"
      ],
      "events": [
        {
          "name": "tree-node-check",
          "type": "CustomEvent<TreeNodeCheckDetail>"
        },
        {
          "name": "tree-node-collapse",
          "type": "CustomEvent<TreeNodeCollapseDetail>"
        },
        {
          "name": "tree-node-expand",
          "type": "CustomEvent<TreeNodeExpandDetail>"
        },
        {
          "name": "tree-node-lazy-load",
          "type": "CustomEvent<TreeNodeLazyLoadDetail>"
        },
        {
          "name": "tree-node-select",
          "type": "CustomEvent<TreeNodeSelectDetail>"
        }
      ],
      "slots": []
    },
    "snice-tree-item": {
      "tagName": "snice-tree-item",
      "className": "SniceTreeItem",
      "modulePath": "snice/components/tree/snice-tree-item",
      "sourceModule": "dist/components/tree/snice-tree-item.js",
      "family": "tree",
      "attributes": {
        "checked": {
          "property": "checked",
          "type": "boolean",
          "literals": []
        },
        "expanded": {
          "property": "expanded",
          "type": "boolean",
          "literals": []
        },
        "indeterminate": {
          "property": "indeterminate",
          "type": "boolean",
          "literals": []
        },
        "loading": {
          "property": "loading",
          "type": "boolean",
          "literals": []
        },
        "selected": {
          "property": "selected",
          "type": "boolean",
          "literals": []
        },
        "show-checkbox": {
          "property": "showCheckbox",
          "type": "boolean",
          "literals": []
        },
        "show-icon": {
          "property": "showIcon",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "checked": {
          "type": "boolean",
          "attribute": "checked",
          "structured": false
        },
        "expanded": {
          "type": "boolean",
          "attribute": "expanded",
          "structured": false
        },
        "indeterminate": {
          "type": "boolean",
          "attribute": "indeterminate",
          "structured": false
        },
        "loading": {
          "type": "boolean",
          "attribute": "loading",
          "structured": false
        },
        "selected": {
          "type": "boolean",
          "attribute": "selected",
          "structured": false
        },
        "showCheckbox": {
          "type": "boolean",
          "attribute": "show-checkbox",
          "structured": false
        },
        "showIcon": {
          "type": "boolean",
          "attribute": "show-icon",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "tree-item-check",
          "type": "CustomEvent<TreeItemCheckDetail>"
        },
        {
          "name": "tree-item-lazy-load",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "tree-item-select",
          "type": "CustomEvent<TreeItemSelectDetail>"
        },
        {
          "name": "tree-item-toggle",
          "type": "CustomEvent<TreeItemToggleDetail>"
        }
      ],
      "slots": []
    },
    "snice-treemap": {
      "tagName": "snice-treemap",
      "className": "SniceTreemap",
      "modulePath": "snice/components/treemap/snice-treemap",
      "sourceModule": "dist/components/treemap/snice-treemap.js",
      "family": "treemap",
      "attributes": {
        "animation": {
          "property": "animation",
          "type": "boolean",
          "literals": []
        },
        "color-scheme": {
          "property": "colorScheme",
          "type": "'default' | 'blue' | 'green' | 'purple' | 'orange' | 'warm' | 'cool' | 'rainbow'",
          "literals": [
            "default",
            "blue",
            "green",
            "purple",
            "orange",
            "warm",
            "cool",
            "rainbow"
          ]
        },
        "padding": {
          "property": "padding",
          "type": "number",
          "literals": []
        },
        "show-labels": {
          "property": "showLabels",
          "type": "boolean",
          "literals": []
        },
        "show-values": {
          "property": "showValues",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "animation": {
          "type": "boolean",
          "attribute": "animation",
          "structured": false
        },
        "colorScheme": {
          "type": "'default' | 'blue' | 'green' | 'purple' | 'orange' | 'warm' | 'cool' | 'rainbow'",
          "attribute": "color-scheme",
          "structured": false
        },
        "data": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "padding": {
          "type": "number",
          "attribute": "padding",
          "structured": false
        },
        "showLabels": {
          "type": "boolean",
          "attribute": "show-labels",
          "structured": false
        },
        "showValues": {
          "type": "boolean",
          "attribute": "show-values",
          "structured": false
        }
      },
      "structuredProperties": [
        "data"
      ],
      "events": [
        {
          "name": "treemap-click",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "treemap-drill",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "treemap-hover",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-user-card": {
      "tagName": "snice-user-card",
      "className": "SniceUserCard",
      "modulePath": "snice/components/user-card/snice-user-card",
      "sourceModule": "dist/components/user-card/snice-user-card.js",
      "family": "user-card",
      "attributes": {
        "avatar": {
          "property": "avatar",
          "type": "string",
          "literals": []
        },
        "company": {
          "property": "company",
          "type": "string",
          "literals": []
        },
        "email": {
          "property": "email",
          "type": "string",
          "literals": []
        },
        "location": {
          "property": "location",
          "type": "string",
          "literals": []
        },
        "name": {
          "property": "name",
          "type": "string",
          "literals": []
        },
        "phone": {
          "property": "phone",
          "type": "string",
          "literals": []
        },
        "role": {
          "property": "role",
          "type": "string",
          "literals": []
        },
        "status": {
          "property": "status",
          "type": "'online' | 'away' | 'offline' | 'busy'",
          "literals": [
            "online",
            "away",
            "offline",
            "busy"
          ]
        },
        "variant": {
          "property": "variant",
          "type": "'card' | 'horizontal' | 'compact'",
          "literals": [
            "card",
            "horizontal",
            "compact"
          ]
        }
      },
      "properties": {
        "avatar": {
          "type": "string",
          "attribute": "avatar",
          "structured": false
        },
        "company": {
          "type": "string",
          "attribute": "company",
          "structured": false
        },
        "email": {
          "type": "string",
          "attribute": "email",
          "structured": false
        },
        "location": {
          "type": "string",
          "attribute": "location",
          "structured": false
        },
        "name": {
          "type": "string",
          "attribute": "name",
          "structured": false
        },
        "phone": {
          "type": "string",
          "attribute": "phone",
          "structured": false
        },
        "role": {
          "type": "string",
          "attribute": "role",
          "structured": false
        },
        "social": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "status": {
          "type": "'online' | 'away' | 'offline' | 'busy'",
          "attribute": "status",
          "structured": false
        },
        "variant": {
          "type": "'card' | 'horizontal' | 'compact'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [
        "social"
      ],
      "events": [
        {
          "name": "action-click",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "social-click",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        ""
      ]
    },
    "snice-video-player": {
      "tagName": "snice-video-player",
      "className": "SniceVideoPlayer",
      "modulePath": "snice/components/video-player/snice-video-player",
      "sourceModule": "dist/components/video-player/snice-video-player.js",
      "family": "video-player",
      "attributes": {
        "autoplay": {
          "property": "autoplay",
          "type": "boolean",
          "literals": []
        },
        "controls": {
          "property": "controls",
          "type": "boolean",
          "literals": []
        },
        "current-time": {
          "property": "currentTime",
          "type": "number",
          "literals": []
        },
        "loop": {
          "property": "loop",
          "type": "boolean",
          "literals": []
        },
        "muted": {
          "property": "muted",
          "type": "boolean",
          "literals": []
        },
        "playback-rate": {
          "property": "playbackRate",
          "type": "number",
          "literals": []
        },
        "poster": {
          "property": "poster",
          "type": "string",
          "literals": []
        },
        "src": {
          "property": "src",
          "type": "string",
          "literals": []
        },
        "variant": {
          "property": "variant",
          "type": "'default' | 'minimal' | 'cinema'",
          "literals": [
            "default",
            "minimal",
            "cinema"
          ]
        },
        "volume": {
          "property": "volume",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "autoplay": {
          "type": "boolean",
          "attribute": "autoplay",
          "structured": false
        },
        "controls": {
          "type": "boolean",
          "attribute": "controls",
          "structured": false
        },
        "currentTime": {
          "type": "number",
          "attribute": "current-time",
          "structured": false
        },
        "duration": {
          "type": "number",
          "attribute": null,
          "structured": false
        },
        "loop": {
          "type": "boolean",
          "attribute": "loop",
          "structured": false
        },
        "muted": {
          "type": "boolean",
          "attribute": "muted",
          "structured": false
        },
        "playbackRate": {
          "type": "number",
          "attribute": "playback-rate",
          "structured": false
        },
        "poster": {
          "type": "string",
          "attribute": "poster",
          "structured": false
        },
        "src": {
          "type": "string",
          "attribute": "src",
          "structured": false
        },
        "variant": {
          "type": "'default' | 'minimal' | 'cinema'",
          "attribute": "variant",
          "structured": false
        },
        "volume": {
          "type": "number",
          "attribute": "volume",
          "structured": false
        }
      },
      "structuredProperties": [],
      "events": [
        {
          "name": "video-ended",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "video-fullscreen-change",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "video-pause",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "video-play",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "video-time-update",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "video-volume-change",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": [
        ""
      ]
    },
    "snice-virtual-scroller": {
      "tagName": "snice-virtual-scroller",
      "className": "SniceVirtualScroller",
      "modulePath": "snice/components/virtual-scroller/snice-virtual-scroller",
      "sourceModule": "dist/components/virtual-scroller/snice-virtual-scroller.js",
      "family": "virtual-scroller",
      "attributes": {
        "buffer-size": {
          "property": "bufferSize",
          "type": "number",
          "literals": []
        },
        "estimated-item-height": {
          "property": "estimatedItemHeight",
          "type": "number",
          "literals": []
        },
        "item-height": {
          "property": "itemHeight",
          "type": "number",
          "literals": []
        }
      },
      "properties": {
        "bufferSize": {
          "type": "number",
          "attribute": "buffer-size",
          "structured": false
        },
        "estimatedItemHeight": {
          "type": "number",
          "attribute": "estimated-item-height",
          "structured": false
        },
        "itemHeight": {
          "type": "number",
          "attribute": "item-height",
          "structured": false
        },
        "items": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "renderItem": {
          "type": "(item: VirtualScrollerItem, index: number) => string | HTMLElement",
          "attribute": null,
          "structured": false
        }
      },
      "structuredProperties": [
        "items"
      ],
      "events": [],
      "slots": []
    },
    "snice-waterfall": {
      "tagName": "snice-waterfall",
      "className": "SniceWaterfall",
      "modulePath": "snice/components/waterfall/snice-waterfall",
      "sourceModule": "dist/components/waterfall/snice-waterfall.js",
      "family": "waterfall",
      "attributes": {
        "animated": {
          "property": "animated",
          "type": "boolean",
          "literals": []
        },
        "orientation": {
          "property": "orientation",
          "type": "'vertical' | 'horizontal'",
          "literals": [
            "vertical",
            "horizontal"
          ]
        },
        "show-connectors": {
          "property": "showConnectors",
          "type": "boolean",
          "literals": []
        },
        "show-values": {
          "property": "showValues",
          "type": "boolean",
          "literals": []
        }
      },
      "properties": {
        "animated": {
          "type": "boolean",
          "attribute": "animated",
          "structured": false
        },
        "data": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "orientation": {
          "type": "'vertical' | 'horizontal'",
          "attribute": "orientation",
          "structured": false
        },
        "showConnectors": {
          "type": "boolean",
          "attribute": "show-connectors",
          "structured": false
        },
        "showValues": {
          "type": "boolean",
          "attribute": "show-values",
          "structured": false
        }
      },
      "structuredProperties": [
        "data"
      ],
      "events": [
        {
          "name": "bar-click",
          "type": "CustomEvent<unknown>"
        },
        {
          "name": "bar-hover",
          "type": "CustomEvent<unknown>"
        }
      ],
      "slots": []
    },
    "snice-weather": {
      "tagName": "snice-weather",
      "className": "SniceWeather",
      "modulePath": "snice/components/weather/snice-weather",
      "sourceModule": "dist/components/weather/snice-weather.js",
      "family": "weather",
      "attributes": {
        "unit": {
          "property": "unit",
          "type": "'celsius' | 'fahrenheit'",
          "literals": [
            "celsius",
            "fahrenheit"
          ]
        },
        "variant": {
          "property": "variant",
          "type": "'compact' | 'full'",
          "literals": [
            "compact",
            "full"
          ]
        }
      },
      "properties": {
        "data": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "unit": {
          "type": "'celsius' | 'fahrenheit'",
          "attribute": "unit",
          "structured": false
        },
        "variant": {
          "type": "'compact' | 'full'",
          "attribute": "variant",
          "structured": false
        }
      },
      "structuredProperties": [
        "data"
      ],
      "events": [],
      "slots": []
    },
    "snice-work-order": {
      "tagName": "snice-work-order",
      "className": "SniceWorkOrder",
      "modulePath": "snice/components/work-order/snice-work-order",
      "sourceModule": "dist/components/work-order/snice-work-order.js",
      "family": "work-order",
      "attributes": {
        "date": {
          "property": "date",
          "type": "string",
          "literals": []
        },
        "description": {
          "property": "description",
          "type": "string",
          "literals": []
        },
        "due-date": {
          "property": "dueDate",
          "type": "string",
          "literals": []
        },
        "laborrate": {
          "property": "laborRate",
          "type": "number",
          "literals": []
        },
        "notes": {
          "property": "notes",
          "type": "string",
          "literals": []
        },
        "priority": {
          "property": "priority",
          "type": "'low' | 'medium' | 'high' | 'urgent'",
          "literals": [
            "low",
            "medium",
            "high",
            "urgent"
          ]
        },
        "qr-data": {
          "property": "qrData",
          "type": "string",
          "literals": []
        },
        "qr-position": {
          "property": "qrPosition",
          "type": "'top-right' | 'header' | 'footer'",
          "literals": [
            "top-right",
            "header",
            "footer"
          ]
        },
        "showqr": {
          "property": "showQr",
          "type": "boolean",
          "literals": []
        },
        "status": {
          "property": "status",
          "type": "'open' | 'in-progress' | 'completed' | 'cancelled'",
          "literals": [
            "open",
            "in-progress",
            "completed",
            "cancelled"
          ]
        },
        "variant": {
          "property": "variant",
          "type": "'standard' | 'compact' | 'field-service' | 'maintenance' | 'detailed' | 'paper' | 'ink' | 'ledger' | 'ticket'",
          "literals": [
            "standard",
            "compact",
            "field-service",
            "maintenance",
            "detailed",
            "paper",
            "ink",
            "ledger",
            "ticket"
          ]
        },
        "wo-number": {
          "property": "woNumber",
          "type": "string",
          "literals": []
        }
      },
      "properties": {
        "asset": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "customer": {
          "type": "Record<string, unknown>",
          "attribute": null,
          "structured": true
        },
        "date": {
          "type": "string",
          "attribute": "date",
          "structured": false
        },
        "description": {
          "type": "string",
          "attribute": "description",
          "structured": false
        },
        "dueDate": {
          "type": "string",
          "attribute": "due-date",
          "structured": false
        },
        "laborRate": {
          "type": "number",
          "attribute": "laborrate",
          "structured": false
        },
        "notes": {
          "type": "string",
          "attribute": "notes",
          "structured": false
        },
        "parts": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "priority": {
          "type": "'low' | 'medium' | 'high' | 'urgent'",
          "attribute": "priority",
          "structured": false
        },
        "qrData": {
          "type": "string",
          "attribute": "qr-data",
          "structured": false
        },
        "qrPosition": {
          "type": "'top-right' | 'header' | 'footer'",
          "attribute": "qr-position",
          "structured": false
        },
        "showQr": {
          "type": "boolean",
          "attribute": "showqr",
          "structured": false
        },
        "status": {
          "type": "'open' | 'in-progress' | 'completed' | 'cancelled'",
          "attribute": "status",
          "structured": false
        },
        "tasks": {
          "type": "unknown[]",
          "attribute": null,
          "structured": true
        },
        "variant": {
          "type": "'standard' | 'compact' | 'field-service' | 'maintenance' | 'detailed' | 'paper' | 'ink' | 'ledger' | 'ticket'",
          "attribute": "variant",
          "structured": false
        },
        "woNumber": {
          "type": "string",
          "attribute": "wo-number",
          "structured": false
        }
      },
      "structuredProperties": [
        "asset",
        "customer",
        "parts",
        "tasks"
      ],
      "events": [
        {
          "name": "status-change",
          "type": "CustomEvent<StatusChangeDetail>"
        },
        {
          "name": "task-toggle",
          "type": "CustomEvent<TaskToggleDetail>"
        },
        {
          "name": "wo-sign",
          "type": "CustomEvent<WorkOrderSignDetail>"
        }
      ],
      "slots": [
        "",
        "after-parts",
        "after-tasks",
        "asset",
        "before-tasks",
        "customer",
        "description",
        "footer",
        "notes",
        "qr",
        "signature",
        "title",
        "totals"
      ]
    }
  },
  "react": {
    "exports": [
      "Accordion",
      "AccordionItem",
      "AccordionItemProps",
      "AccordionProps",
      "ActionBar",
      "ActionBarProps",
      "ActivityFeed",
      "ActivityFeedProps",
      "ActivityItem",
      "ActivityItemProps",
      "AdapterConfig",
      "AdapterHandle",
      "Alert",
      "AlertProps",
      "AppTile",
      "AppTileProps",
      "AppTiles",
      "AppTilesProps",
      "ApprovalFlow",
      "ApprovalFlowProps",
      "AudioRecorder",
      "AudioRecorderProps",
      "Availability",
      "AvailabilityProps",
      "Avatar",
      "AvatarGroup",
      "AvatarGroupProps",
      "AvatarProps",
      "Badge",
      "BadgeProps",
      "Banner",
      "BannerProps",
      "Binpack",
      "BinpackProps",
      "Book",
      "BookPage",
      "BookPageProps",
      "BookProps",
      "Booking",
      "BookingProps",
      "Breadcrumbs",
      "BreadcrumbsProps",
      "Button",
      "ButtonProps",
      "Calendar",
      "CalendarProps",
      "Camera",
      "CameraAnnotate",
      "CameraAnnotateProps",
      "CameraProps",
      "Candlestick",
      "CandlestickProps",
      "Card",
      "CardProps",
      "Carousel",
      "CarouselProps",
      "Cart",
      "CartProps",
      "Cell",
      "CellActions",
      "CellActionsProps",
      "CellBoolean",
      "CellBooleanProps",
      "CellColor",
      "CellColorProps",
      "CellCurrency",
      "CellCurrencyProps",
      "CellDate",
      "CellDateProps",
      "CellDuration",
      "CellDurationProps",
      "CellEmail",
      "CellEmailProps",
      "CellFilesize",
      "CellFilesizeProps",
      "CellImage",
      "CellImageProps",
      "CellJson",
      "CellJsonProps",
      "CellLink",
      "CellLinkProps",
      "CellLocation",
      "CellLocationProps",
      "CellNumber",
      "CellNumberProps",
      "CellPercentage",
      "CellPercentageProps",
      "CellPhone",
      "CellPhoneProps",
      "CellProgress",
      "CellProgressProps",
      "CellProps",
      "CellRating",
      "CellRatingProps",
      "CellSparkline",
      "CellSparklineProps",
      "CellStatus",
      "CellStatusProps",
      "CellTag",
      "CellTagProps",
      "CellText",
      "CellTextProps",
      "Chart",
      "ChartProps",
      "Chat",
      "ChatMessage",
      "ChatMessageProps",
      "ChatProps",
      "Checkbox",
      "CheckboxProps",
      "Chip",
      "ChipProps",
      "CodeBlock",
      "CodeBlockProps",
      "ColorDisplay",
      "ColorDisplayProps",
      "ColorPicker",
      "ColorPickerProps",
      "Column",
      "ColumnProps",
      "CommandPalette",
      "CommandPaletteProps",
      "Comment",
      "CommentProps",
      "Comments",
      "CommentsProps",
      "Countdown",
      "CountdownProps",
      "Cropper",
      "CropperProps",
      "Crumb",
      "CrumbProps",
      "DataCard",
      "DataCardProps",
      "DatePicker",
      "DatePickerProps",
      "DateRangePicker",
      "DateRangePickerProps",
      "DateTimePicker",
      "DateTimePickerProps",
      "Diff",
      "DiffProps",
      "Divider",
      "DividerProps",
      "Doc",
      "DocProps",
      "Draw",
      "DrawProps",
      "Drawer",
      "DrawerProps",
      "DrawerTarget",
      "DrawerTargetProps",
      "EmptyState",
      "EmptyStateProps",
      "Estimate",
      "EstimateProps",
      "Feature",
      "FeatureProps",
      "FileGallery",
      "FileGalleryProps",
      "FileUpload",
      "FileUploadProps",
      "FlipCard",
      "FlipCardProps",
      "Flow",
      "FlowProps",
      "FormLayout",
      "FormLayoutProps",
      "Funnel",
      "FunnelProps",
      "Gantt",
      "GanttProps",
      "Gauge",
      "GaugeProps",
      "Grid",
      "GridProps",
      "Header",
      "HeaderProps",
      "Heatmap",
      "HeatmapProps",
      "Image",
      "ImageProps",
      "Input",
      "InputProps",
      "Invoice",
      "InvoiceProps",
      "Kanban",
      "KanbanProps",
      "KeyValue",
      "KeyValueProps",
      "Kpi",
      "KpiProps",
      "KvPair",
      "KvPairProps",
      "Layout",
      "LayoutAuthSplit",
      "LayoutAuthSplitProps",
      "LayoutBlog",
      "LayoutBlogProps",
      "LayoutCard",
      "LayoutCardProps",
      "LayoutCentered",
      "LayoutCenteredProps",
      "LayoutDashboard",
      "LayoutDashboardProps",
      "LayoutDocs",
      "LayoutDocsProps",
      "LayoutFullscreen",
      "LayoutFullscreenProps",
      "LayoutLanding",
      "LayoutLandingProps",
      "LayoutMasterDetail",
      "LayoutMasterDetailProps",
      "LayoutMinimal",
      "LayoutMinimalProps",
      "LayoutProps",
      "LayoutSidebar",
      "LayoutSidebarProps",
      "LayoutSplit",
      "LayoutSplitProps",
      "Leaderboard",
      "LeaderboardEntry",
      "LeaderboardEntryProps",
      "LeaderboardProps",
      "Link",
      "LinkPreview",
      "LinkPreviewProps",
      "LinkProps",
      "List",
      "ListItem",
      "ListItemProps",
      "ListProps",
      "Location",
      "LocationProps",
      "Login",
      "LoginProps",
      "Map",
      "MapProps",
      "Markdown",
      "MarkdownProps",
      "Masonry",
      "MasonryProps",
      "Menu",
      "MenuDivider",
      "MenuDividerProps",
      "MenuItem",
      "MenuItemProps",
      "MenuProps",
      "MessageStrip",
      "MessageStripProps",
      "Modal",
      "ModalProps",
      "MusicPlayer",
      "MusicPlayerProps",
      "Nav",
      "NavProps",
      "NetworkGraph",
      "NetworkGraphProps",
      "NotificationCenter",
      "NotificationCenterProps",
      "Option",
      "OptionProps",
      "OrderTracker",
      "OrderTrackerProps",
      "OrgChart",
      "OrgChartProps",
      "Pagination",
      "PaginationProps",
      "Paint",
      "PaintProps",
      "PdfViewer",
      "PdfViewerProps",
      "PermissionMatrix",
      "PermissionMatrixProps",
      "Placard",
      "Plan",
      "PlanProps",
      "PodcastPlayer",
      "PodcastPlayerProps",
      "Popover",
      "PopoverProps",
      "PricingTable",
      "PricingTableProps",
      "ProductCard",
      "ProductCardProps",
      "Progress",
      "ProgressProps",
      "ProgressRing",
      "ProgressRingProps",
      "QrCode",
      "QrCodeProps",
      "QrReader",
      "QrReaderProps",
      "Radio",
      "RadioProps",
      "RangeSlider",
      "RangeSliderProps",
      "Rating",
      "RatingProps",
      "Receipt",
      "ReceiptProps",
      "Recipe",
      "RecipeProps",
      "Route",
      "RouteProps",
      "Row",
      "RowProps",
      "Sankey",
      "SankeyProps",
      "SegmentedControl",
      "SegmentedControlProps",
      "Select",
      "SelectProps",
      "Skeleton",
      "SkeletonProps",
      "Slider",
      "SliderProps",
      "SniceAdapterRef",
      "SniceBaseProps",
      "SniceComponentProps",
      "SniceComponentRef",
      "SniceCustomEvent",
      "SniceFormProps",
      "SniceFormRef",
      "SniceMethodHandle",
      "SniceProvider",
      "SniceProviderProps",
      "SniceReactComponent",
      "SniceReactContext",
      "SniceRouter",
      "SniceRouterProps",
      "Sortable",
      "SortableProps",
      "Sparkline",
      "SparklineProps",
      "Spinner",
      "SpinnerProps",
      "SplitButton",
      "SplitButtonProps",
      "SplitPane",
      "SplitPaneProps",
      "Spotlight",
      "SpotlightProps",
      "StatGroup",
      "StatGroupProps",
      "StepInput",
      "StepInputProps",
      "Stepper",
      "StepperPanel",
      "StepperPanelProps",
      "StepperProps",
      "Switch",
      "SwitchProps",
      "Tab",
      "TabPanel",
      "TabPanelProps",
      "TabProps",
      "Table",
      "TableProgress",
      "TableProgressProps",
      "TableProps",
      "Tabs",
      "TabsProps",
      "Tag",
      "TagInput",
      "TagInputProps",
      "TagProps",
      "Terminal",
      "TerminalProps",
      "Testimonial",
      "TestimonialProps",
      "Textarea",
      "TextareaProps",
      "TimePicker",
      "TimePickerProps",
      "TimeRangePicker",
      "TimeRangePickerProps",
      "Timeline",
      "TimelineProps",
      "Timer",
      "TimerProps",
      "Toast",
      "ToastContainer",
      "ToastContainerProps",
      "ToastProps",
      "Tooltip",
      "TooltipProps",
      "Tree",
      "TreeItem",
      "TreeItemProps",
      "TreeProps",
      "Treemap",
      "TreemapProps",
      "UseRequestHandlerOptions",
      "UseRequestRoute",
      "UseRequestRouteMap",
      "UserCard",
      "UserCardProps",
      "VideoPlayer",
      "VideoPlayerProps",
      "VirtualScroller",
      "VirtualScrollerProps",
      "Waterfall",
      "WaterfallProps",
      "Weather",
      "WeatherProps",
      "WorkOrder",
      "WorkOrderProps",
      "camelToKebab",
      "createReactAdapter",
      "extractComponentMetadata",
      "isFormAssociated",
      "kebabToCamel",
      "useNavigate",
      "useParams",
      "useRequestHandler",
      "useRoute",
      "useSniceContext",
      "useSniceFormValue",
      "waitForComponentDefinition"
    ],
    "typeExports": [
      "AccordionItemProps",
      "AccordionProps",
      "ActionBarProps",
      "ActivityFeedProps",
      "ActivityItemProps",
      "AdapterConfig",
      "AdapterHandle",
      "AlertProps",
      "AppTileProps",
      "AppTilesProps",
      "ApprovalFlowProps",
      "AudioRecorderProps",
      "AvailabilityProps",
      "AvatarGroupProps",
      "AvatarProps",
      "BadgeProps",
      "BannerProps",
      "BinpackProps",
      "BookPageProps",
      "BookProps",
      "BookingProps",
      "BreadcrumbsProps",
      "ButtonProps",
      "CalendarProps",
      "CameraAnnotateProps",
      "CameraProps",
      "CandlestickProps",
      "CardProps",
      "CarouselProps",
      "CartProps",
      "CellActionsProps",
      "CellBooleanProps",
      "CellColorProps",
      "CellCurrencyProps",
      "CellDateProps",
      "CellDurationProps",
      "CellEmailProps",
      "CellFilesizeProps",
      "CellImageProps",
      "CellJsonProps",
      "CellLinkProps",
      "CellLocationProps",
      "CellNumberProps",
      "CellPercentageProps",
      "CellPhoneProps",
      "CellProgressProps",
      "CellProps",
      "CellRatingProps",
      "CellSparklineProps",
      "CellStatusProps",
      "CellTagProps",
      "CellTextProps",
      "ChartProps",
      "ChatMessageProps",
      "ChatProps",
      "CheckboxProps",
      "ChipProps",
      "CodeBlockProps",
      "ColorDisplayProps",
      "ColorPickerProps",
      "ColumnProps",
      "CommandPaletteProps",
      "CommentProps",
      "CommentsProps",
      "CountdownProps",
      "CropperProps",
      "CrumbProps",
      "DataCardProps",
      "DatePickerProps",
      "DateRangePickerProps",
      "DateTimePickerProps",
      "DiffProps",
      "DividerProps",
      "DocProps",
      "DrawProps",
      "DrawerProps",
      "DrawerTargetProps",
      "EmptyStateProps",
      "EstimateProps",
      "FeatureProps",
      "FileGalleryProps",
      "FileUploadProps",
      "FlipCardProps",
      "FlowProps",
      "FormLayoutProps",
      "FunnelProps",
      "GanttProps",
      "GaugeProps",
      "GridProps",
      "HeaderProps",
      "HeatmapProps",
      "ImageProps",
      "InputProps",
      "InvoiceProps",
      "KanbanProps",
      "KeyValueProps",
      "KpiProps",
      "KvPairProps",
      "LayoutAuthSplitProps",
      "LayoutBlogProps",
      "LayoutCardProps",
      "LayoutCenteredProps",
      "LayoutDashboardProps",
      "LayoutDocsProps",
      "LayoutFullscreenProps",
      "LayoutLandingProps",
      "LayoutMasterDetailProps",
      "LayoutMinimalProps",
      "LayoutProps",
      "LayoutSidebarProps",
      "LayoutSplitProps",
      "LeaderboardEntryProps",
      "LeaderboardProps",
      "LinkPreviewProps",
      "LinkProps",
      "ListItemProps",
      "ListProps",
      "LocationProps",
      "LoginProps",
      "MapProps",
      "MarkdownProps",
      "MasonryProps",
      "MenuDividerProps",
      "MenuItemProps",
      "MenuProps",
      "MessageStripProps",
      "ModalProps",
      "MusicPlayerProps",
      "NavProps",
      "NetworkGraphProps",
      "NotificationCenterProps",
      "OptionProps",
      "OrderTrackerProps",
      "OrgChartProps",
      "PaginationProps",
      "PaintProps",
      "PdfViewerProps",
      "PermissionMatrixProps",
      "Placard",
      "PlanProps",
      "PodcastPlayerProps",
      "PopoverProps",
      "PricingTableProps",
      "ProductCardProps",
      "ProgressProps",
      "ProgressRingProps",
      "QrCodeProps",
      "QrReaderProps",
      "RadioProps",
      "RangeSliderProps",
      "RatingProps",
      "ReceiptProps",
      "RecipeProps",
      "RouteProps",
      "RowProps",
      "SankeyProps",
      "SegmentedControlProps",
      "SelectProps",
      "SkeletonProps",
      "SliderProps",
      "SniceAdapterRef",
      "SniceBaseProps",
      "SniceComponentProps",
      "SniceComponentRef",
      "SniceCustomEvent",
      "SniceFormProps",
      "SniceFormRef",
      "SniceMethodHandle",
      "SniceProviderProps",
      "SniceReactComponent",
      "SniceReactContext",
      "SniceRouterProps",
      "SortableProps",
      "SparklineProps",
      "SpinnerProps",
      "SplitButtonProps",
      "SplitPaneProps",
      "SpotlightProps",
      "StatGroupProps",
      "StepInputProps",
      "StepperPanelProps",
      "StepperProps",
      "SwitchProps",
      "TabPanelProps",
      "TabProps",
      "TableProgressProps",
      "TableProps",
      "TabsProps",
      "TagInputProps",
      "TagProps",
      "TerminalProps",
      "TestimonialProps",
      "TextareaProps",
      "TimePickerProps",
      "TimeRangePickerProps",
      "TimelineProps",
      "TimerProps",
      "ToastContainerProps",
      "ToastProps",
      "TooltipProps",
      "TreeItemProps",
      "TreeProps",
      "TreemapProps",
      "UseRequestHandlerOptions",
      "UseRequestRoute",
      "UseRequestRouteMap",
      "UserCardProps",
      "VideoPlayerProps",
      "VirtualScrollerProps",
      "WaterfallProps",
      "WeatherProps",
      "WorkOrderProps"
    ],
    "modulePaths": [
      "snice/react",
      "snice/react/SniceProvider",
      "snice/react/SniceRouter",
      "snice/react/accordion",
      "snice/react/accordion-item",
      "snice/react/action-bar",
      "snice/react/activity-feed",
      "snice/react/activity-item",
      "snice/react/alert",
      "snice/react/app-tile",
      "snice/react/app-tiles",
      "snice/react/approval-flow",
      "snice/react/audio-recorder",
      "snice/react/availability",
      "snice/react/avatar",
      "snice/react/avatar-group",
      "snice/react/badge",
      "snice/react/banner",
      "snice/react/binpack",
      "snice/react/book",
      "snice/react/book-page",
      "snice/react/booking",
      "snice/react/breadcrumbs",
      "snice/react/button",
      "snice/react/calendar",
      "snice/react/camera",
      "snice/react/camera-annotate",
      "snice/react/candlestick",
      "snice/react/card",
      "snice/react/carousel",
      "snice/react/cart",
      "snice/react/cell",
      "snice/react/cell-actions",
      "snice/react/cell-boolean",
      "snice/react/cell-color",
      "snice/react/cell-currency",
      "snice/react/cell-date",
      "snice/react/cell-duration",
      "snice/react/cell-email",
      "snice/react/cell-filesize",
      "snice/react/cell-image",
      "snice/react/cell-json",
      "snice/react/cell-link",
      "snice/react/cell-location",
      "snice/react/cell-number",
      "snice/react/cell-percentage",
      "snice/react/cell-phone",
      "snice/react/cell-progress",
      "snice/react/cell-rating",
      "snice/react/cell-sparkline",
      "snice/react/cell-status",
      "snice/react/cell-tag",
      "snice/react/cell-text",
      "snice/react/chart",
      "snice/react/chat",
      "snice/react/chat-message",
      "snice/react/checkbox",
      "snice/react/chip",
      "snice/react/code-block",
      "snice/react/color-display",
      "snice/react/color-picker",
      "snice/react/column",
      "snice/react/command-palette",
      "snice/react/comment",
      "snice/react/comments",
      "snice/react/components",
      "snice/react/countdown",
      "snice/react/cropper",
      "snice/react/crumb",
      "snice/react/data-card",
      "snice/react/date-picker",
      "snice/react/date-range-picker",
      "snice/react/date-time-picker",
      "snice/react/diff",
      "snice/react/divider",
      "snice/react/doc",
      "snice/react/draw",
      "snice/react/drawer",
      "snice/react/drawer-target",
      "snice/react/empty-state",
      "snice/react/estimate",
      "snice/react/feature",
      "snice/react/file-gallery",
      "snice/react/file-upload",
      "snice/react/flip-card",
      "snice/react/flow",
      "snice/react/form-layout",
      "snice/react/funnel",
      "snice/react/gantt",
      "snice/react/gauge",
      "snice/react/grid",
      "snice/react/header",
      "snice/react/heatmap",
      "snice/react/image",
      "snice/react/index",
      "snice/react/input",
      "snice/react/invoice",
      "snice/react/kanban",
      "snice/react/key-value",
      "snice/react/kpi",
      "snice/react/kv-pair",
      "snice/react/layout",
      "snice/react/layout-auth-split",
      "snice/react/layout-blog",
      "snice/react/layout-card",
      "snice/react/layout-centered",
      "snice/react/layout-dashboard",
      "snice/react/layout-docs",
      "snice/react/layout-fullscreen",
      "snice/react/layout-landing",
      "snice/react/layout-master-detail",
      "snice/react/layout-minimal",
      "snice/react/layout-sidebar",
      "snice/react/layout-split",
      "snice/react/leaderboard",
      "snice/react/leaderboard-entry",
      "snice/react/link",
      "snice/react/link-preview",
      "snice/react/list",
      "snice/react/list-item",
      "snice/react/location",
      "snice/react/login",
      "snice/react/map",
      "snice/react/markdown",
      "snice/react/masonry",
      "snice/react/matchRoute",
      "snice/react/menu",
      "snice/react/menu-divider",
      "snice/react/menu-item",
      "snice/react/message-strip",
      "snice/react/modal",
      "snice/react/music-player",
      "snice/react/nav",
      "snice/react/network-graph",
      "snice/react/notification-center",
      "snice/react/option",
      "snice/react/order-tracker",
      "snice/react/org-chart",
      "snice/react/pagination",
      "snice/react/paint",
      "snice/react/pdf-viewer",
      "snice/react/permission-matrix",
      "snice/react/plan",
      "snice/react/podcast-player",
      "snice/react/popover",
      "snice/react/pricing-table",
      "snice/react/product-card",
      "snice/react/progress",
      "snice/react/progress-ring",
      "snice/react/qr-code",
      "snice/react/qr-reader",
      "snice/react/radio",
      "snice/react/range-slider",
      "snice/react/rating",
      "snice/react/receipt",
      "snice/react/recipe",
      "snice/react/route-match",
      "snice/react/route-specificity",
      "snice/react/row",
      "snice/react/sankey",
      "snice/react/segmented-control",
      "snice/react/select",
      "snice/react/skeleton",
      "snice/react/slider",
      "snice/react/sortable",
      "snice/react/sparkline",
      "snice/react/spinner",
      "snice/react/split-button",
      "snice/react/split-pane",
      "snice/react/spotlight",
      "snice/react/stat-group",
      "snice/react/step-input",
      "snice/react/stepper",
      "snice/react/stepper-panel",
      "snice/react/switch",
      "snice/react/tab",
      "snice/react/tab-panel",
      "snice/react/table",
      "snice/react/table-progress",
      "snice/react/tabs",
      "snice/react/tag",
      "snice/react/tag-input",
      "snice/react/terminal",
      "snice/react/testimonial",
      "snice/react/textarea",
      "snice/react/time-picker",
      "snice/react/time-range-picker",
      "snice/react/timeline",
      "snice/react/timer",
      "snice/react/toast",
      "snice/react/toast-container",
      "snice/react/tooltip",
      "snice/react/tree",
      "snice/react/tree-item",
      "snice/react/treemap",
      "snice/react/types",
      "snice/react/useRequestHandler",
      "snice/react/user-card",
      "snice/react/utils",
      "snice/react/video-player",
      "snice/react/virtual-scroller",
      "snice/react/waterfall",
      "snice/react/weather",
      "snice/react/work-order",
      "snice/react/wrapper"
    ],
    "wrappers": {
      "Accordion": {
        "exportName": "Accordion",
        "module": "snice/react/accordion",
        "tagName": "snice-accordion",
        "family": "accordion",
        "componentModulePath": "snice/components/accordion/snice-accordion",
        "properties": [
          "multiple",
          "variant"
        ],
        "events": {
          "accordion-open": "onAccordionOpen",
          "accordion-close": "onAccordionClose"
        },
        "interfaceProps": [
          "multiple",
          "variant",
          "onAccordionOpen",
          "onAccordionClose"
        ],
        "formAssociated": false
      },
      "AccordionItem": {
        "exportName": "AccordionItem",
        "module": "snice/react/accordion-item",
        "tagName": "snice-accordion-item",
        "family": "accordion",
        "componentModulePath": "snice/components/accordion/snice-accordion-item",
        "properties": [
          "itemId",
          "open",
          "disabled"
        ],
        "events": {
          "accordion-item-toggle": "onAccordionItemToggle"
        },
        "interfaceProps": [
          "itemId",
          "open",
          "disabled",
          "onAccordionItemToggle"
        ],
        "formAssociated": false
      },
      "ActionBar": {
        "exportName": "ActionBar",
        "module": "snice/react/action-bar",
        "tagName": "snice-action-bar",
        "family": "action-bar",
        "componentModulePath": "snice/components/action-bar/snice-action-bar",
        "properties": [
          "open",
          "position",
          "size",
          "variant",
          "label",
          "noAnimation",
          "noEscapeDismiss"
        ],
        "events": {
          "action-bar-open": "onActionBarOpen",
          "action-bar-close": "onActionBarClose"
        },
        "interfaceProps": [
          "open",
          "position",
          "size",
          "variant",
          "label",
          "noAnimation",
          "noEscapeDismiss",
          "onActionBarOpen",
          "onActionBarClose"
        ],
        "formAssociated": false
      },
      "ActivityFeed": {
        "exportName": "ActivityFeed",
        "module": "snice/react/activity-feed",
        "tagName": "snice-activity-feed",
        "family": "activity-feed",
        "componentModulePath": "snice/components/activity-feed/snice-activity-feed",
        "properties": [
          "activities",
          "filter",
          "groupBy",
          "hasMore",
          "refreshInterval",
          "emptyMessage",
          "loadMoreLabel",
          "allLabel"
        ],
        "events": {
          "activity-click": "onActivityClick",
          "load-more": "onLoadMore"
        },
        "interfaceProps": [
          "activities",
          "filter",
          "groupBy",
          "hasMore",
          "refreshInterval",
          "emptyMessage",
          "loadMoreLabel",
          "allLabel",
          "onActivityClick",
          "onLoadMore"
        ],
        "formAssociated": false
      },
      "ActivityItem": {
        "exportName": "ActivityItem",
        "module": "snice/react/activity-item",
        "tagName": "snice-activity-item",
        "family": "activity-feed",
        "componentModulePath": "snice/components/activity-feed/snice-activity-item",
        "properties": [
          "itemId",
          "actorName",
          "actorAvatar",
          "action",
          "target",
          "timestamp",
          "icon",
          "type"
        ],
        "events": {},
        "interfaceProps": [
          "itemId",
          "actorName",
          "actorAvatar",
          "action",
          "target",
          "timestamp",
          "icon",
          "type"
        ],
        "formAssociated": false
      },
      "Alert": {
        "exportName": "Alert",
        "module": "snice/react/alert",
        "tagName": "snice-alert",
        "family": "alert",
        "componentModulePath": "snice/components/alert/snice-alert",
        "properties": [
          "variant",
          "size",
          "appearance",
          "title",
          "dismissible",
          "icon",
          "duration"
        ],
        "events": {
          "alert-dismiss": "onAlertDismiss",
          "alert-hidden": "onAlertHidden",
          "alert-shown": "onAlertShown"
        },
        "interfaceProps": [
          "variant",
          "size",
          "appearance",
          "title",
          "dismissible",
          "icon",
          "duration",
          "onAlertDismiss",
          "onAlertHidden",
          "onAlertShown"
        ],
        "formAssociated": false
      },
      "ApprovalFlow": {
        "exportName": "ApprovalFlow",
        "module": "snice/react/approval-flow",
        "tagName": "snice-approval-flow",
        "family": "approval-flow",
        "componentModulePath": "snice/components/approval-flow/snice-approval-flow",
        "properties": [
          "steps",
          "orientation",
          "currentStep"
        ],
        "events": {
          "step-approve": "onStepApprove",
          "step-reject": "onStepReject",
          "step-comment": "onStepComment"
        },
        "interfaceProps": [
          "steps",
          "orientation",
          "currentStep",
          "onStepApprove",
          "onStepReject",
          "onStepComment"
        ],
        "formAssociated": false
      },
      "AppTile": {
        "exportName": "AppTile",
        "module": "snice/react/app-tile",
        "tagName": "snice-app-tile",
        "family": "app-tiles",
        "componentModulePath": "snice/components/app-tiles/snice-app-tiles",
        "properties": [],
        "events": {},
        "interfaceProps": [
          "name",
          "icon",
          "color",
          "href",
          "badge"
        ],
        "formAssociated": false
      },
      "AppTiles": {
        "exportName": "AppTiles",
        "module": "snice/react/app-tiles",
        "tagName": "snice-app-tiles",
        "family": "app-tiles",
        "componentModulePath": "snice/components/app-tiles/snice-app-tiles",
        "properties": [
          "tiles",
          "columns",
          "size",
          "variant"
        ],
        "events": {
          "tile-click": "onTileClick"
        },
        "interfaceProps": [
          "tiles",
          "columns",
          "size",
          "variant",
          "onTileClick"
        ],
        "formAssociated": false
      },
      "AudioRecorder": {
        "exportName": "AudioRecorder",
        "module": "snice/react/audio-recorder",
        "tagName": "snice-audio-recorder",
        "family": "audio-recorder",
        "componentModulePath": "snice/components/audio-recorder/snice-audio-recorder",
        "properties": [
          "autoStart",
          "format",
          "bitrate",
          "showControls",
          "showVisualizer",
          "maxDuration",
          "showTimer",
          "showPlayback",
          "recordedUrl"
        ],
        "events": {
          "recorder-start": "onRecorderStart",
          "recorder-error": "onRecorderError",
          "recorder-pause": "onRecorderPause",
          "recorder-resume": "onRecorderResume",
          "recorder-cancel": "onRecorderCancel",
          "recorder-stop": "onRecorderStop"
        },
        "interfaceProps": [
          "autoStart",
          "format",
          "bitrate",
          "showControls",
          "showVisualizer",
          "maxDuration",
          "showTimer",
          "showPlayback",
          "recordedUrl",
          "onRecorderStart",
          "onRecorderError",
          "onRecorderPause",
          "onRecorderResume",
          "onRecorderCancel",
          "onRecorderStop"
        ],
        "formAssociated": false
      },
      "Availability": {
        "exportName": "Availability",
        "module": "snice/react/availability",
        "tagName": "snice-availability",
        "family": "availability",
        "componentModulePath": "snice/components/availability/snice-availability",
        "properties": [
          "value",
          "granularity",
          "startHour",
          "endHour",
          "format",
          "readonly"
        ],
        "events": {
          "availability-change": "onAvailabilityChange"
        },
        "interfaceProps": [
          "value",
          "granularity",
          "startHour",
          "endHour",
          "format",
          "readonly",
          "onAvailabilityChange"
        ],
        "formAssociated": false
      },
      "Avatar": {
        "exportName": "Avatar",
        "module": "snice/react/avatar",
        "tagName": "snice-avatar",
        "family": "avatar",
        "componentModulePath": "snice/components/avatar/snice-avatar",
        "properties": [
          "src",
          "alt",
          "name",
          "size",
          "shape",
          "loading",
          "fallbackColor",
          "fallbackBackground"
        ],
        "events": {},
        "interfaceProps": [
          "src",
          "alt",
          "name",
          "size",
          "shape",
          "loading",
          "fallbackColor",
          "fallbackBackground"
        ],
        "formAssociated": false
      },
      "AvatarGroup": {
        "exportName": "AvatarGroup",
        "module": "snice/react/avatar-group",
        "tagName": "snice-avatar-group",
        "family": "avatar-group",
        "componentModulePath": "snice/components/avatar-group/snice-avatar-group",
        "properties": [
          "avatars",
          "max",
          "size",
          "overlap"
        ],
        "events": {
          "avatar-click": "onAvatarClick",
          "overflow-click": "onOverflowClick"
        },
        "interfaceProps": [
          "avatars",
          "max",
          "size",
          "overlap",
          "onAvatarClick",
          "onOverflowClick"
        ],
        "formAssociated": false
      },
      "Badge": {
        "exportName": "Badge",
        "module": "snice/react/badge",
        "tagName": "snice-badge",
        "family": "badge",
        "componentModulePath": "snice/components/badge/snice-badge",
        "properties": [
          "content",
          "count",
          "max",
          "dot",
          "variant",
          "position",
          "inline",
          "size",
          "pulse",
          "label",
          "showZero",
          "offset"
        ],
        "events": {},
        "interfaceProps": [
          "content",
          "count",
          "max",
          "dot",
          "variant",
          "position",
          "inline",
          "size",
          "pulse",
          "label",
          "showZero",
          "offset"
        ],
        "formAssociated": false
      },
      "Banner": {
        "exportName": "Banner",
        "module": "snice/react/banner",
        "tagName": "snice-banner",
        "family": "banner",
        "componentModulePath": "snice/components/banner/snice-banner",
        "properties": [
          "variant",
          "position",
          "message",
          "dismissible",
          "icon",
          "actionText",
          "open",
          "label",
          "duration"
        ],
        "events": {
          "banner-open": "onBannerOpen",
          "banner-close": "onBannerClose",
          "banner-action": "onBannerAction"
        },
        "interfaceProps": [
          "variant",
          "position",
          "message",
          "dismissible",
          "icon",
          "actionText",
          "open",
          "label",
          "duration",
          "onBannerOpen",
          "onBannerClose",
          "onBannerAction"
        ],
        "formAssociated": false
      },
      "Binpack": {
        "exportName": "Binpack",
        "module": "snice/react/binpack",
        "tagName": "snice-binpack",
        "family": "binpack",
        "componentModulePath": "snice/components/binpack/snice-binpack",
        "properties": [
          "gap",
          "columnWidth",
          "rowHeight",
          "horizontal",
          "originLeft",
          "originTop",
          "transitionDuration",
          "stagger",
          "resize",
          "draggable",
          "dragThrottle"
        ],
        "events": {
          "binpack-layout-complete": "onBinpackLayoutComplete",
          "binpack-fit-complete": "onBinpackFitComplete",
          "binpack-drag-item-positioned": "onBinpackDragItemPositioned"
        },
        "interfaceProps": [
          "gap",
          "columnWidth",
          "rowHeight",
          "horizontal",
          "originLeft",
          "originTop",
          "transitionDuration",
          "stagger",
          "resize",
          "draggable",
          "dragThrottle",
          "onBinpackLayoutComplete",
          "onBinpackFitComplete",
          "onBinpackDragItemPositioned"
        ],
        "formAssociated": false
      },
      "Book": {
        "exportName": "Book",
        "module": "snice/react/book",
        "tagName": "snice-book",
        "family": "book",
        "componentModulePath": "snice/components/book/snice-book",
        "properties": [
          "currentPage",
          "coverImage",
          "title",
          "author"
        ],
        "events": {
          "page-turn": "onPageTurn",
          "page-flip-start": "onPageFlipStart",
          "page-flip-end": "onPageFlipEnd"
        },
        "interfaceProps": [
          "currentPage",
          "coverImage",
          "title",
          "author",
          "onPageTurn",
          "onPageFlipStart",
          "onPageFlipEnd"
        ],
        "formAssociated": false
      },
      "Booking": {
        "exportName": "Booking",
        "module": "snice/react/booking",
        "tagName": "snice-booking",
        "family": "booking",
        "componentModulePath": "snice/components/booking/snice-booking",
        "properties": [
          "availableDates",
          "availableSlots",
          "duration",
          "minDate",
          "maxDate",
          "fields",
          "variant"
        ],
        "events": {
          "date-select": "onDateSelect",
          "slot-select": "onSlotSelect",
          "booking-confirm": "onBookingConfirm",
          "booking-cancel": "onBookingCancel"
        },
        "interfaceProps": [
          "availableDates",
          "availableSlots",
          "duration",
          "minDate",
          "maxDate",
          "fields",
          "variant",
          "onDateSelect",
          "onSlotSelect",
          "onBookingConfirm",
          "onBookingCancel"
        ],
        "formAssociated": false
      },
      "BookPage": {
        "exportName": "BookPage",
        "module": "snice/react/book-page",
        "tagName": "snice-book-page",
        "family": "book",
        "componentModulePath": "snice/components/book/snice-book",
        "properties": [],
        "events": {},
        "interfaceProps": [],
        "formAssociated": false
      },
      "Breadcrumbs": {
        "exportName": "Breadcrumbs",
        "module": "snice/react/breadcrumbs",
        "tagName": "snice-breadcrumbs",
        "family": "breadcrumbs",
        "componentModulePath": "snice/components/breadcrumbs/snice-breadcrumbs",
        "properties": [
          "items",
          "separator",
          "size",
          "maxItems",
          "collapsed"
        ],
        "events": {
          "breadcrumb-click": "onBreadcrumbClick"
        },
        "interfaceProps": [
          "items",
          "separator",
          "size",
          "maxItems",
          "collapsed",
          "onBreadcrumbClick"
        ],
        "formAssociated": false
      },
      "Button": {
        "exportName": "Button",
        "module": "snice/react/button",
        "tagName": "snice-button",
        "family": "button",
        "componentModulePath": "snice/components/button/snice-button",
        "properties": [
          "variant",
          "size",
          "type",
          "disabled",
          "loading",
          "outline",
          "pill",
          "circle",
          "href",
          "target",
          "download",
          "icon",
          "iconPlacement",
          "justifyText"
        ],
        "events": {
          "button-click": "onButtonClick"
        },
        "interfaceProps": [
          "variant",
          "size",
          "type",
          "disabled",
          "loading",
          "outline",
          "pill",
          "circle",
          "href",
          "target",
          "download",
          "icon",
          "iconPlacement",
          "justifyText",
          "onButtonClick"
        ],
        "formAssociated": true
      },
      "Calendar": {
        "exportName": "Calendar",
        "module": "snice/react/calendar",
        "tagName": "snice-calendar",
        "family": "calendar",
        "componentModulePath": "snice/components/calendar/snice-calendar",
        "properties": [
          "value",
          "view",
          "events",
          "minDate",
          "maxDate",
          "disabledDates",
          "highlightToday",
          "showWeekNumbers",
          "firstDayOfWeek",
          "locale",
          "noDaySelect",
          "cellSizing",
          "eventTooltip",
          "eventPopover"
        ],
        "events": {
          "calendar-change": "onCalendarChange",
          "calendar-event-click": "onCalendarEventClick"
        },
        "interfaceProps": [
          "value",
          "view",
          "events",
          "minDate",
          "maxDate",
          "disabledDates",
          "highlightToday",
          "showWeekNumbers",
          "firstDayOfWeek",
          "locale",
          "noDaySelect",
          "cellSizing",
          "eventTooltip",
          "eventPopover",
          "onCalendarChange",
          "onCalendarEventClick"
        ],
        "formAssociated": false
      },
      "Camera": {
        "exportName": "Camera",
        "module": "snice/react/camera",
        "tagName": "snice-camera",
        "family": "camera",
        "componentModulePath": "snice/components/camera/snice-camera",
        "properties": [
          "autoStart",
          "facingMode",
          "mirror",
          "controlsPosition",
          "showControls",
          "width",
          "height",
          "aspectRatio",
          "objectFit"
        ],
        "events": {
          "camera-start": "onCameraStart",
          "camera-error": "onCameraError",
          "camera-stop": "onCameraStop",
          "camera-capture": "onCameraCapture"
        },
        "interfaceProps": [
          "autoStart",
          "facingMode",
          "mirror",
          "controlsPosition",
          "showControls",
          "width",
          "height",
          "aspectRatio",
          "objectFit",
          "onCameraStart",
          "onCameraError",
          "onCameraStop",
          "onCameraCapture"
        ],
        "formAssociated": false
      },
      "CameraAnnotate": {
        "exportName": "CameraAnnotate",
        "module": "snice/react/camera-annotate",
        "tagName": "snice-camera-annotate",
        "family": "camera-annotate",
        "componentModulePath": "snice/components/camera-annotate/snice-camera-annotate",
        "properties": [
          "mode",
          "autoStart",
          "autoRotateColors",
          "showLabelsPanel"
        ],
        "events": {
          "capture": "onCapture",
          "annotate": "onAnnotate",
          "annotation-change": "onAnnotationChange"
        },
        "interfaceProps": [
          "mode",
          "autoStart",
          "autoRotateColors",
          "showLabelsPanel",
          "onCapture",
          "onAnnotate",
          "onAnnotationChange"
        ],
        "formAssociated": false
      },
      "Candlestick": {
        "exportName": "Candlestick",
        "module": "snice/react/candlestick",
        "tagName": "snice-candlestick",
        "family": "candlestick",
        "componentModulePath": "snice/components/candlestick/snice-candlestick",
        "properties": [
          "data",
          "showVolume",
          "showGrid",
          "showCrosshair",
          "bullishColor",
          "bearishColor",
          "timeFormat",
          "yAxisFormat",
          "zoomEnabled",
          "animation"
        ],
        "events": {
          "candle-click": "onCandleClick",
          "candle-hover": "onCandleHover",
          "crosshair-move": "onCrosshairMove"
        },
        "interfaceProps": [
          "data",
          "showVolume",
          "showGrid",
          "showCrosshair",
          "bullishColor",
          "bearishColor",
          "timeFormat",
          "yAxisFormat",
          "zoomEnabled",
          "animation",
          "onCandleClick",
          "onCandleHover",
          "onCrosshairMove"
        ],
        "formAssociated": false
      },
      "Card": {
        "exportName": "Card",
        "module": "snice/react/card",
        "tagName": "snice-card",
        "family": "card",
        "componentModulePath": "snice/components/card/snice-card",
        "properties": [
          "variant",
          "size",
          "clickable",
          "selected",
          "disabled"
        ],
        "events": {
          "card-click": "onCardClick"
        },
        "interfaceProps": [
          "variant",
          "size",
          "clickable",
          "selected",
          "disabled",
          "onCardClick"
        ],
        "formAssociated": false
      },
      "Carousel": {
        "exportName": "Carousel",
        "module": "snice/react/carousel",
        "tagName": "snice-carousel",
        "family": "carousel",
        "componentModulePath": "snice/components/carousel/snice-carousel",
        "properties": [
          "activeIndex",
          "autoplay",
          "autoplayInterval",
          "autoplayDirection",
          "loop",
          "showControls",
          "showIndicators",
          "slidesPerView",
          "spaceBetween"
        ],
        "events": {
          "carousel-slide-change": "onCarouselSlideChange"
        },
        "interfaceProps": [
          "activeIndex",
          "autoplay",
          "autoplayInterval",
          "autoplayDirection",
          "loop",
          "showControls",
          "showIndicators",
          "slidesPerView",
          "spaceBetween",
          "onCarouselSlideChange"
        ],
        "formAssociated": false
      },
      "Cart": {
        "exportName": "Cart",
        "module": "snice/react/cart",
        "tagName": "snice-cart",
        "family": "cart",
        "componentModulePath": "snice/components/cart/snice-cart",
        "properties": [
          "items",
          "currency",
          "taxRate",
          "discount",
          "couponCode"
        ],
        "events": {
          "item-add": "onItemAdd",
          "item-remove": "onItemRemove",
          "quantity-change": "onQuantityChange",
          "coupon-apply": "onCouponApply",
          "checkout": "onCheckout"
        },
        "interfaceProps": [
          "items",
          "currency",
          "taxRate",
          "discount",
          "couponCode",
          "onItemAdd",
          "onItemRemove",
          "onQuantityChange",
          "onCouponApply",
          "onCheckout"
        ],
        "formAssociated": false
      },
      "Cell": {
        "exportName": "Cell",
        "module": "snice/react/cell",
        "tagName": "snice-cell",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-cell",
        "properties": [
          "align",
          "type",
          "value",
          "column",
          "rowData"
        ],
        "events": {},
        "interfaceProps": [
          "align",
          "type",
          "value",
          "column",
          "rowData"
        ],
        "formAssociated": false
      },
      "CellActions": {
        "exportName": "CellActions",
        "module": "snice/react/cell-actions",
        "tagName": "snice-cell-actions",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-cell-actions",
        "properties": [
          "actions",
          "column",
          "rowData",
          "value",
          "align",
          "type"
        ],
        "events": {
          "cell-action": "onCellAction"
        },
        "interfaceProps": [
          "actions",
          "column",
          "rowData",
          "value",
          "align",
          "type",
          "onCellAction"
        ],
        "formAssociated": false
      },
      "CellBoolean": {
        "exportName": "CellBoolean",
        "module": "snice/react/cell-boolean",
        "tagName": "snice-cell-boolean",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-cell-boolean",
        "properties": [
          "align",
          "type",
          "value",
          "column",
          "rowData",
          "trueValue",
          "falseValue",
          "useSymbols",
          "trueSymbol",
          "falseSymbol"
        ],
        "events": {},
        "interfaceProps": [
          "align",
          "type",
          "value",
          "column",
          "rowData",
          "trueValue",
          "falseValue",
          "useSymbols",
          "trueSymbol",
          "falseSymbol"
        ],
        "formAssociated": false
      },
      "CellColor": {
        "exportName": "CellColor",
        "module": "snice/react/cell-color",
        "tagName": "snice-cell-color",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-cell-color",
        "properties": [
          "value",
          "color",
          "showSwatch",
          "showHex",
          "showRgb",
          "swatchSize",
          "column",
          "rowData",
          "align",
          "type"
        ],
        "events": {},
        "interfaceProps": [
          "value",
          "color",
          "showSwatch",
          "showHex",
          "showRgb",
          "swatchSize",
          "column",
          "rowData",
          "align",
          "type"
        ],
        "formAssociated": false
      },
      "CellCurrency": {
        "exportName": "CellCurrency",
        "module": "snice/react/cell-currency",
        "tagName": "snice-cell-currency",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-cell-currency",
        "properties": [
          "align",
          "type",
          "value",
          "column",
          "rowData",
          "decimals",
          "thousandsSeparator",
          "currency",
          "currencyDisplay",
          "locale",
          "negativeStyle",
          "highlight"
        ],
        "events": {},
        "interfaceProps": [
          "align",
          "type",
          "value",
          "column",
          "rowData",
          "decimals",
          "thousandsSeparator",
          "currency",
          "currencyDisplay",
          "locale",
          "negativeStyle",
          "highlight"
        ],
        "formAssociated": false
      },
      "CellDate": {
        "exportName": "CellDate",
        "module": "snice/react/cell-date",
        "tagName": "snice-cell-date",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-cell-date",
        "properties": [
          "align",
          "type",
          "value",
          "column",
          "rowData",
          "dateFormat",
          "customFormat",
          "locale",
          "relativeTime",
          "showTime"
        ],
        "events": {},
        "interfaceProps": [
          "align",
          "type",
          "value",
          "column",
          "rowData",
          "dateFormat",
          "customFormat",
          "locale",
          "relativeTime",
          "showTime"
        ],
        "formAssociated": false
      },
      "CellDuration": {
        "exportName": "CellDuration",
        "module": "snice/react/cell-duration",
        "tagName": "snice-cell-duration",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-cell-duration",
        "properties": [
          "align",
          "type",
          "value",
          "column",
          "rowData"
        ],
        "events": {},
        "interfaceProps": [
          "align",
          "type",
          "value",
          "column",
          "rowData"
        ],
        "formAssociated": false
      },
      "CellEmail": {
        "exportName": "CellEmail",
        "module": "snice/react/cell-email",
        "tagName": "snice-cell-email",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-cell-email",
        "properties": [
          "value",
          "email",
          "displayText",
          "showIcon",
          "column",
          "rowData",
          "align",
          "type"
        ],
        "events": {},
        "interfaceProps": [
          "value",
          "email",
          "displayText",
          "showIcon",
          "column",
          "rowData",
          "align",
          "type"
        ],
        "formAssociated": false
      },
      "CellFilesize": {
        "exportName": "CellFilesize",
        "module": "snice/react/cell-filesize",
        "tagName": "snice-cell-filesize",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-cell-filesize",
        "properties": [
          "align",
          "type",
          "value",
          "column",
          "rowData"
        ],
        "events": {},
        "interfaceProps": [
          "align",
          "type",
          "value",
          "column",
          "rowData"
        ],
        "formAssociated": false
      },
      "CellImage": {
        "exportName": "CellImage",
        "module": "snice/react/cell-image",
        "tagName": "snice-cell-image",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-cell-image",
        "properties": [
          "value",
          "src",
          "alt",
          "fallback",
          "variant",
          "size",
          "lazy",
          "column",
          "rowData",
          "align",
          "type",
          "imageError"
        ],
        "events": {},
        "interfaceProps": [
          "value",
          "src",
          "alt",
          "fallback",
          "variant",
          "size",
          "lazy",
          "column",
          "rowData",
          "align",
          "type",
          "imageError"
        ],
        "formAssociated": false
      },
      "CellJson": {
        "exportName": "CellJson",
        "module": "snice/react/cell-json",
        "tagName": "snice-cell-json",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-cell-json",
        "properties": [
          "value",
          "collapsed",
          "maxDepth",
          "showToggle",
          "column",
          "rowData",
          "align",
          "type"
        ],
        "events": {},
        "interfaceProps": [
          "value",
          "collapsed",
          "maxDepth",
          "showToggle",
          "column",
          "rowData",
          "align",
          "type"
        ],
        "formAssociated": false
      },
      "CellLink": {
        "exportName": "CellLink",
        "module": "snice/react/cell-link",
        "tagName": "snice-cell-link",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-cell-link",
        "properties": [
          "value",
          "href",
          "target",
          "external",
          "icon",
          "text",
          "column",
          "rowData",
          "align",
          "type"
        ],
        "events": {},
        "interfaceProps": [
          "value",
          "href",
          "target",
          "external",
          "icon",
          "text",
          "column",
          "rowData",
          "align",
          "type"
        ],
        "formAssociated": false
      },
      "CellLocation": {
        "exportName": "CellLocation",
        "module": "snice/react/cell-location",
        "tagName": "snice-cell-location",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-cell-location",
        "properties": [
          "value",
          "address",
          "latitude",
          "longitude",
          "showMapLink",
          "mapProvider",
          "showIcon",
          "column",
          "rowData",
          "align",
          "type"
        ],
        "events": {},
        "interfaceProps": [
          "value",
          "address",
          "latitude",
          "longitude",
          "showMapLink",
          "mapProvider",
          "showIcon",
          "column",
          "rowData",
          "align",
          "type"
        ],
        "formAssociated": false
      },
      "CellNumber": {
        "exportName": "CellNumber",
        "module": "snice/react/cell-number",
        "tagName": "snice-cell-number",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-cell-number",
        "properties": [
          "align",
          "type",
          "value",
          "column",
          "rowData",
          "decimals",
          "thousandsSeparator",
          "prefix",
          "suffix",
          "negativeStyle",
          "highlight"
        ],
        "events": {},
        "interfaceProps": [
          "align",
          "type",
          "value",
          "column",
          "rowData",
          "decimals",
          "thousandsSeparator",
          "prefix",
          "suffix",
          "negativeStyle",
          "highlight"
        ],
        "formAssociated": false
      },
      "CellPercentage": {
        "exportName": "CellPercentage",
        "module": "snice/react/cell-percentage",
        "tagName": "snice-cell-percentage",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-cell-percentage",
        "properties": [
          "align",
          "type",
          "value",
          "column",
          "rowData",
          "decimals",
          "showTrend",
          "trendValue",
          "colorize"
        ],
        "events": {},
        "interfaceProps": [
          "align",
          "type",
          "value",
          "column",
          "rowData",
          "decimals",
          "showTrend",
          "trendValue",
          "colorize"
        ],
        "formAssociated": false
      },
      "CellPhone": {
        "exportName": "CellPhone",
        "module": "snice/react/cell-phone",
        "tagName": "snice-cell-phone",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-cell-phone",
        "properties": [
          "value",
          "phone",
          "displayText",
          "showIcon",
          "format",
          "country",
          "column",
          "rowData",
          "align",
          "type"
        ],
        "events": {},
        "interfaceProps": [
          "value",
          "phone",
          "displayText",
          "showIcon",
          "format",
          "country",
          "column",
          "rowData",
          "align",
          "type"
        ],
        "formAssociated": false
      },
      "CellProgress": {
        "exportName": "CellProgress",
        "module": "snice/react/cell-progress",
        "tagName": "snice-cell-progress",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-cell-progress",
        "properties": [
          "align",
          "type",
          "value",
          "column",
          "rowData"
        ],
        "events": {},
        "interfaceProps": [
          "align",
          "type",
          "value",
          "column",
          "rowData"
        ],
        "formAssociated": false
      },
      "CellRating": {
        "exportName": "CellRating",
        "module": "snice/react/cell-rating",
        "tagName": "snice-cell-rating",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-cell-rating",
        "properties": [
          "align",
          "type",
          "value",
          "column",
          "rowData"
        ],
        "events": {},
        "interfaceProps": [
          "align",
          "type",
          "value",
          "column",
          "rowData"
        ],
        "formAssociated": false
      },
      "CellSparkline": {
        "exportName": "CellSparkline",
        "module": "snice/react/cell-sparkline",
        "tagName": "snice-cell-sparkline",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-cell-sparkline",
        "properties": [
          "align",
          "type",
          "value",
          "column",
          "rowData",
          "chartType",
          "color",
          "width",
          "height",
          "showDots",
          "showBaseline",
          "strokeWidth",
          "minValue",
          "maxValue",
          "data"
        ],
        "events": {},
        "interfaceProps": [
          "align",
          "type",
          "value",
          "column",
          "rowData",
          "chartType",
          "color",
          "width",
          "height",
          "showDots",
          "showBaseline",
          "strokeWidth",
          "minValue",
          "maxValue",
          "data"
        ],
        "formAssociated": false
      },
      "CellStatus": {
        "exportName": "CellStatus",
        "module": "snice/react/cell-status",
        "tagName": "snice-cell-status",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-cell-status",
        "properties": [
          "value",
          "status",
          "label",
          "showDot",
          "variant",
          "column",
          "rowData",
          "align",
          "type"
        ],
        "events": {},
        "interfaceProps": [
          "value",
          "status",
          "label",
          "showDot",
          "variant",
          "column",
          "rowData",
          "align",
          "type"
        ],
        "formAssociated": false
      },
      "CellTag": {
        "exportName": "CellTag",
        "module": "snice/react/cell-tag",
        "tagName": "snice-cell-tag",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-cell-tag",
        "properties": [
          "tags",
          "value",
          "variant",
          "column",
          "rowData",
          "align",
          "type"
        ],
        "events": {},
        "interfaceProps": [
          "tags",
          "value",
          "variant",
          "column",
          "rowData",
          "align",
          "type"
        ],
        "formAssociated": false
      },
      "CellText": {
        "exportName": "CellText",
        "module": "snice/react/cell-text",
        "tagName": "snice-cell-text",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-cell-text",
        "properties": [
          "align",
          "type",
          "value",
          "column",
          "rowData",
          "multiline",
          "maxLines"
        ],
        "events": {},
        "interfaceProps": [
          "align",
          "type",
          "value",
          "column",
          "rowData",
          "multiline",
          "maxLines"
        ],
        "formAssociated": false
      },
      "Chart": {
        "exportName": "Chart",
        "module": "snice/react/chart",
        "tagName": "snice-chart",
        "family": "chart",
        "componentModulePath": "snice/components/chart/snice-chart",
        "properties": [
          "type",
          "datasets",
          "labels",
          "options",
          "width",
          "height"
        ],
        "events": {},
        "interfaceProps": [
          "type",
          "datasets",
          "labels",
          "options",
          "width",
          "height"
        ],
        "formAssociated": false
      },
      "Chat": {
        "exportName": "Chat",
        "module": "snice/react/chat",
        "tagName": "snice-chat",
        "family": "chat",
        "componentModulePath": "snice/components/chat/snice-chat",
        "properties": [
          "messages",
          "currentUser",
          "currentAvatar",
          "placeholder",
          "allowFiles",
          "showTyping",
          "showAvatars",
          "showTimestamps",
          "authorColors",
          "colorAuthors",
          "markdown",
          "layout"
        ],
        "events": {
          "message-send": "onMessageSend",
          "message-edit": "onMessageEdit",
          "message-delete": "onMessageDelete",
          "message-react": "onMessageReact",
          "typing-start": "onTypingStart",
          "typing-stop": "onTypingStop"
        },
        "interfaceProps": [
          "messages",
          "currentUser",
          "currentAvatar",
          "placeholder",
          "allowFiles",
          "showTyping",
          "showAvatars",
          "showTimestamps",
          "authorColors",
          "colorAuthors",
          "markdown",
          "layout",
          "onMessageSend",
          "onMessageEdit",
          "onMessageDelete",
          "onMessageReact",
          "onTypingStart",
          "onTypingStop"
        ],
        "formAssociated": false
      },
      "ChatMessage": {
        "exportName": "ChatMessage",
        "module": "snice/react/chat-message",
        "tagName": "snice-chat-message",
        "family": "chat",
        "componentModulePath": "snice/components/chat/snice-chat-message",
        "properties": [
          "author",
          "avatar",
          "type",
          "format",
          "edited",
          "authorColor",
          "reactions",
          "attachment",
          "thread"
        ],
        "events": {},
        "interfaceProps": [
          "author",
          "avatar",
          "type",
          "format",
          "edited",
          "authorColor",
          "reactions",
          "attachment",
          "thread"
        ],
        "formAssociated": false
      },
      "Checkbox": {
        "exportName": "Checkbox",
        "module": "snice/react/checkbox",
        "tagName": "snice-checkbox",
        "family": "checkbox",
        "componentModulePath": "snice/components/checkbox/snice-checkbox",
        "properties": [
          "defaultChecked",
          "indeterminate",
          "disabled",
          "loading",
          "required",
          "invalid",
          "size",
          "name",
          "value",
          "label",
          "checked"
        ],
        "events": {
          "checkbox-change": "onCheckboxChange"
        },
        "interfaceProps": [
          "defaultChecked",
          "indeterminate",
          "disabled",
          "loading",
          "required",
          "invalid",
          "size",
          "name",
          "value",
          "label",
          "checked",
          "onCheckboxChange"
        ],
        "formAssociated": true
      },
      "Chip": {
        "exportName": "Chip",
        "module": "snice/react/chip",
        "tagName": "snice-chip",
        "family": "chip",
        "componentModulePath": "snice/components/chip/snice-chip",
        "properties": [
          "label",
          "variant",
          "size",
          "shape",
          "removable",
          "selectable",
          "selected",
          "disabled",
          "icon",
          "avatar"
        ],
        "events": {
          "chip-click": "onChipClick",
          "chip-remove": "onChipRemove"
        },
        "interfaceProps": [
          "label",
          "variant",
          "size",
          "shape",
          "removable",
          "selectable",
          "selected",
          "disabled",
          "icon",
          "avatar",
          "onChipClick",
          "onChipRemove"
        ],
        "formAssociated": false
      },
      "CodeBlock": {
        "exportName": "CodeBlock",
        "module": "snice/react/code-block",
        "tagName": "snice-code-block",
        "family": "code-block",
        "componentModulePath": "snice/components/code-block/snice-code-block",
        "properties": [
          "language",
          "showLineNumbers",
          "startLine",
          "highlightLines",
          "copyable",
          "filename",
          "grammar",
          "fetchMode",
          "format",
          "theme"
        ],
        "events": {
          "code-copy": "onCodeCopy",
          "code-before-highlight": "onCodeBeforeHighlight",
          "code-after-highlight": "onCodeAfterHighlight",
          "code-before-format": "onCodeBeforeFormat",
          "code-after-format": "onCodeAfterFormat",
          "grammar-request": "onGrammarRequest",
          "grammar-loaded": "onGrammarLoaded"
        },
        "interfaceProps": [
          "language",
          "showLineNumbers",
          "startLine",
          "highlightLines",
          "copyable",
          "filename",
          "grammar",
          "fetchMode",
          "format",
          "theme",
          "onCodeCopy",
          "onCodeBeforeHighlight",
          "onCodeAfterHighlight",
          "onCodeBeforeFormat",
          "onCodeAfterFormat",
          "onGrammarRequest",
          "onGrammarLoaded"
        ],
        "formAssociated": false
      },
      "ColorDisplay": {
        "exportName": "ColorDisplay",
        "module": "snice/react/color-display",
        "tagName": "snice-color-display",
        "family": "color-display",
        "componentModulePath": "snice/components/color-display/snice-color-display",
        "properties": [
          "value",
          "format",
          "showSwatch",
          "showLabel",
          "swatchSize",
          "label"
        ],
        "events": {},
        "interfaceProps": [
          "value",
          "format",
          "showSwatch",
          "showLabel",
          "swatchSize",
          "label"
        ],
        "formAssociated": false
      },
      "ColorPicker": {
        "exportName": "ColorPicker",
        "module": "snice/react/color-picker",
        "tagName": "snice-color-picker",
        "family": "color-picker",
        "componentModulePath": "snice/components/color-picker/snice-color-picker",
        "properties": [
          "defaultValue",
          "size",
          "format",
          "label",
          "helperText",
          "errorText",
          "disabled",
          "loading",
          "required",
          "invalid",
          "name",
          "showInput",
          "showPresets",
          "presets",
          "value"
        ],
        "events": {
          "color-picker-input": "onColorPickerInput",
          "color-picker-change": "onColorPickerChange",
          "color-picker-focus": "onColorPickerFocus",
          "color-picker-blur": "onColorPickerBlur"
        },
        "interfaceProps": [
          "defaultValue",
          "size",
          "format",
          "label",
          "helperText",
          "errorText",
          "disabled",
          "loading",
          "required",
          "invalid",
          "name",
          "showInput",
          "showPresets",
          "presets",
          "value",
          "onColorPickerInput",
          "onColorPickerChange",
          "onColorPickerFocus",
          "onColorPickerBlur"
        ],
        "formAssociated": true
      },
      "Column": {
        "exportName": "Column",
        "module": "snice/react/column",
        "tagName": "snice-column",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-column",
        "properties": [
          "key",
          "label",
          "type",
          "align",
          "width",
          "sortable",
          "filterable",
          "wrap",
          "ellipsis",
          "tooltip",
          "decimals",
          "thousandsSeparator",
          "numberPrefix",
          "numberSuffix",
          "negativeStyle",
          "dateFormat",
          "customDateFormat",
          "dateLocale",
          "trueValue",
          "falseValue",
          "useSymbols",
          "trueSymbol",
          "falseSymbol",
          "ratingMax",
          "ratingSymbol",
          "ratingEmptySymbol",
          "ratingColor",
          "progressMax",
          "showPercentage",
          "progressColor",
          "progressBgColor",
          "progressHeight",
          "sparklineType",
          "sparklineColor",
          "sparklineWidth",
          "sparklineHeight",
          "cellBgColor",
          "cellColor",
          "cellFontWeight",
          "cellFontStyle",
          "cellFontSize",
          "cellTextDecoration"
        ],
        "events": {
          "column-changed": "onColumnChanged"
        },
        "interfaceProps": [
          "key",
          "label",
          "type",
          "align",
          "width",
          "sortable",
          "filterable",
          "wrap",
          "ellipsis",
          "tooltip",
          "decimals",
          "thousandsSeparator",
          "numberPrefix",
          "numberSuffix",
          "negativeStyle",
          "dateFormat",
          "customDateFormat",
          "dateLocale",
          "trueValue",
          "falseValue",
          "useSymbols",
          "trueSymbol",
          "falseSymbol",
          "ratingMax",
          "ratingSymbol",
          "ratingEmptySymbol",
          "ratingColor",
          "progressMax",
          "showPercentage",
          "progressColor",
          "progressBgColor",
          "progressHeight",
          "sparklineType",
          "sparklineColor",
          "sparklineWidth",
          "sparklineHeight",
          "cellBgColor",
          "cellColor",
          "cellFontWeight",
          "cellFontStyle",
          "cellFontSize",
          "cellTextDecoration",
          "onColumnChanged"
        ],
        "formAssociated": false
      },
      "CommandPalette": {
        "exportName": "CommandPalette",
        "module": "snice/react/command-palette",
        "tagName": "snice-command-palette",
        "family": "command-palette",
        "componentModulePath": "snice/components/command-palette/snice-command-palette",
        "properties": [
          "open",
          "commands",
          "placeholder",
          "noResultsText",
          "maxResults",
          "showRecentCommands",
          "recentCommandsLimit",
          "caseSensitive"
        ],
        "events": {
          "command-palette-open": "onCommandPaletteOpen",
          "command-palette-close": "onCommandPaletteClose",
          "command-select": "onCommandSelect",
          "command-execute": "onCommandExecute",
          "command-search": "onCommandSearch"
        },
        "interfaceProps": [
          "open",
          "commands",
          "placeholder",
          "noResultsText",
          "maxResults",
          "showRecentCommands",
          "recentCommandsLimit",
          "caseSensitive",
          "onCommandPaletteOpen",
          "onCommandPaletteClose",
          "onCommandSelect",
          "onCommandExecute",
          "onCommandSearch"
        ],
        "formAssociated": false
      },
      "Comment": {
        "exportName": "Comment",
        "module": "snice/react/comment",
        "tagName": "snice-comment",
        "family": "comments",
        "componentModulePath": "snice/components/comments/snice-comments",
        "properties": [],
        "events": {},
        "interfaceProps": [
          "author",
          "avatar",
          "timestamp",
          "likes",
          "liked"
        ],
        "formAssociated": false
      },
      "Comments": {
        "exportName": "Comments",
        "module": "snice/react/comments",
        "tagName": "snice-comments",
        "family": "comments",
        "componentModulePath": "snice/components/comments/snice-comments",
        "properties": [
          "comments",
          "currentUser",
          "allowReplies",
          "allowLikes",
          "maxDepth"
        ],
        "events": {
          "comment-add": "onCommentAdd",
          "comment-reply": "onCommentReply",
          "comment-delete": "onCommentDelete",
          "comment-like": "onCommentLike"
        },
        "interfaceProps": [
          "comments",
          "currentUser",
          "allowReplies",
          "allowLikes",
          "maxDepth",
          "onCommentAdd",
          "onCommentReply",
          "onCommentDelete",
          "onCommentLike"
        ],
        "formAssociated": false
      },
      "Countdown": {
        "exportName": "Countdown",
        "module": "snice/react/countdown",
        "tagName": "snice-countdown",
        "family": "countdown",
        "componentModulePath": "snice/components/countdown/snice-countdown",
        "properties": [
          "target",
          "format",
          "variant"
        ],
        "events": {
          "countdown-complete": "onCountdownComplete",
          "countdown-tick": "onCountdownTick"
        },
        "interfaceProps": [
          "target",
          "format",
          "variant",
          "onCountdownComplete",
          "onCountdownTick"
        ],
        "formAssociated": false
      },
      "Cropper": {
        "exportName": "Cropper",
        "module": "snice/react/cropper",
        "tagName": "snice-cropper",
        "family": "cropper",
        "componentModulePath": "snice/components/cropper/snice-cropper",
        "properties": [
          "src",
          "aspectRatio",
          "minWidth",
          "minHeight",
          "outputType"
        ],
        "events": {
          "crop-change": "onCropChange",
          "crop-complete": "onCropComplete"
        },
        "interfaceProps": [
          "src",
          "aspectRatio",
          "minWidth",
          "minHeight",
          "outputType",
          "onCropChange",
          "onCropComplete"
        ],
        "formAssociated": false
      },
      "Crumb": {
        "exportName": "Crumb",
        "module": "snice/react/crumb",
        "tagName": "snice-crumb",
        "family": "breadcrumbs",
        "componentModulePath": "snice/components/breadcrumbs/snice-crumb",
        "properties": [
          "label",
          "href",
          "icon",
          "iconImage",
          "active"
        ],
        "events": {},
        "interfaceProps": [
          "label",
          "href",
          "icon",
          "iconImage",
          "active"
        ],
        "formAssociated": false
      },
      "DataCard": {
        "exportName": "DataCard",
        "module": "snice/react/data-card",
        "tagName": "snice-data-card",
        "family": "data-card",
        "componentModulePath": "snice/components/data-card/snice-data-card",
        "properties": [
          "fields",
          "editable",
          "variant"
        ],
        "events": {
          "field-change": "onFieldChange",
          "field-save": "onFieldSave"
        },
        "interfaceProps": [
          "fields",
          "editable",
          "variant",
          "onFieldChange",
          "onFieldSave"
        ],
        "formAssociated": false
      },
      "DatePicker": {
        "exportName": "DatePicker",
        "module": "snice/react/date-picker",
        "tagName": "snice-date-picker",
        "family": "date-picker",
        "componentModulePath": "snice/components/date-picker/snice-date-picker",
        "properties": [
          "size",
          "variant",
          "defaultValue",
          "format",
          "placeholder",
          "label",
          "helperText",
          "errorText",
          "disabled",
          "readonly",
          "loading",
          "required",
          "invalid",
          "clearable",
          "min",
          "max",
          "name",
          "open",
          "firstDayOfWeek",
          "value"
        ],
        "events": {
          "datepicker-input": "onDatepickerInput",
          "datepicker-change": "onDatepickerChange",
          "datepicker-focus": "onDatepickerFocus",
          "datepicker-blur": "onDatepickerBlur",
          "datepicker-open": "onDatepickerOpen",
          "datepicker-close": "onDatepickerClose",
          "datepicker-clear": "onDatepickerClear",
          "datepicker-select": "onDatepickerSelect"
        },
        "interfaceProps": [
          "size",
          "variant",
          "defaultValue",
          "format",
          "placeholder",
          "label",
          "helperText",
          "errorText",
          "disabled",
          "readonly",
          "loading",
          "required",
          "invalid",
          "clearable",
          "min",
          "max",
          "name",
          "open",
          "firstDayOfWeek",
          "value",
          "onDatepickerInput",
          "onDatepickerChange",
          "onDatepickerFocus",
          "onDatepickerBlur",
          "onDatepickerOpen",
          "onDatepickerClose",
          "onDatepickerClear",
          "onDatepickerSelect"
        ],
        "formAssociated": true
      },
      "DateRangePicker": {
        "exportName": "DateRangePicker",
        "module": "snice/react/date-range-picker",
        "tagName": "snice-date-range-picker",
        "family": "date-range-picker",
        "componentModulePath": "snice/components/date-range-picker/snice-date-range-picker",
        "properties": [
          "defaultStart",
          "defaultEnd",
          "size",
          "variant",
          "format",
          "placeholder",
          "label",
          "helperText",
          "errorText",
          "disabled",
          "readonly",
          "loading",
          "required",
          "invalid",
          "clearable",
          "min",
          "max",
          "name",
          "columns",
          "firstDayOfWeek",
          "presets",
          "showCalendar",
          "start",
          "end"
        ],
        "events": {
          "daterange-change": "onDaterangeChange",
          "daterange-open": "onDaterangeOpen",
          "daterange-close": "onDaterangeClose",
          "daterange-clear": "onDaterangeClear",
          "daterange-preset": "onDaterangePreset",
          "daterange-focus": "onDaterangeFocus",
          "daterange-blur": "onDaterangeBlur"
        },
        "interfaceProps": [
          "defaultStart",
          "defaultEnd",
          "size",
          "variant",
          "format",
          "placeholder",
          "label",
          "helperText",
          "errorText",
          "disabled",
          "readonly",
          "loading",
          "required",
          "invalid",
          "clearable",
          "min",
          "max",
          "name",
          "columns",
          "firstDayOfWeek",
          "presets",
          "showCalendar",
          "start",
          "end",
          "onDaterangeChange",
          "onDaterangeOpen",
          "onDaterangeClose",
          "onDaterangeClear",
          "onDaterangePreset",
          "onDaterangeFocus",
          "onDaterangeBlur"
        ],
        "formAssociated": true
      },
      "DateTimePicker": {
        "exportName": "DateTimePicker",
        "module": "snice/react/date-time-picker",
        "tagName": "snice-date-time-picker",
        "family": "date-time-picker",
        "componentModulePath": "snice/components/date-time-picker/snice-date-time-picker",
        "properties": [
          "size",
          "defaultValue",
          "dateFormat",
          "timeFormat",
          "min",
          "max",
          "showSeconds",
          "loading",
          "clearable",
          "disabled",
          "readonly",
          "placeholder",
          "label",
          "helperText",
          "errorText",
          "required",
          "invalid",
          "name",
          "variant",
          "value"
        ],
        "events": {
          "datetimepicker-clear": "onDatetimepickerClear",
          "datetime-change": "onDatetimeChange",
          "datetimepicker-focus": "onDatetimepickerFocus",
          "datetimepicker-blur": "onDatetimepickerBlur",
          "datetimepicker-open": "onDatetimepickerOpen",
          "datetimepicker-close": "onDatetimepickerClose"
        },
        "interfaceProps": [
          "size",
          "defaultValue",
          "dateFormat",
          "timeFormat",
          "min",
          "max",
          "showSeconds",
          "loading",
          "clearable",
          "disabled",
          "readonly",
          "placeholder",
          "label",
          "helperText",
          "errorText",
          "required",
          "invalid",
          "name",
          "variant",
          "value",
          "onDatetimepickerClear",
          "onDatetimeChange",
          "onDatetimepickerFocus",
          "onDatetimepickerBlur",
          "onDatetimepickerOpen",
          "onDatetimepickerClose"
        ],
        "formAssociated": true
      },
      "Diff": {
        "exportName": "Diff",
        "module": "snice/react/diff",
        "tagName": "snice-diff",
        "family": "diff",
        "componentModulePath": "snice/components/diff/snice-diff",
        "properties": [
          "oldText",
          "newText",
          "language",
          "mode",
          "lineNumbers",
          "contextLines",
          "markers",
          "showModeToggle"
        ],
        "events": {
          "diff-computed": "onDiffComputed",
          "mode-change": "onModeChange"
        },
        "interfaceProps": [
          "oldText",
          "newText",
          "language",
          "mode",
          "lineNumbers",
          "contextLines",
          "markers",
          "showModeToggle",
          "onDiffComputed",
          "onModeChange"
        ],
        "formAssociated": false
      },
      "Divider": {
        "exportName": "Divider",
        "module": "snice/react/divider",
        "tagName": "snice-divider",
        "family": "divider",
        "componentModulePath": "snice/components/divider/snice-divider",
        "properties": [
          "orientation",
          "variant",
          "spacing",
          "align",
          "text",
          "textBackground",
          "color",
          "capped"
        ],
        "events": {},
        "interfaceProps": [
          "orientation",
          "variant",
          "spacing",
          "align",
          "text",
          "textBackground",
          "color",
          "capped"
        ],
        "formAssociated": false
      },
      "Doc": {
        "exportName": "Doc",
        "module": "snice/react/doc",
        "tagName": "snice-doc",
        "family": "doc",
        "componentModulePath": "snice/components/doc/snice-doc",
        "properties": [
          "placeholder",
          "readonly",
          "icons"
        ],
        "events": {},
        "interfaceProps": [
          "placeholder",
          "readonly",
          "icons"
        ],
        "formAssociated": false
      },
      "Draw": {
        "exportName": "Draw",
        "module": "snice/react/draw",
        "tagName": "snice-draw",
        "family": "draw",
        "componentModulePath": "snice/components/draw/snice-draw",
        "properties": [
          "width",
          "height",
          "tool",
          "color",
          "strokeWidth",
          "backgroundColor",
          "lazy",
          "lazyRadius",
          "friction",
          "smoothing",
          "autoPolygon",
          "polygonCurvePoints",
          "autoCircle",
          "circlePoints",
          "disabled"
        ],
        "events": {
          "draw-start": "onDrawStart",
          "draw-end": "onDrawEnd",
          "draw-clear": "onDrawClear",
          "draw-undo": "onDrawUndo",
          "draw-redo": "onDrawRedo"
        },
        "interfaceProps": [
          "width",
          "height",
          "tool",
          "color",
          "strokeWidth",
          "backgroundColor",
          "lazy",
          "lazyRadius",
          "friction",
          "smoothing",
          "autoPolygon",
          "polygonCurvePoints",
          "autoCircle",
          "circlePoints",
          "disabled",
          "onDrawStart",
          "onDrawEnd",
          "onDrawClear",
          "onDrawUndo",
          "onDrawRedo"
        ],
        "formAssociated": false
      },
      "Drawer": {
        "exportName": "Drawer",
        "module": "snice/react/drawer",
        "tagName": "snice-drawer",
        "family": "drawer",
        "componentModulePath": "snice/components/drawer/snice-drawer",
        "properties": [
          "open",
          "position",
          "size",
          "inline",
          "breakpoint",
          "noBackdrop",
          "noBackdropDismiss",
          "noEscapeDismiss",
          "noFocusTrap",
          "persistent",
          "pushContent",
          "contained",
          "noHeader",
          "noFooter"
        ],
        "events": {
          "drawer-open": "onDrawerOpen",
          "drawer-close": "onDrawerClose"
        },
        "interfaceProps": [
          "open",
          "position",
          "size",
          "inline",
          "breakpoint",
          "noBackdrop",
          "noBackdropDismiss",
          "noEscapeDismiss",
          "noFocusTrap",
          "persistent",
          "pushContent",
          "contained",
          "noHeader",
          "noFooter",
          "onDrawerOpen",
          "onDrawerClose"
        ],
        "formAssociated": false
      },
      "DrawerTarget": {
        "exportName": "DrawerTarget",
        "module": "snice/react/drawer-target",
        "tagName": "snice-drawer-target",
        "family": "drawer",
        "componentModulePath": "snice/components/drawer/snice-drawer-target",
        "properties": [
          "for",
          "push"
        ],
        "events": {},
        "interfaceProps": [
          "for",
          "push"
        ],
        "formAssociated": false
      },
      "EmptyState": {
        "exportName": "EmptyState",
        "module": "snice/react/empty-state",
        "tagName": "snice-empty-state",
        "family": "empty-state",
        "componentModulePath": "snice/components/empty-state/snice-empty-state",
        "properties": [
          "size",
          "icon",
          "title",
          "description",
          "actionText",
          "actionHref"
        ],
        "events": {
          "empty-state-action": "onEmptyStateAction"
        },
        "interfaceProps": [
          "size",
          "icon",
          "title",
          "description",
          "actionText",
          "actionHref",
          "onEmptyStateAction"
        ],
        "formAssociated": false
      },
      "Estimate": {
        "exportName": "Estimate",
        "module": "snice/react/estimate",
        "tagName": "snice-estimate",
        "family": "estimate",
        "componentModulePath": "snice/components/estimate/snice-estimate",
        "properties": [
          "estimateNumber",
          "date",
          "expiryDate",
          "status",
          "from",
          "to",
          "items",
          "currency",
          "taxRate",
          "discount",
          "notes",
          "terms",
          "variant",
          "showQr",
          "qrData",
          "qrPosition"
        ],
        "events": {
          "estimate-accept": "onEstimateAccept",
          "estimate-decline": "onEstimateDecline",
          "item-toggle": "onItemToggle"
        },
        "interfaceProps": [
          "estimateNumber",
          "date",
          "expiryDate",
          "status",
          "from",
          "to",
          "items",
          "currency",
          "taxRate",
          "discount",
          "notes",
          "terms",
          "variant",
          "showQr",
          "qrData",
          "qrPosition",
          "onEstimateAccept",
          "onEstimateDecline",
          "onItemToggle"
        ],
        "formAssociated": false
      },
      "Feature": {
        "exportName": "Feature",
        "module": "snice/react/feature",
        "tagName": "snice-feature",
        "family": "pricing-table",
        "componentModulePath": "snice/components/pricing-table/snice-pricing-table",
        "properties": [],
        "events": {},
        "interfaceProps": [
          "excluded",
          "value"
        ],
        "formAssociated": false
      },
      "FileGallery": {
        "exportName": "FileGallery",
        "module": "snice/react/file-gallery",
        "tagName": "snice-file-gallery",
        "family": "file-gallery",
        "componentModulePath": "snice/components/file-gallery/snice-file-gallery",
        "properties": [
          "accept",
          "multiple",
          "disabled",
          "maxSize",
          "maxFiles",
          "view",
          "showProgress",
          "allowPause",
          "allowDelete",
          "autoUpload",
          "showDropzone",
          "showAddButton",
          "showHeader"
        ],
        "events": {
          "files-change": "onFilesChange",
          "file-remove": "onFileRemove",
          "upload-progress": "onUploadProgress",
          "upload-complete": "onUploadComplete",
          "upload-error": "onUploadError",
          "upload-pause": "onUploadPause",
          "gallery-error": "onGalleryError",
          "custom-action-click": "onCustomActionClick"
        },
        "interfaceProps": [
          "accept",
          "multiple",
          "disabled",
          "maxSize",
          "maxFiles",
          "view",
          "showProgress",
          "allowPause",
          "allowDelete",
          "autoUpload",
          "showDropzone",
          "showAddButton",
          "showHeader",
          "onFilesChange",
          "onFileRemove",
          "onUploadProgress",
          "onUploadComplete",
          "onUploadError",
          "onUploadPause",
          "onGalleryError",
          "onCustomActionClick"
        ],
        "formAssociated": false
      },
      "FileUpload": {
        "exportName": "FileUpload",
        "module": "snice/react/file-upload",
        "tagName": "snice-file-upload",
        "family": "file-upload",
        "componentModulePath": "snice/components/file-upload/snice-file-upload",
        "properties": [
          "size",
          "variant",
          "accept",
          "multiple",
          "disabled",
          "required",
          "invalid",
          "label",
          "helperText",
          "errorText",
          "maxSize",
          "maxFiles",
          "name",
          "dragDrop",
          "showPreview"
        ],
        "events": {
          "file-upload-change": "onFileUploadChange",
          "file-upload-error": "onFileUploadError"
        },
        "interfaceProps": [
          "size",
          "variant",
          "accept",
          "multiple",
          "disabled",
          "required",
          "invalid",
          "label",
          "helperText",
          "errorText",
          "maxSize",
          "maxFiles",
          "name",
          "dragDrop",
          "showPreview",
          "onFileUploadChange",
          "onFileUploadError"
        ],
        "formAssociated": true
      },
      "FlipCard": {
        "exportName": "FlipCard",
        "module": "snice/react/flip-card",
        "tagName": "snice-flip-card",
        "family": "flip-card",
        "componentModulePath": "snice/components/flip-card/snice-flip-card",
        "properties": [
          "flipped",
          "clickToFlip",
          "direction",
          "duration"
        ],
        "events": {
          "flip-change": "onFlipChange"
        },
        "interfaceProps": [
          "flipped",
          "clickToFlip",
          "direction",
          "duration",
          "onFlipChange"
        ],
        "formAssociated": false
      },
      "Flow": {
        "exportName": "Flow",
        "module": "snice/react/flow",
        "tagName": "snice-flow",
        "family": "flow",
        "componentModulePath": "snice/components/flow/snice-flow",
        "properties": [
          "nodes",
          "edges",
          "snapToGrid",
          "gridSize",
          "zoomEnabled",
          "panEnabled",
          "minimap",
          "editable"
        ],
        "events": {
          "node-drag": "onNodeDrag",
          "node-select": "onNodeSelect",
          "edge-connect": "onEdgeConnect",
          "edge-disconnect": "onEdgeDisconnect",
          "canvas-click": "onCanvasClick"
        },
        "interfaceProps": [
          "nodes",
          "edges",
          "snapToGrid",
          "gridSize",
          "zoomEnabled",
          "panEnabled",
          "minimap",
          "editable",
          "onNodeDrag",
          "onNodeSelect",
          "onEdgeConnect",
          "onEdgeDisconnect",
          "onCanvasClick"
        ],
        "formAssociated": false
      },
      "FormLayout": {
        "exportName": "FormLayout",
        "module": "snice/react/form-layout",
        "tagName": "snice-form-layout",
        "family": "form-layout",
        "componentModulePath": "snice/components/form-layout/snice-form-layout",
        "properties": [
          "columns",
          "labelPosition",
          "labelWidth",
          "gap",
          "variant"
        ],
        "events": {},
        "interfaceProps": [
          "columns",
          "labelPosition",
          "labelWidth",
          "gap",
          "variant"
        ],
        "formAssociated": false
      },
      "Funnel": {
        "exportName": "Funnel",
        "module": "snice/react/funnel",
        "tagName": "snice-funnel",
        "family": "funnel",
        "componentModulePath": "snice/components/funnel/snice-funnel",
        "properties": [
          "data",
          "variant",
          "orientation",
          "showLabels",
          "showValues",
          "showPercentages",
          "animation"
        ],
        "events": {
          "funnel-click": "onFunnelClick",
          "funnel-hover": "onFunnelHover"
        },
        "interfaceProps": [
          "data",
          "variant",
          "orientation",
          "showLabels",
          "showValues",
          "showPercentages",
          "animation",
          "onFunnelClick",
          "onFunnelHover"
        ],
        "formAssociated": false
      },
      "Gantt": {
        "exportName": "Gantt",
        "module": "snice/react/gantt",
        "tagName": "snice-gantt",
        "family": "gantt",
        "componentModulePath": "snice/components/gantt/snice-gantt",
        "properties": [
          "tasks",
          "zoom",
          "showDependencies"
        ],
        "events": {
          "task-click": "onTaskClick",
          "task-resize": "onTaskResize",
          "task-move": "onTaskMove",
          "task-link": "onTaskLink"
        },
        "interfaceProps": [
          "tasks",
          "zoom",
          "showDependencies",
          "onTaskClick",
          "onTaskResize",
          "onTaskMove",
          "onTaskLink"
        ],
        "formAssociated": false
      },
      "Gauge": {
        "exportName": "Gauge",
        "module": "snice/react/gauge",
        "tagName": "snice-gauge",
        "family": "gauge",
        "componentModulePath": "snice/components/gauge/snice-gauge",
        "properties": [
          "value",
          "min",
          "max",
          "label",
          "variant",
          "size",
          "showValue",
          "thickness"
        ],
        "events": {},
        "interfaceProps": [
          "value",
          "min",
          "max",
          "label",
          "variant",
          "size",
          "showValue",
          "thickness"
        ],
        "formAssociated": false
      },
      "Grid": {
        "exportName": "Grid",
        "module": "snice/react/grid",
        "tagName": "snice-grid",
        "family": "grid",
        "componentModulePath": "snice/components/grid/snice-grid",
        "properties": [
          "gap",
          "columnWidth",
          "rowHeight",
          "columns",
          "rows",
          "originLeft",
          "originTop",
          "transitionDuration",
          "stagger",
          "resize",
          "draggable",
          "dragThrottle"
        ],
        "events": {
          "grid-layout-complete": "onGridLayoutComplete",
          "grid-drag-item-positioned": "onGridDragItemPositioned"
        },
        "interfaceProps": [
          "gap",
          "columnWidth",
          "rowHeight",
          "columns",
          "rows",
          "originLeft",
          "originTop",
          "transitionDuration",
          "stagger",
          "resize",
          "draggable",
          "dragThrottle",
          "onGridLayoutComplete",
          "onGridDragItemPositioned"
        ],
        "formAssociated": false
      },
      "Header": {
        "exportName": "Header",
        "module": "snice/react/header",
        "tagName": "snice-header",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-header",
        "properties": [
          "sticky",
          "columns",
          "selectable",
          "sortable",
          "currentSort",
          "allSelected",
          "someSelected"
        ],
        "events": {
          "header-sort": "onHeaderSort",
          "header-select-all": "onHeaderSelectAll",
          "header-filter": "onHeaderFilter"
        },
        "interfaceProps": [
          "sticky",
          "columns",
          "selectable",
          "sortable",
          "currentSort",
          "allSelected",
          "someSelected",
          "onHeaderSort",
          "onHeaderSelectAll",
          "onHeaderFilter"
        ],
        "formAssociated": false
      },
      "Heatmap": {
        "exportName": "Heatmap",
        "module": "snice/react/heatmap",
        "tagName": "snice-heatmap",
        "family": "heatmap",
        "componentModulePath": "snice/components/heatmap/snice-heatmap",
        "properties": [
          "data",
          "colorScheme",
          "showLabels",
          "cellSize",
          "cellGap",
          "showTooltip",
          "weeks"
        ],
        "events": {
          "cell-click": "onCellClick"
        },
        "interfaceProps": [
          "data",
          "colorScheme",
          "showLabels",
          "cellSize",
          "cellGap",
          "showTooltip",
          "weeks",
          "onCellClick"
        ],
        "formAssociated": false
      },
      "Image": {
        "exportName": "Image",
        "module": "snice/react/image",
        "tagName": "snice-image",
        "family": "image",
        "componentModulePath": "snice/components/image/snice-image",
        "properties": [
          "src",
          "alt",
          "fallback",
          "placeholder",
          "srcset",
          "sizes",
          "variant",
          "size",
          "lazy",
          "fit",
          "width",
          "height"
        ],
        "events": {},
        "interfaceProps": [
          "src",
          "alt",
          "fallback",
          "placeholder",
          "srcset",
          "sizes",
          "variant",
          "size",
          "lazy",
          "fit",
          "width",
          "height"
        ],
        "formAssociated": false
      },
      "Input": {
        "exportName": "Input",
        "module": "snice/react/input",
        "tagName": "snice-input",
        "family": "input",
        "componentModulePath": "snice/components/input/snice-input",
        "properties": [
          "defaultValue",
          "type",
          "size",
          "variant",
          "placeholder",
          "label",
          "helperText",
          "errorText",
          "disabled",
          "readonly",
          "loading",
          "required",
          "invalid",
          "clearable",
          "password",
          "min",
          "max",
          "step",
          "pattern",
          "maxlength",
          "minlength",
          "autocomplete",
          "name",
          "align",
          "labelAlign",
          "stretch",
          "prefixIcon",
          "suffixIcon",
          "value"
        ],
        "events": {
          "input-input": "onInputInput",
          "input-change": "onInputChange",
          "input-focus": "onInputFocus",
          "input-blur": "onInputBlur",
          "input-clear": "onInputClear"
        },
        "interfaceProps": [
          "defaultValue",
          "type",
          "size",
          "variant",
          "placeholder",
          "label",
          "helperText",
          "errorText",
          "disabled",
          "readonly",
          "loading",
          "required",
          "invalid",
          "clearable",
          "password",
          "min",
          "max",
          "step",
          "pattern",
          "maxlength",
          "minlength",
          "autocomplete",
          "name",
          "align",
          "labelAlign",
          "stretch",
          "prefixIcon",
          "suffixIcon",
          "value",
          "onInputInput",
          "onInputChange",
          "onInputFocus",
          "onInputBlur",
          "onInputClear"
        ],
        "formAssociated": true
      },
      "Invoice": {
        "exportName": "Invoice",
        "module": "snice/react/invoice",
        "tagName": "snice-invoice",
        "family": "invoice",
        "componentModulePath": "snice/components/invoice/snice-invoice",
        "properties": [
          "invoiceNumber",
          "date",
          "dueDate",
          "status",
          "currency",
          "taxRate",
          "discount",
          "from",
          "to",
          "items",
          "notes",
          "variant",
          "showQr",
          "qrData",
          "qrPosition"
        ],
        "events": {
          "invoice-item-change": "onInvoiceItemChange",
          "invoice-status-change": "onInvoiceStatusChange"
        },
        "interfaceProps": [
          "invoiceNumber",
          "date",
          "dueDate",
          "status",
          "currency",
          "taxRate",
          "discount",
          "from",
          "to",
          "items",
          "notes",
          "variant",
          "showQr",
          "qrData",
          "qrPosition",
          "onInvoiceItemChange",
          "onInvoiceStatusChange"
        ],
        "formAssociated": false
      },
      "Kanban": {
        "exportName": "Kanban",
        "module": "snice/react/kanban",
        "tagName": "snice-kanban",
        "family": "kanban",
        "componentModulePath": "snice/components/kanban/snice-kanban",
        "properties": [
          "columns",
          "allowDragDrop",
          "showCardCount"
        ],
        "events": {
          "kanban-card-move": "onKanbanCardMove",
          "kanban-card-click": "onKanbanCardClick"
        },
        "interfaceProps": [
          "columns",
          "allowDragDrop",
          "showCardCount",
          "onKanbanCardMove",
          "onKanbanCardClick"
        ],
        "formAssociated": false
      },
      "KeyValue": {
        "exportName": "KeyValue",
        "module": "snice/react/key-value",
        "tagName": "snice-key-value",
        "family": "key-value",
        "componentModulePath": "snice/components/key-value/snice-key-value",
        "properties": [
          "label",
          "autoExpand",
          "rows",
          "showDescription",
          "keyPlaceholder",
          "valuePlaceholder",
          "disabled",
          "readonly",
          "required",
          "name",
          "variant",
          "mode",
          "showCopy",
          "defaultValue",
          "placeholders",
          "value"
        ],
        "events": {
          "kv-add": "onKvAdd",
          "kv-remove": "onKvRemove",
          "kv-change": "onKvChange",
          "kv-copy": "onKvCopy"
        },
        "interfaceProps": [
          "label",
          "autoExpand",
          "rows",
          "showDescription",
          "keyPlaceholder",
          "valuePlaceholder",
          "disabled",
          "readonly",
          "required",
          "name",
          "variant",
          "mode",
          "showCopy",
          "defaultValue",
          "placeholders",
          "value",
          "onKvAdd",
          "onKvRemove",
          "onKvChange",
          "onKvCopy"
        ],
        "formAssociated": true
      },
      "Kpi": {
        "exportName": "Kpi",
        "module": "snice/react/kpi",
        "tagName": "snice-kpi",
        "family": "kpi",
        "componentModulePath": "snice/components/kpi/snice-kpi",
        "properties": [
          "label",
          "value",
          "trendValue",
          "trendData",
          "sentiment",
          "size",
          "showSparkline",
          "colorValue"
        ],
        "events": {},
        "interfaceProps": [
          "label",
          "value",
          "trendValue",
          "trendData",
          "sentiment",
          "size",
          "showSparkline",
          "colorValue"
        ],
        "formAssociated": false
      },
      "KvPair": {
        "exportName": "KvPair",
        "module": "snice/react/kv-pair",
        "tagName": "snice-kv-pair",
        "family": "key-value",
        "componentModulePath": "snice/components/key-value/snice-kv-pair",
        "properties": [
          "key",
          "value",
          "description"
        ],
        "events": {},
        "interfaceProps": [
          "key",
          "value",
          "description"
        ],
        "formAssociated": false
      },
      "Layout": {
        "exportName": "Layout",
        "module": "snice/react/layout",
        "tagName": "snice-layout",
        "family": "layout",
        "componentModulePath": "snice/components/layout/snice-layout",
        "properties": [],
        "events": {},
        "interfaceProps": [],
        "formAssociated": false
      },
      "LayoutAuthSplit": {
        "exportName": "LayoutAuthSplit",
        "module": "snice/react/layout-auth-split",
        "tagName": "snice-layout-auth-split",
        "family": "layout",
        "componentModulePath": "snice/components/layout/snice-layout-auth-split",
        "properties": [
          "panelPosition",
          "contained"
        ],
        "events": {},
        "interfaceProps": [
          "panelPosition",
          "contained"
        ],
        "formAssociated": false
      },
      "LayoutBlog": {
        "exportName": "LayoutBlog",
        "module": "snice/react/layout-blog",
        "tagName": "snice-layout-blog",
        "family": "layout",
        "componentModulePath": "snice/components/layout/snice-layout-blog",
        "properties": [
          "useNav",
          "hasSidebar"
        ],
        "events": {},
        "interfaceProps": [
          "useNav",
          "hasSidebar"
        ],
        "formAssociated": false
      },
      "LayoutCard": {
        "exportName": "LayoutCard",
        "module": "snice/react/layout-card",
        "tagName": "snice-layout-card",
        "family": "layout",
        "componentModulePath": "snice/components/layout/snice-layout-card",
        "properties": [
          "columns",
          "gap",
          "hasFooter",
          "hasHeader"
        ],
        "events": {},
        "interfaceProps": [
          "columns",
          "gap",
          "hasFooter",
          "hasHeader"
        ],
        "formAssociated": false
      },
      "LayoutCentered": {
        "exportName": "LayoutCentered",
        "module": "snice/react/layout-centered",
        "tagName": "snice-layout-centered",
        "family": "layout",
        "componentModulePath": "snice/components/layout/snice-layout-centered",
        "properties": [
          "width",
          "hasBrand",
          "hasFooter"
        ],
        "events": {},
        "interfaceProps": [
          "width",
          "hasBrand",
          "hasFooter"
        ],
        "formAssociated": false
      },
      "LayoutDashboard": {
        "exportName": "LayoutDashboard",
        "module": "snice/react/layout-dashboard",
        "tagName": "snice-layout-dashboard",
        "family": "layout",
        "componentModulePath": "snice/components/layout/snice-layout-dashboard",
        "properties": [
          "collapsed",
          "contained",
          "mobileOpen",
          "hasRail",
          "hasToolbarContent"
        ],
        "events": {},
        "interfaceProps": [
          "collapsed",
          "contained",
          "mobileOpen",
          "hasRail",
          "hasToolbarContent"
        ],
        "formAssociated": false
      },
      "LayoutDocs": {
        "exportName": "LayoutDocs",
        "module": "snice/react/layout-docs",
        "tagName": "snice-layout-docs",
        "family": "layout",
        "componentModulePath": "snice/components/layout/snice-layout-docs",
        "properties": [
          "sidebarOpen",
          "contained"
        ],
        "events": {},
        "interfaceProps": [
          "sidebarOpen",
          "contained"
        ],
        "formAssociated": false
      },
      "LayoutFullscreen": {
        "exportName": "LayoutFullscreen",
        "module": "snice/react/layout-fullscreen",
        "tagName": "snice-layout-fullscreen",
        "family": "layout",
        "componentModulePath": "snice/components/layout/snice-layout-fullscreen",
        "properties": [
          "overlay",
          "contained"
        ],
        "events": {},
        "interfaceProps": [
          "overlay",
          "contained"
        ],
        "formAssociated": false
      },
      "LayoutLanding": {
        "exportName": "LayoutLanding",
        "module": "snice/react/layout-landing",
        "tagName": "snice-layout-landing",
        "family": "layout",
        "componentModulePath": "snice/components/layout/snice-layout-landing",
        "properties": [
          "useNav"
        ],
        "events": {},
        "interfaceProps": [
          "useNav"
        ],
        "formAssociated": false
      },
      "LayoutMasterDetail": {
        "exportName": "LayoutMasterDetail",
        "module": "snice/react/layout-master-detail",
        "tagName": "snice-layout-master-detail",
        "family": "layout",
        "componentModulePath": "snice/components/layout/snice-layout-master-detail",
        "properties": [
          "selected",
          "contained"
        ],
        "events": {
          "detail-closed": "onDetailClosed"
        },
        "interfaceProps": [
          "selected",
          "contained",
          "onDetailClosed"
        ],
        "formAssociated": false
      },
      "LayoutMinimal": {
        "exportName": "LayoutMinimal",
        "module": "snice/react/layout-minimal",
        "tagName": "snice-layout-minimal",
        "family": "layout",
        "componentModulePath": "snice/components/layout/snice-layout-minimal",
        "properties": [],
        "events": {},
        "interfaceProps": [],
        "formAssociated": false
      },
      "LayoutSidebar": {
        "exportName": "LayoutSidebar",
        "module": "snice/react/layout-sidebar",
        "tagName": "snice-layout-sidebar",
        "family": "layout",
        "componentModulePath": "snice/components/layout/snice-layout-sidebar",
        "properties": [
          "collapsed",
          "contained",
          "collapseMode",
          "mobileOpen"
        ],
        "events": {},
        "interfaceProps": [
          "collapsed",
          "contained",
          "collapseMode",
          "mobileOpen"
        ],
        "formAssociated": false
      },
      "LayoutSplit": {
        "exportName": "LayoutSplit",
        "module": "snice/react/layout-split",
        "tagName": "snice-layout-split",
        "family": "layout",
        "componentModulePath": "snice/components/layout/snice-layout-split",
        "properties": [
          "direction",
          "ratio"
        ],
        "events": {},
        "interfaceProps": [
          "direction",
          "ratio"
        ],
        "formAssociated": false
      },
      "Leaderboard": {
        "exportName": "Leaderboard",
        "module": "snice/react/leaderboard",
        "tagName": "snice-leaderboard",
        "family": "leaderboard",
        "componentModulePath": "snice/components/leaderboard/snice-leaderboard",
        "properties": [
          "variant",
          "size",
          "title"
        ],
        "events": {
          "entry-click": "onEntryClick"
        },
        "interfaceProps": [
          "variant",
          "size",
          "title",
          "onEntryClick"
        ],
        "formAssociated": false
      },
      "LeaderboardEntry": {
        "exportName": "LeaderboardEntry",
        "module": "snice/react/leaderboard-entry",
        "tagName": "snice-leaderboard-entry",
        "family": "leaderboard",
        "componentModulePath": "snice/components/leaderboard/snice-leaderboard-entry",
        "properties": [
          "rank",
          "name",
          "score",
          "avatar",
          "change",
          "highlighted"
        ],
        "events": {},
        "interfaceProps": [
          "rank",
          "name",
          "score",
          "avatar",
          "change",
          "highlighted"
        ],
        "formAssociated": false
      },
      "Link": {
        "exportName": "Link",
        "module": "snice/react/link",
        "tagName": "snice-link",
        "family": "link",
        "componentModulePath": "snice/components/link/snice-link",
        "properties": [
          "href",
          "target",
          "variant",
          "disabled",
          "external",
          "underline",
          "hash"
        ],
        "events": {},
        "interfaceProps": [
          "href",
          "target",
          "variant",
          "disabled",
          "external",
          "underline",
          "hash"
        ],
        "formAssociated": false
      },
      "LinkPreview": {
        "exportName": "LinkPreview",
        "module": "snice/react/link-preview",
        "tagName": "snice-link-preview",
        "family": "link-preview",
        "componentModulePath": "snice/components/link-preview/snice-link-preview",
        "properties": [
          "url",
          "title",
          "description",
          "image",
          "siteName",
          "favicon",
          "variant",
          "size"
        ],
        "events": {
          "link-click": "onLinkClick"
        },
        "interfaceProps": [
          "url",
          "title",
          "description",
          "image",
          "siteName",
          "favicon",
          "variant",
          "size",
          "onLinkClick"
        ],
        "formAssociated": false
      },
      "List": {
        "exportName": "List",
        "module": "snice/react/list",
        "tagName": "snice-list",
        "family": "list",
        "componentModulePath": "snice/components/list/snice-list",
        "properties": [
          "dividers",
          "searchable",
          "search",
          "infinite",
          "loading",
          "noResults",
          "threshold",
          "skeletonCount"
        ],
        "events": {},
        "interfaceProps": [
          "dividers",
          "searchable",
          "search",
          "infinite",
          "loading",
          "noResults",
          "threshold",
          "skeletonCount"
        ],
        "formAssociated": false
      },
      "ListItem": {
        "exportName": "ListItem",
        "module": "snice/react/list-item",
        "tagName": "snice-list-item",
        "family": "list",
        "componentModulePath": "snice/components/list/snice-list-item",
        "properties": [
          "heading",
          "description",
          "selected",
          "disabled"
        ],
        "events": {},
        "interfaceProps": [
          "heading",
          "description",
          "selected",
          "disabled"
        ],
        "formAssociated": false
      },
      "Location": {
        "exportName": "Location",
        "module": "snice/react/location",
        "tagName": "snice-location",
        "family": "location",
        "componentModulePath": "snice/components/location/snice-location",
        "properties": [
          "mode",
          "name",
          "address",
          "city",
          "state",
          "country",
          "zipCode",
          "latitude",
          "longitude",
          "showMap",
          "showIcon",
          "icon",
          "iconImage",
          "mapUrl",
          "clickable"
        ],
        "events": {
          "location-click": "onLocationClick"
        },
        "interfaceProps": [
          "mode",
          "name",
          "address",
          "city",
          "state",
          "country",
          "zipCode",
          "latitude",
          "longitude",
          "showMap",
          "showIcon",
          "icon",
          "iconImage",
          "mapUrl",
          "clickable",
          "onLocationClick"
        ],
        "formAssociated": false
      },
      "Login": {
        "exportName": "Login",
        "module": "snice/react/login",
        "tagName": "snice-login",
        "family": "login",
        "componentModulePath": "snice/components/login/snice-login",
        "properties": [
          "variant",
          "size",
          "title",
          "disabled",
          "loading",
          "showRememberMe",
          "showForgotPassword",
          "actionText",
          "alertMessage",
          "alertVariant"
        ],
        "events": {
          "login-attempt": "onLoginAttempt",
          "login-forgot-password": "onLoginForgotPassword",
          "login-success": "onLoginSuccess",
          "login-error": "onLoginError"
        },
        "interfaceProps": [
          "variant",
          "size",
          "title",
          "disabled",
          "loading",
          "showRememberMe",
          "showForgotPassword",
          "actionText",
          "alertMessage",
          "alertVariant",
          "onLoginAttempt",
          "onLoginForgotPassword",
          "onLoginSuccess",
          "onLoginError"
        ],
        "formAssociated": false
      },
      "Map": {
        "exportName": "Map",
        "module": "snice/react/map",
        "tagName": "snice-map",
        "family": "map",
        "componentModulePath": "snice/components/map/snice-map",
        "properties": [
          "center",
          "zoom",
          "minZoom",
          "maxZoom",
          "markers",
          "tileUrl"
        ],
        "events": {
          "map-click": "onMapClick",
          "marker-click": "onMarkerClick",
          "map-move": "onMapMove",
          "map-zoom": "onMapZoom"
        },
        "interfaceProps": [
          "center",
          "zoom",
          "minZoom",
          "maxZoom",
          "markers",
          "tileUrl",
          "onMapClick",
          "onMarkerClick",
          "onMapMove",
          "onMapZoom"
        ],
        "formAssociated": false
      },
      "Markdown": {
        "exportName": "Markdown",
        "module": "snice/react/markdown",
        "tagName": "snice-markdown",
        "family": "markdown",
        "componentModulePath": "snice/components/markdown/snice-markdown",
        "properties": [
          "content",
          "sanitize",
          "theme"
        ],
        "events": {
          "markdown-render": "onMarkdownRender",
          "link-click": "onLinkClick"
        },
        "interfaceProps": [
          "content",
          "sanitize",
          "theme",
          "onMarkdownRender",
          "onLinkClick"
        ],
        "formAssociated": false
      },
      "Masonry": {
        "exportName": "Masonry",
        "module": "snice/react/masonry",
        "tagName": "snice-masonry",
        "family": "masonry",
        "componentModulePath": "snice/components/masonry/snice-masonry",
        "properties": [
          "columns",
          "gap",
          "minColumnWidth"
        ],
        "events": {},
        "interfaceProps": [
          "columns",
          "gap",
          "minColumnWidth"
        ],
        "formAssociated": false
      },
      "Menu": {
        "exportName": "Menu",
        "module": "snice/react/menu",
        "tagName": "snice-menu",
        "family": "menu",
        "componentModulePath": "snice/components/menu/snice-menu",
        "properties": [
          "open",
          "placement",
          "trigger",
          "closeOnSelect",
          "distance"
        ],
        "events": {
          "menu-open": "onMenuOpen",
          "menu-close": "onMenuClose"
        },
        "interfaceProps": [
          "open",
          "placement",
          "trigger",
          "closeOnSelect",
          "distance",
          "onMenuOpen",
          "onMenuClose"
        ],
        "formAssociated": false
      },
      "MenuDivider": {
        "exportName": "MenuDivider",
        "module": "snice/react/menu-divider",
        "tagName": "snice-menu-divider",
        "family": "menu",
        "componentModulePath": "snice/components/menu/snice-menu-divider",
        "properties": [],
        "events": {},
        "interfaceProps": [],
        "formAssociated": false
      },
      "MenuItem": {
        "exportName": "MenuItem",
        "module": "snice/react/menu-item",
        "tagName": "snice-menu-item",
        "family": "menu",
        "componentModulePath": "snice/components/menu/snice-menu-item",
        "properties": [
          "disabled",
          "value",
          "selected"
        ],
        "events": {
          "menu-item-select": "onMenuItemSelect"
        },
        "interfaceProps": [
          "disabled",
          "value",
          "selected",
          "onMenuItemSelect"
        ],
        "formAssociated": false
      },
      "MessageStrip": {
        "exportName": "MessageStrip",
        "module": "snice/react/message-strip",
        "tagName": "snice-message-strip",
        "family": "message-strip",
        "componentModulePath": "snice/components/message-strip/snice-message-strip",
        "properties": [
          "variant",
          "dismissible",
          "icon"
        ],
        "events": {
          "dismiss": "onDismiss"
        },
        "interfaceProps": [
          "variant",
          "dismissible",
          "icon",
          "onDismiss"
        ],
        "formAssociated": false
      },
      "Modal": {
        "exportName": "Modal",
        "module": "snice/react/modal",
        "tagName": "snice-modal",
        "family": "modal",
        "componentModulePath": "snice/components/modal/snice-modal",
        "properties": [
          "open",
          "size",
          "noBackdropDismiss",
          "noEscapeDismiss",
          "noFocusTrap",
          "noCloseButton",
          "noHeader",
          "noFooter",
          "label"
        ],
        "events": {
          "modal-open": "onModalOpen",
          "modal-close": "onModalClose"
        },
        "interfaceProps": [
          "open",
          "size",
          "noBackdropDismiss",
          "noEscapeDismiss",
          "noFocusTrap",
          "noCloseButton",
          "noHeader",
          "noFooter",
          "label",
          "onModalOpen",
          "onModalClose"
        ],
        "formAssociated": false
      },
      "MusicPlayer": {
        "exportName": "MusicPlayer",
        "module": "snice/react/music-player",
        "tagName": "snice-music-player",
        "family": "music-player",
        "componentModulePath": "snice/components/music-player/snice-music-player",
        "properties": [
          "tracks",
          "currentTrackIndex",
          "currentTrack",
          "currentTime",
          "duration",
          "volume",
          "muted",
          "shuffle",
          "repeat",
          "state",
          "autoplay",
          "showPlaylist",
          "showControls",
          "showVolume",
          "showArtwork",
          "showTrackInfo",
          "compact"
        ],
        "events": {
          "player-play": "onPlayerPlay",
          "player-pause": "onPlayerPause",
          "player-stop": "onPlayerStop",
          "player-track-change": "onPlayerTrackChange",
          "player-track-ended": "onPlayerTrackEnded",
          "player-seek": "onPlayerSeek",
          "player-volume-change": "onPlayerVolumeChange",
          "player-shuffle-change": "onPlayerShuffleChange",
          "player-repeat-change": "onPlayerRepeatChange",
          "player-time-update": "onPlayerTimeUpdate",
          "player-error": "onPlayerError"
        },
        "interfaceProps": [
          "tracks",
          "currentTrackIndex",
          "currentTrack",
          "currentTime",
          "duration",
          "volume",
          "muted",
          "shuffle",
          "repeat",
          "state",
          "autoplay",
          "showPlaylist",
          "showControls",
          "showVolume",
          "showArtwork",
          "showTrackInfo",
          "compact",
          "onPlayerPlay",
          "onPlayerPause",
          "onPlayerStop",
          "onPlayerTrackChange",
          "onPlayerTrackEnded",
          "onPlayerSeek",
          "onPlayerVolumeChange",
          "onPlayerShuffleChange",
          "onPlayerRepeatChange",
          "onPlayerTimeUpdate",
          "onPlayerError"
        ],
        "formAssociated": false
      },
      "Nav": {
        "exportName": "Nav",
        "module": "snice/react/nav",
        "tagName": "snice-nav",
        "family": "nav",
        "componentModulePath": "snice/components/nav/snice-nav",
        "properties": [
          "variant",
          "orientation",
          "activeStyle",
          "isTopLevel"
        ],
        "events": {},
        "interfaceProps": [
          "variant",
          "orientation",
          "activeStyle",
          "isTopLevel"
        ],
        "formAssociated": false
      },
      "NetworkGraph": {
        "exportName": "NetworkGraph",
        "module": "snice/react/network-graph",
        "tagName": "snice-network-graph",
        "family": "network-graph",
        "componentModulePath": "snice/components/network-graph/snice-network-graph",
        "properties": [
          "data",
          "layout",
          "chargeStrength",
          "linkDistance",
          "zoomEnabled",
          "dragEnabled",
          "showLabels",
          "animation"
        ],
        "events": {
          "node-click": "onNodeClick",
          "edge-click": "onEdgeClick",
          "node-drag": "onNodeDrag",
          "graph-zoom": "onGraphZoom"
        },
        "interfaceProps": [
          "data",
          "layout",
          "chargeStrength",
          "linkDistance",
          "zoomEnabled",
          "dragEnabled",
          "showLabels",
          "animation",
          "onNodeClick",
          "onEdgeClick",
          "onNodeDrag",
          "onGraphZoom"
        ],
        "formAssociated": false
      },
      "NotificationCenter": {
        "exportName": "NotificationCenter",
        "module": "snice/react/notification-center",
        "tagName": "snice-notification-center",
        "family": "notification-center",
        "componentModulePath": "snice/components/notification-center/snice-notification-center",
        "properties": [
          "notifications",
          "open",
          "placement",
          "icon"
        ],
        "events": {
          "notification-click": "onNotificationClick",
          "notification-dismiss": "onNotificationDismiss",
          "notification-read-all": "onNotificationReadAll"
        },
        "interfaceProps": [
          "notifications",
          "open",
          "placement",
          "icon",
          "onNotificationClick",
          "onNotificationDismiss",
          "onNotificationReadAll"
        ],
        "formAssociated": false
      },
      "Option": {
        "exportName": "Option",
        "module": "snice/react/option",
        "tagName": "snice-option",
        "family": "select",
        "componentModulePath": "snice/components/select/snice-option",
        "properties": [
          "value",
          "label",
          "disabled",
          "selected",
          "icon"
        ],
        "events": {},
        "interfaceProps": [
          "value",
          "label",
          "disabled",
          "selected",
          "icon"
        ],
        "formAssociated": false
      },
      "OrderTracker": {
        "exportName": "OrderTracker",
        "module": "snice/react/order-tracker",
        "tagName": "snice-order-tracker",
        "family": "order-tracker",
        "componentModulePath": "snice/components/order-tracker/snice-order-tracker",
        "properties": [
          "steps",
          "trackingNumber",
          "carrier",
          "variant"
        ],
        "events": {
          "step-click": "onStepClick"
        },
        "interfaceProps": [
          "steps",
          "trackingNumber",
          "carrier",
          "variant",
          "onStepClick"
        ],
        "formAssociated": false
      },
      "OrgChart": {
        "exportName": "OrgChart",
        "module": "snice/react/org-chart",
        "tagName": "snice-org-chart",
        "family": "org-chart",
        "componentModulePath": "snice/components/org-chart/snice-org-chart",
        "properties": [
          "data",
          "direction",
          "compact"
        ],
        "events": {
          "node-click": "onNodeClick",
          "node-expand": "onNodeExpand",
          "node-collapse": "onNodeCollapse"
        },
        "interfaceProps": [
          "data",
          "direction",
          "compact",
          "onNodeClick",
          "onNodeExpand",
          "onNodeCollapse"
        ],
        "formAssociated": false
      },
      "Pagination": {
        "exportName": "Pagination",
        "module": "snice/react/pagination",
        "tagName": "snice-pagination",
        "family": "pagination",
        "componentModulePath": "snice/components/pagination/snice-pagination",
        "properties": [
          "current",
          "total",
          "siblings",
          "showFirst",
          "showLast",
          "showPrev",
          "showNext",
          "size",
          "variant"
        ],
        "events": {
          "pagination-change": "onPaginationChange"
        },
        "interfaceProps": [
          "current",
          "total",
          "siblings",
          "showFirst",
          "showLast",
          "showPrev",
          "showNext",
          "size",
          "variant",
          "onPaginationChange"
        ],
        "formAssociated": false
      },
      "Paint": {
        "exportName": "Paint",
        "module": "snice/react/paint",
        "tagName": "snice-paint",
        "family": "paint",
        "componentModulePath": "snice/components/paint/snice-paint",
        "properties": [
          "color",
          "strokeWidth",
          "minStrokeWidth",
          "maxStrokeWidth",
          "controls",
          "backgroundColor",
          "colorSelects",
          "disabled"
        ],
        "events": {
          "color-select": "onColorSelect",
          "paint-start": "onPaintStart",
          "paint-end": "onPaintEnd",
          "paint-clear": "onPaintClear",
          "paint-undo": "onPaintUndo",
          "paint-redo": "onPaintRedo"
        },
        "interfaceProps": [
          "color",
          "strokeWidth",
          "minStrokeWidth",
          "maxStrokeWidth",
          "controls",
          "backgroundColor",
          "colorSelects",
          "disabled",
          "onColorSelect",
          "onPaintStart",
          "onPaintEnd",
          "onPaintClear",
          "onPaintUndo",
          "onPaintRedo"
        ],
        "formAssociated": false
      },
      "PdfViewer": {
        "exportName": "PdfViewer",
        "module": "snice/react/pdf-viewer",
        "tagName": "snice-pdf-viewer",
        "family": "pdf-viewer",
        "componentModulePath": "snice/components/pdf-viewer/snice-pdf-viewer",
        "properties": [
          "src",
          "page",
          "zoom",
          "fit"
        ],
        "events": {
          "page-change": "onPageChange",
          "pdf-loaded": "onPdfLoaded",
          "pdf-error": "onPdfError"
        },
        "interfaceProps": [
          "src",
          "page",
          "zoom",
          "fit",
          "onPageChange",
          "onPdfLoaded",
          "onPdfError"
        ],
        "formAssociated": false
      },
      "PermissionMatrix": {
        "exportName": "PermissionMatrix",
        "module": "snice/react/permission-matrix",
        "tagName": "snice-permission-matrix",
        "family": "permission-matrix",
        "componentModulePath": "snice/components/permission-matrix/snice-permission-matrix",
        "properties": [
          "roles",
          "permissions",
          "matrix",
          "readonly"
        ],
        "events": {
          "permission-toggle": "onPermissionToggle",
          "matrix-change": "onMatrixChange"
        },
        "interfaceProps": [
          "roles",
          "permissions",
          "matrix",
          "readonly",
          "onPermissionToggle",
          "onMatrixChange"
        ],
        "formAssociated": false
      },
      "Plan": {
        "exportName": "Plan",
        "module": "snice/react/plan",
        "tagName": "snice-plan",
        "family": "pricing-table",
        "componentModulePath": "snice/components/pricing-table/snice-pricing-table",
        "properties": [],
        "events": {},
        "interfaceProps": [
          "name",
          "price",
          "annual-price",
          "highlighted",
          "badge",
          "cta",
          "period",
          "currency",
          "description"
        ],
        "formAssociated": false
      },
      "PodcastPlayer": {
        "exportName": "PodcastPlayer",
        "module": "snice/react/podcast-player",
        "tagName": "snice-podcast-player",
        "family": "podcast-player",
        "componentModulePath": "snice/components/podcast-player/snice-podcast-player",
        "properties": [
          "src",
          "fromRss",
          "title",
          "show",
          "artwork",
          "description",
          "playbackRate",
          "skipForward",
          "skipBack",
          "currentTime",
          "duration",
          "volume",
          "muted",
          "episodes",
          "currentEpisodeIndex",
          "sleepTimer",
          "state"
        ],
        "events": {
          "podcast-play": "onPodcastPlay",
          "podcast-pause": "onPodcastPause",
          "podcast-ended": "onPodcastEnded",
          "podcast-time-update": "onPodcastTimeUpdate",
          "podcast-rate-change": "onPodcastRateChange",
          "podcast-episode-change": "onPodcastEpisodeChange",
          "podcast-feed-loaded": "onPodcastFeedLoaded"
        },
        "interfaceProps": [
          "src",
          "fromRss",
          "title",
          "show",
          "artwork",
          "description",
          "playbackRate",
          "skipForward",
          "skipBack",
          "currentTime",
          "duration",
          "volume",
          "muted",
          "episodes",
          "currentEpisodeIndex",
          "sleepTimer",
          "state",
          "onPodcastPlay",
          "onPodcastPause",
          "onPodcastEnded",
          "onPodcastTimeUpdate",
          "onPodcastRateChange",
          "onPodcastEpisodeChange",
          "onPodcastFeedLoaded"
        ],
        "formAssociated": false
      },
      "Popover": {
        "exportName": "Popover",
        "module": "snice/react/popover",
        "tagName": "snice-popover",
        "family": "popover",
        "componentModulePath": "snice/components/popover/snice-popover",
        "properties": [
          "open",
          "placement",
          "distance",
          "noOutsideDismiss",
          "noEscapeDismiss"
        ],
        "events": {
          "popover-open": "onPopoverOpen",
          "popover-close": "onPopoverClose"
        },
        "interfaceProps": [
          "open",
          "placement",
          "distance",
          "noOutsideDismiss",
          "noEscapeDismiss",
          "onPopoverOpen",
          "onPopoverClose"
        ],
        "formAssociated": false
      },
      "PricingTable": {
        "exportName": "PricingTable",
        "module": "snice/react/pricing-table",
        "tagName": "snice-pricing-table",
        "family": "pricing-table",
        "componentModulePath": "snice/components/pricing-table/snice-pricing-table",
        "properties": [
          "plans",
          "variant",
          "annual"
        ],
        "events": {
          "plan-select": "onPlanSelect"
        },
        "interfaceProps": [
          "plans",
          "variant",
          "annual",
          "onPlanSelect"
        ],
        "formAssociated": false
      },
      "ProductCard": {
        "exportName": "ProductCard",
        "module": "snice/react/product-card",
        "tagName": "snice-product-card",
        "family": "product-card",
        "componentModulePath": "snice/components/product-card/snice-product-card",
        "properties": [
          "name",
          "price",
          "salePrice",
          "currency",
          "images",
          "rating",
          "reviewCount",
          "variants",
          "inStock",
          "variant",
          "badge",
          "badgeVariant",
          "loading",
          "favorite",
          "stockCount"
        ],
        "events": {
          "add-to-cart": "onAddToCart",
          "variant-select": "onVariantSelect",
          "image-click": "onImageClick",
          "favorite": "onFavorite",
          "quick-view": "onQuickView"
        },
        "interfaceProps": [
          "name",
          "price",
          "salePrice",
          "currency",
          "images",
          "rating",
          "reviewCount",
          "variants",
          "inStock",
          "variant",
          "badge",
          "badgeVariant",
          "loading",
          "favorite",
          "stockCount",
          "onAddToCart",
          "onVariantSelect",
          "onImageClick",
          "onFavorite",
          "onQuickView"
        ],
        "formAssociated": false
      },
      "Progress": {
        "exportName": "Progress",
        "module": "snice/react/progress",
        "tagName": "snice-progress",
        "family": "progress",
        "componentModulePath": "snice/components/progress/snice-progress",
        "properties": [
          "value",
          "max",
          "variant",
          "size",
          "color",
          "indeterminate",
          "showLabel",
          "label",
          "striped",
          "animated",
          "thickness"
        ],
        "events": {
          "progress-change": "onProgressChange"
        },
        "interfaceProps": [
          "value",
          "max",
          "variant",
          "size",
          "color",
          "indeterminate",
          "showLabel",
          "label",
          "striped",
          "animated",
          "thickness",
          "onProgressChange"
        ],
        "formAssociated": false
      },
      "ProgressRing": {
        "exportName": "ProgressRing",
        "module": "snice/react/progress-ring",
        "tagName": "snice-progress-ring",
        "family": "progress-ring",
        "componentModulePath": "snice/components/progress-ring/snice-progress-ring",
        "properties": [
          "value",
          "max",
          "size",
          "thickness",
          "color",
          "showValue",
          "label"
        ],
        "events": {
          "progress-complete": "onProgressComplete"
        },
        "interfaceProps": [
          "value",
          "max",
          "size",
          "thickness",
          "color",
          "showValue",
          "label",
          "onProgressComplete"
        ],
        "formAssociated": false
      },
      "QrCode": {
        "exportName": "QrCode",
        "module": "snice/react/qr-code",
        "tagName": "snice-qr-code",
        "family": "qr-code",
        "componentModulePath": "snice/components/qr-code/snice-qr-code",
        "properties": [
          "value",
          "size",
          "errorCorrectionLevel",
          "renderMode",
          "dotStyle",
          "margin",
          "fgColor",
          "bgColor",
          "includeImage",
          "imageUrl",
          "imageSize",
          "centerText",
          "centerTextSize",
          "textFillColor",
          "textOutlineColor"
        ],
        "events": {},
        "interfaceProps": [
          "value",
          "size",
          "errorCorrectionLevel",
          "renderMode",
          "dotStyle",
          "margin",
          "fgColor",
          "bgColor",
          "includeImage",
          "imageUrl",
          "imageSize",
          "centerText",
          "centerTextSize",
          "textFillColor",
          "textOutlineColor"
        ],
        "formAssociated": false
      },
      "QrReader": {
        "exportName": "QrReader",
        "module": "snice/react/qr-reader",
        "tagName": "snice-qr-reader",
        "family": "qr-reader",
        "componentModulePath": "snice/components/qr-reader/snice-qr-reader",
        "properties": [
          "autoStart",
          "camera",
          "pickFirst",
          "manualSnap",
          "scanSpeed",
          "tapStart"
        ],
        "events": {
          "qr-scan": "onQrScan",
          "qr-error": "onQrError",
          "camera-ready": "onCameraReady",
          "camera-error": "onCameraError"
        },
        "interfaceProps": [
          "autoStart",
          "camera",
          "pickFirst",
          "manualSnap",
          "scanSpeed",
          "tapStart",
          "onQrScan",
          "onQrError",
          "onCameraReady",
          "onCameraError"
        ],
        "formAssociated": false
      },
      "Radio": {
        "exportName": "Radio",
        "module": "snice/react/radio",
        "tagName": "snice-radio",
        "family": "radio",
        "componentModulePath": "snice/components/radio/snice-radio",
        "properties": [
          "defaultChecked",
          "disabled",
          "loading",
          "required",
          "invalid",
          "variant",
          "size",
          "name",
          "value",
          "label",
          "description",
          "checked"
        ],
        "events": {
          "radio-change": "onRadioChange"
        },
        "interfaceProps": [
          "defaultChecked",
          "disabled",
          "loading",
          "required",
          "invalid",
          "variant",
          "size",
          "name",
          "value",
          "label",
          "description",
          "checked",
          "onRadioChange"
        ],
        "formAssociated": true
      },
      "RangeSlider": {
        "exportName": "RangeSlider",
        "module": "snice/react/range-slider",
        "tagName": "snice-range-slider",
        "family": "range-slider",
        "componentModulePath": "snice/components/range-slider/snice-range-slider",
        "properties": [
          "defaultValueLow",
          "defaultValueHigh",
          "min",
          "max",
          "step",
          "disabled",
          "showTooltip",
          "showLabels",
          "orientation",
          "name",
          "valueLow",
          "valueHigh"
        ],
        "events": {
          "range-change": "onRangeChange"
        },
        "interfaceProps": [
          "defaultValueLow",
          "defaultValueHigh",
          "min",
          "max",
          "step",
          "disabled",
          "showTooltip",
          "showLabels",
          "orientation",
          "name",
          "valueLow",
          "valueHigh",
          "onRangeChange"
        ],
        "formAssociated": true
      },
      "Rating": {
        "exportName": "Rating",
        "module": "snice/react/rating",
        "tagName": "snice-rating",
        "family": "rating",
        "componentModulePath": "snice/components/rating/snice-rating",
        "properties": [
          "value",
          "max",
          "icon",
          "emptyIcon",
          "size",
          "readonly",
          "precision"
        ],
        "events": {
          "rating-change": "onRatingChange"
        },
        "interfaceProps": [
          "value",
          "max",
          "icon",
          "emptyIcon",
          "size",
          "readonly",
          "precision",
          "onRatingChange"
        ],
        "formAssociated": false
      },
      "Receipt": {
        "exportName": "Receipt",
        "module": "snice/react/receipt",
        "tagName": "snice-receipt",
        "family": "receipt",
        "componentModulePath": "snice/components/receipt/snice-receipt",
        "properties": [
          "receiptNumber",
          "date",
          "currency",
          "locale",
          "merchant",
          "items",
          "tax",
          "taxes",
          "subtotal",
          "total",
          "tip",
          "discount",
          "discountLabel",
          "paymentMethod",
          "paymentDetails",
          "variant",
          "showQr",
          "qrData",
          "qrPosition",
          "thankYou",
          "cashier",
          "terminalId"
        ],
        "events": {},
        "interfaceProps": [
          "receiptNumber",
          "date",
          "currency",
          "locale",
          "merchant",
          "items",
          "tax",
          "taxes",
          "subtotal",
          "total",
          "tip",
          "discount",
          "discountLabel",
          "paymentMethod",
          "paymentDetails",
          "variant",
          "showQr",
          "qrData",
          "qrPosition",
          "thankYou",
          "cashier",
          "terminalId"
        ],
        "formAssociated": false
      },
      "Recipe": {
        "exportName": "Recipe",
        "module": "snice/react/recipe",
        "tagName": "snice-recipe",
        "family": "recipe",
        "componentModulePath": "snice/components/recipe/snice-recipe",
        "properties": [
          "title",
          "description",
          "image",
          "author",
          "prepTime",
          "cookTime",
          "servings",
          "difficulty",
          "cuisine",
          "variant",
          "ingredients",
          "steps",
          "nutrition",
          "tags"
        ],
        "events": {
          "recipe-serving-change": "onRecipeServingChange",
          "recipe-step-complete": "onRecipeStepComplete",
          "recipe-ingredient-check": "onRecipeIngredientCheck"
        },
        "interfaceProps": [
          "title",
          "description",
          "image",
          "author",
          "prepTime",
          "cookTime",
          "servings",
          "difficulty",
          "cuisine",
          "variant",
          "ingredients",
          "steps",
          "nutrition",
          "tags",
          "onRecipeServingChange",
          "onRecipeStepComplete",
          "onRecipeIngredientCheck"
        ],
        "formAssociated": false
      },
      "Row": {
        "exportName": "Row",
        "module": "snice/react/row",
        "tagName": "snice-row",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-row",
        "properties": [
          "selected",
          "hoverable",
          "clickable",
          "selectable",
          "selectionDisabled",
          "data",
          "index",
          "columns"
        ],
        "events": {
          "row-click": "onRowClick",
          "row-select": "onRowSelect",
          "row-hover": "onRowHover"
        },
        "interfaceProps": [
          "selected",
          "hoverable",
          "clickable",
          "selectable",
          "selectionDisabled",
          "data",
          "index",
          "columns",
          "onRowClick",
          "onRowSelect",
          "onRowHover"
        ],
        "formAssociated": false
      },
      "Sankey": {
        "exportName": "Sankey",
        "module": "snice/react/sankey",
        "tagName": "snice-sankey",
        "family": "sankey",
        "componentModulePath": "snice/components/sankey/snice-sankey",
        "properties": [
          "data",
          "nodeWidth",
          "nodePadding",
          "alignment",
          "showLabels",
          "showValues",
          "animation"
        ],
        "events": {
          "sankey-node-click": "onSankeyNodeClick",
          "sankey-link-click": "onSankeyLinkClick",
          "sankey-hover": "onSankeyHover"
        },
        "interfaceProps": [
          "data",
          "nodeWidth",
          "nodePadding",
          "alignment",
          "showLabels",
          "showValues",
          "animation",
          "onSankeyNodeClick",
          "onSankeyLinkClick",
          "onSankeyHover"
        ],
        "formAssociated": false
      },
      "SegmentedControl": {
        "exportName": "SegmentedControl",
        "module": "snice/react/segmented-control",
        "tagName": "snice-segmented-control",
        "family": "segmented-control",
        "componentModulePath": "snice/components/segmented-control/snice-segmented-control",
        "properties": [
          "value",
          "options",
          "size",
          "disabled"
        ],
        "events": {
          "value-change": "onValueChange"
        },
        "interfaceProps": [
          "value",
          "options",
          "size",
          "disabled",
          "onValueChange"
        ],
        "formAssociated": false
      },
      "Select": {
        "exportName": "Select",
        "module": "snice/react/select",
        "tagName": "snice-select",
        "family": "select",
        "componentModulePath": "snice/components/select/snice-select",
        "properties": [
          "defaultValue",
          "disabled",
          "required",
          "invalid",
          "readonly",
          "loading",
          "multiple",
          "searchable",
          "clearable",
          "allowFreeText",
          "editable",
          "remote",
          "searchDebounce",
          "open",
          "size",
          "name",
          "label",
          "helperText",
          "errorText",
          "placeholder",
          "maxHeight",
          "options",
          "value"
        ],
        "events": {
          "select-change": "onSelectChange",
          "select-open": "onSelectOpen",
          "select-close": "onSelectClose"
        },
        "interfaceProps": [
          "defaultValue",
          "disabled",
          "required",
          "invalid",
          "readonly",
          "loading",
          "multiple",
          "searchable",
          "clearable",
          "allowFreeText",
          "editable",
          "remote",
          "searchDebounce",
          "open",
          "size",
          "name",
          "label",
          "helperText",
          "errorText",
          "placeholder",
          "maxHeight",
          "options",
          "value",
          "onSelectChange",
          "onSelectOpen",
          "onSelectClose"
        ],
        "formAssociated": true
      },
      "Skeleton": {
        "exportName": "Skeleton",
        "module": "snice/react/skeleton",
        "tagName": "snice-skeleton",
        "family": "skeleton",
        "componentModulePath": "snice/components/skeleton/snice-skeleton",
        "properties": [
          "variant",
          "width",
          "height",
          "animation",
          "count",
          "spacing"
        ],
        "events": {},
        "interfaceProps": [
          "variant",
          "width",
          "height",
          "animation",
          "count",
          "spacing"
        ],
        "formAssociated": false
      },
      "Slider": {
        "exportName": "Slider",
        "module": "snice/react/slider",
        "tagName": "snice-slider",
        "family": "slider",
        "componentModulePath": "snice/components/slider/snice-slider",
        "properties": [
          "defaultValue",
          "size",
          "variant",
          "min",
          "max",
          "step",
          "label",
          "helperText",
          "errorText",
          "disabled",
          "readonly",
          "loading",
          "required",
          "invalid",
          "name",
          "showValue",
          "showTicks",
          "vertical",
          "value"
        ],
        "events": {
          "slider-input": "onSliderInput",
          "slider-change": "onSliderChange"
        },
        "interfaceProps": [
          "defaultValue",
          "size",
          "variant",
          "min",
          "max",
          "step",
          "label",
          "helperText",
          "errorText",
          "disabled",
          "readonly",
          "loading",
          "required",
          "invalid",
          "name",
          "showValue",
          "showTicks",
          "vertical",
          "value",
          "onSliderInput",
          "onSliderChange"
        ],
        "formAssociated": true
      },
      "Sortable": {
        "exportName": "Sortable",
        "module": "snice/react/sortable",
        "tagName": "snice-sortable",
        "family": "sortable",
        "componentModulePath": "snice/components/sortable/snice-sortable",
        "properties": [
          "direction",
          "handle",
          "disabled",
          "group"
        ],
        "events": {
          "sort-start": "onSortStart",
          "sort-end": "onSortEnd",
          "sort-change": "onSortChange"
        },
        "interfaceProps": [
          "direction",
          "handle",
          "disabled",
          "group",
          "onSortStart",
          "onSortEnd",
          "onSortChange"
        ],
        "formAssociated": false
      },
      "Sparkline": {
        "exportName": "Sparkline",
        "module": "snice/react/sparkline",
        "tagName": "snice-sparkline",
        "family": "sparkline",
        "componentModulePath": "snice/components/sparkline/snice-sparkline",
        "properties": [
          "data",
          "type",
          "color",
          "customColor",
          "width",
          "height",
          "strokeWidth",
          "showDots",
          "showArea",
          "smooth",
          "min",
          "max"
        ],
        "events": {},
        "interfaceProps": [
          "data",
          "type",
          "color",
          "customColor",
          "width",
          "height",
          "strokeWidth",
          "showDots",
          "showArea",
          "smooth",
          "min",
          "max"
        ],
        "formAssociated": false
      },
      "Spinner": {
        "exportName": "Spinner",
        "module": "snice/react/spinner",
        "tagName": "snice-spinner",
        "family": "spinner",
        "componentModulePath": "snice/components/spinner/snice-spinner",
        "properties": [
          "size",
          "color",
          "label",
          "thickness",
          "variant"
        ],
        "events": {},
        "interfaceProps": [
          "size",
          "color",
          "label",
          "thickness",
          "variant"
        ],
        "formAssociated": false
      },
      "SplitButton": {
        "exportName": "SplitButton",
        "module": "snice/react/split-button",
        "tagName": "snice-split-button",
        "family": "split-button",
        "componentModulePath": "snice/components/split-button/snice-split-button",
        "properties": [
          "label",
          "actions",
          "variant",
          "size",
          "disabled",
          "loading",
          "outline",
          "pill",
          "icon",
          "iconPlacement"
        ],
        "events": {
          "primary-click": "onPrimaryClick",
          "action-click": "onActionClick"
        },
        "interfaceProps": [
          "label",
          "actions",
          "variant",
          "size",
          "disabled",
          "loading",
          "outline",
          "pill",
          "icon",
          "iconPlacement",
          "onPrimaryClick",
          "onActionClick"
        ],
        "formAssociated": false
      },
      "SplitPane": {
        "exportName": "SplitPane",
        "module": "snice/react/split-pane",
        "tagName": "snice-split-pane",
        "family": "split-pane",
        "componentModulePath": "snice/components/split-pane/snice-split-pane",
        "properties": [
          "direction",
          "primarySize",
          "minPrimarySize",
          "minSecondarySize",
          "snapSize",
          "disabled"
        ],
        "events": {
          "pane-resize": "onPaneResize"
        },
        "interfaceProps": [
          "direction",
          "primarySize",
          "minPrimarySize",
          "minSecondarySize",
          "snapSize",
          "disabled",
          "onPaneResize"
        ],
        "formAssociated": false
      },
      "Spotlight": {
        "exportName": "Spotlight",
        "module": "snice/react/spotlight",
        "tagName": "snice-spotlight",
        "family": "spotlight",
        "componentModulePath": "snice/components/spotlight/snice-spotlight",
        "properties": [
          "steps"
        ],
        "events": {
          "spotlight-start": "onSpotlightStart",
          "spotlight-step": "onSpotlightStep",
          "spotlight-end": "onSpotlightEnd",
          "spotlight-skip": "onSpotlightSkip",
          "spotlight-target-missing": "onSpotlightTargetMissing"
        },
        "interfaceProps": [
          "steps",
          "onSpotlightStart",
          "onSpotlightStep",
          "onSpotlightEnd",
          "onSpotlightSkip",
          "onSpotlightTargetMissing"
        ],
        "formAssociated": false
      },
      "StatGroup": {
        "exportName": "StatGroup",
        "module": "snice/react/stat-group",
        "tagName": "snice-stat-group",
        "family": "stat-group",
        "componentModulePath": "snice/components/stat-group/snice-stat-group",
        "properties": [
          "stats",
          "columns",
          "variant"
        ],
        "events": {
          "stat-click": "onStatClick"
        },
        "interfaceProps": [
          "stats",
          "columns",
          "variant",
          "onStatClick"
        ],
        "formAssociated": false
      },
      "StepInput": {
        "exportName": "StepInput",
        "module": "snice/react/step-input",
        "tagName": "snice-step-input",
        "family": "step-input",
        "componentModulePath": "snice/components/step-input/snice-step-input",
        "properties": [
          "defaultValue",
          "min",
          "max",
          "step",
          "disabled",
          "readonly",
          "size",
          "wrap",
          "name",
          "value"
        ],
        "events": {
          "value-change": "onValueChange"
        },
        "interfaceProps": [
          "defaultValue",
          "min",
          "max",
          "step",
          "disabled",
          "readonly",
          "size",
          "wrap",
          "name",
          "value",
          "onValueChange"
        ],
        "formAssociated": true
      },
      "Stepper": {
        "exportName": "Stepper",
        "module": "snice/react/stepper",
        "tagName": "snice-stepper",
        "family": "stepper",
        "componentModulePath": "snice/components/stepper/snice-stepper",
        "properties": [
          "steps",
          "currentStep",
          "orientation",
          "clickable"
        ],
        "events": {},
        "interfaceProps": [
          "steps",
          "currentStep",
          "orientation",
          "clickable"
        ],
        "formAssociated": false
      },
      "StepperPanel": {
        "exportName": "StepperPanel",
        "module": "snice/react/stepper-panel",
        "tagName": "snice-stepper-panel",
        "family": "stepper",
        "componentModulePath": "snice/components/stepper/snice-stepper-panel",
        "properties": [
          "index",
          "active"
        ],
        "events": {},
        "interfaceProps": [
          "index",
          "active"
        ],
        "formAssociated": false
      },
      "Switch": {
        "exportName": "Switch",
        "module": "snice/react/switch",
        "tagName": "snice-switch",
        "family": "switch",
        "componentModulePath": "snice/components/switch/snice-switch",
        "properties": [
          "defaultChecked",
          "disabled",
          "loading",
          "required",
          "invalid",
          "size",
          "name",
          "value",
          "label",
          "labelOn",
          "labelOff",
          "checked"
        ],
        "events": {
          "switch-change": "onSwitchChange"
        },
        "interfaceProps": [
          "defaultChecked",
          "disabled",
          "loading",
          "required",
          "invalid",
          "size",
          "name",
          "value",
          "label",
          "labelOn",
          "labelOff",
          "checked",
          "onSwitchChange"
        ],
        "formAssociated": true
      },
      "Tab": {
        "exportName": "Tab",
        "module": "snice/react/tab",
        "tagName": "snice-tab",
        "family": "tabs",
        "componentModulePath": "snice/components/tabs/snice-tab",
        "properties": [
          "disabled",
          "closable"
        ],
        "events": {
          "tab-close": "onTabClose",
          "tab-select": "onTabSelect"
        },
        "interfaceProps": [
          "disabled",
          "closable",
          "onTabClose",
          "onTabSelect"
        ],
        "formAssociated": false
      },
      "Table": {
        "exportName": "Table",
        "module": "snice/react/table",
        "tagName": "snice-table",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-table",
        "properties": [
          "striped",
          "searchable",
          "filterable",
          "sortable",
          "selectable",
          "hoverable",
          "clickable",
          "list",
          "pagination",
          "paginationMode",
          "pageSize",
          "currentPage",
          "totalItems",
          "pageSizes",
          "searchDebounce",
          "columns",
          "data",
          "mode",
          "currentSort",
          "selector",
          "selectorOptions",
          "loading",
          "virtualize",
          "rowHeight",
          "virtualBuffer",
          "columnResize",
          "editable",
          "editMode",
          "density",
          "headerFilters",
          "quickFilter",
          "rowReorder",
          "columnReorder",
          "columnMenu",
          "lazyLoad",
          "lazyLoadThreshold",
          "selectedRows",
          "selectionMode",
          "groupBy",
          "groupDefaults",
          "listRenderer"
        ],
        "events": {
          "page-change": "onPageChange",
          "table-row-selection-changed": "onTableRowSelectionChanged",
          "row-clicked": "onRowClicked",
          "table-load-error": "onTableLoadError",
          "table-select-all-changed": "onTableSelectAllChanged",
          "selection-changed": "onSelectionChanged",
          "sort-change": "onSortChange",
          "filter-change": "onFilterChange",
          "column-visibility-change": "onColumnVisibilityChange",
          "column-pin-change": "onColumnPinChange",
          "column-order-change": "onColumnOrderChange",
          "density-change": "onDensityChange",
          "group-toggle": "onGroupToggle",
          "lazy-load": "onLazyLoad"
        },
        "interfaceProps": [
          "striped",
          "searchable",
          "filterable",
          "sortable",
          "selectable",
          "hoverable",
          "clickable",
          "list",
          "pagination",
          "paginationMode",
          "pageSize",
          "currentPage",
          "totalItems",
          "pageSizes",
          "searchDebounce",
          "columns",
          "data",
          "mode",
          "currentSort",
          "selector",
          "selectorOptions",
          "loading",
          "virtualize",
          "rowHeight",
          "virtualBuffer",
          "columnResize",
          "editable",
          "editMode",
          "density",
          "headerFilters",
          "quickFilter",
          "rowReorder",
          "columnReorder",
          "columnMenu",
          "lazyLoad",
          "lazyLoadThreshold",
          "selectedRows",
          "selectionMode",
          "groupBy",
          "groupDefaults",
          "listRenderer",
          "onPageChange",
          "onTableRowSelectionChanged",
          "onRowClicked",
          "onTableLoadError",
          "onTableSelectAllChanged",
          "onSelectionChanged",
          "onSortChange",
          "onFilterChange",
          "onColumnVisibilityChange",
          "onColumnPinChange",
          "onColumnOrderChange",
          "onDensityChange",
          "onGroupToggle",
          "onLazyLoad"
        ],
        "formAssociated": false
      },
      "TableProgress": {
        "exportName": "TableProgress",
        "module": "snice/react/table-progress",
        "tagName": "snice-table-progress",
        "family": "table",
        "componentModulePath": "snice/components/table/snice-progress",
        "properties": [
          "value",
          "max",
          "color",
          "backgroundColor",
          "height",
          "showPercentage"
        ],
        "events": {},
        "interfaceProps": [
          "value",
          "max",
          "color",
          "backgroundColor",
          "height",
          "showPercentage"
        ],
        "formAssociated": false
      },
      "TabPanel": {
        "exportName": "TabPanel",
        "module": "snice/react/tab-panel",
        "tagName": "snice-tab-panel",
        "family": "tabs",
        "componentModulePath": "snice/components/tabs/snice-tab-panel",
        "properties": [
          "name",
          "transitionIn",
          "transitionOut",
          "transitioning",
          "transitionDuration"
        ],
        "events": {},
        "interfaceProps": [
          "name",
          "transitionIn",
          "transitionOut",
          "transitioning",
          "transitionDuration"
        ],
        "formAssociated": false
      },
      "Tabs": {
        "exportName": "Tabs",
        "module": "snice/react/tabs",
        "tagName": "snice-tabs",
        "family": "tabs",
        "componentModulePath": "snice/components/tabs/snice-tabs",
        "properties": [
          "placement",
          "selected",
          "noScrollControls",
          "transition"
        ],
        "events": {
          "tab-change": "onTabChange"
        },
        "interfaceProps": [
          "placement",
          "selected",
          "noScrollControls",
          "transition",
          "onTabChange"
        ],
        "formAssociated": false
      },
      "Tag": {
        "exportName": "Tag",
        "module": "snice/react/tag",
        "tagName": "snice-tag",
        "family": "tag",
        "componentModulePath": "snice/components/tag/snice-tag",
        "properties": [
          "variant",
          "size",
          "removable",
          "outline",
          "pill"
        ],
        "events": {
          "tag-remove": "onTagRemove"
        },
        "interfaceProps": [
          "variant",
          "size",
          "removable",
          "outline",
          "pill",
          "onTagRemove"
        ],
        "formAssociated": false
      },
      "TagInput": {
        "exportName": "TagInput",
        "module": "snice/react/tag-input",
        "tagName": "snice-tag-input",
        "family": "tag-input",
        "componentModulePath": "snice/components/tag-input/snice-tag-input",
        "properties": [
          "defaultValue",
          "suggestions",
          "maxTags",
          "allowDuplicates",
          "placeholder",
          "disabled",
          "readonly",
          "label",
          "name",
          "value"
        ],
        "events": {
          "tag-add": "onTagAdd",
          "tag-remove": "onTagRemove",
          "tag-change": "onTagChange"
        },
        "interfaceProps": [
          "defaultValue",
          "suggestions",
          "maxTags",
          "allowDuplicates",
          "placeholder",
          "disabled",
          "readonly",
          "label",
          "name",
          "value",
          "onTagAdd",
          "onTagRemove",
          "onTagChange"
        ],
        "formAssociated": true
      },
      "Terminal": {
        "exportName": "Terminal",
        "module": "snice/react/terminal",
        "tagName": "snice-terminal",
        "family": "terminal",
        "componentModulePath": "snice/components/terminal/snice-terminal",
        "properties": [
          "prompt",
          "cwd",
          "readonly",
          "maxLines",
          "showTimestamps"
        ],
        "events": {
          "terminal-command": "onTerminalCommand",
          "terminal-clear": "onTerminalClear",
          "terminal-ready": "onTerminalReady"
        },
        "interfaceProps": [
          "prompt",
          "cwd",
          "readonly",
          "maxLines",
          "showTimestamps",
          "onTerminalCommand",
          "onTerminalClear",
          "onTerminalReady"
        ],
        "formAssociated": false
      },
      "Testimonial": {
        "exportName": "Testimonial",
        "module": "snice/react/testimonial",
        "tagName": "snice-testimonial",
        "family": "testimonial",
        "componentModulePath": "snice/components/testimonial/snice-testimonial",
        "properties": [
          "quote",
          "author",
          "avatar",
          "role",
          "company",
          "rating",
          "variant"
        ],
        "events": {},
        "interfaceProps": [
          "quote",
          "author",
          "avatar",
          "role",
          "company",
          "rating",
          "variant"
        ],
        "formAssociated": false
      },
      "Textarea": {
        "exportName": "Textarea",
        "module": "snice/react/textarea",
        "tagName": "snice-textarea",
        "family": "textarea",
        "componentModulePath": "snice/components/textarea/snice-textarea",
        "properties": [
          "defaultValue",
          "size",
          "variant",
          "resize",
          "placeholder",
          "label",
          "helperText",
          "errorText",
          "disabled",
          "readonly",
          "loading",
          "required",
          "invalid",
          "rows",
          "cols",
          "maxlength",
          "minlength",
          "autocomplete",
          "name",
          "autoGrow",
          "value"
        ],
        "events": {
          "textarea-input": "onTextareaInput",
          "textarea-change": "onTextareaChange",
          "textarea-focus": "onTextareaFocus",
          "textarea-blur": "onTextareaBlur"
        },
        "interfaceProps": [
          "defaultValue",
          "size",
          "variant",
          "resize",
          "placeholder",
          "label",
          "helperText",
          "errorText",
          "disabled",
          "readonly",
          "loading",
          "required",
          "invalid",
          "rows",
          "cols",
          "maxlength",
          "minlength",
          "autocomplete",
          "name",
          "autoGrow",
          "value",
          "onTextareaInput",
          "onTextareaChange",
          "onTextareaFocus",
          "onTextareaBlur"
        ],
        "formAssociated": true
      },
      "Timeline": {
        "exportName": "Timeline",
        "module": "snice/react/timeline",
        "tagName": "snice-timeline",
        "family": "timeline",
        "componentModulePath": "snice/components/timeline/snice-timeline",
        "properties": [
          "orientation",
          "position",
          "items",
          "reverse"
        ],
        "events": {},
        "interfaceProps": [
          "orientation",
          "position",
          "items",
          "reverse"
        ],
        "formAssociated": false
      },
      "TimePicker": {
        "exportName": "TimePicker",
        "module": "snice/react/time-picker",
        "tagName": "snice-time-picker",
        "family": "time-picker",
        "componentModulePath": "snice/components/time-picker/snice-time-picker",
        "properties": [
          "defaultValue",
          "format",
          "step",
          "minTime",
          "maxTime",
          "showSeconds",
          "disabled",
          "readonly",
          "placeholder",
          "label",
          "helperText",
          "errorText",
          "required",
          "invalid",
          "name",
          "variant",
          "size",
          "loading",
          "clearable",
          "value"
        ],
        "events": {
          "time-change": "onTimeChange",
          "timepicker-focus": "onTimepickerFocus",
          "timepicker-blur": "onTimepickerBlur",
          "timepicker-open": "onTimepickerOpen",
          "timepicker-close": "onTimepickerClose",
          "timepicker-clear": "onTimepickerClear"
        },
        "interfaceProps": [
          "defaultValue",
          "format",
          "step",
          "minTime",
          "maxTime",
          "showSeconds",
          "disabled",
          "readonly",
          "placeholder",
          "label",
          "helperText",
          "errorText",
          "required",
          "invalid",
          "name",
          "variant",
          "size",
          "loading",
          "clearable",
          "value",
          "onTimeChange",
          "onTimepickerFocus",
          "onTimepickerBlur",
          "onTimepickerOpen",
          "onTimepickerClose",
          "onTimepickerClear"
        ],
        "formAssociated": true
      },
      "Timer": {
        "exportName": "Timer",
        "module": "snice/react/timer",
        "tagName": "snice-timer",
        "family": "timer",
        "componentModulePath": "snice/components/timer/snice-timer",
        "properties": [
          "mode",
          "initialTime",
          "running"
        ],
        "events": {
          "timer-start": "onTimerStart",
          "timer-stop": "onTimerStop",
          "timer-reset": "onTimerReset",
          "timer-complete": "onTimerComplete"
        },
        "interfaceProps": [
          "mode",
          "initialTime",
          "running",
          "onTimerStart",
          "onTimerStop",
          "onTimerReset",
          "onTimerComplete"
        ],
        "formAssociated": false
      },
      "TimeRangePicker": {
        "exportName": "TimeRangePicker",
        "module": "snice/react/time-range-picker",
        "tagName": "snice-time-range-picker",
        "family": "time-range-picker",
        "componentModulePath": "snice/components/time-range-picker/snice-time-range-picker",
        "properties": [
          "granularity",
          "startTime",
          "endTime",
          "value",
          "disabledRanges",
          "format",
          "multiple",
          "readonly",
          "disabled"
        ],
        "events": {
          "time-range-change": "onTimeRangeChange",
          "time-range-select": "onTimeRangeSelect",
          "time-range-complete": "onTimeRangeComplete"
        },
        "interfaceProps": [
          "granularity",
          "startTime",
          "endTime",
          "value",
          "disabledRanges",
          "format",
          "multiple",
          "readonly",
          "disabled",
          "onTimeRangeChange",
          "onTimeRangeSelect",
          "onTimeRangeComplete"
        ],
        "formAssociated": false
      },
      "Toast": {
        "exportName": "Toast",
        "module": "snice/react/toast",
        "tagName": "snice-toast",
        "family": "toast",
        "componentModulePath": "snice/components/toast/snice-toast",
        "properties": [
          "type",
          "message",
          "closable",
          "icon"
        ],
        "events": {
          "close-toast": "onCloseToast"
        },
        "interfaceProps": [
          "type",
          "message",
          "closable",
          "icon",
          "onCloseToast"
        ],
        "formAssociated": false
      },
      "ToastContainer": {
        "exportName": "ToastContainer",
        "module": "snice/react/toast-container",
        "tagName": "snice-toast-container",
        "family": "toast",
        "componentModulePath": "snice/components/toast/snice-toast-container",
        "properties": [
          "position"
        ],
        "events": {},
        "interfaceProps": [
          "position"
        ],
        "formAssociated": false
      },
      "Tooltip": {
        "exportName": "Tooltip",
        "module": "snice/react/tooltip",
        "tagName": "snice-tooltip",
        "family": "tooltip",
        "componentModulePath": "snice/components/tooltip/snice-tooltip",
        "properties": [
          "content",
          "position",
          "trigger",
          "delay",
          "hideDelay",
          "offset",
          "arrow",
          "open",
          "maxWidth",
          "zIndex",
          "strictPositioning"
        ],
        "events": {},
        "interfaceProps": [
          "content",
          "position",
          "trigger",
          "delay",
          "hideDelay",
          "offset",
          "arrow",
          "open",
          "maxWidth",
          "zIndex",
          "strictPositioning"
        ],
        "formAssociated": false
      },
      "Tree": {
        "exportName": "Tree",
        "module": "snice/react/tree",
        "tagName": "snice-tree",
        "family": "tree",
        "componentModulePath": "snice/components/tree/snice-tree",
        "properties": [
          "selectable",
          "selectionMode",
          "showCheckboxes",
          "showIcons",
          "expandOnClick",
          "nodes",
          "selectedNodes",
          "checkedNodes"
        ],
        "events": {
          "tree-node-expand": "onTreeNodeExpand",
          "tree-node-collapse": "onTreeNodeCollapse",
          "tree-node-select": "onTreeNodeSelect",
          "tree-node-check": "onTreeNodeCheck",
          "tree-node-lazy-load": "onTreeNodeLazyLoad"
        },
        "interfaceProps": [
          "selectable",
          "selectionMode",
          "showCheckboxes",
          "showIcons",
          "expandOnClick",
          "nodes",
          "selectedNodes",
          "checkedNodes",
          "onTreeNodeExpand",
          "onTreeNodeCollapse",
          "onTreeNodeSelect",
          "onTreeNodeCheck",
          "onTreeNodeLazyLoad"
        ],
        "formAssociated": false
      },
      "TreeItem": {
        "exportName": "TreeItem",
        "module": "snice/react/tree-item",
        "tagName": "snice-tree-item",
        "family": "tree",
        "componentModulePath": "snice/components/tree/snice-tree-item",
        "properties": [
          "expanded",
          "selected",
          "checked",
          "showCheckbox",
          "showIcon",
          "loading",
          "indeterminate"
        ],
        "events": {
          "tree-item-toggle": "onTreeItemToggle",
          "tree-item-select": "onTreeItemSelect",
          "tree-item-check": "onTreeItemCheck",
          "tree-item-lazy-load": "onTreeItemLazyLoad"
        },
        "interfaceProps": [
          "expanded",
          "selected",
          "checked",
          "showCheckbox",
          "showIcon",
          "loading",
          "indeterminate",
          "onTreeItemToggle",
          "onTreeItemSelect",
          "onTreeItemCheck",
          "onTreeItemLazyLoad"
        ],
        "formAssociated": false
      },
      "Treemap": {
        "exportName": "Treemap",
        "module": "snice/react/treemap",
        "tagName": "snice-treemap",
        "family": "treemap",
        "componentModulePath": "snice/components/treemap/snice-treemap",
        "properties": [
          "data",
          "showLabels",
          "showValues",
          "colorScheme",
          "padding",
          "animation"
        ],
        "events": {
          "treemap-click": "onTreemapClick",
          "treemap-hover": "onTreemapHover",
          "treemap-drill": "onTreemapDrill"
        },
        "interfaceProps": [
          "data",
          "showLabels",
          "showValues",
          "colorScheme",
          "padding",
          "animation",
          "onTreemapClick",
          "onTreemapHover",
          "onTreemapDrill"
        ],
        "formAssociated": false
      },
      "UserCard": {
        "exportName": "UserCard",
        "module": "snice/react/user-card",
        "tagName": "snice-user-card",
        "family": "user-card",
        "componentModulePath": "snice/components/user-card/snice-user-card",
        "properties": [
          "name",
          "avatar",
          "role",
          "company",
          "email",
          "phone",
          "location",
          "social",
          "status",
          "variant"
        ],
        "events": {
          "social-click": "onSocialClick",
          "action-click": "onActionClick"
        },
        "interfaceProps": [
          "name",
          "avatar",
          "role",
          "company",
          "email",
          "phone",
          "location",
          "social",
          "status",
          "variant",
          "onSocialClick",
          "onActionClick"
        ],
        "formAssociated": false
      },
      "VideoPlayer": {
        "exportName": "VideoPlayer",
        "module": "snice/react/video-player",
        "tagName": "snice-video-player",
        "family": "video-player",
        "componentModulePath": "snice/components/video-player/snice-video-player",
        "properties": [
          "src",
          "poster",
          "autoplay",
          "muted",
          "loop",
          "controls",
          "playbackRate",
          "currentTime",
          "volume",
          "variant",
          "duration"
        ],
        "events": {
          "video-play": "onVideoPlay",
          "video-pause": "onVideoPause",
          "video-ended": "onVideoEnded",
          "video-time-update": "onVideoTimeUpdate",
          "video-fullscreen-change": "onVideoFullscreenChange",
          "video-volume-change": "onVideoVolumeChange"
        },
        "interfaceProps": [
          "src",
          "poster",
          "autoplay",
          "muted",
          "loop",
          "controls",
          "playbackRate",
          "currentTime",
          "volume",
          "variant",
          "duration",
          "onVideoPlay",
          "onVideoPause",
          "onVideoEnded",
          "onVideoTimeUpdate",
          "onVideoFullscreenChange",
          "onVideoVolumeChange"
        ],
        "formAssociated": false
      },
      "VirtualScroller": {
        "exportName": "VirtualScroller",
        "module": "snice/react/virtual-scroller",
        "tagName": "snice-virtual-scroller",
        "family": "virtual-scroller",
        "componentModulePath": "snice/components/virtual-scroller/snice-virtual-scroller",
        "properties": [
          "items",
          "itemHeight",
          "bufferSize",
          "estimatedItemHeight",
          "renderItem"
        ],
        "events": {},
        "interfaceProps": [
          "items",
          "itemHeight",
          "bufferSize",
          "estimatedItemHeight",
          "renderItem"
        ],
        "formAssociated": false
      },
      "Waterfall": {
        "exportName": "Waterfall",
        "module": "snice/react/waterfall",
        "tagName": "snice-waterfall",
        "family": "waterfall",
        "componentModulePath": "snice/components/waterfall/snice-waterfall",
        "properties": [
          "data",
          "orientation",
          "showValues",
          "showConnectors",
          "animated"
        ],
        "events": {
          "bar-click": "onBarClick",
          "bar-hover": "onBarHover"
        },
        "interfaceProps": [
          "data",
          "orientation",
          "showValues",
          "showConnectors",
          "animated",
          "onBarClick",
          "onBarHover"
        ],
        "formAssociated": false
      },
      "Weather": {
        "exportName": "Weather",
        "module": "snice/react/weather",
        "tagName": "snice-weather",
        "family": "weather",
        "componentModulePath": "snice/components/weather/snice-weather",
        "properties": [
          "data",
          "unit",
          "variant"
        ],
        "events": {},
        "interfaceProps": [
          "data",
          "unit",
          "variant"
        ],
        "formAssociated": false
      },
      "WorkOrder": {
        "exportName": "WorkOrder",
        "module": "snice/react/work-order",
        "tagName": "snice-work-order",
        "family": "work-order",
        "componentModulePath": "snice/components/work-order/snice-work-order",
        "properties": [
          "woNumber",
          "date",
          "dueDate",
          "priority",
          "status",
          "customer",
          "description",
          "tasks",
          "parts",
          "asset",
          "laborRate",
          "notes",
          "variant",
          "showQr",
          "qrData",
          "qrPosition"
        ],
        "events": {
          "task-toggle": "onTaskToggle",
          "status-change": "onStatusChange",
          "wo-sign": "onWoSign"
        },
        "interfaceProps": [
          "woNumber",
          "date",
          "dueDate",
          "priority",
          "status",
          "customer",
          "description",
          "tasks",
          "parts",
          "asset",
          "laborRate",
          "notes",
          "variant",
          "showQr",
          "qrData",
          "qrPosition",
          "onTaskToggle",
          "onStatusChange",
          "onWoSign"
        ],
        "formAssociated": false
      }
    }
  }
};
