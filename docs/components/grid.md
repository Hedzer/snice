<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/grid.md -->

# Grid Component
`<snice-grid>`

A grid-coordinate layout component. Items are placed at explicit grid positions using `grid-col` and `grid-row` attributes, and can span multiple cells with `grid-colspan` and `grid-rowspan`. Collision resolution uses swap-first with push-right-then-down fallback. Supports animated transitions and drag-and-drop with snap-to-grid.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `gap` | `gap` | `string` | `'1rem'` | Spacing between cells |
| `columnWidth` | `column-width` | `number` | `80` | Width of each grid column in pixels |
| `rowHeight` | `row-height` | `number` | `80` | Height of each grid row in pixels |
| `columns` | `columns` | `number` | `0` | Fixed number of columns (0 = auto from content) |
| `rows` | `rows` | `number` | `0` | Fixed number of rows (0 = auto from content) |
| `originLeft` | `origin-left` | `boolean` | `true` | `false` = right-to-left |
| `originTop` | `origin-top` | `boolean` | `true` | `false` = bottom-to-top |
| `transitionDuration` | `transition-duration` | `string` | `'0.4s'` | CSS transition duration for item movement |
| `stagger` | `stagger` | `number` | `0` | Delay in ms between each item's transition |
| `resize` | `resize` | `boolean` | `true` | Auto re-layout on container resize |
| `draggable` | `draggable` | `boolean` | `false` | Enable drag-to-reorder with snap-to-grid |
| `dragThrottle` | `drag-throttle` | `number` | `120` | Throttle interval (ms) for drag layout updates |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `layout()` | -- | Perform a full re-layout |
| `fit()` | `element: HTMLElement, col?: number, row?: number` | Position specific item at grid coordinates, reflow others |
| `reloadItems()` | -- | Re-collect items from DOM |
| `getItemElements()` | -- | Returns array of all layout items |
| `getLayout()` | -- | Returns `GridLayout` object with item positions, spans, and order |
| `setLayout()` | `layout: GridLayout` | Apply a saved layout (reorder, reposition, hide/show items) |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `grid-layout-complete` | `{ items: HTMLElement[] }` | Fired after layout completes |
| `grid-drag-item-positioned` | `{ item: HTMLElement, col: number, row: number }` | Fired after a dragged item settles into its new grid position |

## Slots

| Name | Description |
|------|-------------|
| (default) | Items to place on the grid. Use `grid-col`, `grid-row`, `grid-colspan`, `grid-rowspan` attributes on each item to control placement. |

### Item Attributes

These attributes are set on child elements (not on `<snice-grid>` itself):

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `grid-col` | `number` | `0` | Column position (0-based) |
| `grid-row` | `number` | `0` | Row position (0-based) |
| `grid-colspan` | `number` | `1` | Number of columns to span |
| `grid-rowspan` | `number` | `1` | Number of rows to span |
| `name` | `string` | -- | Identifier used by `getLayout()`/`setLayout()` for persistence |
| `hidden` | `boolean` | -- | Hides the item from layout |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--grid-gap` | Gap between cells (set via `gap` property) | `1rem` |
| `--grid-transition-duration` | Transition duration for item movement (set via `transition-duration` property) | `0.4s` |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The inner container element |

## Basic Usage

```typescript
import 'snice/components/grid/snice-grid';
```

```html
<snice-grid column-width="100" row-height="100" gap="8px">
  <div grid-col="0" grid-row="0">A</div>
  <div grid-col="1" grid-row="0">B</div>
  <div grid-col="0" grid-row="1">C</div>
</snice-grid>
```

Items are sized automatically based on `columnWidth`, `rowHeight`, and their `grid-colspan`/`grid-rowspan` values.

## Examples

### Spanning Multiple Cells

Use `grid-colspan` and `grid-rowspan` to make items span multiple columns or rows.

```html
<snice-grid column-width="80" row-height="80" gap="8px">
  <div grid-col="0" grid-row="0" grid-colspan="2" grid-rowspan="2">Large</div>
  <div grid-col="2" grid-row="0">Small A</div>
  <div grid-col="2" grid-row="1">Small B</div>
  <div grid-col="0" grid-row="2" grid-colspan="3">Wide</div>
</snice-grid>
```

### Collision Resolution

When two items request the same grid position, the component resolves collisions automatically:

1. **Swap** -- If the target cell has a single occupant, the two items swap positions.
2. **Push-right-then-down** -- If swap fails (multiple occupants or the swapped item doesn't fit), the incoming item is pushed to the next free cell scanning right, then down.

```html
<snice-grid column-width="80" row-height="80" gap="8px">
  <!-- Both request (0,0): the second item will be pushed to (1,0) -->
  <div grid-col="0" grid-row="0">First</div>
  <div grid-col="0" grid-row="0">Second</div>
</snice-grid>
```

### Fixed Grid Size

Set `columns` and/or `rows` to constrain the grid. Items that exceed the column limit are wrapped to the next row.

```html
<snice-grid column-width="100" row-height="100" gap="8px" columns="4" rows="3">
  <div grid-col="0" grid-row="0">A</div>
  <div grid-col="3" grid-row="0" grid-colspan="2">B (clamped to fit)</div>
</snice-grid>
```

When an item's `col + colspan` exceeds the column count, its column position is clamped to `columns - colspan`.

### Draggable with Snap-to-Grid

Enable `draggable` to let users drag items. Items snap to the nearest grid cell during and after drag.

```html
<snice-grid draggable column-width="80" row-height="80" gap="8px" columns="4">
  <div grid-col="0" grid-row="0" name="widget-a">Widget A</div>
  <div grid-col="1" grid-row="0" name="widget-b">Widget B</div>
  <div grid-col="0" grid-row="1" name="widget-c" grid-colspan="2">Widget C</div>
</snice-grid>
```

A dashed drop-placeholder shows the target cell during drag. CSS classes applied during drag:

- `.grid-dragging` -- applied during drag (no transition, z-index: 100, opacity: 0.9, cursor: grabbing)
- `.grid-positioning` -- applied while animating to final position after drop (z-index: 99)

```javascript
const grid = document.querySelector('snice-grid');
grid.addEventListener('grid-drag-item-positioned', (e) => {
  const { item, col, row } = e.detail;
  console.log(`${item.getAttribute('name')} dropped at col=${col} row=${row}`);
});
```

### Staggered Transitions

Use `stagger` to add incremental delay between each item's transition.

```html
<snice-grid column-width="80" row-height="80" transition-duration="0.6s" stagger="40">
  <div grid-col="0" grid-row="0">A</div>
  <div grid-col="1" grid-row="0">B</div>
  <div grid-col="2" grid-row="0">C</div>
</snice-grid>
```

### Right-to-Left / Bottom-to-Top

Set `origin-left="false"` or `origin-top="false"` to change the coordinate origin.

```html
<snice-grid column-width="80" row-height="80" origin-left="false">
  <div grid-col="0" grid-row="0">Aligned right</div>
</snice-grid>
```

### Save and Restore Layout

Use `getLayout()` and `setLayout()` to persist item arrangement. Items must have a `name` attribute.

```javascript
const grid = document.querySelector('snice-grid');

// Save
const layout = grid.getLayout();
localStorage.setItem('dashboard', JSON.stringify(layout));

// Restore
const saved = JSON.parse(localStorage.getItem('dashboard'));
grid.setLayout(saved);
```

The `GridLayout` object is a `Record<string, GridLayoutEntry>` keyed by item name:

```typescript
interface GridLayoutEntry {
  col: number;
  row: number;
  colspan?: number;
  rowspan?: number;
  order: number;
  hidden?: boolean;
}
```

### Dynamic Items

Items can be added or removed dynamically. The layout automatically updates via slot change detection.

```javascript
const grid = document.querySelector('snice-grid');

// Add an item
const item = document.createElement('div');
item.setAttribute('grid-col', '2');
item.setAttribute('grid-row', '0');
grid.appendChild(item);

// Remove an item
grid.lastElementChild.remove();
```

## Accessibility

- The inner container has `role="list"` for screen reader navigation.
- When `draggable` is enabled, items show `cursor: grab` (and `cursor: grabbing` during drag).

### Notes

- Items are absolutely positioned using `transform` for smooth transitions.
- Item width/height is computed automatically from `columnWidth`, `rowHeight`, `colspan`, and `rowspan`.
- Uses `ResizeObserver` on the container for automatic re-layout when `resize` is `true`.
- FOUC is prevented by gating transitions behind the `[ready]` attribute.
- Uses `contain: layout style` on `:host`.
