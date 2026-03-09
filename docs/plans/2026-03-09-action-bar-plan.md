# Action Bar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build `snice-action-bar`, a positioned animated container for contextual actions with slotted content.

**Architecture:** Slot-only component using `position: absolute` within a relative parent. CSS transitions for fade+slide animation. Roving tabindex for keyboard nav. Follows existing drawer/banner patterns for show/hide lifecycle.

**Tech Stack:** Snice decorators (@element, @property, @watch, @dispatch, @render, @styles, @query, @on, @ready, @dispose), CSS transitions, role="toolbar"

**Design doc:** `docs/plans/2026-03-09-action-bar-design.md`

**Component checklist:** `.ai/component-checklist.md` — verify ALL items before marking complete.

## REQUIRED READING — Complete ALL before writing any code

### Project instructions (read first)
1. `CLAUDE.md` — project instructions, overrides, all links mentioned must be followed

### Development guidelines (read second)
2. `docs/ai/README.md` — API reference, pitfalls, decorator patterns, component import patterns
3. `docs/ai/DEVELOPMENT.md` — build system, testing, component file structure, adding components checklist, CDN builds, React adapters, test generation, component template

### Internal coding standards (read third — these are mandatory)
4. `.ai/coding-standards.md` — REQUIRED decorator patterns (@query, @on, @dispatch, @ready, @dispose, @observe, @watch, @request/@respond), CSS theme integration with fallbacks, units (rem vs px), two-tier variable pattern, container component dual API, dos and don'ts
5. `.ai/component-checklist.md` — every item must be satisfied before component is complete
6. `.ai/component-docs-guide.md` — exact doc format for both human and AI docs, section order, writing rules
7. `.ai/notes.md` — project organization (customer-facing vs internal), file naming, camera/timer rules, scroll spy notes
8. `.ai/playwright-testing.md` — E2E testing rules, .debug/ only for temp files, always headless
9. `.ai/tasks.md` — has pending tasks list AND required snice decorator patterns reference at the bottom
10. `.ai/release-checklist.md` — release process, when to manually update llms.txt

### Design spec (read fourth)
11. `docs/plans/2026-03-09-action-bar-design.md` — the design spec for this component

### Reference files (read as needed during implementation)
- `components/banner/snice-banner.ts` — closest pattern to follow (show/hide, events, @watch)
- `components/banner/snice-banner.types.ts` — types file pattern
- `components/banner/snice-banner.css` — CSS pattern with theme tokens and fallbacks
- `components/theme/theme.css` — all available CSS custom properties
- `components/drawer/snice-drawer.ts` — positioning and escape key patterns
- `components/tooltip/snice-tooltip.ts` — keyboard navigation pattern

---

### Task 1: Add to WIP list

**Files:**
- Modify: `components/.wip`

**Step 1: Add action-bar to WIP**

Add `action-bar` to `components/.wip` so it's excluded from builds while in development.

**Step 2: Create component directory**

```bash
mkdir -p components/action-bar
```

**Step 3: Commit**

```bash
git add components/.wip
git commit -m "chore: add action-bar to WIP list"
```

---

### Task 2: Types file

**Files:**
- Create: `components/action-bar/snice-action-bar.types.ts`

**Step 1: Write types**

```typescript
export type ActionBarPosition = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type ActionBarSize = 'small' | 'medium';
export type ActionBarVariant = 'default' | 'pill';

export interface SniceActionBarElement extends HTMLElement {
  open: boolean;
  position: ActionBarPosition;
  size: ActionBarSize;
  variant: ActionBarVariant;
  noAnimation: boolean;
  noEscapeDismiss: boolean;

  show(): void;
  hide(): void;
  toggle(): void;
}

export interface ActionBarEventDetail {
  actionBar: SniceActionBarElement;
}
```

**Step 2: Commit**

```bash
git add components/action-bar/snice-action-bar.types.ts
git commit -m "feat(action-bar): add type definitions"
```

---

### Task 3: CSS file

**Files:**
- Create: `components/action-bar/snice-action-bar.css`
- Reference: `.ai/coding-standards.md` for theme token patterns, units, fallbacks

**Step 1: Read theme.css for available tokens**

Read `components/theme/theme.css` to understand available custom properties.

**Step 2: Write styles**

Key requirements:
- `:host` uses `contain: layout style paint`, `display: block`, `position: absolute`
- Position mapping via `:host([position="..."])` attribute selectors using CSS inset properties
- Size variants via `:host([size="small"])`
- Pill variant via `:host([variant="pill"])`
- Animation: CSS transitions on `opacity` and `transform`
- Hidden state (not open, not no-animation): `opacity: 0`, `pointer-events: none`, translated away from anchor
- Open state: `opacity: 1`, `pointer-events: auto`, `transform: none`
- `no-animation` state: no transition, always visible
- All `var()` calls MUST have fallbacks
- Spacing/typography in rem, borders/shadows in px
- Two-tier variable pattern for customizable properties

```css
:host {
  display: block;
  position: absolute;
  z-index: var(--action-bar-z-index, 10);
  font-family: var(--snice-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif);
  contain: layout style paint;
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--snice-transition-medium, 250ms) ease, transform var(--snice-transition-medium, 250ms) ease;
}

:host([open]),
:host([no-animation]) {
  pointer-events: auto;
  opacity: 1;
  transform: translate(0, 0);
}

:host([no-animation]) {
  transition: none;
}

/* Position: bottom (default) — centered bottom, slides up */
:host,
:host([position="bottom"]) {
  bottom: var(--snice-spacing-sm, 0.75rem);
  left: 50%;
  transform: translate(-50%, 0.5rem);
}
:host([position="bottom"][open]),
:host([position="bottom"][no-animation]) {
  transform: translate(-50%, 0);
}

/* Position: top — centered top, slides down */
:host([position="top"]) {
  top: var(--snice-spacing-sm, 0.75rem);
  left: 50%;
  transform: translate(-50%, -0.5rem);
}
:host([position="top"][open]),
:host([position="top"][no-animation]) {
  transform: translate(-50%, 0);
}

/* Position: left — centered left, slides right */
:host([position="left"]) {
  left: var(--snice-spacing-sm, 0.75rem);
  top: 50%;
  transform: translate(-0.5rem, -50%);
}
:host([position="left"][open]),
:host([position="left"][no-animation]) {
  transform: translate(0, -50%);
}

/* Position: right — centered right, slides left */
:host([position="right"]) {
  right: var(--snice-spacing-sm, 0.75rem);
  top: 50%;
  transform: translate(0.5rem, -50%);
}
:host([position="right"][open]),
:host([position="right"][no-animation]) {
  transform: translate(0, -50%);
}

/* Corners */
:host([position="top-left"]) {
  top: var(--snice-spacing-sm, 0.75rem);
  left: var(--snice-spacing-sm, 0.75rem);
  transform: translate(-0.5rem, -0.5rem);
}
:host([position="top-left"][open]),
:host([position="top-left"][no-animation]) {
  transform: translate(0, 0);
}

:host([position="top-right"]) {
  top: var(--snice-spacing-sm, 0.75rem);
  right: var(--snice-spacing-sm, 0.75rem);
  transform: translate(0.5rem, -0.5rem);
}
:host([position="top-right"][open]),
:host([position="top-right"][no-animation]) {
  transform: translate(0, 0);
}

:host([position="bottom-left"]) {
  bottom: var(--snice-spacing-sm, 0.75rem);
  left: var(--snice-spacing-sm, 0.75rem);
  transform: translate(-0.5rem, 0.5rem);
}
:host([position="bottom-left"][open]),
:host([position="bottom-left"][no-animation]) {
  transform: translate(0, 0);
}

:host([position="bottom-right"]) {
  bottom: var(--snice-spacing-sm, 0.75rem);
  right: var(--snice-spacing-sm, 0.75rem);
  transform: translate(0.5rem, 0.5rem);
}
:host([position="bottom-right"][open]),
:host([position="bottom-right"][no-animation]) {
  transform: translate(0, 0);
}

/* Inner container */
.action-bar {
  display: inline-flex;
  align-items: center;
  gap: var(--action-bar-gap, var(--snice-spacing-2xs, 0.25rem));
  padding: var(--action-bar-padding, var(--snice-spacing-xs, 0.5rem));
  background: var(--action-bar-background, var(--snice-color-background-element, rgb(252 251 249)));
  border: var(--action-bar-border, 1px solid var(--snice-color-border, rgb(226 226 226)));
  border-radius: var(--action-bar-border-radius, var(--snice-border-radius-lg, 0.5rem));
  box-shadow: var(--action-bar-shadow, var(--snice-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)));
}

/* Pill variant */
:host([variant="pill"]) .action-bar {
  border-radius: 9999px;
}

/* Size: small */
:host([size="small"]) .action-bar {
  gap: var(--snice-spacing-3xs, 0.125rem);
  padding: var(--snice-spacing-2xs, 0.25rem) var(--snice-spacing-xs, 0.5rem);
}
```

**Step 3: Commit**

```bash
git add components/action-bar/snice-action-bar.css
git commit -m "feat(action-bar): add component styles"
```

---

### Task 4: Component implementation

**Files:**
- Create: `components/action-bar/snice-action-bar.ts`
- Reference: `components/banner/snice-banner.ts` for pattern

**Step 1: Write component**

```typescript
import { element, property, watch, dispatch, render, styles, on, ready, dispose } from 'snice';
import { html, css } from 'snice';
import cssContent from './snice-action-bar.css?inline';
import type { ActionBarPosition, ActionBarSize, ActionBarVariant, SniceActionBarElement, ActionBarEventDetail } from './snice-action-bar.types';

@element('snice-action-bar')
export class SniceActionBar extends HTMLElement implements SniceActionBarElement {
  @property({ type: Boolean }) open = false;
  @property() position: ActionBarPosition = 'bottom';
  @property() size: ActionBarSize = 'medium';
  @property() variant: ActionBarVariant = 'default';
  @property({ type: Boolean, attribute: 'no-animation' }) noAnimation = false;
  @property({ type: Boolean, attribute: 'no-escape-dismiss' }) noEscapeDismiss = false;

  @watch('open')
  handleOpenChange() {
    if (this.open) {
      this.setAttribute('open', '');
      this.emitOpen();
    } else {
      this.removeAttribute('open');
      this.emitClose();
    }
  }

  @watch('noAnimation')
  handleNoAnimationChange() {
    if (this.noAnimation) {
      this.setAttribute('no-animation', '');
    } else {
      this.removeAttribute('no-animation');
    }
  }

  @dispatch('action-bar-open', { bubbles: true, composed: true })
  private emitOpen(): ActionBarEventDetail {
    return { actionBar: this };
  }

  @dispatch('action-bar-close', { bubbles: true, composed: true })
  private emitClose(): ActionBarEventDetail {
    return { actionBar: this };
  }

  @on('keydown')
  handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && !this.noEscapeDismiss) {
      this.hide();
      return;
    }

    const focusable = this.getFocusableChildren();
    if (focusable.length === 0) return;

    const current = focusable.indexOf(document.activeElement as HTMLElement);
    let next = -1;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      next = current < focusable.length - 1 ? current + 1 : 0;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      next = current > 0 ? current - 1 : focusable.length - 1;
    } else if (e.key === 'Home') {
      e.preventDefault();
      next = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      next = focusable.length - 1;
    }

    if (next >= 0) {
      focusable[next].focus();
    }
  }

  show() {
    this.open = true;
  }

  hide() {
    this.open = false;
  }

  toggle() {
    this.open = !this.open;
  }

  private getFocusableChildren(): HTMLElement[] {
    const slot = this.shadowRoot?.querySelector('slot');
    if (!slot) return [];
    const elements = slot.assignedElements({ flatten: true }) as HTMLElement[];
    return elements.filter(el =>
      !el.hasAttribute('disabled') &&
      (el.tabIndex >= 0 || el.matches('button, [href], input, select, textarea, [tabindex]'))
    );
  }

  @render()
  template() {
    return html`
      <div class="action-bar" role="toolbar" part="base">
        <slot></slot>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css`${cssContent}`;
  }
}
```

**Step 2: Commit**

```bash
git add components/action-bar/snice-action-bar.ts
git commit -m "feat(action-bar): add component implementation"
```

---

### Task 5: Unit tests

**Files:**
- Create: `tests/components/action-bar.test.ts`
- Reference: `tests/components/banner.test.ts` for pattern

**Step 1: Write tests**

Test the following:
- Renders with default properties
- `open` property shows/hides
- `show()`, `hide()`, `toggle()` methods work
- `action-bar-open` and `action-bar-close` events fire
- `position` attribute renders correct positioning
- `variant="pill"` applies pill style
- `size="small"` applies small size
- `no-animation` mode: always visible
- `Escape` key calls hide
- `no-escape-dismiss` prevents Escape from closing
- Arrow key navigation between slotted children
- Slotted content renders in the slot

Use `createComponent`, `removeComponent`, `queryShadow`, `wait` from test utils. Import the component and types. Use `await el.ready` before assertions.

**Step 2: Run tests to verify they fail**

```bash
npm run test:src -- --grep "action-bar"
```

Expected: FAIL (component not built yet — but files exist)

**Step 3: Run tests to verify they pass**

```bash
npm run test:src -- --grep "action-bar"
```

Expected: All PASS

**Step 4: Commit**

```bash
git add tests/components/action-bar.test.ts
git commit -m "test(action-bar): add unit tests"
```

---

### Task 6: Demo page

**Files:**
- Create: `components/action-bar/demo.html`
- Reference: `components/banner/demo.html` for pattern

**Step 1: Write demo**

Create a demo page that shows:
- Basic action-bar with icon buttons (default variant)
- Pill variant
- All position values (top, bottom, left, right, corners)
- Size small vs medium
- Animated show/hide (hover a card to trigger)
- Always-visible (no-animation) mode
- Works in both light and dark mode (use theme tokens)

**Step 2: Manual test**

```bash
npm run dev
# Open http://localhost:5566/components/action-bar/demo.html
# Verify light mode, dark mode, hover animations
```

**Step 3: Commit**

```bash
git add components/action-bar/demo.html
git commit -m "feat(action-bar): add demo page"
```

---

### Task 7: Full showcase

**Files:**
- Create: `components/action-bar/full-showcase.html`

**Step 1: Write full showcase**

Demo ALL features: variants, sizes, positions, animation modes, keyboard nav. Follow existing full-showcase patterns from other components.

**Step 2: Commit**

```bash
git add components/action-bar/full-showcase.html
git commit -m "feat(action-bar): add full showcase"
```

---

### Task 8: Documentation

**Files:**
- Create: `docs/components/action-bar.md` (human-friendly)
- Create: `docs/ai/components/action-bar.md` (token-efficient)
- Reference: `.ai/component-docs-guide.md` for exact format

**Step 1: Write human docs**

Follow the section order from component-docs-guide.md:
1. Title + tag name
2. One-sentence description
3. Basic usage
4. Import paths (ESM + CDN)
5. Examples (variants, sizes, positions, animation, keyboard)
6. Slots
7. Properties table
8. Events table
9. Methods table
10. CSS Custom Properties table

**Step 2: Write AI docs**

Token-efficient format:
- TypeScript property signatures in code block
- Bullets for slots, events, methods
- One usage block
- 50-150 lines max

**Step 3: Commit**

```bash
git add docs/components/action-bar.md docs/ai/components/action-bar.md
git commit -m "docs(action-bar): add human and AI documentation"
```

---

### Task 9: React adapter + tests

**Files:**
- Modify: `scripts/generate-react-tests.js` (add test metadata)
- Reference: `scripts/generate-react-adapters.js` (auto-discovers, no changes needed)

**Step 1: Add test metadata to generate-react-tests.js**

Add entry for action-bar with properties, events, variants, sizes.

**Step 2: Generate adapters and tests**

```bash
npm run generate:react-adapters
npm run generate:react-tests
```

**Step 3: Run React tests**

```bash
npm run test:react-adapters -- --grep "action-bar"
```

Expected: PASS

**Step 4: Commit**

```bash
git add scripts/generate-react-tests.js adapters/react/ tests/react-adapters/
git commit -m "feat(action-bar): add React adapter and tests"
```

---

### Task 10: Website showcase

**Files:**
- Create: `public/showcases/action-bar.html` (fragment)
- Modify: `public/showcases/manifest.json` (add entry)
- Modify: `public/showcases/_footer.html` (add script tag + comp-list entry)

**Step 1: Write showcase fragment**

Start with `<div class="comp-section">`, use `comp-split` layout pattern. Interactive demo with hover trigger.

**Step 2: Add to manifest.json**

Add `"action-bar.html"` in the appropriate category section.

**Step 3: Add script tag and comp-list entry to _footer.html**

**Step 4: Rebuild showcases**

```bash
node public/build-showcases.js
```

**Step 5: Commit**

```bash
git add public/showcases/action-bar.html public/showcases/manifest.json public/showcases/_footer.html public/components.html
git commit -m "feat(action-bar): add website showcase"
```

---

### Task 11: Build and final verification

**Step 1: Remove from WIP**

Remove `action-bar` from `components/.wip`.

**Step 2: Full build**

```bash
npm run build
```

Expected: SUCCESS

**Step 3: CDN build**

```bash
npx snice build-component action-bar
```

**Step 4: Copy CDN to public**

```bash
node scripts/build-website.js
```

**Step 5: Run all tests**

```bash
npm test
```

Expected: ALL PASS

**Step 6: Verify against component checklist**

Run through every item in `.ai/component-checklist.md`:
- [ ] Pre-implementation items
- [ ] Implementation items
- [ ] Testing items
- [ ] React adapter items
- [ ] CDN build items
- [ ] Documentation items
- [ ] MCP server catalogue items
- [ ] Website integration items
- [ ] Final verification items

**Step 7: Commit**

```bash
git add .
git commit -m "feat(action-bar): complete component, remove from WIP"
```

---

### Stretch Goal: `for` attribute

Deferred to a follow-up task. When implemented:
- `for` property (string selector)
- `@ready()` resolves element via `this.closest(selector)` then `document.querySelector(selector)`
- Attaches mouseenter/mouseleave listeners
- `@dispose()` cleans up
- `@watch('for')` re-binds on change
