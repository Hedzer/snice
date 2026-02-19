# snice-tooltip

Contextual information on hover, click, or focus with smart positioning.

## Properties

```typescript
content: string = '';
position: TooltipPosition = 'top';
trigger: 'hover'|'click'|'focus'|'manual' = 'hover';
delay: number = 0;                    // Show delay (ms)
hideDelay: number = 0;                // Hide delay (ms)
offset: number = 12;                  // Distance from trigger (px)
arrow: boolean = true;
open: boolean = false;                // For manual trigger
maxWidth: number = 250;               // px
zIndex: number = 10000;
strictPositioning: boolean = false;   // Disable auto-repositioning
```

## Positions

**12 positions:**
- `top`, `bottom`, `left`, `right`
- `top-start`, `top-end`
- `bottom-start`, `bottom-end`
- `left-start`, `left-end`
- `right-start`, `right-end`

## Methods

```typescript
show()            // Show tooltip
hide()            // Hide tooltip
toggle()          // Toggle visibility
updatePosition()  // Recalculate position
```

## Usage

```html
<!-- Basic -->
<snice-tooltip content="Tooltip text">
  <button>Hover me</button>
</snice-tooltip>

<!-- Position -->
<snice-tooltip content="Below" position="bottom">
  <button>Button</button>
</snice-tooltip>

<!-- Click trigger -->
<snice-tooltip content="Click to toggle" trigger="click">
  <button>Click me</button>
</snice-tooltip>

<!-- Focus trigger -->
<snice-tooltip content="Focus input" trigger="focus">
  <input type="text">
</snice-tooltip>

<!-- Manual control -->
<snice-tooltip id="tip" content="Manual" trigger="manual">
  <span>Element</span>
</snice-tooltip>
<button onclick="document.querySelector('#tip').open = true">Show</button>

<!-- With delay -->
<snice-tooltip content="Delayed" delay="500" hide-delay="200">
  <button>Wait</button>
</snice-tooltip>

<!-- Custom styling -->
<snice-tooltip
  content="Custom"
  max-width="400"
  offset="20"
  arrow="false">
  <button>Custom</button>
</snice-tooltip>
```

## Features

- Portal rendering (appends to body)
- Smart viewport detection & auto-repositioning
- 12 position options with alignment
- 4 trigger modes
- Show/hide delays
- Arrow indicator
- Click-outside detection (click trigger)
- Custom max-width, offset, z-index
- Accessibility: role="tooltip"
- Focus restoration

## Patterns

**Help icon:**
```html
<snice-tooltip content="Help text">
  <span>?</span>
</snice-tooltip>
```

**Disabled button:**
```html
<snice-tooltip content="Fill form first">
  <span>
    <button disabled>Submit</button>
  </span>
</snice-tooltip>
```

**Truncated text:**
```html
<snice-tooltip content="Full text here">
  <div class="truncated">Full text...</div>
</snice-tooltip>
```

**Programmatic:**
```typescript
const tip = document.querySelector('snice-tooltip');
tip.show();
tip.hide();
tip.toggle();
tip.updatePosition(); // After layout change
```

## Smart Positioning

Auto-repositions if tooltip would overflow viewport. Tries alternative positions in order:
- Top → Bottom → Left → Right
- Bottom → Top → Left → Right
- Left → Right → Top → Bottom
- Right → Left → Top → Bottom

Disable with `strict-positioning` attribute.

## Notes

- Disabled elements need wrapper span (no events)
- Portal created in document.body
- Hover doesn't work on touch devices
- Content should be brief (not interactive)
- Use `trigger="manual"` with `open` for programmatic control
