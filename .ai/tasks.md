# Component Implementation Tasks

## CRITICAL: Theme Compliance Checklist

**BEFORE starting ANY component:**
1. Read `theme.css` - understand available CSS custom properties
2. Read `.ai/THEME_INTEGRATION_GUIDE.md` - understand fallback pattern
3. Read `.ai/PIXEL_TO_REM_GUIDE.md` - understand spacing/typography units

**AFTER implementing component:**
1. Verify ALL CSS uses `var(--snice-property, fallback)` pattern
2. Test in LIGHT mode - check theme.css tokens work
3. Test in DARK mode - ensure component is readable/functional
4. Verify demo.html uses theme tokens (NOT hard-coded colors/spacing)
5. Verify demo.html works in both light AND dark modes
6. Run tests to ensure functionality

**NEVER:**
- Use hard-coded colors (e.g., `#ffffff`, `rgb(255, 255, 255)` without theme var)
- Use hard-coded spacing without theme tokens
- Skip fallback values in `var()` calls
- Use px for spacing/typography (use rem with proper fallbacks)

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

---

## New Components to Implement

### Documents & Finance

82. [ ] `<snice-invoice>` - Invoice display/generator
   - Line items table with qty, unit price, amount columns
   - Tax/discount rows, subtotal, total with currency formatting
   - Company logo, bill-to/ship-to address blocks
   - Payment terms, due date, invoice number, date
   - Status badge (draft/sent/paid/overdue/cancelled)
   - Print-friendly layout via `print()` method
   - **Properties:**
     - `invoice-number`, `date`, `due-date`, `status` ("draft" | "sent" | "paid" | "overdue" | "cancelled")
     - `currency` (default "USD"), `tax-rate`, `discount`
     - `from` - `{ name, address, email?, phone?, logo? }`
     - `to` - `{ name, address, email?, phone? }`
     - `items` - Array of `{ description, quantity, unitPrice, amount?, tax? }`
     - `notes` - Footer notes/terms text
     - `variant` ("standard" | "compact" | "detailed")
   - **Methods:** `print()`, `toJSON()`
   - **Events:** `invoice-item-change`, `invoice-status-change`

83. [ ] `<snice-receipt>` - Transaction receipt
   - Simpler than invoice — single transaction focus
   - Items list, subtotal, tax, total, payment method
   - Optional barcode/QR code for receipt ID
   - Thermal-printer-style variant (narrow, monospace)
   - **Properties:**
     - `receipt-number`, `date`, `currency`
     - `merchant` - `{ name, address?, logo? }`
     - `items` - Array of `{ name, quantity, price }`
     - `tax`, `subtotal`, `total`, `payment-method`
     - `variant` ("standard" | "thermal")
   - **Methods:** `print()`

84. [ ] `<snice-work-order>` - Service/maintenance work order
   - Header: WO#, date, priority (low/medium/high/urgent), status (open/in-progress/completed/cancelled)
   - Customer info block
   - Description/scope of work
   - Task checklist (checkable items with assignee)
   - Parts/materials list with quantities and costs
   - Time tracking section (start/end, hours, labor rate)
   - Signature capture slot for sign-off
   - **Properties:**
     - `wo-number`, `date`, `priority`, `status`
     - `customer` - `{ name, address, phone?, email? }`
     - `description` - Scope of work text
     - `tasks` - Array of `{ description, assignee?, completed?, hours? }`
     - `parts` - Array of `{ name, partNumber?, quantity, unitCost }`
     - `labor-rate`, `notes`
     - `variant` ("standard" | "compact")
   - **Methods:** `print()`, `toJSON()`
   - **Events:** `task-toggle`, `status-change`, `wo-sign`

85. [ ] `<snice-estimate>` - Quote/estimate card
   - Similar to invoice but pre-sale — accept/decline CTA
   - Expiry date, validity period
   - Line items with optional/included toggle per item
   - Comparison variant showing multiple estimate options
   - **Properties:**
     - `estimate-number`, `date`, `expiry-date`, `status` ("draft" | "sent" | "accepted" | "declined" | "expired")
     - `from`, `to` (same as invoice)
     - `items` - Array of `{ description, quantity, unitPrice, optional? }`
     - `currency`, `tax-rate`, `discount`, `notes`
     - `variant` ("standard" | "comparison")
   - **Methods:** `print()`, `toJSON()`
   - **Events:** `estimate-accept`, `estimate-decline`, `item-toggle`

### Data Entry & Workflows

86. [ ] `<snice-form-builder>` - Drag-and-drop form designer
   - Outputs JSON schema describing form structure
   - Field types: text, number, email, phone, select, date, checkbox, radio, file, signature, section header, paragraph
   - Drag to reorder fields, click to edit field properties
   - Preview mode to test the form
   - **Properties:**
     - `schema` - JSON schema (input/output)
     - `mode` ("edit" | "preview")
     - `field-types` - Array of available field types (customizable)
   - **Methods:** `getSchema()`, `setSchema(schema)`, `addField(type)`, `removeField(id)`, `preview()`
   - **Events:** `schema-change`, `field-add`, `field-remove`, `field-reorder`

87. [ ] `<snice-approval-flow>` - Visual approval chain
   - Sequence of approver nodes: avatar, name, role, status (pending/approved/rejected/skipped)
   - Current step highlighted, comments per step
   - Horizontal or vertical orientation
   - **Properties:**
     - `steps` - Array of `{ id, approver, role?, avatar?, status, comment?, timestamp? }`
     - `orientation` ("horizontal" | "vertical")
     - `current-step` - ID of active step
   - **Events:** `step-approve`, `step-reject`, `step-comment`

88. [ ] `<snice-data-card>` - Key-value detail panel
   - Label/value rows, grouped into sections
   - Edit-in-place toggle per field or global
   - Supports various value types: text, link, badge, date, currency
   - **Properties:**
     - `fields` - Array of `{ label, value, type?, editable?, group?, icon? }`
     - `editable` - Boolean, global edit mode
     - `variant` ("default" | "horizontal" | "compact")
   - **Methods:** `getValues()`, `setValues(data)`
   - **Events:** `field-change`, `field-save`

### Scheduling & Resources

89. [ ] `<snice-scheduler>` - Multi-resource week/day scheduler
   - Rows = resources (people, rooms, equipment), columns = time slots
   - Drag to create/resize/move events on the grid
   - Day/week/month view toggle
   - **Properties:**
     - `resources` - Array of `{ id, name, avatar?, color? }`
     - `events` - Array of `{ id, resourceId, start, end, title, color? }`
     - `view` ("day" | "week" | "month")
     - `date` - Current view date
     - `granularity` - Slot size in minutes (15, 30, 60)
     - `start-hour`, `end-hour`
   - **Methods:** `addEvent(event)`, `removeEvent(id)`, `scrollToDate(date)`, `scrollToResource(id)`
   - **Events:** `event-create`, `event-move`, `event-resize`, `event-click`, `slot-click`

90. [ ] `<snice-booking>` - Appointment booking widget
   - Step 1: date picker (calendar)
   - Step 2: available time slots for selected date
   - Step 3: confirmation with name/email/notes
   - **Properties:**
     - `available-dates` - Array of dates or date ranges
     - `available-slots` - Array of `{ date, time, duration }` or callback
     - `duration` - Default appointment duration in minutes
     - `min-date`, `max-date`
     - `fields` - Custom form fields for step 3
     - `variant` ("stepper" | "inline")
   - **Methods:** `reset()`, `getBooking()`
   - **Events:** `date-select`, `slot-select`, `booking-confirm`, `booking-cancel`

91. [ ] `<snice-availability>` - Weekly availability grid
   - 7 columns (Mon-Sun), rows = time slots
   - Toggle cells on/off by clicking or dragging
   - Presets: "Business hours", "Weekdays only", "Clear all"
   - **Properties:**
     - `value` - Array of `{ day, start, end }` ranges
     - `granularity` - Slot size in minutes (15, 30, 60)
     - `start-hour`, `end-hour`
     - `format` ("12h" | "24h")
     - `readonly`
   - **Methods:** `getAvailability()`, `setAvailability(ranges)`, `clear()`
   - **Events:** `availability-change`

### Communication & Collaboration

92. [ ] `<snice-activity-feed>` - Activity/audit log feed
   - Vertical timeline of activity entries
   - Each entry: icon, actor (avatar + name), action verb, target, timestamp
   - Filterable by activity type
   - Infinite scroll / load more
   - **Properties:**
     - `activities` - Array of `{ id, actor, action, target?, timestamp, icon?, type?, meta? }`
     - `filter` - Active filter type
     - `group-by` ("none" | "date")
   - **Methods:** `addActivity(activity)`, `clearFilter()`
   - **Events:** `activity-click`, `load-more`

93. [ ] `<snice-mentions>` - @mention input
   - Text input/textarea with inline @mention autocomplete
   - Triggered by typing `@`, shows filtered user list dropdown
   - Mentions rendered as styled chips/badges in the text
   - Returns structured content with mention references
   - **Properties:**
     - `value` - Raw text with mention markers
     - `users` - Array of `{ id, name, avatar? }` for autocomplete
     - `placeholder`, `readonly`
     - `trigger` - Trigger character (default "@")
   - **Methods:** `getValue()`, `getPlainText()`, `getMentions()`
   - **Events:** `mention-add`, `mention-remove`, `value-change`

### Dashboards

94. [ ] `<snice-stat-group>` - Coordinated row of KPI cards
   - Row of `<snice-kpi>` instances with consistent sizing
   - Comparison period (vs. last week/month/year)
   - Responsive: wraps to grid on narrow viewports
   - **Properties:**
     - `stats` - Array of `{ label, value, trend?, trendValue?, icon?, color? }`
     - `columns` - Number of cards per row (default: auto)
     - `variant` ("card" | "minimal" | "bordered")
   - **Events:** `stat-click`

95. [ ] `<snice-leaderboard>` - Ranked list
   - Position #, avatar, name, score, change indicator (+2/-1)
   - Podium variant for top 3 with medal styling
   - Highlight current user row
   - **Properties:**
     - `entries` - Array of `{ rank, name, avatar?, score, change?, highlighted? }`
     - `variant` ("list" | "podium")
     - `metric-label` - Label for the score column
   - **Events:** `entry-click`

96. [ ] `<snice-metric-table>` - Compact metrics table
   - Data table optimized for numeric/metric data
   - Sparklines in cells, color-coded values (red/green for neg/pos)
   - Built-in sorting by any metric column
   - Compact row density
   - **Properties:**
     - `columns` - Array of `{ key, label, type?, format?, sparkline? }`
     - `data` - Array of row objects
     - `sort-by`, `sort-direction`
   - **Events:** `sort-change`, `row-click`

### E-commerce & Transactions

97. [ ] `<snice-product-card>` - Product display card
   - Image (with gallery/carousel for multiple), title, price
   - Sale price with original crossed out
   - Star rating, review count
   - Variant selectors (size chips, color swatches)
   - Add-to-cart CTA button
   - **Properties:**
     - `name`, `price`, `sale-price`, `currency`
     - `images` - Array of image URLs
     - `rating`, `review-count`
     - `variants` - Array of `{ type, options: string[] }`
     - `in-stock` - Boolean
     - `variant` ("vertical" | "horizontal" | "compact")
   - **Events:** `add-to-cart`, `variant-select`, `image-click`

98. [ ] `<snice-cart>` - Shopping cart summary
   - Line items with thumbnail, name, qty +/- controls, line total
   - Remove item button
   - Subtotal, discount/coupon field, tax, total
   - Checkout CTA
   - **Properties:**
     - `items` - Array of `{ id, name, image?, price, quantity, variant? }`
     - `currency`, `tax-rate`, `discount`
     - `coupon-code`
   - **Methods:** `addItem(item)`, `removeItem(id)`, `updateQuantity(id, qty)`, `applyCoupon(code)`, `clear()`
   - **Events:** `item-add`, `item-remove`, `quantity-change`, `coupon-apply`, `checkout`

99. [ ] `<snice-order-tracker>` - Order status timeline
   - Horizontal stepper: ordered > confirmed > shipped > out for delivery > delivered
   - Each step: icon, label, date/time, optional description
   - Current step highlighted, completed steps checked
   - Tracking number and carrier info
   - **Properties:**
     - `steps` - Array of `{ label, status, timestamp?, description?, icon? }`
     - `tracking-number`, `carrier`
     - `variant` ("horizontal" | "vertical")
   - **Events:** `step-click`

### Auth & User

100. [ ] `<snice-user-card>` - Profile card
   - Avatar (large), name, role/title, company
   - Contact: email, phone, location
   - Social links row (icons)
   - Status indicator (online/away/offline/busy)
   - **Properties:**
     - `name`, `avatar`, `role`, `company`
     - `email`, `phone`, `location`
     - `social` - Array of `{ platform, url }`
     - `status` ("online" | "away" | "offline" | "busy")
     - `variant` ("card" | "horizontal" | "compact")
   - **Events:** `social-click`, `action-click`

101. [ ] `<snice-permission-matrix>` - Role/permission grid
   - Rows = roles, columns = permissions
   - Cells = checkbox/toggle for each role-permission pair
   - Group permissions by category
   - Read-only mode for viewing
   - **Properties:**
     - `roles` - Array of `{ id, name, description? }`
     - `permissions` - Array of `{ id, name, group?, description? }`
     - `matrix` - Object mapping `{ [roleId]: string[] }` (array of permission IDs)
     - `readonly`
   - **Methods:** `getMatrix()`, `setMatrix(matrix)`, `hasPermission(roleId, permId)`
   - **Events:** `permission-toggle`, `matrix-change`

---

## Missing vs Other Libraries (deduped)

Add components that other major libraries provide but Snice does not. Keep implementations minimal and avoid duplicating existing components.

102. [ ] `<snice-combobox>` - Editable input + dropdown
   - Diff: `snice-select` is selection-only (non-editable).

103. [ ] `<snice-popover>` - Anchored overlay container
   - Diff: `snice-tooltip` is content-only; `snice-menu` is action-only.

104. [ ] `<snice-segmented-control>` - Multi-option switcher
   - Diff: `snice-switch` is binary; `snice-tabs` is for content panes.

105. [ ] `<snice-split-button>` - Primary action + dropdown action
   - Diff: `snice-button` has no split action; `snice-menu` is separate.

106. [ ] `<snice-step-input>` - Numeric stepper control
   - Diff: `snice-input type="number"` lacks stepper UI.

107. [ ] `<snice-range-slider>` - Two-handle slider
   - Diff: `snice-slider` is single-handle.

108. [ ] `<snice-progress-ring>` - Determinate circular progress
   - Diff: `snice-progress` is linear; `snice-spinner` is indeterminate.

109. [ ] `<snice-icon>` - Icon element + registry
   - Diff: no icon component exists.

110. [ ] `<snice-tag>` - Display-only tag/token
   - Diff: `snice-chip` is close but not token-specific; `snice-tag-input` is input.

111. [ ] `<snice-form-layout>` - Form layout/grid
   - Diff: no form layout component exists.

112. [ ] `<snice-time-picker>` - Time-only picker
   - Diff: `snice-time-range-picker` is range; `snice-date-picker` is date-only.

113. [ ] `<snice-date-time-picker>` - Combined date+time picker
   - Diff: no combined date-time control exists.

114. [ ] `<snice-avatar-group>` - Grouped avatar stack
   - Diff: only `snice-avatar` exists.

115. [ ] `<snice-message-strip>` - Inline message bar
   - Diff: `snice-alert`/`snice-banner`/`snice-toast` are different patterns.

---

## SNICE DECORATOR PATTERNS - REQUIRED FOR ALL COMPONENTS

### DOM Queries
- `@query(selector)` — NOT `this.shadowRoot.querySelector()`
- `@queryAll(selector)` — NOT `this.shadowRoot.querySelectorAll()`

### Event Handling
- `@on(event, options)` — NOT `addEventListener` + `removeEventListener`
- Template `@event` binding — `html\`<button @click=\${this.handleClick}>\``

### Custom Events
- `@dispatch(eventName, options)` — NOT `new CustomEvent()`

### Lifecycle
- `@ready()` — NOT `connectedCallback()`
- `@dispose()` — NOT `disconnectedCallback()`

### Mutation Observers
- `@observe(target, options)` — NOT `new MutationObserver()`

### Property Watching
- `@watch(propertyName)` — NOT manual property change detection

### Request/Respond (async data)
- `@request(channel)` / `@respond(channel)` — for component-to-controller data flow
