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

## All tasks 82-114 completed — moved to tasks-finished.md

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
