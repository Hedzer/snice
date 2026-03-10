<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/split-pane.md -->

# Split Pane

A resizable split layout with a draggable divider. Supports horizontal (left/right) and vertical (top/bottom) orientations with configurable size constraints.

## Table of Contents

- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | Split direction |
| `primarySize` (attr: `primary-size`) | `number` | `50` | Primary pane size (%) |
| `minPrimarySize` (attr: `min-primary-size`) | `number` | `10` | Minimum primary pane size (%) |
| `minSecondarySize` (attr: `min-secondary-size`) | `number` | `10` | Minimum secondary pane size (%) |
| `snapSize` (attr: `snap-size`) | `number` | `0` | Snap interval (%, 0 = no snapping) |
| `disabled` | `boolean` | `false` | Disable resizing |

## Methods

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `getPrimarySize()` | -- | `number` | Get current primary pane size (%) |
| `getSecondarySize()` | -- | `number` | Get current secondary pane size (%) |
| `setPrimarySize()` | `size: number` | `void` | Set primary pane size (respects min sizes) |
| `reset()` | -- | `void` | Reset to 50/50 split |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `pane-resize` | `{ primarySize: number, secondarySize: number, splitPane: SniceSplitPaneElement }` | Fired when the pane is resized |

## Slots

| Name | Description |
|------|-------------|
| `primary` | Primary pane content (left or top) |
| `secondary` | Secondary pane content (right or bottom) |

## CSS Parts

| Part | Description |
|------|-------------|
| `primary` | The primary pane container |
| `divider` | The draggable divider bar |
| `handle` | The visual handle inside the divider |
| `secondary` | The secondary pane container |

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

## Examples

### Vertical Split

Use `direction="vertical"` for a top/bottom layout.

```html
<snice-split-pane direction="vertical" style="height: 400px;">
  <div slot="primary">Top pane</div>
  <div slot="secondary">Bottom pane</div>
</snice-split-pane>
```

### Custom Initial Size

Use `primary-size` to set the initial split ratio.

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

Use `snap-size` to snap the divider to fixed percentage increments.

```html
<snice-split-pane snap-size="10" style="height: 400px;">
  <div slot="primary">Snaps to 10% increments</div>
  <div slot="secondary">Right pane</div>
</snice-split-pane>
```

### Disabled

Set `disabled` to prevent resizing.

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

```typescript
const split = document.querySelector('snice-split-pane');
split.setPrimarySize(30);   // Set to 30%
console.log(split.getPrimarySize());  // 30
split.reset();              // Reset to 50/50
```

## Accessibility

- Divider is keyboard-accessible with arrow keys for resizing
- Mouse, touch, and keyboard input supported
