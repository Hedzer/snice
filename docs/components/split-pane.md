[//]: # (AI: For a low-token version of this doc, use docs/ai/components/split-pane.md instead)

# Split Pane
`<snice-split-pane>`

A resizable split pane layout with horizontal or vertical orientation.

## Basic Usage

```typescript
import 'snice/components/split-pane/snice-split-pane';
```

```html
<snice-split-pane style="height: 400px;">
  <div slot="primary">Left pane content</div>
  <div slot="secondary">Right pane content</div>
</snice-split-pane>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/split-pane/snice-split-pane';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-split-pane.min.js"></script>
```

## Examples

### Vertical Split

Use the `direction` attribute to split vertically (top/bottom).

```html
<snice-split-pane direction="vertical" style="height: 400px;">
  <div slot="primary">Top pane</div>
  <div slot="secondary">Bottom pane</div>
</snice-split-pane>
```

### Custom Initial Size

Use the `primary-size` attribute to set the initial split ratio.

```html
<snice-split-pane primary-size="30" style="height: 400px;">
  <div slot="primary">30% width</div>
  <div slot="secondary">70% width</div>
</snice-split-pane>
```

### Minimum Sizes

Use `min-primary-size` and `min-secondary-size` to constrain pane sizing.

```html
<snice-split-pane min-primary-size="20" min-secondary-size="30" style="height: 400px;">
  <div slot="primary">Min 20%</div>
  <div slot="secondary">Min 30%</div>
</snice-split-pane>
```

### Snap

Use the `snap-size` attribute to snap the divider to fixed increments.

```html
<snice-split-pane snap-size="10" style="height: 400px;">
  <div slot="primary">Snaps to 10% increments</div>
  <div slot="secondary">Right pane</div>
</snice-split-pane>
```

### Disabled

Set the `disabled` attribute to prevent resizing.

```html
<snice-split-pane disabled primary-size="40" style="height: 400px;">
  <div slot="primary">Fixed 40%</div>
  <div slot="secondary">Fixed 60%</div>
</snice-split-pane>
```

### Nested Split Panes

```html
<snice-split-pane style="height: 500px;">
  <div slot="primary">
    <snice-split-pane direction="vertical" style="height: 100%;">
      <div slot="primary">Top Left</div>
      <div slot="secondary">Bottom Left</div>
    </snice-split-pane>
  </div>
  <div slot="secondary">Right Pane</div>
</snice-split-pane>
```

### Programmatic Control

```html
<snice-split-pane id="my-split" style="height: 400px;">
  <div slot="primary">Primary</div>
  <div slot="secondary">Secondary</div>
</snice-split-pane>

<script>
  const split = document.getElementById('my-split');
  split.setPrimarySize(30);   // Set to 30%
  split.reset();              // Reset to 50/50
</script>
```

## Slots

| Name | Description |
|------|-------------|
| `primary` | Primary pane content (left or top) |
| `secondary` | Secondary pane content (right or bottom) |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | Split direction |
| `primarySize` (attr: `primary-size`) | `number` | `50` | Primary pane size (%) |
| `minPrimarySize` (attr: `min-primary-size`) | `number` | `10` | Min primary size (%) |
| `minSecondarySize` (attr: `min-secondary-size`) | `number` | `10` | Min secondary size (%) |
| `snapSize` (attr: `snap-size`) | `number` | `0` | Snap interval (%, 0 = none) |
| `disabled` | `boolean` | `false` | Disable resizing |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `pane-resize` | `{ primarySize: number, secondarySize: number, splitPane: SniceResizeElement }` | Fired when pane is resized |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `getPrimarySize()` | -- | Get primary pane size (%), returns `number` |
| `getSecondarySize()` | -- | Get secondary pane size (%), returns `number` |
| `setPrimarySize()` | `size: number` | Set primary pane size (respects min sizes) |
| `reset()` | -- | Reset to 50/50 split |
