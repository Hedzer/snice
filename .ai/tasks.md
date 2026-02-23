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
- [ ] Tests (.test.ts) — all passing
- [ ] Demo page (demo.html) using theme tokens (not hard-coded values)
- [ ] **AFTER**: Test in light mode
- [ ] **AFTER**: Test in dark mode
- [ ] **AFTER**: Verify demo.html theme compliance
- [ ] Human documentation (docs/components/)
- [ ] AI documentation (docs/ai/components/)
- [ ] CDN build — `npm run build:core && npm run build:cdn` (auto-discovered from dist/components/)
- [ ] React adapter — `npm run generate:react-adapters` (auto-discovered from components/ dir)
- [ ] Website showcase — fragment in `public/showcases/`, added to `manifest.json`
- [ ] Website showcase — script tag in `public/showcases/_footer.html`
- [ ] Website showcase — component tag in `public/showcases/_footer.html` comp-list
- [ ] Website rebuild — `node public/build-showcases.js`
- [ ] Copy CDN builds to public — `node scripts/build-website.js` (copies dist/cdn/ to public/components/)

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
42. [x] `<snice-link-preview>` - Website thumbnail/preview card (like social media link previews with Open Graph data)
   - [x] Implementation (31/31 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
43. [x] `<snice-heatmap>` - Heatmap visualization (separate from chart - for calendar-style heatmaps like GitHub contributions)
   - [x] Implementation (13/13 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
44. [x] `<snice-gauge>` - Gauge/meter chart (semicircle or full circle)
   - [x] Implementation (21/21 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
45. [ ] `<snice-funnel>` - Funnel chart (for conversion tracking)
46. [ ] `<snice-treemap>` - Treemap visualization (hierarchical data as nested rectangles)
47. [ ] `<snice-sankey>` - Sankey diagram (flow visualization)
48. [ ] `<snice-network-graph>` - Network/relationship graph visualization
49. [ ] `<snice-candlestick>` - Candlestick/OHLC chart (for financial data)
50. [x] `<snice-masonry>` - Masonry layout (Pinterest-style grid with variable height items)
   - [x] Implementation (11/11 tests passing)
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
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
54. [x] `<snice-qr-reader>` - QR code scanner component
   - [x] Implementation
   - [x] Demo page
   - [x] Human docs
   - [x] AI docs
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
55. [ ] `<snice-flip-card>` - Flip card with front/back slots
   - **Layout:**
     - Two-sided card with CSS 3D transform flip animation
     - `<slot name="front">` and `<slot name="back">` for content on each side
     - Preserves dimensions of whichever side is larger
   - **Flip Behavior:**
     - Click-to-flip enabled by default (disable with `click-to-flip="false"`)
     - Programmatic flip via `flip()` method and `flipped` property
     - Configurable flip direction: horizontal (default) or vertical
     - Smooth CSS transition with configurable duration
   - **Properties:**
     - `flipped` - Boolean, current flip state
     - `click-to-flip` - Boolean, enable click-to-flip (default: true)
     - `direction` - `"horizontal"` | `"vertical"` (default: `"horizontal"`)
     - `duration` - Flip animation duration in ms (default: 600)
   - **Methods:**
     - `flip(): void` - Toggle flip state
     - `flipTo(side: 'front' | 'back'): void` - Flip to specific side
   - **Events:**
     - `flip-change` - Emitted when card flips, detail: `{ flipped: boolean, side: 'front' | 'back' }`
56. [ ] `<snice-podcast-player>` - Podcast player (similar to `<snice-music-player>`)
   - **Layout:**
     - Episode artwork/thumbnail display
     - Episode title, show name, description
     - Playback controls: play/pause, skip forward/back (15s/30s configurable)
     - Progress bar with seek, time elapsed/remaining
     - Playback speed control (0.5x, 1x, 1.25x, 1.5x, 2x)
     - Volume control
     - Episode list from RSS feed
   - **Properties:**
     - `src` - Audio source URL (direct episode playback)
     - `from-rss` - RSS feed URL (fetches and displays episode list)
     - `title` - Episode title
     - `show` - Show/podcast name
     - `artwork` - Artwork image URL
     - `description` - Episode description
     - `playback-rate` - Current playback speed (default: 1)
     - `skip-forward` - Skip forward duration in seconds (default: 30)
     - `skip-back` - Skip back duration in seconds (default: 15)
     - `current-time` - Current playback position
     - `duration` - Episode duration (read-only)
   - **RSS Feed Mode (`from-rss`):**
     - Parses RSS/XML feed to extract episodes
     - Auto-populates show name, artwork, episode list from feed metadata
     - Displays scrollable episode list with title, date, duration
     - Click episode to load it into the player
     - Currently playing episode highlighted in list
   - **Methods:**
     - `play(): void`, `pause(): void`, `toggle(): void`
     - `skipForward(): void`, `skipBack(): void`
     - `seekTo(time: number): void`
     - `setPlaybackRate(rate: number): void`
     - `loadEpisode(index: number): void` - Load and play specific episode from feed
   - **Events:**
     - `podcast-play`, `podcast-pause`, `podcast-ended`
     - `podcast-time-update` - Periodic time update
     - `podcast-rate-change` - Playback speed changed
     - `podcast-episode-change` - New episode selected from list
     - `podcast-feed-loaded` - RSS feed parsed successfully
   - **Features:**
     - Remember playback position (localStorage)
     - Chapter markers support (optional)
     - Playlist/queue support for multiple episodes
     - Sleep timer
57. [ ] `<snice-book>` - Book component with page-flip navigation
   - **Layout:**
     - Realistic book appearance with cover, spine, pages
     - CSS 3D page-flip animation when turning pages
     - Two-page spread view (left/right pages visible simultaneously)
     - Single-page mode for narrow viewports
   - **Content:**
     - Each child element or `<snice-page>` slot becomes a page
     - Supports HTML content per page (text, images, mixed)
     - Auto-pagination of long text content (optional)
   - **Properties:**
     - `current-page` - Current page number (0-indexed)
     - `total-pages` - Total page count (read-only)
     - `mode` - `"single"` | `"spread"` (default: `"spread"`)
     - `cover-image` - Cover image URL
     - `title` - Book title
     - `author` - Book author
   - **Navigation:**
     - Click/tap page edges to turn
     - Swipe gesture support for touch devices
     - Keyboard: arrow keys for prev/next
     - Programmatic: `goToPage(n)`, `nextPage()`, `prevPage()`
   - **Methods:**
     - `goToPage(page: number): void`
     - `nextPage(): void`, `prevPage(): void`
     - `firstPage(): void`, `lastPage(): void`
   - **Events:**
     - `page-turn` - Page turned, detail: `{ page: number, direction: 'forward' | 'backward' }`
     - `page-flip-start` - Flip animation started
     - `page-flip-end` - Flip animation completed
58. [ ] `<snice-video-player>` - Video player component
   - **Layout:**
     - Video viewport with overlay controls
     - Controls bar: play/pause, seek bar, time display, volume, fullscreen, PiP
     - Optional poster image before playback
   - **Properties:**
     - `src` - Video source URL
     - `poster` - Poster image URL
     - `autoplay` - Boolean, auto-start playback
     - `muted` - Boolean, muted state
     - `loop` - Boolean, loop playback
     - `controls` - Boolean, show controls (default: true)
     - `playback-rate` - Playback speed
     - `current-time` - Current position
     - `duration` - Video duration (read-only)
     - `volume` - Volume level (0-1)
     - `variant` - `"default"` | `"minimal"` | `"cinema"`
   - **Methods:**
     - `play(): void`, `pause(): void`, `toggle(): void`
     - `seekTo(time: number): void`
     - `requestFullscreen(): void`, `exitFullscreen(): void`
     - `requestPictureInPicture(): void`
     - `setPlaybackRate(rate: number): void`
   - **Events:**
     - `video-play`, `video-pause`, `video-ended`
     - `video-time-update` - Periodic time update
     - `video-fullscreen-change` - Fullscreen toggled
     - `video-volume-change` - Volume changed
   - **Features:**
     - Keyboard shortcuts (space=play/pause, f=fullscreen, m=mute, arrows=seek)
     - Double-click to fullscreen
     - Playback speed selector (0.5x-2x)
     - Picture-in-Picture support
     - Subtitle/caption track support (`<track>` elements via slot)
     - Responsive controls that adapt to container size
59. [ ] `<snice-recipe>` - Recipe display component
   - **Layout:**
     - Hero image/photo of dish
     - Recipe title, description, author
     - Meta info bar: prep time, cook time, total time, servings, difficulty
     - Two-column layout: ingredients list (left), instructions/steps (right)
     - Nutrition facts panel (optional)
   - **Properties:**
     - `title` - Recipe name
     - `description` - Short description
     - `image` - Hero image URL
     - `author` - Recipe author
     - `prep-time` - Prep time in minutes
     - `cook-time` - Cook time in minutes
     - `servings` - Number of servings (default)
     - `difficulty` - `"easy"` | `"medium"` | `"hard"`
     - `cuisine` - Cuisine type tag
     - `variant` - `"card"` | `"full"` (default: `"full"`)
   - **Data (via properties or JSON):**
     - `ingredients` - Array of `{ name, amount, unit, group? }`
     - `steps` - Array of `{ text, image?, tip? }`
     - `nutrition` - `{ calories, protein, carbs, fat, fiber?, sodium? }`
     - `tags` - Array of tags (e.g., `["vegetarian", "gluten-free"]`)
   - **Interactive Features:**
     - Serving size adjuster — scales ingredient quantities dynamically
     - Ingredient checkbox (strike-through when checked)
     - Step-by-step mode: highlight current step, mark completed
     - Print-friendly layout via `print()` method
     - Timer integration: steps with times show inline timer buttons
   - **Methods:**
     - `setServings(count: number): void` - Adjust serving size
     - `print(): void` - Open print-friendly view
     - `reset(): void` - Uncheck all ingredients/steps
   - **Events:**
     - `recipe-serving-change` - Serving size adjusted
     - `recipe-step-complete` - Step marked complete
     - `recipe-ingredient-check` - Ingredient checked/unchecked
60. [ ] `<snice-rating>` - Star/emoji rating component
   - Configurable icon (stars, hearts, emoji, custom)
   - Half-star support, readonly mode
   - `value`, `max`, `icon`, `size`, `readonly`, `precision` ("full" | "half")
   - Events: `rating-change`
61. [ ] `<snice-signature>` - Signature capture pad
   - Smooth drawing optimized for signatures
   - `stroke-color`, `stroke-width`, `background-color`, `readonly`
   - Methods: `clear()`, `toDataURL(type?)`, `toBlob()`, `isEmpty()`
   - Events: `signature-change`, `signature-clear`
62. [ ] `<snice-cropper>` - Image crop/rotate/zoom tool
   - Drag to reposition, handles to resize crop area
   - `src`, `aspect-ratio`, `min-width`, `min-height`, `output-type` ("png" | "jpeg" | "webp")
   - Methods: `crop(): Promise<Blob>`, `rotate(deg)`, `reset()`, `zoom(level)`
   - Events: `crop-change`, `crop-complete`
63. [ ] `<snice-tag-input>` - Tag/pill input with autocomplete
   - Add tags by typing + Enter/comma, remove with backspace or X button
   - `value` (array of strings), `suggestions`, `max-tags`, `allow-duplicates`, `placeholder`
   - Keyboard nav through suggestions dropdown
   - Events: `tag-add`, `tag-remove`, `tag-change`
64. [ ] `<snice-sortable>` - Drag-and-drop reorderable list
   - Drag handle or full-item drag, animated reorder
   - `direction` ("vertical" | "horizontal"), `handle` (selector), `disabled`, `group` (for cross-list drag)
   - Ghost element during drag with configurable opacity
   - Events: `sort-start`, `sort-end`, `sort-change`
65. [ ] `<snice-markdown>` - Markdown renderer
   - Renders markdown string to styled HTML in shadow DOM
   - `content` (markdown string), `sanitize` (boolean, default true), `theme` ("default" | "github")
   - GFM support: tables, task lists, strikethrough, autolinks
   - Syntax highlighting for code blocks
   - Events: `markdown-render`, `link-click`
66. [ ] `<snice-diff>` - Code/text diff viewer
   - Side-by-side or unified inline view
   - `old-text`, `new-text`, `language`, `mode` ("split" | "unified"), `line-numbers`
   - Syntax highlighting, line-level and word-level diffs
   - Collapsible unchanged sections
   - Events: `diff-computed`
67. [ ] `<snice-pdf-viewer>` - PDF document viewer
   - Renders PDF pages via canvas (pdf.js-based)
   - `src` (URL or ArrayBuffer), `page`, `zoom`, `fit` ("width" | "height" | "page")
   - Toolbar: page nav, zoom, fit controls, download
   - Methods: `goToPage(n)`, `nextPage()`, `prevPage()`, `print()`, `download()`
   - Events: `page-change`, `pdf-loaded`, `pdf-error`
68. [ ] `<snice-countdown>` - Countdown to a date/time
   - Displays days, hours, minutes, seconds with flip/slide animation
   - `target` (ISO date string), `format` ("dhms" | "hms" | "ms"), `variant` ("flip" | "simple" | "circular")
   - Auto-updates every second
   - Events: `countdown-complete`, `countdown-tick`
69. [ ] `<snice-comments>` - Threaded comment section
   - Nested reply threads, author avatar/name/timestamp
   - `comments` (array of `{ id, author, avatar, text, timestamp, replies?, likes? }`)
   - Like/upvote per comment, edit/delete own comments
   - Markdown support in comment text
   - Events: `comment-add`, `comment-reply`, `comment-delete`, `comment-like`
70. [ ] `<snice-testimonial>` - Testimonial/review card
   - Quote text, author name, avatar, role/company, rating
   - `quote`, `author`, `avatar`, `role`, `company`, `rating`, `variant` ("card" | "minimal" | "featured")
   - Optional star rating display
71. [ ] `<snice-gantt>` - Gantt chart for project timelines
   - Horizontal bar chart with time axis
   - `tasks` (array of `{ id, name, start, end, progress?, dependencies?, color?, group? }`)
   - Drag to resize/move tasks, dependency arrows
   - Zoom levels: day, week, month
   - Methods: `scrollToDate(date)`, `scrollToTask(id)`
   - Events: `task-click`, `task-resize`, `task-move`, `task-link`
72. [ ] `<snice-org-chart>` - Organizational/hierarchy chart
   - Tree layout with cards for each node, connecting lines
   - `data` (tree of `{ id, name, title, avatar?, children? }`)
   - `direction` ("top-down" | "left-right"), `compact` boolean
   - Zoom/pan, collapse/expand subtrees
   - Events: `node-click`, `node-expand`, `node-collapse`
73. [ ] `<snice-flow>` - Node-based flow/diagram editor
   - Draggable nodes with input/output ports, bezier curve edges
   - `nodes` (array of `{ id, x, y, type, data }`) , `edges` (array of `{ source, target, sourcePort?, targetPort? }`)
   - Zoom/pan canvas, snap-to-grid, minimap
   - Methods: `addNode(node)`, `removeNode(id)`, `addEdge(edge)`, `removeEdge(id)`, `fitView()`
   - Events: `node-drag`, `edge-connect`, `edge-disconnect`, `node-select`, `canvas-click`
74. [ ] `<snice-waterfall>` - Waterfall chart
   - Horizontal or vertical bars showing cumulative effect of sequential values
   - `data` (array of `{ label, value, type?: 'increase' | 'decrease' | 'total' }`)
   - Color-coded: green for increase, red for decrease, blue for totals
   - Connector lines between bars, value labels
   - Events: `bar-click`, `bar-hover`
75. [ ] `<snice-infinite-scroll>` - Infinite scroll container
   - Triggers load callback when scrolling near bottom
   - `threshold` (px from bottom to trigger, default 200), `loading`, `has-more`, `direction` ("down" | "up")
   - Slot for loading spinner, slot for end-of-list message
   - Events: `load-more`
76. [ ] `<snice-spotlight>` - Feature tour/onboarding spotlight overlay
   - Highlights elements with cutout overlay, shows tooltip/popover with step info
   - `steps` (array of `{ target, title, description, position? }`)
   - Step navigation: next, prev, skip, done
   - Methods: `start()`, `next()`, `prev()`, `goToStep(n)`, `end()`
   - Events: `spotlight-start`, `spotlight-step`, `spotlight-end`, `spotlight-skip`
77. [ ] `<snice-notification-center>` - Bell icon with dropdown notification list
   - Bell icon with unread count badge
   - Dropdown panel with notification items (icon, title, message, timestamp, read/unread)
   - `notifications` (array of `{ id, title, message, timestamp, read?, icon?, type? }`)
   - Mark as read, mark all read, dismiss individual
   - Events: `notification-click`, `notification-dismiss`, `notification-read-all`
78. [ ] `<snice-map>` - Interactive map component
   - Renders tile-based map (OpenStreetMap tiles by default)
   - `center` (lat/lng), `zoom`, `min-zoom`, `max-zoom`, `markers` (array of `{ lat, lng, label?, icon? }`)
   - Pan/zoom with mouse/touch, marker popups
   - Methods: `setCenter(lat, lng)`, `setZoom(n)`, `addMarker(marker)`, `removeMarker(id)`, `fitBounds(markers)`
   - Events: `map-click`, `marker-click`, `map-move`, `map-zoom`
79. [ ] `<snice-spreadsheet>` - Editable spreadsheet grid
   - Cell selection, multi-select, copy/paste
   - `data` (2D array), `columns` (column defs with type, width, header), `readonly`
   - Cell types: text, number, date, boolean, select
   - Formula support (basic: SUM, AVG, COUNT, MIN, MAX)
   - Methods: `getCell(row, col)`, `setCell(row, col, value)`, `getData()`, `setData(data)`
   - Events: `cell-change`, `cell-select`, `row-select`, `column-sort`
80. [ ] `<snice-pricing-table>` - Pricing tier comparison
   - Side-by-side plan cards with feature comparison rows
   - `plans` (array of `{ name, price, period?, currency?, features, cta, highlighted? }`)
   - `variant` ("cards" | "table"), highlighted/recommended plan emphasis
   - Toggle for monthly/annual pricing
   - Events: `plan-select`
81. [ ] `<snice-weather>` - Weather display widget
   - Current conditions: temp, icon, description, humidity, wind
   - `data` (`{ temp, condition, icon?, humidity?, wind?, forecast? }`)
   - `unit` ("celsius" | "fahrenheit"), `variant` ("compact" | "full")
   - Optional multi-day forecast row
   - No built-in API calls — receives data via properties

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
  @dispatch('my-event', { bubbles: true, composed: true })
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