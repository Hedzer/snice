# Style

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
@on('click', '.button')
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
@observe('mutation:childList', '.container')
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
async *fetchData(params: Query): Response<TableData> {
  return yield params;
}

// In controller/parent — handle request
@respond('fetch-table-data')
async handleDataRequest(req: Query) {
  return fetch(`/api?search=${req.search}`).then(r => r.json());
}
```

Use only when a component needs to request data and wait for a response.

### Daemons (app-owned state/lifecycle)
```typescript
@daemon
class SessionDaemon {
  @respond('session/get')
  getSession() { return this.session; }
}

// Explicit construction and provisioning; never a singleton or global registry.
const session = new SessionDaemon();
const release = provideContext(appRoot, { daemons: { session } });

// Elements/controllers use the address and do not import SessionDaemon.
@request('session/get', { daemon: 'session' })
async *getSession(): Response<Session | null> { return yield {}; }
```

- Provide context before element connection/controller attachment.
- Use `@request`/`@respond` for one reply and `@dispatch`/`@on` for notifications.
- Call the provider's `release()` during app/test teardown.
- Do not combine `daemon` with DOM `scope` or selector delegation.

---

## CSS: Theme Integration

Every `var()` MUST include a fallback value. Components must work without the theme loaded.

**Fallback values must be the concrete default from `theme.css`** — not arbitrary values. If `--snice-color-primary` is `rgb(37 99 235)` in the theme, the fallback must be exactly `rgb(37 99 235)`. This ensures components look identical with or without the theme.

**Override hierarchy:** theme token → component-level variable → hardcoded fallback. The theme overrides everything; the fallback is the last resort, not a creative choice.

### Pattern: `var(--snice-property, fallback)`

```css
/* ✅ Correct — fallback matches theme.css default */
color: var(--snice-color-text, rgb(23 23 23));
background: var(--snice-color-surface, rgb(255 255 255));
padding: var(--snice-spacing-md, 1rem);

/* ❌ NEVER — missing fallback */
color: var(--snice-color-text);

/* ❌ NEVER — hard-coded without theme var */
background: #ffffff;

/* ❌ NEVER — fallback doesn't match theme.css default */
color: var(--snice-color-text, #333);  /* theme default is rgb(23 23 23), not #333 */
```

### Two-Tier Variable Pattern (complex components)

Component-level variables reference theme tokens with correct fallbacks. Internal elements use only the component variable (no fallback needed since `--component-*` is always defined on `:host`).

```css
:host {
  /* Component var → theme token → theme's default as fallback */
  --component-bg: var(--snice-color-surface, rgb(255 255 255));
  --component-text: var(--snice-color-text, rgb(23 23 23));
}
.component {
  /* Uses component var only — always defined above */
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
var(--snice-color-surface, rgb(255 255 255))
var(--snice-color-surface-container-high, rgb(252 251 249))
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
`avatar-group`, `stat-group`, `activity-feed`, `leaderboard`, `tag` (as tag-group), `breadcrumbs`, `stepper`, `tabs`, `carousel`, `nav`

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
- The Table CDN build includes `snice-table`, `snice-column`, `snice-row`, and cell dependencies. Declarative named slots and the programmatic API are both supported. Prefer reactive `table.columns = ...` / `table.data = ...`; an unpaired `setData()` is intentionally non-eager, so call `renderBody()` afterward.

## Component Documentation Guide

Every component needs **two** doc files:

- `docs/components/<name>.md` — Human-readable, detailed, with examples
- `docs/ai/components/<name>.md` — Low-token AI reference, concise

Both must stay in sync. When updating one, update the other.

---

### Human Docs: `docs/components/<name>.md`

Modeled after [Shoelace](https://shoelace.style) — the gold standard for web component docs.

#### Section Order (strict)

```
1. <!-- AI: ... --> comment (invisible HTML comment linking to AI docs)
2. # Component Name
3. Description paragraph
4. ## Table of Contents (links to all sections below)
5. ## Components (only if multi-element, e.g. accordion + accordion-item)
6. ## Properties (table format)
7. ## Methods
8. ## Events
9. ## Slots
10. ## CSS Parts (or ## CSS Custom Properties if applicable)
11. ## Basic Usage (simplest example + import statement)
12. ## Examples (H2, individual examples as H3)
13. ## Keyboard Navigation (only if applicable)
14. ## Accessibility
```

**Removed sections** (do NOT include):
- `## Importing` — merge import code into Basic Usage
- `## Browser Support`
- `## Common Patterns`

#### Section Details

##### 1. AI Comment + Title + Description

```markdown
<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/button.md -->

# Button Component

Buttons represent actions available to the user.
```

##### 2. Table of Contents

Links to every section that exists in the doc. Anchors are lowercase, spaces→hyphens.

```markdown
## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)
```

##### 3. Examples

Each example gets an H3 heading. Follow this pattern:

1. **One sentence** explaining when/why, referencing the attribute name in backticks
2. **Code example** showing the feature

Order examples: visual variants first, then behavioral features, then composition, then advanced.

```markdown
## Examples

### Variants

Use the `variant` attribute to set the button's visual style.

\`\`\`html
<snice-button variant="primary">Primary</snice-button>
<snice-button variant="success">Success</snice-button>
<snice-button variant="danger">Danger</snice-button>
\`\`\`

### Sizes

Use the `size` attribute to change the button's size.

\`\`\`html
<snice-button size="small">Small</snice-button>
<snice-button size="large">Large</snice-button>
\`\`\`

### Loading

Set the `loading` attribute to show a spinner and disable interaction.

\`\`\`html
<snice-button loading>Saving...</snice-button>
\`\`\`
```

**Rules for examples:**
- One feature per example
- Show 2-3 variations, not every permutation
- Real-world labels (not "Button 1", "Button 2")
- Include comments only when behavior isn't obvious

##### 6. Slots

Markdown table. List default slot first.

```markdown
## Slots

| Name | Description |
|------|-------------|
| (default) | Button label content |
| `icon` | Custom icon content (overrides `icon` property) |
```

##### 7. Properties

Markdown table with 4 columns. Show attribute name if it differs from the JS property.

```markdown
## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'text'` | `'default'` | Visual style |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `disabled` | `boolean` | `false` | Disables the button |
| `loading` | `boolean` | `false` | Shows loading spinner |
```

Note the attribute name when it differs:

```markdown
| `iconPlacement` (attr: `icon-placement`) | `'start' \| 'end'` | `'start'` | Icon position |
```

##### 8. Events

```markdown
## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `snice-click` | `{ originalEvent: MouseEvent }` | Fired on click |
```

##### 9. Methods

```markdown
## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `focus()` | `options?: FocusOptions` | Focuses the button |
| `blur()` | — | Removes focus |
```

##### 10-11. CSS Custom Properties & Parts (if applicable)

```markdown
## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--button-height` | Button height | `auto` |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The button element |
| `label` | The label container |
```

---

### AI Docs: `docs/ai/components/<name>.md`

**Goal: Minimum tokens, maximum signal.** An AI agent reading this should be able to use the component correctly without reading the human docs.

#### Format

AI docs follow the **same section order** as human docs, but in low-token format:

```markdown
# snice-<name>

One-line description.

## Properties

\`\`\`typescript
variant: 'default'|'primary'|'success'|'warning'|'danger'|'text' = 'default';
size: 'small'|'medium'|'large' = 'medium';
disabled: boolean = false;
loading: boolean = false;
\`\`\`

## Methods

- `focus(options?)` - Focus
- `blur()` - Remove focus

## Events

- `snice-click` → `{ originalEvent: MouseEvent }`

## Slots

- `(default)` - Label content
- `icon` - Custom icon (overrides `icon` prop)

## CSS Parts

- `base` - The button element
- `label` - The label container

## Basic Usage

\`\`\`html
<snice-button variant="primary">Save</snice-button>
<snice-button loading disabled>Processing</snice-button>
\`\`\`

## Accessibility

- Keyboard: Enter, Space to activate
- ARIA: role=button, aria-disabled
```

#### AI Doc Rules

- **TypeScript property signatures** in a single code block, not a table
- **Bullets** for slots, events, methods — not tables
- **One usage block** with the most common patterns, not exhaustive examples
- **No prose paragraphs** — every line carries information
- **No tutorials, no "Getting Started", no step-by-step**
- **Arrow notation** for event details: `event-name` → `{ payload }`
- **Dash notation** for methods: `methodName(args)` - description
- **50-150 lines max** per component

---

### Writing Docs From Source

When documenting a component, read these files:

1. `packages/components/src/<name>/snice-<name>.ts` — Properties (`@property`), methods, events (`@dispatch`), slots
2. `packages/components/src/<name>/snice-<name>.types.ts` — TypeScript interfaces and type definitions
3. `packages/components/src/<name>/snice-<name>.css` — CSS custom properties, parts
4. `website/showcases/<name>/full.html` — Working examples showing real usage

Extract:
- Every `@property()` decorator → Properties section
- Every `@dispatch()` decorator → Events section
- Every public method → Methods section
- Every `<slot>` in the template → Slots section
- Every `::part()` in CSS → CSS Parts section
- Every `--snice-*` custom property → CSS Custom Properties section
