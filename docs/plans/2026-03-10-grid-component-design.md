# snice-grid Component Design

## Concept
Explicit grid-coordinate placement with animated transitions and drag-and-drop. Items declare their position in grid units (col, row); the component translates to pixel positions. Collision resolution via push-right-then-down.

## Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `gap` | string | `"1rem"` | Gap between cells (CSS value) |
| `column-width` | number | `80` | Cell width in px |
| `row-height` | number | `80` | Cell height in px |
| `columns` | number | `0` | Max columns (0 = auto-grow) |
| `rows` | number | `0` | Max rows (0 = auto-grow) |
| `origin-left` | boolean | `true` | RTL support |
| `origin-top` | boolean | `true` | Bottom-origin support |
| `transition-duration` | string | `"0.4s"` | Animation speed |
| `stagger` | number | `0` | Cascade delay (ms) per item |
| `resize` | boolean | `true` | ResizeObserver relayout |
| `draggable` | boolean | `false` | Enable drag-and-drop |
| `drag-throttle` | number | `100` | Drag relayout throttle (ms) |

## Item Attributes (on slotted children)

| Attribute | Default | Description |
|---|---|---|
| `name` | required | Unique item identifier |
| `grid-col` | `0` | Column position |
| `grid-row` | `0` | Row position |
| `grid-colspan` | `1` | Columns spanned |
| `grid-rowspan` | `1` | Rows spanned |
| `hidden` | — | Hides item from layout |

## Pixel Calculation

```
x = col × (columnWidth + gap)
y = row × (rowHeight + gap)
width = colspan × columnWidth + (colspan - 1) × gap
height = rowspan × rowHeight + (rowspan - 1) × gap
```

Items are auto-sized to their grid cell dimensions.

## Collision Resolution

**Push-right-then-down**: When item A is placed at an occupied cell, the existing item shifts right to the next open cell that fits it (accounting for colspan/rowspan). If no room remains in that row, wraps to column 0 of the next row. Cascading — if the displaced item lands on another occupied area, that item pushes too.

When `columns` is set, "no room in row" means hitting the column limit. When `rows` is also set and the grid is completely full, the last displaced item goes out of bounds (clipped by `overflow: hidden`).

## Drag Behavior

Same as binpack: free drag during gesture, on release snap to nearest grid cell. If that cell is occupied, push-right-then-down resolution kicks in. Dashed placeholder outline shows target cell during drag.

## Container Sizing

- `columns`/`rows` unset (0): container grows to fit furthest item edge
- `columns` and/or `rows` set: fixed size with `overflow: hidden`
- Individual items can be hidden via `hidden` attribute (same as binpack)

## Public API

```ts
interface SniceGridElement extends HTMLElement {
  gap: string;
  columnWidth: number;
  rowHeight: number;
  columns: number;
  rows: number;
  horizontal: boolean;
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
```

## Types

```ts
interface GridLayoutEntry {
  col: number;
  row: number;
  colspan?: number;  // default 1
  rowspan?: number;  // default 1
  order: number;
  hidden?: boolean;
}

type GridLayout = Record<string, GridLayoutEntry>;

interface GridLayoutCompleteDetail {
  items: HTMLElement[];
}

interface GridDragItemPositionedDetail {
  item: HTMLElement;
  col: number;
  row: number;
}

interface GridEventMap {
  'grid-layout-complete': CustomEvent<GridLayoutCompleteDetail>;
  'grid-drag-item-positioned': CustomEvent<GridDragItemPositionedDetail>;
}
```

## CSS Custom Properties

- `--grid-gap` (maps to gap property)
- `--grid-transition-duration` (maps to transitionDuration property)

## CSS Structure

- `:host` — `display: block; position: relative; overflow: hidden` (when columns/rows set)
- `::slotted(*)` — `position: absolute; box-sizing: border-box`
- `:host([ready]) ::slotted(*)` — transition on transform (FOUC gate)
- Dragging/placeholder styles identical to binpack pattern

## Shared Patterns with Binpack

- `[ready]` attribute for FOUC prevention
- `name` attribute for item identification
- `getLayout()`/`setLayout()` for persistence
- Stagger animation delay
- ResizeObserver relayout
- Drag placeholder with dashed outline
- Same event naming convention
