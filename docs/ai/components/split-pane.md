# snice-split-pane

Resizable split pane layout.

## Properties

```typescript
direction: 'horizontal'|'vertical' = 'horizontal';
primarySize: number = 50;         // attr: primary-size, percentage
minPrimarySize: number = 10;      // attr: min-primary-size, percentage
minSecondarySize: number = 10;    // attr: min-secondary-size, percentage
snapSize: number = 0;             // attr: snap-size, percentage, 0 = no snap
disabled: boolean = false;
```

## Slots

- `primary` - Primary pane content
- `secondary` - Secondary pane content

## Events

- `pane-resize` → `{ primarySize, secondarySize, splitPane }`

## Methods

- `getPrimarySize()` - Get primary pane percentage
- `getSecondarySize()` - Get secondary pane percentage
- `setPrimarySize(size)` - Set primary pane percentage
- `reset()` - Reset to 50/50

## CSS Parts

- `primary` - The primary pane container
- `divider` - The draggable divider bar
- `handle` - The visual handle inside the divider
- `secondary` - The secondary pane container

## Usage

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
