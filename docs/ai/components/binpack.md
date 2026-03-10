# snice-binpack

JS-driven bin-packing layout using the maximal rectangles algorithm. Absolute positioning with transform-based transitions.

## Properties

```typescript
gap: string = '1rem';                           // spacing between items
columnWidth: number = 0;                        // grid snap width (0 = no grid) — attr: column-width
rowHeight: number = 0;                          // grid snap height (0 = no grid) — attr: row-height
horizontal: boolean = false;                    // pack horizontally instead of vertically
originLeft: boolean = true;                     // false = right-to-left — attr: origin-left
originTop: boolean = true;                      // false = bottom-to-top — attr: origin-top
transitionDuration: string = '0.4s';            // CSS transition duration — attr: transition-duration
stagger: number = 0;                            // ms delay between each item transition
resize: boolean = true;                         // auto re-layout on container resize
```

## Slots

- `(default)` - Items to pack (any elements)

## Events

- `binpack-layout-complete` -> `{ items: HTMLElement[] }`
- `binpack-fit-complete` -> `{ item: HTMLElement, x: number, y: number }`

## Methods

- `layout()` - Full re-layout
- `fit(element, x?, y?)` - Position specific item at coordinates, reflow others
- `reloadItems()` - Re-collect items from DOM
- `stamp(elements)` - Layout around fixed elements
- `unstamp(elements)` - Remove stamp constraint
- `getItemElements()` - Get all layout items

## CSS Custom Properties

- `--binpack-gap` - Gap between items (set via `gap` property)
- `--binpack-transition-duration` - Transition duration (set via `transition-duration` property)

## Usage

```html
<snice-binpack gap="0.5rem">
  <div style="width:100px;height:100px">A</div>
  <div style="width:150px;height:80px">B</div>
  <div style="width:80px;height:120px">C</div>
</snice-binpack>

<!-- Horizontal mode -->
<snice-binpack horizontal style="height:300px">
  <div style="width:100px;height:100px">A</div>
</snice-binpack>

<!-- Grid-snapped -->
<snice-binpack column-width="100" row-height="100">
  <div style="width:80px;height:80px">A</div>
</snice-binpack>
```

## Notes

- Items must have explicit width/height (not auto-sized)
- Container uses `position: relative`, items get `position: absolute` + `transform`
- Uses ResizeObserver on container and items for auto re-layout
- FOUC prevented via `[ready]` attribute gating transitions
- `contain: layout style` on `:host` (NOT paint — items use absolute positioning)
