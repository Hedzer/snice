# snice-popover

Floating content positioned relative to target element.

## Properties

```typescript
open: boolean = false;
placement: 'top'|'bottom'|'left'|'right'|'top-start'|'top-end'|'bottom-start'|'bottom-end'|'left-start'|'left-end'|'right-start'|'right-end' = 'top';
trigger: 'click'|'hover'|'focus'|'manual' = 'click';
distance: number = 8;
showArrow: boolean = true;
closeOnClickOutside: boolean = true;
closeOnEscape: boolean = true;
hoverDelay: number = 200;
targetSelector: string = '';
```

## Methods

```typescript
show(): void
hide(): void
toggle(): void
updatePosition(): void
```

## Events

- `@snice/popover-show` - Dispatched when shown
- `@snice/popover-hide` - Dispatched when hidden

## Usage

```html
<button id="btn">Click me</button>
<snice-popover target-selector="#btn">
  Popover content
</snice-popover>

<!-- Hover trigger -->
<snice-popover target-selector="#btn" trigger="hover">
  Appears on hover
</snice-popover>

<!-- Manual control -->
<snice-popover id="pop" trigger="manual">Content</snice-popover>
<script>
  document.getElementById('pop').show();
</script>

<!-- Different placements -->
<snice-popover placement="bottom">Bottom</snice-popover>
<snice-popover placement="left-start">Left Start</snice-popover>

<!-- No arrow -->
<snice-popover show-arrow="false">No arrow</snice-popover>
```

## Features

- 12 placement options with start/end alignment
- Multiple triggers (click/hover/focus/manual)
- Arrow indicator (optional)
- Auto-positioning with scroll/resize
- Close on click outside or Escape
- Hover delay configuration
- Target via selector or previous sibling
- Fixed positioning overlay
- Event dispatching
