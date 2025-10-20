# Component Tests

## Overview

This directory contains tests for Snice v3 components located in `/components`.

## Test Infrastructure

### Test Utilities (`test-utils.ts`)

Helper functions for component testing:

- `createComponent<T>(tagName, attributes)` - Creates and appends a component, waits for it to be ready
- `removeComponent(el)` - Removes component from DOM
- `wait(ms)` - Wait for specified milliseconds
- `waitForRender()` - Wait for v3 @render() microtasks to complete
- `queryShadow(el, selector)` - Query within shadow DOM
- `queryShadowAll(el, selector)` - Query all within shadow DOM
- `triggerEvent(el, eventName, detail)` - Dispatch custom events
- `triggerKeyboardEvent(el, key, type, options)` - Dispatch keyboard events
- `triggerMouseEvent(el, type, options)` - Dispatch mouse events

### Component Test Pattern

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, waitForRender } from './test-utils';
import '../../components/badge/snice-badge';
import type { SniceBadgeElement } from '../../components/badge/snice-badge.types';

describe('snice-badge', () => {
  let badge: SniceBadgeElement;

  afterEach(() => {
    if (badge) {
      removeComponent(badge as HTMLElement);
    }
  });

  it('should render badge element', async () => {
    badge = await createComponent<SniceBadgeElement>('snice-badge');
    expect(badge).toBeTruthy();
  });

  it('should update when property changes', async () => {
    badge = await createComponent<SniceBadgeElement>('snice-badge');

    badge.content = 'New';
    await waitForRender(); // Wait for v3 render to complete

    const badgeEl = queryShadow(badge as HTMLElement, '.badge');
    expect(badgeEl?.textContent).toBe('New');
  });
});
```

## Component Fixes Applied

### V3 Components - @styles() Decorator

All v3 components using `@styles()` were updated to use the `css` template tag:

**Before:**
```typescript
import { element, property, render, styles, html } from 'snice';
import cssContent from './component.css?inline';

@styles()
componentStyles() {
  return cssContent; // ❌ Plain string
}
```

**After:**
```typescript
import { element, property, render, styles, html, css } from 'snice';
import cssContent from './component.css?inline';

@styles()
componentStyles() {
  return css`${cssContent}`; // ✅ css template tag
}
```

**Fixed Components:**
- `components/alert/snice-alert.ts`
- `components/avatar/snice-avatar.ts`
- `components/badge/snice-badge.ts`
- `components/layout/snice-layout-blog.ts`
- `components/layout/snice-layout-dashboard.ts`
- `components/layout/snice-layout-landing.ts`
- `components/layout/snice-layout-sidebar.ts`
- `components/nav/snice-nav.ts`

## VSCode File Nesting

Added `.vscode/settings.json` to nest component files:

```json
{
  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.expand": false,
  "explorer.fileNesting.patterns": {
    "*.ts": "${capture}.types.ts, ${capture}.css, ${capture}.test.ts, ${capture}.spec.ts"
  }
}
```

## Test Files Created

1. **badge.test.ts** - Tests for snice-badge component (15 tests)
   - Basic functionality
   - Content display (text, count, dot)
   - Variants
   - Pulse effect
   - API methods
   - Offset property

2. **button.test.ts** - Tests for snice-button component
   - Basic functionality
   - Variants (default, primary, success, warning, danger)
   - Sizes (small, medium, large)
   - Modifiers (outline, pill, circle)
   - Disabled state
   - Loading state
   - Icon support
   - Click events
   - API methods

3. **checkbox.test.ts** - Tests for snice-checkbox component
   - Basic functionality
   - Checked state
   - Indeterminate state
   - Disabled state
   - Required state
   - Invalid state
   - Sizes
   - Label
   - Form integration
   - API methods

## Current Status

### Completed ✅
- Test infrastructure setup with comprehensive utilities
- VSCode file nesting configuration
- Fixed all 8 v3 components to use css template tag
- Created test utilities for component testing
- Created tests for 3 core components (badge, button, checkbox)
- **Fixed badge component template interpolation issue**
- **Migrated button component from v2 to v3 API**
- **Migrated checkbox component from v2 to v3 API**
- All core Snice tests passing (465 tests across 48 test files)
- Badge component tests passing (15/15)
- Button component tests passing (30/30)
- Checkbox component tests passing (24/24)
- **All tests passing: 534 tests across 51 test files**

### Pending ⏳
- Create tests for remaining 58 components
- Add Playwright e2e tests for interactive components
- Verify all components build and work correctly

## Issues Fixed

### 1. V3 Component Template Interpolation Bug

**Problem:** Multiple interpolations in the same attribute value don't work correctly in v3 templates.

**Example that FAILS:**
```typescript
html`<span class="badge ${this.dot ? 'dot' : ''} ${this.pulse ? 'pulse' : ''}"></span>`
// Results in: <span class=""></span>
```

**Solution:** Compute the final attribute value in a variable first:
```typescript
const classes = `badge${this.dot ? ' dot' : ''}${this.pulse ? ' pulse' : ''}`;
html`<span class="${classes}"></span>`
// Results in: <span class="badge dot pulse"></span>
```

**Fixed in:** `components/badge/snice-badge.ts`

### 2. V3 Async Rendering in Tests

**Problem:** V3 components using `@render()` queue rendering in microtasks, so tests need to wait for render to complete.

**Solution:**
1. Added `waitForRender()` helper that waits for microtasks to flush
2. Updated `createComponent()` to automatically wait for initial render
3. Tests call `waitForRender()` after setting properties

```typescript
const badge = await createComponent('snice-badge'); // Waits for initial render
badge.content = 'Test';
await waitForRender(); // Wait for re-render
const el = queryShadow(badge, '.badge'); // Now element exists
```

### 3. V2 to V3 Component Migration

**Problem:** Some components (button, checkbox) were using v2 API (`html()` and `css()` methods) which doesn't create shadow DOM in v3.

**Solution:** Migrate to v3 API using `@render()` and `@styles()` decorators.

#### Migration Pattern:

**Step 1: Update imports**
```typescript
// Before (v2)
import { element, property, query, on, dispatch, watch, ready } from 'snice';
import css from './component.css?inline';

// After (v3)
import { element, property, query, render, styles, html, css as cssTag } from 'snice';
import cssContent from './component.css?inline';
```

**Step 2: Convert html() to @render()**
```typescript
// Before (v2)
html() {
  return /*html*/`
    <button class="${classes}">
      ${content}
    </button>
  `;
}

// After (v3)
@render()
renderContent() {
  return html`
    <button class="${classes}">
      ${content}
    </button>
  `;
}
```

**Step 3: Convert css() to @styles()**
```typescript
// Before (v2)
css() {
  return css;
}

// After (v3)
@styles()
componentStyles() {
  return cssTag`${cssContent}`;
}
```

**Step 4: Handle events in template**
```typescript
// Before (v2) - Used @on decorator on host element
@on('click')
handleClick(e: MouseEvent) {
  // handler logic
}

// After (v3) - Attach to internal element in template
@render()
renderContent() {
  return html`
    <button @click="${(e: MouseEvent) => this.handleInternalClick(e)}">
      ...
    </button>
  `;
}

private handleInternalClick(event: MouseEvent) {
  // handler logic
  this.dispatchEvent(new CustomEvent('@snice/click', {
    bubbles: true,
    composed: true,
    detail: { originalEvent: event }
  }));
}
```

**Step 5: Remove obsolete @watch decorators**

V3's differential rendering automatically updates the DOM when properties change, so most `@watch` methods are no longer needed.

```typescript
// Before (v2) - Needed to manually update DOM
@watch('disabled')
handleDisabledChange() {
  if (this.button) {
    this.button.disabled = this.disabled;
  }
}

// After (v3) - Not needed, differential rendering handles it
// Just remove these methods
```

**Step 6: Pre-compute class strings**

Due to the template interpolation bug, compute attribute values before using them in templates:

```typescript
@render()
renderContent() {
  // Pre-compute classes
  const classes = `button button--${this.variant}${this.disabled ? ' button--disabled' : ''}`;

  return html`
    <button class="${classes}">...</button>
  `;
}
```

**Migrated Components:**
- `components/button/snice-button.ts` (v2 → v3)
- `components/checkbox/snice-checkbox.ts` (v2 → v3)

## Next Steps

1. Create tests for high-priority components:
   - Input
   - Select
   - Modal
   - Tabs
   - Table
2. Migrate any remaining v2 components to v3 API
3. Add Playwright e2e tests for interactive components
4. Document component APIs and usage examples
