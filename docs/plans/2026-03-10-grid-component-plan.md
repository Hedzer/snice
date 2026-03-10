# Grid Component Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create `snice-grid`, a grid-coordinate-based layout component with animated transitions and drag-and-drop, mirroring binpack's API patterns.

**Architecture:** Items declare grid positions via `grid-col`/`grid-row` attributes (and optional `grid-colspan`/`grid-rowspan`). The component translates coordinates to pixel positions. Collision resolution uses push-right-then-down. Drag snaps to nearest grid cell on release. Container uses `overflow: hidden` when `columns`/`rows` are set.

**Tech Stack:** Snice framework (TC39 decorators, shadow DOM), TypeScript, CSS-in-shadow-DOM, Vitest

---

### Task 1: Types File

**Files:**
- Create: `components/grid/snice-grid.types.ts`

**Step 1: Write the types file**

```typescript
export interface SniceGridElement extends HTMLElement {
  gap: string;
  columnWidth: number;
  rowHeight: number;
  columns: number;
  rows: number;
  originLeft: boolean;
  originTop: boolean;
  transitionDuration: string;
  stagger: number;
  resize: boolean;
  draggable: boolean;
  dragThrottle: number;

  layout(): void;
  fit(element: HTMLElement, col?: number, row?: number): void;
  reloadItems(): void;
  getItemElements(): HTMLElement[];
  getLayout(): GridLayout;
  setLayout(layout: GridLayout): void;
}

export interface GridLayoutEntry {
  col: number;
  row: number;
  colspan?: number;
  rowspan?: number;
  order: number;
  hidden?: boolean;
}

export type GridLayout = Record<string, GridLayoutEntry>;

export interface GridLayoutCompleteDetail {
  items: HTMLElement[];
}

export interface GridDragItemPositionedDetail {
  item: HTMLElement;
  col: number;
  row: number;
}

export interface GridEventMap {
  'grid-layout-complete': CustomEvent<GridLayoutCompleteDetail>;
  'grid-drag-item-positioned': CustomEvent<GridDragItemPositionedDetail>;
}
```

**Step 2: Commit**

```bash
git add components/grid/snice-grid.types.ts
git commit -m "feat(grid): add type definitions"
```

---

### Task 2: CSS File

**Files:**
- Create: `components/grid/snice-grid.css`

**Step 1: Write the CSS**

Mirror binpack's CSS structure. Key differences: `--grid-gap` and `--grid-transition-duration` custom property names, `.grid` container class, `overflow: hidden` on `:host`.

```css
:host {
  display: block;
  position: relative;
  width: 100%;
  font-family: var(--snice-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif);
  contain: layout style;
  --grid-gap: 1rem;
  --grid-transition-duration: 0.4s;
  overflow: hidden;
}

.grid {
  position: relative;
  width: 100%;
  min-height: 1rem;
}

::slotted(*) {
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
}

::slotted([hidden]) {
  display: none !important;
}

/* Gate transitions behind [ready] to prevent FOUC */
:host([ready]) ::slotted(*) {
  transition: transform var(--grid-transition-duration) ease;
}

/* Dragging states */
::slotted(.grid-dragging) {
  z-index: 100;
  opacity: 0.9;
  transition: none !important;
  cursor: grabbing !important;
  user-select: none;
}

::slotted(.grid-positioning) {
  z-index: 99;
}

:host([draggable]) ::slotted(*) {
  cursor: grab;
}

/* Drop placeholder */
.grid-drop-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  outline: 3px dashed rgba(128, 128, 128, 0.5);
  outline-offset: -6px;
  border-radius: 4px;
  transition: transform 0.2s ease;
  pointer-events: none;
  display: none;
}

.grid-drop-placeholder.visible {
  display: block;
}
```

**Step 2: Commit**

```bash
git add components/grid/snice-grid.css
git commit -m "feat(grid): add component styles"
```

---

### Task 3: Test File — Basic Functionality and Properties

**Files:**
- Create: `tests/components/grid.test.ts`

**Step 1: Write failing tests**

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/grid/snice-grid';
import type { SniceGridElement } from '../../components/grid/snice-grid.types';

describe('snice-grid', () => {
  let el: SniceGridElement;

  afterEach(() => {
    if (el) {
      removeComponent(el as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render grid element', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      expect(el).toBeTruthy();
      expect(el.tagName).toBe('SNICE-GRID');
    });

    it('should have default properties', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      expect(el.gap).toBe('1rem');
      expect(el.columnWidth).toBe(80);
      expect(el.rowHeight).toBe(80);
      expect(el.columns).toBe(0);
      expect(el.rows).toBe(0);
      expect(el.originLeft).toBe(true);
      expect(el.originTop).toBe(true);
      expect(el.transitionDuration).toBe('0.4s');
      expect(el.stagger).toBe(0);
      expect(el.resize).toBe(true);
    });

    it('should render slot element', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      const slot = el.shadowRoot?.querySelector('slot');
      expect(slot).toBeTruthy();
    });

    it('should render container with role=list', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      const container = el.shadowRoot?.querySelector('.grid');
      expect(container).toBeTruthy();
      expect(container?.getAttribute('role')).toBe('list');
    });

    it('should have part=base on container', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      const container = el.shadowRoot?.querySelector('[part="base"]');
      expect(container).toBeTruthy();
    });
  });

  describe('property reflection', () => {
    it('should reflect gap attribute', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        gap: '2rem'
      });
      expect(el.getAttribute('gap')).toBe('2rem');
      expect(el.gap).toBe('2rem');
    });

    it('should reflect column-width attribute', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        'column-width': 100
      });
      expect(el.columnWidth).toBe(100);
    });

    it('should reflect row-height attribute', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        'row-height': 60
      });
      expect(el.rowHeight).toBe(60);
    });

    it('should reflect columns attribute', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        columns: 5
      });
      expect(el.columns).toBe(5);
    });

    it('should reflect rows attribute', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        rows: 4
      });
      expect(el.rows).toBe(4);
    });

    it('should reflect origin-left attribute', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        'origin-left': false
      });
      expect(el.originLeft).toBe(false);
    });

    it('should reflect origin-top attribute', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        'origin-top': false
      });
      expect(el.originTop).toBe(false);
    });

    it('should reflect transition-duration attribute', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        'transition-duration': '1s'
      });
      expect(el.transitionDuration).toBe('1s');
    });

    it('should reflect stagger attribute', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        stagger: 50
      });
      expect(el.stagger).toBe(50);
    });

    it('should reflect resize attribute', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        resize: false
      });
      expect(el.resize).toBe(false);
    });
  });

  describe('API methods', () => {
    it('should expose layout() method', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      expect(typeof el.layout).toBe('function');
      el.layout();
    });

    it('should expose fit() method', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      expect(typeof el.fit).toBe('function');
    });

    it('should expose reloadItems() method', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      expect(typeof el.reloadItems).toBe('function');
      el.reloadItems();
    });

    it('should expose getItemElements() method', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      expect(typeof el.getItemElements).toBe('function');
      const items = el.getItemElements();
      expect(Array.isArray(items)).toBe(true);
      expect(items).toHaveLength(0);
    });

    it('should collect slotted items via getItemElements()', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');

      const item1 = document.createElement('div');
      item1.setAttribute('name', 'a');
      item1.setAttribute('grid-col', '0');
      item1.setAttribute('grid-row', '0');
      const item2 = document.createElement('div');
      item2.setAttribute('name', 'b');
      item2.setAttribute('grid-col', '1');
      item2.setAttribute('grid-row', '0');
      el.appendChild(item1);
      el.appendChild(item2);
      await wait(50);

      el.reloadItems();
      await wait(50);

      const items = el.getItemElements();
      expect(items).toHaveLength(2);
      expect(items).toContain(item1);
      expect(items).toContain(item2);
    });

    it('should position item at grid coordinates via fit()', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        'column-width': 80,
        'row-height': 80,
        gap: '0px'
      });

      const item = document.createElement('div');
      item.setAttribute('name', 'a');
      item.setAttribute('grid-col', '0');
      item.setAttribute('grid-row', '0');
      el.appendChild(item);
      await wait(50);
      el.reloadItems();

      el.fit(item, 2, 3);
      // col=2, row=3 with columnWidth=80, rowHeight=80, gap=0
      // x = 2 * (80 + 0) = 160, y = 3 * (80 + 0) = 240
      expect(item.style.transform).toContain('160');
      expect(item.style.transform).toContain('240');
    });

    it('should ignore fit() on unknown elements', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      const outsider = document.createElement('div');
      el.fit(outsider, 1, 1);
    });
  });

  describe('grid positioning', () => {
    it('should position items based on grid-col and grid-row attributes', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        'column-width': 100,
        'row-height': 50,
        gap: '10px'
      });

      const item = document.createElement('div');
      item.setAttribute('name', 'a');
      item.setAttribute('grid-col', '2');
      item.setAttribute('grid-row', '1');
      el.appendChild(item);
      await wait(50);
      el.reloadItems();
      el.layout();

      // x = 2 * (100 + 10) = 220, y = 1 * (50 + 10) = 60
      expect(item.style.transform).toBe('translate(220px, 60px)');
    });

    it('should auto-size items to colspan x rowspan', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        'column-width': 80,
        'row-height': 80,
        gap: '8px'
      });

      const item = document.createElement('div');
      item.setAttribute('name', 'a');
      item.setAttribute('grid-col', '0');
      item.setAttribute('grid-row', '0');
      item.setAttribute('grid-colspan', '2');
      item.setAttribute('grid-rowspan', '3');
      el.appendChild(item);
      await wait(50);
      el.reloadItems();
      el.layout();

      // width = 2 * 80 + (2 - 1) * 8 = 168
      // height = 3 * 80 + (3 - 1) * 8 = 256
      expect(item.style.width).toBe('168px');
      expect(item.style.height).toBe('256px');
    });

    it('should hide items with hidden attribute', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');

      const item = document.createElement('div');
      item.setAttribute('name', 'a');
      item.setAttribute('grid-col', '0');
      item.setAttribute('grid-row', '0');
      item.setAttribute('hidden', '');
      el.appendChild(item);
      await wait(50);
      el.reloadItems();
      el.layout();

      // Hidden items should not be positioned
      expect(item.style.transform).toBe('');
    });
  });

  describe('collision resolution', () => {
    it('should push item right when position is occupied', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        'column-width': 80,
        'row-height': 80,
        gap: '0px'
      });

      // Two items at the same position — second should be pushed right
      const item1 = document.createElement('div');
      item1.setAttribute('name', 'a');
      item1.setAttribute('grid-col', '0');
      item1.setAttribute('grid-row', '0');
      const item2 = document.createElement('div');
      item2.setAttribute('name', 'b');
      item2.setAttribute('grid-col', '0');
      item2.setAttribute('grid-row', '0');
      el.appendChild(item1);
      el.appendChild(item2);
      await wait(50);
      el.reloadItems();
      el.layout();

      // item1 at (0,0), item2 pushed to (1,0) → x=80
      expect(item1.style.transform).toBe('translate(0px, 0px)');
      expect(item2.style.transform).toBe('translate(80px, 0px)');
    });

    it('should push to next row when row is full', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        'column-width': 80,
        'row-height': 80,
        gap: '0px',
        columns: 2
      });

      // 3 items at (0,0) — third should wrap to next row
      const items: HTMLElement[] = [];
      for (let i = 0; i < 3; i++) {
        const item = document.createElement('div');
        item.setAttribute('name', String.fromCharCode(97 + i));
        item.setAttribute('grid-col', '0');
        item.setAttribute('grid-row', '0');
        items.push(item);
        el.appendChild(item);
      }
      await wait(50);
      el.reloadItems();
      el.layout();

      expect(items[0].style.transform).toBe('translate(0px, 0px)');
      expect(items[1].style.transform).toBe('translate(80px, 0px)');
      expect(items[2].style.transform).toBe('translate(0px, 80px)');
    });

    it('should handle colspan collision', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        'column-width': 80,
        'row-height': 80,
        gap: '0px',
        columns: 4
      });

      // item1 at (0,0) colspan=2, item2 at (1,0) — overlaps, should push right to col 2
      const item1 = document.createElement('div');
      item1.setAttribute('name', 'a');
      item1.setAttribute('grid-col', '0');
      item1.setAttribute('grid-row', '0');
      item1.setAttribute('grid-colspan', '2');
      const item2 = document.createElement('div');
      item2.setAttribute('name', 'b');
      item2.setAttribute('grid-col', '1');
      item2.setAttribute('grid-row', '0');
      el.appendChild(item1);
      el.appendChild(item2);
      await wait(50);
      el.reloadItems();
      el.layout();

      expect(item1.style.transform).toBe('translate(0px, 0px)');
      expect(item2.style.transform).toBe('translate(160px, 0px)');
    });
  });

  describe('layout persistence', () => {
    it('should return layout via getLayout()', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        'column-width': 80,
        'row-height': 80,
        gap: '0px'
      });

      const item = document.createElement('div');
      item.setAttribute('name', 'myitem');
      item.setAttribute('grid-col', '2');
      item.setAttribute('grid-row', '3');
      el.appendChild(item);
      await wait(50);
      el.reloadItems();
      el.layout();

      const layout = el.getLayout();
      expect(layout['myitem']).toBeDefined();
      expect(layout['myitem'].col).toBe(2);
      expect(layout['myitem'].row).toBe(3);
      expect(layout['myitem'].order).toBe(0);
    });

    it('should restore layout via setLayout()', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        'column-width': 80,
        'row-height': 80,
        gap: '0px'
      });

      const item = document.createElement('div');
      item.setAttribute('name', 'myitem');
      item.setAttribute('grid-col', '0');
      item.setAttribute('grid-row', '0');
      el.appendChild(item);
      await wait(50);
      el.reloadItems();

      el.setLayout({
        myitem: { col: 3, row: 2, order: 0 }
      });

      // x = 3 * 80 = 240, y = 2 * 80 = 160
      expect(item.style.transform).toBe('translate(240px, 160px)');
    });
  });

  describe('events', () => {
    it('should fire grid-layout-complete on layout()', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');

      let eventFired = false;
      (el as HTMLElement).addEventListener('grid-layout-complete', () => {
        eventFired = true;
      });

      el.layout();
      expect(eventFired).toBe(true);
    });
  });

  describe('ready attribute', () => {
    it('should set ready attribute after initialization', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      await wait(20);
      expect(el.hasAttribute('ready')).toBe(true);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/grid.test.ts`
Expected: FAIL — module `../../components/grid/snice-grid` not found

**Step 3: Commit**

```bash
git add tests/components/grid.test.ts
git commit -m "test(grid): add failing tests for grid component"
```

---

### Task 4: Grid Component — Core Layout Engine

**Files:**
- Create: `components/grid/snice-grid.ts`

This is the main implementation file. Structure mirrors binpack exactly:
1. Imports and types
2. `OccupancyGrid` helper class (replaces binpack's `Packer`)
3. `SniceGrid` component class with decorators

**Step 1: Write the component**

The component has these sections:

**OccupancyGrid class** — A 2D boolean grid tracking occupied cells. Methods:
- `occupy(col, row, colspan, rowspan)` — marks cells as taken
- `isOccupied(col, row, colspan, rowspan)` — checks if any cell in the range is taken
- `findNextFree(col, row, colspan, rowspan, maxCols)` — scans right-then-down for open space
- `grow(col, row)` — expands grid dimensions as needed

**SniceGrid class** — Same decorator pattern as binpack:
- `@element('snice-grid')`, `@property()` for all properties
- `@query()` for `.grid`, `slot`, `.grid-drop-placeholder`
- `@ready()` / `@dispose()` lifecycle
- `@watch()` for property change → relayout
- `@dispatch()` for events
- `@render()` template, `@styles()` CSS
- `performLayout()` — reads item attributes, builds occupancy grid, resolves collisions, positions items
- Same drag implementation as binpack but snapping to grid cells on release

Key implementation details:
- `performLayout()`: iterate items in DOM order, read `grid-col`/`grid-row`/`grid-colspan`/`grid-rowspan` attributes, check occupancy grid, if collision → `findNextFree()`, set `transform` and `width`/`height`
- `fit(el, col, row)`: update element's `grid-col`/`grid-row` attributes, call `performLayout()`
- `getLayout()`: read current resolved positions from item attributes
- `setLayout()`: set attributes from map, reorder DOM, call `performLayout()`
- Container sizing: after layout, compute `maxCol`/`maxRow` from placed items, set container width/height. If `columns`/`rows` set, use those for fixed size
- Drag: on release, compute nearest cell from pixel position, call `fit()` which triggers collision resolution

**Step 2: Run tests**

Run: `npx vitest run tests/components/grid.test.ts`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add components/grid/snice-grid.ts
git commit -m "feat(grid): implement core grid layout component"
```

---

### Task 5: Demo HTML

**Files:**
- Create: `components/grid/demo.html`

**Step 1: Write basic demo page**

Simple demo with a few items at various grid positions, some spanning multiple cells. Include controls to toggle draggable, change column/row counts. Follow the pattern from `components/binpack/demo.html`.

**Step 2: Manual verification**

Run: `npx vite --open components/grid/demo.html`
Verify: Items appear at correct grid positions, spanning works, collision pushes items right.

**Step 3: Commit**

```bash
git add components/grid/demo.html
git commit -m "feat(grid): add demo page"
```

---

### Task 6: Run Full Test Suite

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass, no regressions.

**Step 2: Final commit if any fixes needed**

---

### Task 7: CDN Build Setup

**Files:**
- Modify: Check if `snice.config.ts` or equivalent needs a grid entry for CDN build

**Step 1: Build the component for CDN**

```bash
npm run build:core
npx snice build-component grid
```

**Step 2: Verify CDN bundle exists**

Check `dist/cdn/grid/snice-grid.min.js` exists.

**Step 3: Commit if config changes were needed**
