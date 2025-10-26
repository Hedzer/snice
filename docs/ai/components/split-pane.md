# snice-split-pane

Resizable split pane layout.

## Properties

```typescript
direction: 'horizontal'|'vertical' = 'horizontal';
primarySize: number = 50; // percentage
minPrimarySize: number = 10; // percentage
minSecondarySize: number = 10; // percentage
snapSize: number = 0; // percentage, 0 = no snap
disabled: boolean = false;
```

## Methods

```typescript
getPrimarySize(): number
getSecondarySize(): number
setPrimarySize(size: number): void
reset(): void
```

## Events

- `@snice/resize` - Dispatched on resize (detail: { primarySize, secondarySize, splitPane })

## Usage

```html
<snice-split-pane style="height: 400px;">
  <div slot="primary">Left pane</div>
  <div slot="secondary">Right pane</div>
</snice-split-pane>

<!-- Vertical -->
<snice-split-pane direction="vertical">
  <div slot="primary">Top</div>
  <div slot="secondary">Bottom</div>
</snice-split-pane>

<!-- Custom size -->
<snice-split-pane primary-size="30">
  <div slot="primary">30%</div>
  <div slot="secondary">70%</div>
</snice-split-pane>

<!-- With snap -->
<snice-split-pane snap-size="10">
  <div slot="primary">Snaps to 10%</div>
  <div slot="secondary">Right</div>
</snice-split-pane>

<!-- Programmatic -->
<script>
  splitPane.setPrimarySize(40);
  splitPane.reset(); // 50/50
</script>
```

## Features

- Horizontal and vertical orientation
- Drag to resize
- Minimum sizes for both panes
- Snap to grid
- Programmatic control
- Nested layouts supported
- Disabled state
- Event dispatching
