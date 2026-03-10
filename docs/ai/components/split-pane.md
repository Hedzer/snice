# snice-split-pane

Resizable split pane layout with draggable divider.

## Properties

```typescript
direction: 'horizontal'|'vertical' = 'horizontal';
primarySize: number = 50;         // attr: primary-size, percentage
minPrimarySize: number = 10;      // attr: min-primary-size, percentage
minSecondarySize: number = 10;    // attr: min-secondary-size, percentage
snapSize: number = 0;             // attr: snap-size, percentage, 0 = no snap
disabled: boolean = false;
```

## Methods

- `getPrimarySize()` → `number` - Get primary pane percentage
- `getSecondarySize()` → `number` - Get secondary pane percentage
- `setPrimarySize(size)` - Set primary pane percentage
- `reset()` - Reset to 50/50

## Events

- `pane-resize` → `{ primarySize, secondarySize, splitPane }`

## Slots

- `primary` - Primary pane content (left or top)
- `secondary` - Secondary pane content (right or bottom)

## CSS Parts

- `primary` - Primary pane container
- `divider` - Draggable divider bar
- `handle` - Visual handle inside divider
- `secondary` - Secondary pane container

## Basic Usage

```html
<snice-split-pane style="height: 400px;">
  <div slot="primary">Left pane</div>
  <div slot="secondary">Right pane</div>
</snice-split-pane>

<snice-split-pane direction="vertical">
  <div slot="primary">Top</div>
  <div slot="secondary">Bottom</div>
</snice-split-pane>

<snice-split-pane primary-size="30" snap-size="10">
  <div slot="primary">30%</div>
  <div slot="secondary">70%</div>
</snice-split-pane>
```

## Accessibility

- Divider keyboard-accessible with arrow keys
- Mouse, touch, and keyboard input supported
