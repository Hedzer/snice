# Component Implementation Tasks

## Implementation Checklist per Component
For each component:
- [ ] Component implementation (.ts, .types.ts, .css)
- [ ] Tests (.test.ts)
- [ ] Demo page (demo.html)
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
15. [ ] `<snice-menu>` - Menu/dropdown
16. [ ] `<snice-tree>` - Tree view
17. [ ] `<snice-command-palette>` - Command palette
18. [ ] `<snice-list>` - List component
19. [ ] `<snice-carousel>` - Carousel
20. [ ] `<snice-code-block>` - Code display
21. [ ] `<snice-stat>` - Statistic display
22. [ ] `<snice-location>` - Location component (from table cell)
23. [ ] `<snice-actions>` - Action buttons (from table cell)
24. [ ] `<snice-popover>` - Popover
25. [ ] `<snice-split-pane>` - Split pane
26. [ ] `<snice-virtual-scroller>` - Virtual scrolling
27. [ ] `<snice-calendar>` - Calendar view
28. [ ] `<snice-kanban>` - Kanban board
29. [ ] `<snice-gantt>` - Gantt chart
30. [ ] `<snice-chart>` - General-purpose chart component with multiple types:
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
31. [ ] `<snice-qr-code>` - QR code generator
32. [ ] `<snice-camera>` - Live camera view
33. [ ] `<snice-audio-recorder>` - Audio recording component
34. [ ] `<snice-draw>` - Paint/draw canvas (copy lazy-brush from https://github.com/dulnan/lazy-brush/tree/master/src)
35. [ ] `<snice-doc>` - Document editor, like notion
36. [ ] `<snice-chat>` - Embeddable chat area (Slack-style)
37. [ ] `<snice-terminal>` - Shell terminal component
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
