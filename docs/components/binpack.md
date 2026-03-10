<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/binpack.md -->

# Binpack Component
`<snice-binpack>`

A JavaScript-driven bin-packing layout component. Uses the maximal rectangles algorithm to efficiently pack items of varying sizes into a container with absolute positioning and smooth transitions.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `gap` | `gap` | `string` | `'1rem'` | Spacing between items |
| `columnWidth` | `column-width` | `number` | `0` | Grid snap width (0 = no grid) |
| `rowHeight` | `row-height` | `number` | `0` | Grid snap height (0 = no grid) |
| `horizontal` | `horizontal` | `boolean` | `false` | Pack horizontally instead of vertically |
| `originLeft` | `origin-left` | `boolean` | `true` | `false` = right-to-left |
| `originTop` | `origin-top` | `boolean` | `true` | `false` = bottom-to-top |
| `transitionDuration` | `transition-duration` | `string` | `'0.4s'` | CSS transition duration for item movement |
| `stagger` | `stagger` | `number` | `0` | Delay in ms between each item's transition |
| `resize` | `resize` | `boolean` | `true` | Auto re-layout on container resize |
| `draggable` | `draggable` | `boolean` | `false` | Enable drag-to-reorder |
| `dragThrottle` | `drag-throttle` | `number` | `120` | Throttle interval (ms) for drag layout updates |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `layout()` | -- | Perform a full re-layout |
| `fit()` | `element: HTMLElement, x?: number, y?: number` | Position specific item at coordinates, reflow others |
| `reloadItems()` | -- | Re-collect items from DOM |
| `stamp()` | `elements: HTMLElement \| HTMLElement[]` | Layout around fixed elements |
| `unstamp()` | `elements: HTMLElement \| HTMLElement[]` | Remove stamp constraint |
| `getItemElements()` | -- | Returns array of all layout items |
| `getLayout()` | -- | Returns `BinpackLayout` object with item positions |
| `setLayout()` | `layout: BinpackLayout` | Apply a saved layout (reorder, hide/show items) |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `binpack-layout-complete` | `{ items: HTMLElement[] }` | Fired after layout completes |
| `binpack-fit-complete` | `{ item: HTMLElement, x: number, y: number }` | Fired after `fit()` completes |
| `binpack-drag-item-positioned` | `{ item: HTMLElement, x: number, y: number }` | Fired after a dragged item settles into its new position |

## Slots

| Name | Description |
|------|-------------|
| (default) | Items to pack. Each item should have explicit width and height. |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--binpack-gap` | Gap between items (set via `gap` property) | `1rem` |
| `--binpack-transition-duration` | Transition duration for item movement (set via `transition-duration` property) | `0.4s` |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The inner container element |

## Basic Usage

```typescript
import 'snice/components/binpack/snice-binpack';
```

```html
<snice-binpack gap="0.5rem">
  <div style="width: 100px; height: 100px;">A</div>
  <div style="width: 150px; height: 80px;">B</div>
  <div style="width: 80px; height: 120px;">C</div>
</snice-binpack>
```

## Examples

### Horizontal Packing

Use the `horizontal` attribute to pack items left-to-right instead of top-to-bottom. Set a fixed height on the container.

```html
<snice-binpack horizontal gap="0.5rem" style="height: 300px;">
  <div style="width: 100px; height: 100px;">A</div>
  <div style="width: 80px; height: 150px;">B</div>
  <div style="width: 120px; height: 80px;">C</div>
</snice-binpack>
```

### Grid-Snapped Layout

Use `column-width` and `row-height` to snap items to a grid.

```html
<snice-binpack column-width="100" row-height="100" gap="0.5rem">
  <div style="width: 80px; height: 80px;">A</div>
  <div style="width: 180px; height: 80px;">B</div>
  <div style="width: 80px; height: 160px;">C</div>
</snice-binpack>
```

### Staggered Transitions

Use `stagger` to add incremental delay between each item's transition.

```html
<snice-binpack transition-duration="0.6s" stagger="40">
  <div style="width: 100px; height: 100px;">A</div>
  <div style="width: 100px; height: 100px;">B</div>
  <div style="width: 100px; height: 100px;">C</div>
</snice-binpack>
```

### Right-to-Left

Set `origin-left="false"` to pack items from the right side.

```html
<snice-binpack origin-left="false" gap="0.5rem">
  <div style="width: 100px; height: 100px;">A</div>
  <div style="width: 150px; height: 80px;">B</div>
</snice-binpack>
```

### Draggable Dashboard

Enable `draggable` to let users drag items to rearrange them.

```html
<snice-binpack draggable gap="8px" column-width="80" row-height="80">
  <div style="width: 160px; height: 160px;">Revenue</div>
  <div style="width: 80px; height: 80px;">CPU</div>
  <div style="width: 160px; height: 80px;">Orders</div>
</snice-binpack>
```

CSS classes applied during drag:
- `.binpack-dragging` -- applied during drag (no transition, z-index: 100)
- `.binpack-positioning` -- applied while animating to final position after drop

```javascript
pack.addEventListener('binpack-drag-item-positioned', (e) => {
  const { item, x, y } = e.detail;
  console.log('Item dropped at', x, y);
});
```

### Dynamic Items

Items can be added or removed dynamically. The layout automatically updates via slot change detection.

```javascript
const pack = document.querySelector('snice-binpack');

// Add an item
const item = document.createElement('div');
item.style.width = '120px';
item.style.height = '80px';
pack.appendChild(item);

// Remove an item
pack.lastElementChild.remove();
```

### Stamp (Fixed Elements)

Use `stamp()` to mark elements as fixed -- other items layout around them.

```javascript
const pack = document.getElementById('stamp-demo');
const fixed = document.getElementById('fixed');
pack.stamp(fixed);    // Items layout around it
pack.unstamp(fixed);  // Resume normal layout
```

### Save and Restore Layout

Use `getLayout()` and `setLayout()` to persist item arrangement. Items must have a `name` attribute.

```javascript
// Save
const layout = pack.getLayout();
localStorage.setItem('dashboard', JSON.stringify(layout));

// Restore
const saved = JSON.parse(localStorage.getItem('dashboard'));
pack.setLayout(saved);
```

### Notes

- Items must have explicit `width` and `height` (the component does not auto-size items)
- The container uses `position: relative` and items are absolutely positioned with `transform` for smooth transitions
- Uses `ResizeObserver` on both the container and individual items for automatic re-layout
- FOUC is prevented by gating transitions behind the `[ready]` attribute
- Uses `contain: layout style` on `:host` (not `paint`, as items use absolute positioning that may overflow)
