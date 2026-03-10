# snice-grid

Grid-coordinate layout component. Items placed at explicit (col, row) positions with optional spanning. Collision resolution: swap-first, fallback push-right-then-down. Animated transitions, drag-and-drop with snap-to-grid.

## Properties

```typescript
gap: string = '1rem';                           // spacing between cells
columnWidth: number = 80;                       // column width in px -- attr: column-width
rowHeight: number = 80;                         // row height in px -- attr: row-height
columns: number = 0;                            // fixed column count (0 = auto) -- attr: columns
rows: number = 0;                               // fixed row count (0 = auto) -- attr: rows
originLeft: boolean = true;                     // false = right-to-left -- attr: origin-left
originTop: boolean = true;                      // false = bottom-to-top -- attr: origin-top
transitionDuration: string = '0.4s';            // CSS transition duration -- attr: transition-duration
stagger: number = 0;                            // ms delay between each item transition
resize: boolean = true;                         // auto re-layout on container resize
draggable: boolean = false;                     // enable drag-to-reorder with snap-to-grid
dragThrottle: number = 120;                     // ms throttle for drag layout updates -- attr: drag-throttle
```

## Item Attributes

Set on child elements:

- `grid-col` (number, default 0) -- column position (0-based)
- `grid-row` (number, default 0) -- row position (0-based)
- `grid-colspan` (number, default 1) -- columns to span
- `grid-rowspan` (number, default 1) -- rows to span
- `name` (string) -- identifier for getLayout/setLayout persistence
- `hidden` -- hides item from layout

## Methods

- `layout()` - Full re-layout
- `fit(element, col?, row?)` - Position specific item at grid coordinates, reflow others
- `reloadItems()` - Re-collect items from DOM
- `getItemElements()` - Get all layout items
- `getLayout()` - Returns `GridLayout` (Record<string, GridLayoutEntry>) with positions/spans/order
- `setLayout(layout)` - Apply saved layout (reorder, reposition, hide/show)

## Events

- `grid-layout-complete` -> `{ items: HTMLElement[] }`
- `grid-drag-item-positioned` -> `{ item: HTMLElement, col: number, row: number }`

## Slots

- `(default)` - Items to place on grid (use grid-col/grid-row/grid-colspan/grid-rowspan attributes)

## CSS Custom Properties

- `--grid-gap` - Gap between cells (set via `gap` property)
- `--grid-transition-duration` - Transition duration (set via `transition-duration` property)

## CSS Parts

- `base` - The inner container element

## Types

```typescript
interface GridLayoutEntry {
  col: number;
  row: number;
  colspan?: number;
  rowspan?: number;
  order: number;
  hidden?: boolean;
}

type GridLayout = Record<string, GridLayoutEntry>;
```

## Basic Usage

```html
<snice-grid column-width="100" row-height="100" gap="8px">
  <div grid-col="0" grid-row="0">A</div>
  <div grid-col="1" grid-row="0">B</div>
  <div grid-col="0" grid-row="1" grid-colspan="2">Wide</div>
</snice-grid>

<!-- Draggable dashboard -->
<snice-grid draggable column-width="80" row-height="80" gap="8px" columns="4">
  <div grid-col="0" grid-row="0" name="a">A</div>
  <div grid-col="1" grid-row="0" name="b">B</div>
  <div grid-col="0" grid-row="1" name="c" grid-colspan="2">C</div>
</snice-grid>

<!-- Fixed grid -->
<snice-grid column-width="80" row-height="80" columns="4" rows="3">
  <div grid-col="0" grid-row="0">A</div>
</snice-grid>
```

## Collision Resolution

1. **Swap** -- single occupant in target area swaps positions with incoming item
2. **Push-right-then-down** -- fallback if swap fails (multiple occupants or occupant doesn't fit at swap position)
3. Column clamping: if `col + colspan > columns`, col is clamped to `columns - colspan`

## Drag CSS Classes

- `.grid-dragging` -- during drag (no transition, z-index: 100, opacity: 0.9, cursor: grabbing)
- `.grid-positioning` -- animating to final position after drop (z-index: 99)

## Notes

- Items sized automatically from columnWidth/rowHeight + colspan/rowspan
- Container uses `position: relative`, items get `position: absolute` + `transform`
- Uses ResizeObserver on container for auto re-layout
- FOUC prevented via `[ready]` attribute gating transitions
- `contain: layout style` on `:host`
- Inner container has `role="list"`
- Dashed drop-placeholder shown during drag
