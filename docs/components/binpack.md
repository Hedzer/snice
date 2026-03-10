# Binpack
`<snice-binpack>`

A JavaScript-driven bin-packing layout component inspired by Packery. Uses the maximal rectangles algorithm to efficiently pack items of varying sizes into a container with absolute positioning and smooth transitions.

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

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/binpack/snice-binpack';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-binpack.min.js"></script>
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

Use `stagger` to add incremental delay between each item's transition for a cascading effect.

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

### Dynamic Items

Items can be added or removed dynamically. The layout automatically updates via slot change detection.

```html
<snice-binpack id="my-pack" gap="0.5rem">
  <div style="width: 100px; height: 100px;">A</div>
</snice-binpack>

<script>
  const pack = document.getElementById('my-pack');

  // Add an item
  const item = document.createElement('div');
  item.style.width = '120px';
  item.style.height = '80px';
  pack.appendChild(item);

  // Remove an item
  pack.lastElementChild.remove();
</script>
```

### Stamp (Fixed Elements)

Use `stamp()` to mark elements as fixed — other items will layout around them.

```html
<snice-binpack id="stamp-demo" gap="0.5rem">
  <div id="fixed" style="width: 200px; height: 200px;">Fixed</div>
  <div style="width: 80px; height: 80px;">A</div>
  <div style="width: 100px; height: 60px;">B</div>
</snice-binpack>

<script>
  const pack = document.getElementById('stamp-demo');
  const fixed = document.getElementById('fixed');
  pack.stamp(fixed);    // Items layout around it
  pack.unstamp(fixed);  // Resume normal layout
</script>
```

### fit() Method

Position a specific item at given coordinates, then reflow the remaining items around it.

```html
<snice-binpack id="fit-demo" gap="0.5rem">
  <div id="target" style="width: 100px; height: 100px;">Target</div>
  <div style="width: 80px; height: 80px;">A</div>
</snice-binpack>

<script>
  const pack = document.getElementById('fit-demo');
  const target = document.getElementById('target');
  pack.fit(target, 200, 0);
</script>
```

## Slots

| Name | Description |
|------|-------------|
| (default) | Items to pack. Each item should have explicit width and height. |

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

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `binpack-layout-complete` | `{ items: HTMLElement[] }` | Fired after layout completes |
| `binpack-fit-complete` | `{ item: HTMLElement, x: number, y: number }` | Fired after `fit()` completes |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `layout()` | — | Perform a full re-layout |
| `fit()` | `element: HTMLElement, x?: number, y?: number` | Position specific item at coordinates, reflow others |
| `reloadItems()` | — | Re-collect items from DOM |
| `stamp()` | `elements: HTMLElement \| HTMLElement[]` | Layout around fixed elements |
| `unstamp()` | `elements: HTMLElement \| HTMLElement[]` | Remove stamp constraint |
| `getItemElements()` | — | Returns array of all layout items |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--binpack-gap` | Gap between items | `1rem` |
| `--binpack-transition-duration` | Transition duration for item movement | `0.4s` |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The inner container element |

## Notes

- Items must have explicit `width` and `height` (the component does not auto-size items)
- The container uses `position: relative` and items are absolutely positioned with `transform` for smooth transitions
- Uses `ResizeObserver` on both the container and individual items for automatic re-layout
- FOUC is prevented by gating transitions behind the `[ready]` attribute
- Uses `contain: layout style` on `:host` (not `paint`, as items use absolute positioning that may overflow)
