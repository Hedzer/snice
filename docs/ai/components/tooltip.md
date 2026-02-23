# snice-tooltip

Contextual information on hover, click, or focus with smart positioning.

## Properties

```typescript
content: string = '';
position: 'top'|'top-start'|'top-end'|'bottom'|'bottom-start'|'bottom-end'|'left'|'left-start'|'left-end'|'right'|'right-start'|'right-end' = 'top';
trigger: 'hover'|'click'|'focus'|'manual' = 'hover';
delay: number = 0;
hideDelay: number = 0;           // attr: hide-delay
offset: number = 12;
arrow: boolean = true;
open: boolean = false;
maxWidth: number = 250;          // attr: max-width
zIndex: number = 10000;          // attr: z-index
strictPositioning: boolean = false; // attr: strict-positioning
```

## Slots

- `(default)` - Trigger element the tooltip attaches to

## Methods

- `show()` - Show tooltip
- `hide()` - Hide tooltip
- `toggle()` - Toggle visibility
- `updatePosition()` - Recalculate position

## Usage

```html
<snice-tooltip content="Tooltip text">
  <button>Hover me</button>
</snice-tooltip>

<snice-tooltip content="Below" position="bottom">
  <button>Bottom</button>
</snice-tooltip>

<snice-tooltip content="Click to toggle" trigger="click">
  <button>Click me</button>
</snice-tooltip>

<snice-tooltip content="Focus help" trigger="focus">
  <input type="text">
</snice-tooltip>

<snice-tooltip id="tip" content="Manual" trigger="manual">
  <span>Element</span>
</snice-tooltip>
<script>document.querySelector('#tip').open = true;</script>

<snice-tooltip content="Delayed" delay="500" hide-delay="200">
  <button>Wait</button>
</snice-tooltip>
```
