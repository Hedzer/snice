# Component Implementation Tasks

## CRITICAL: Theme Compliance Checklist

**BEFORE starting ANY component:**
1. ✅ Read `theme.css` - understand available CSS custom properties
2. ✅ Read `.ai/THEME_INTEGRATION_GUIDE.md` - understand fallback pattern
3. ✅ Read `.ai/PIXEL_TO_REM_GUIDE.md` - understand spacing/typography units

**AFTER implementing component:**
1. ✅ Verify ALL CSS uses `var(--snice-property, fallback)` pattern
2. ✅ Test in LIGHT mode - check theme.css tokens work
3. ✅ Test in DARK mode - ensure component is readable/functional
4. ✅ Verify demo.html uses theme tokens (NOT hard-coded colors/spacing)
5. ✅ Verify demo.html works in both light AND dark modes
6. ✅ Run tests to ensure functionality

**NEVER:**
- ❌ Use hard-coded colors (e.g., `#ffffff`, `rgb(255, 255, 255)` without theme var)
- ❌ Use hard-coded spacing without theme tokens
- ❌ Skip fallback values in `var()` calls
- ❌ Use px for spacing/typography (use rem with proper fallbacks)

## Implementation Checklist per Component
For each component:
- [ ] **BEFORE**: Read theme.css, .ai/THEME_INTEGRATION_GUIDE.md, .ai/PIXEL_TO_REM_GUIDE.md
- [ ] Component implementation (.ts, .types.ts, .css) with theme tokens + fallbacks
- [ ] Tests (.test.ts)
- [ ] Demo page (demo.html) using theme tokens (not hard-coded values)
- [ ] **AFTER**: Test in light mode
- [ ] **AFTER**: Test in dark mode
- [ ] **AFTER**: Verify demo.html theme compliance
- [ ] Human documentation (docs/components/)
- [ ] AI documentation (docs/ai/components/)

## New Components to Implement

1. `<snice-textarea>` - Multi-line text
   - [x] Implementation (35/35 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs

2. `<snice-slider>` - Range slider
   - [x] Implementation (30/30 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs

3. `<snice-file-upload>` - File upload
   - [x] Implementation (27/27 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
4. `<snice-color-picker>` - Color picker
   - [x] Implementation (24/24 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
5. `<snice-spinner>` - Extract from progress component
   - [x] Implementation (18/18 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
6. `<snice-empty-state>` - No data display
   - [x] Implementation (16/16 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
7. `<snice-banner>` - Notification banner
   - [x] Implementation (22/22 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
8. `<snice-timeline>` - Event timeline
   - [x] Implementation (24/24 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
9. `<snice-image>` - Image component (from table cell)
   - [x] Implementation (25/25 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
10. `<snice-color-display>` - Color display (from table cell)
   - [x] Implementation (20/20 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
11. `<snice-link>` - Link component (from table cell)
   - [x] Implementation (19/19 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
12. [x] `<snice-sparkline>` - Sparkline chart (from table cell) - minimal inline chart
   - [x] Implementation (21/21 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
13. [x] `<snice-kpi>` - KPI metric display with value, label, trend sparkline, trend value, and trend sentiment (up/down/neutral)
   - [x] Implementation (19/19 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
14. [x] `<snice-stepper>` - Step indicator
   - [x] Implementation (21/21 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
15. [x] `<snice-menu>` - Menu/dropdown
   - [x] Implementation (30/30 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
16. [x] `<snice-tree>` - Tree view
   - [x] Implementation (29/29 tests passing, 4 skipped)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
17. [x] `<snice-command-palette>` - Command palette
   - [x] Implementation (15/15 tests passing, 3 skipped)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
18. [x] `<snice-list>` - List component
   - [x] Implementation (3/3 tests passing, 3 skipped)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
19. [x] `<snice-carousel>` - Carousel
   - [x] Implementation (6/6 tests passing, 2 skipped)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
20. [x] `<snice-code-block>` - Code display
   - [x] Implementation (6/6 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
21. [x] `<snice-stat>` - Statistic display (MERGED INTO KPI)
   - Functionality merged into `<snice-kpi>` component
   - KPI now supports icons/iconImages from stat
   - KPI provides superset of stat features (sparklines, better styling)
   - Component removed to avoid duplication
22. [x] `<snice-location>` - Location component (from table cell)
   - [x] Implementation (15/15 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
24. [x] `<snice-popover>` - Popover
   - [x] Implementation (13/13 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
25. [x] `<snice-split-pane>` - Split pane
   - [x] Implementation (12/12 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
26. [x] `<snice-virtual-scroller>` - Virtual scrolling
   - [x] Implementation (7/7 tests passing, 1 skipped)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
27. [x] `<snice-calendar>` - Calendar view
   - [x] Implementation (13/13 tests passing, 2 skipped)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
28. [x] `<snice-kanban>` - Kanban board
   - [x] Implementation (11/11 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
29. [x] `<snice-chart>` - General-purpose chart component with multiple types:
   - [x] Implementation (19/19 tests passing, 1 skipped)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
   - Line chart
   - Bar chart (vertical/horizontal)
   - Area chart
   - Pie chart
   - Donut chart
   - Scatter plot
   - Radar/spider chart
   - Bubble chart
   - Mixed/combo charts
   - Configurable via `type` attribute
   - Support for multiple datasets, axes, legends, tooltips, animations
31. [x] `<snice-qr-code>` - QR code generator
   - [x] Implementation (13/13 tests passing, 2 skipped)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
32. [x] `<snice-camera>` - Live camera view
   - [x] Implementation (1/1 tests passing, limited testing due to hardware requirements)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
33. [x] `<snice-audio-recorder>` - Audio recording component
   - [x] Implementation (1/1 tests passing, limited testing due to hardware requirements)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
34. [x] `<snice-draw>` - Paint/draw canvas with smooth drawing
   - [x] Implementation (1/1 tests passing, limited testing due to Canvas API requirements)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
35. [x] `<snice-doc>` - Document editor, like notion
   - [x] Implementation (41/41 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
36. [x] `<snice-chat>` - Embeddable chat area (Slack-style)
   - [x] Implementation (29/29 tests passing, 1 skipped)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
37. [x] `<snice-terminal>` - Shell terminal component
   - [x] Implementation (tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
38. [ ] `<snice-music-player>` - Music player component
39. [ ] `<snice-video-player>` - Video player with custom controls, quality selection, playback speed, fullscreen, PiP
41. [ ] `<snice-file-gallery>` - File upload gallery with preview, pausable/resumable uploads, deletable files (use @request/@response decorators)
42. [ ] `<snice-link-preview>` - Website thumbnail/preview card (like social media link previews with Open Graph data)
43. [ ] `<snice-heatmap>` - Heatmap visualization (separate from chart - for calendar-style heatmaps like GitHub contributions)
44. [ ] `<snice-gauge>` - Gauge/meter chart (semicircle or full circle)
45. [ ] `<snice-funnel>` - Funnel chart (for conversion tracking)
46. [ ] `<snice-treemap>` - Treemap visualization (hierarchical data as nested rectangles)
47. [ ] `<snice-sankey>` - Sankey diagram (flow visualization)
48. [ ] `<snice-network-graph>` - Network/relationship graph visualization
49. [ ] `<snice-candlestick>` - Candlestick/OHLC chart (for financial data)
50. [ ] `<snice-masonry>` - Masonry layout (Pinterest-style grid with variable height items)
51. [ ] `<snice-camera-annotate>` - Image annotation component (combines camera + drawing)
   - Combines `<snice-camera>` and `<snice-draw>` components
   - **Workflow:**
     1. Take a picture from camera
     2. Draw a shape on the captured image
     3. Write a label for that shape
     4. Then either:
        - Draw and label more shapes on the same image
        - Take another picture to start fresh
   - **Labeling System:**
     - Labels are NOT on canvas - displayed in separate sidebar
     - Each drawn shape can have an associated label
     - Labels are linked to their corresponding drawn shapes
     - Each label-shape pair can be shown/hidden independently
   - **Label Management:**
     - Side panel/sidebar for adding labels to drawn shapes
     - Option to present labels (show/hide all)
     - Option to render labels on canvas or keep separate
     - Adding labels happens via sidebar UI, not on canvas
   - **Visual Highlighting:**
     - Mouse over a label: corresponding shape highlighted
     - Other shapes become opacity 0.2 + grayscale filter
     - Clear visual emphasis on the labeled item being hovered
   - **Color System:**
     - Integrate `<snice-color-picker>` component for color selection
     - Preset color palette displayed in wheel/circular pattern
     - "Auto Rotate Colors" checkbox:
       - When enabled, each new shape automatically gets next color from palette
       - Colors cycle through preset wheel
       - Makes multi-annotation workflows faster
   - **Features:**
     - Show/hide individual annotation layers (shape + label pairs)
     - Bulk show/hide all annotations
     - Export annotated image with or without labels
     - Save annotation data separately (shapes, colors, labels, positions)
     - Load saved annotations onto images
52. [ ] `<snice-time-range-picker>` - Time range/timeslot picker
   - **Visual Layout:**
     - Vertically stacked cells representing time intervals for a single day
     - Grid-like appearance with clear time labels
     - Each cell represents a time slot (configurable granularity: 15min, 30min, 1hr, etc.)
   - **Selection Behavior:**
     - Click and drag to select time range (from cell X to cell Y)
     - Single click to select individual timeslot
     - Visual highlight of selected range
     - Display selected time range (e.g., "9:00 AM - 11:30 AM")
   - **Granularity Options:**
     - 5-minute intervals
     - 15-minute intervals (default)
     - 30-minute intervals
     - 1-hour intervals
     - Custom interval duration
   - **Features:**
     - Time range validation (min/max times)
     - Disabled/blocked time slots (e.g., lunch breaks, unavailable hours)
     - Multiple selection mode (select multiple non-contiguous ranges)
     - Read-only mode for displaying existing timeslots
     - 12-hour or 24-hour time format
     - Configurable start/end of day (e.g., 6 AM - 10 PM)
   - **Use Cases:**
     - Appointment booking
     - Meeting scheduler
     - Availability selection
     - Working hours configuration
     - Event time selection
   - **Properties:**
     - `granularity` - Time interval size (5, 15, 30, 60 minutes)
     - `start-time` - Day start time (default: "00:00")
     - `end-time` - Day end time (default: "23:59")
     - `value` - Selected time range(s)
     - `disabled-ranges` - Array of unavailable time ranges
     - `format` - Time format ("12h" | "24h")
     - `multiple` - Allow multiple range selection
   - **Events:**
     - `@snice/time-range-change` - Emitted when selection changes
     - `@snice/time-range-select` - Emitted when range selection starts
     - `@snice/time-range-complete` - Emitted when range selection completes
53. [x] `<snice-timer>` - Basic timer/stopwatch component
   - [x] Implementation (25/25 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
54. [ ] `<snice-qr-reader>` - QR code scanner component
   - **Properties:**
     - `auto-start` - Start camera automatically
     - `camera` - "front" | "back" (default: "back")
   - **Methods:**
     - `start(): Promise<void>` - Start camera and scanning
     - `stop(): void` - Stop camera
     - `scanImage(file: File): Promise<string>` - Scan QR from image file
     - `switchCamera(): void` - Switch between front/back camera
   - **Events:**
     - `@snice/qr-scan` - QR code detected and decoded
     - `@snice/qr-error` - Error during scanning
     - `@snice/camera-ready` - Camera initialized
     - `@snice/camera-error` - Camera access denied/failed

---

## SNICE DECORATOR PATTERNS - REQUIRED FOR ALL COMPONENTS

### DOM Queries
- ❌ **ANTI-PATTERN**: `this.shadowRoot.querySelector(selector)`
- ✅ **USE**: `@query(selector)` decorator
  ```typescript
  @query('.my-element') myElement?: HTMLElement;
  ```

- ❌ **ANTI-PATTERN**: `this.shadowRoot.querySelectorAll(selector)`
- ✅ **USE**: `@queryAll(selector)` decorator
  ```typescript
  @queryAll('.my-items') myItems!: NodeListOf<HTMLElement>;
  ```

### Event Handling
- ❌ **ANTI-PATTERN**: `element.addEventListener(event, handler)` + `removeEventListener`
- ✅ **USE**: `@on(event, options)` decorator
  ```typescript
  @on('click', { target: '.button' })
  handleClick(e: Event) {}
  ```

- ❌ **ANTI-PATTERN**: Template inline with `addEventListener`
- ✅ **USE**: Template `@event` binding
  ```typescript
  html`<button @click=${this.handleClick}>Click</button>`
  ```

### Custom Events
- ❌ **ANTI-PATTERN**: `this.dispatchEvent(new CustomEvent(name, { detail, bubbles, composed }))`
- ✅ **USE**: `@dispatch(eventName)` decorator
  ```typescript
  @dispatch('@snice/my-event', { bubbles: true, composed: true })
  private emitMyEvent() {
    return { value: this.value, component: this };
  }
  ```

### Lifecycle
- ❌ **ANTI-PATTERN**: Manual setup in `connectedCallback()`
- ✅ **USE**: `@ready()` decorator (runs after initial render)
  ```typescript
  @ready()
  init() {
    // Setup code here
  }
  ```

- ❌ **ANTI-PATTERN**: `disconnectedCallback() { /* cleanup */ }`
- ✅ **USE**: `@dispose()` decorator
  ```typescript
  @dispose()
  cleanup() {
    // Cleanup code here
  }
  ```

### Mutation Observers
- ❌ **ANTI-PATTERN**: `new MutationObserver()` + manual setup/cleanup
- ✅ **USE**: `@observe(target, options)` decorator
  ```typescript
  @observe(() => this.container, { childList: true })
  handleMutation(mutations: MutationRecord[]) {}
  ```

### Property Watching
- ❌ **ANTI-PATTERN**: Manual property change detection
- ✅ **USE**: `@watch(propertyName)` decorator
  ```typescript
  @watch('value')
  handleValueChange(oldVal, newVal) {}
  ```

### Request/Respond Pattern (for async data requests)
- **USE WHEN**: A component needs to request data and wait for response to continue
- **EXAMPLE**: Table component requests filtered data when user types in search
  ```typescript
  // In table component:
  @request('fetch-table-data')
  fetchData!: (params: { search: string, page: number }) => Promise<TableData>;

  async handleSearch(search: string) {
    const data = await this.fetchData({ search, page: 1 });
    this.renderData(data);
  }

  // In controller or parent:
  @respond('fetch-table-data')
  async handleDataRequest(req, respond) {
    const data = await fetch(`/api/data?search=${req.search}&page=${req.page}`).then(r => r.json());
    respond(data);
  }
  ```

### Notes
- **Method calls are fine**: Calling methods on components directly is acceptable (e.g., `camera.capture()`)
- **Events for state changes**: Components emit events when their state changes so parent can react
- **@request/@respond**: ONLY when component needs to request data and wait for response