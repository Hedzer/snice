# Coding Standards

## Decorator Patterns (REQUIRED)

### DOM Queries
```typescript
// ✅ USE
@query('.my-element') myElement?: HTMLElement;
@queryAll('.my-items') myItems!: NodeListOf<HTMLElement>;

// ❌ NEVER
this.shadowRoot.querySelector(selector)
this.shadowRoot.querySelectorAll(selector)
```

### Event Handling
```typescript
// ✅ USE
@on('click', { target: '.button' })
handleClick(e: Event) {}

// ✅ Template binding
html`<button @click=${this.handleClick}>Click</button>`

// ❌ NEVER
element.addEventListener(event, handler)
```

### Custom Events
```typescript
// ✅ USE — kebab-case: component-action (e.g., timer-start, draw-end, switch-change)
@dispatch('my-event', { bubbles: true, composed: true })
private emitMyEvent() {
  return { value: this.value, component: this };
}

// ❌ NEVER
this.dispatchEvent(new CustomEvent(name, { detail, bubbles, composed }))
```

### Lifecycle
```typescript
// ✅ USE
@ready() init() { /* runs after initial render */ }
@dispose() cleanup() { /* teardown */ }

// ❌ NEVER
connectedCallback() { /* manual setup */ }
disconnectedCallback() { /* manual cleanup */ }
```

### Mutation Observers
```typescript
// ✅ USE
@observe(() => this.container, { childList: true })
handleMutation(mutations: MutationRecord[]) {}

// ❌ NEVER
new MutationObserver() + manual setup/cleanup
```

### Property Watching
```typescript
// ✅ USE
@watch('value')
handleValueChange(oldVal, newVal) {}
```

### Request/Respond (async data)
```typescript
// In component — request data and wait
@request('fetch-table-data')
fetchData!: (params: { search: string, page: number }) => Promise<TableData>;

// In controller/parent — handle request
@respond('fetch-table-data')
async handleDataRequest(req, respond) {
  const data = await fetch(`/api?search=${req.search}`).then(r => r.json());
  respond(data);
}
```

Use only when a component needs to request data and wait for a response.

---

## CSS: Theme Integration

Every `var()` MUST include a fallback value. Components must work without the theme loaded.

### Pattern: `var(--snice-property, fallback)`

```css
/* ✅ Correct */
color: var(--snice-color-text, rgb(23 23 23));
background: var(--snice-color-background, white);
padding: var(--snice-spacing-md, 1rem);

/* ❌ NEVER — missing fallback */
color: var(--snice-color-text);

/* ❌ NEVER — hard-coded without theme var */
background: #ffffff;
```

### Two-Tier Variable Pattern (complex components)
```css
:host {
  --component-bg: var(--snice-color-background, white);
  --component-text: var(--snice-color-text, rgb(23 23 23));
}
.component {
  background: var(--component-bg);
  color: var(--component-text);
}
```

### :host Defaults
```css
:host {
  display: block;
  font-family: var(--snice-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif);
  contain: layout style paint;
}
```

### Token Reference

**Colors:**
```css
var(--snice-color-text, rgb(23 23 23))
var(--snice-color-text-secondary, rgb(82 82 82))
var(--snice-color-text-tertiary, rgb(115 115 115))
var(--snice-color-text-inverse, rgb(250 250 250))
var(--snice-color-background, rgb(255 255 255))
var(--snice-color-background-element, rgb(252 251 249))
var(--snice-color-border, rgb(226 226 226))
var(--snice-color-primary, rgb(37 99 235))
var(--snice-color-success, rgb(22 163 74))
var(--snice-color-danger, rgb(220 38 38))
```

**Spacing:**
```css
var(--snice-spacing-3xs, 0.125rem)   /* 2px */
var(--snice-spacing-2xs, 0.25rem)    /* 4px */
var(--snice-spacing-xs, 0.5rem)      /* 8px */
var(--snice-spacing-sm, 0.75rem)     /* 12px */
var(--snice-spacing-md, 1rem)        /* 16px */
var(--snice-spacing-lg, 1.5rem)      /* 24px */
var(--snice-spacing-xl, 2rem)        /* 32px */
```

**Typography:**
```css
var(--snice-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif)
var(--snice-font-size-md, 1rem)
var(--snice-font-size-lg, 1.125rem)
var(--snice-font-size-2xl, 1.5rem)
var(--snice-font-weight-medium, 500)
var(--snice-font-weight-semibold, 600)
var(--snice-font-weight-bold, 700)
var(--snice-line-height-normal, 1.5)
```

**Visual Effects:**
```css
var(--snice-border-radius-md, 0.25rem)
var(--snice-border-radius-lg, 0.5rem)
var(--snice-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1))
var(--snice-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1))
var(--snice-transition-fast, 150ms)
var(--snice-transition-medium, 250ms)
```

**Focus:**
```css
var(--snice-focus-ring-width, 2px)
var(--snice-focus-ring-color, rgb(59 130 246 / 0.5))
var(--snice-focus-ring-offset, 2px)
```

---

## CSS: Units (Hybrid rem/px)

### Convert to rem (scales with user font preferences):
- Padding, margins, gap
- Font sizes
- Icon/component sizes, width/height for content
- Internal component spacing

### Keep as px (stays fixed):
- Borders (`border-width`, `outline-width`) — crisp 1px lines
- Border radius — consistent corners
- Box shadows — consistent depth
- Small offsets (`outline-offset`, small `translateY`)
- Divider thickness

### Conversion Reference (16px = 1rem)
```
4px  → 0.25rem     24px → 1.5rem
6px  → 0.375rem    32px → 2rem
8px  → 0.5rem      40px → 2.5rem
10px → 0.625rem    48px → 3rem
12px → 0.75rem     64px → 4rem
14px → 0.875rem    96px → 6rem
16px → 1rem
18px → 1.125rem
20px → 1.25rem
```

---

## Testing

### Unit Tests (Vitest)
```bash
npm test                   # All tests
npm run test:src           # Source tests
npm run test:built         # Dist tests
npm run test:cdn           # CDN tests
npm run test:react-adapters # React tests
npm run test:watch         # Watch mode
npm run test:ui            # Vitest UI
npm run test:coverage      # Coverage
```

- `await el.ready` before assertions
- `el.shadowRoot.querySelector()` for shadow DOM

### Playwright (E2E)

**Rules:**
- Temp files go in `.debug/` — delete after use
- Real tests go in `tests/`
- Always headless — no `--headed`, no screenshots
- Use console logs and text content for debugging

```bash
npx playwright test .debug/test-file.spec.js --project=chromium
```

**Debug pattern:**
```javascript
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
```

---

## Container Components: Dual API Pattern

Any component that represents a **collection** (group, list, feed, grid of items) MUST support both:

### 1. Imperative API — JS property with array of objects
```typescript
group.avatars = [
  { name: 'Alice', src: '...' },
  { name: 'Bob' }
];
```

### 2. Declarative API — child elements in the slot
```html
<snice-avatar-group>
  <snice-avatar name="Alice" src="..."></snice-avatar>
  <snice-avatar name="Bob"></snice-avatar>
</snice-avatar-group>
```

### The container must add value
The container isn't just a wrapper — it provides layout and behavior that individual items don't have on their own:
- **Layout effects**: overlap/stack, grid arrangement, spacing normalization
- **Overflow handling**: "+3 more" badge, truncation, expand/collapse
- **Size normalization**: force consistent sizing on children
- **Shared context**: pass down variant, size, orientation to children
- **Aggregate behavior**: select-all, bulk actions, keyboard navigation across items

### Implementation pattern
- Use `<slot>` for declarative children
- Use `@observe` to watch for slotted children changes
- When the array property is set, render items internally
- When children are slotted, use them as-is but apply container effects
- Children take precedence if both are provided (slot wins over array)

### Examples of container components
`avatar-group`, `stat-group`, `activity-feed`, `leaderboard`, `metric-table`, `tag` (as tag-group), `breadcrumbs`, `stepper`, `tabs`, `carousel`, `nav`

---

## General Dos and Don'ts

### ✅ DO:
- Use semantic color tokens (`text`, `background`, `primary`)
- Use spacing tokens for consistency
- Provide fallback values on every `var()`
- Test components without theme loaded
- Use the two-tier variable pattern for complex components
- Use `contain: layout style paint` on `:host`
- Use RGB values in fallbacks (not hex or named colors)
- Method calls on components are fine (e.g., `camera.capture()`)
- Events for state changes so parents can react

### ❌ DON'T:
- Use theme variables without fallbacks
- Mix hard-coded values with theme values
- Use px for spacing/typography (use rem)
- Skip accessibility testing in light and dark modes
- Use `this.shadowRoot.querySelector` (use `@query`)
- Use `addEventListener`/`removeEventListener` (use `@on`)
- Use `new MutationObserver` (use `@observe`)
- Use `connectedCallback`/`disconnectedCallback` (use `@ready`/`@dispose`)
- Use `dispatchEvent(new CustomEvent(...))` (use `@dispatch`)

### Known Gotchas
- `contain: layout style paint` on `:host` can block flex `align-items: stretch` — fix with `width: 100%` on `:host`
- Compound expressions in `<if>` template get stripped by Rollup/Terser — pre-compute as separate `const` variables
- Table CDN build doesn't include snice-column/snice-row — use programmatic `setColumns()`/`setData()` + `requestAnimationFrame`
