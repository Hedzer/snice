# Tooltip Component

The `<snice-tooltip>` component provides contextual information when users interact with an element. Tooltips appear on hover, click, or focus and can be positioned in 13 different locations relative to the trigger element.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Positions](#positions)
- [Triggers](#triggers)
- [Examples](#examples)

## Basic Usage

```html
<snice-tooltip content="This is a tooltip">
  <button>Hover me</button>
</snice-tooltip>
```

```typescript
import 'snice/components/tooltip/snice-tooltip';
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `content` | `string` | `''` | Tooltip text content |
| `position` | `TooltipPosition` | `'top'` | Position relative to trigger |
| `trigger` | `TooltipTrigger` | `'hover'` | Interaction that shows tooltip |
| `delay` | `number` | `0` | Show delay in milliseconds |
| `hideDelay` | `number` | `0` | Hide delay in milliseconds |
| `offset` | `number` | `12` | Distance from trigger in pixels |
| `arrow` | `boolean` | `true` | Show arrow indicator |
| `open` | `boolean` | `false` | Visibility state (manual trigger) |
| `maxWidth` | `number` | `250` | Maximum width in pixels |
| `zIndex` | `number` | `10000` | Stacking order |

### TooltipPosition

**Main positions:**
- `'top'` - Centered above
- `'bottom'` - Centered below
- `'left'` - Centered to the left
- `'right'` - Centered to the right

**Aligned positions:**
- `'top-start'` - Above, left-aligned
- `'top-end'` - Above, right-aligned
- `'bottom-start'` - Below, left-aligned
- `'bottom-end'` - Below, right-aligned
- `'left-start'` - Left, top-aligned
- `'left-end'` - Left, bottom-aligned
- `'right-start'` - Right, top-aligned
- `'right-end'` - Right, bottom-aligned

### TooltipTrigger

- `'hover'` - Show on mouse enter, hide on mouse leave
- `'click'` - Toggle on click, hide on click outside
- `'focus'` - Show on focus, hide on blur
- `'manual'` - Control via `open` property

## Methods

### `show(): void`
Show the tooltip.

```typescript
const tooltip = document.querySelector('snice-tooltip');
tooltip.show();
```

### `hide(): void`
Hide the tooltip.

```typescript
tooltip.hide();
```

### `toggle(): void`
Toggle tooltip visibility.

```typescript
tooltip.toggle();
```

### `updatePosition(): void`
Recalculate and update tooltip position. Useful when trigger element moves or resizes.

```typescript
tooltip.updatePosition();
```

## Positions

### Basic Positions

```html
<!-- Top -->
<snice-tooltip content="Tooltip above" position="top">
  <button>Top</button>
</snice-tooltip>

<!-- Bottom -->
<snice-tooltip content="Tooltip below" position="bottom">
  <button>Bottom</button>
</snice-tooltip>

<!-- Left -->
<snice-tooltip content="Tooltip on left" position="left">
  <button>Left</button>
</snice-tooltip>

<!-- Right -->
<snice-tooltip content="Tooltip on right" position="right">
  <button>Right</button>
</snice-tooltip>
```

### Aligned Positions

```html
<!-- Top-start (left-aligned) -->
<snice-tooltip content="Left aligned" position="top-start">
  <button>Top Start</button>
</snice-tooltip>

<!-- Top-end (right-aligned) -->
<snice-tooltip content="Right aligned" position="top-end">
  <button>Top End</button>
</snice-tooltip>

<!-- Bottom-start -->
<snice-tooltip content="Left aligned" position="bottom-start">
  <button>Bottom Start</button>
</snice-tooltip>

<!-- And so on... -->
```

## Triggers

### Hover (Default)

```html
<snice-tooltip content="Appears on hover">
  <button>Hover me</button>
</snice-tooltip>
```

### Click

```html
<snice-tooltip content="Click to toggle" trigger="click">
  <button>Click me</button>
</snice-tooltip>
```

### Focus

```html
<snice-tooltip content="Focus the input" trigger="focus">
  <input type="text" placeholder="Focus me">
</snice-tooltip>
```

### Manual

```html
<snice-tooltip id="manualTip" content="Manually controlled" trigger="manual">
  <span>Trigger element</span>
</snice-tooltip>

<button onclick="document.querySelector('#manualTip').open = true">
  Show
</button>
<button onclick="document.querySelector('#manualTip').open = false">
  Hide
</button>
```

## Examples

### Icon with Tooltip

```html
<snice-tooltip content="Save your changes">
  <button>
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path d="M8 2l6 12H2z"/>
    </svg>
  </button>
</snice-tooltip>
```

### With Delay

```html
<!-- Show after 500ms, hide after 200ms -->
<snice-tooltip
  content="Delayed tooltip"
  delay="500"
  hide-delay="200">
  <button>Hover and wait</button>
</snice-tooltip>
```

### Without Arrow

```html
<snice-tooltip content="No arrow" arrow="false">
  <button>No arrow</button>
</snice-tooltip>
```

### Custom Width

```html
<snice-tooltip
  content="This is a longer tooltip that needs more space"
  max-width="400">
  <button>Wide tooltip</button>
</snice-tooltip>
```

### Custom Offset

```html
<!-- Further away from trigger -->
<snice-tooltip content="Far away" offset="30">
  <button>More space</button>
</snice-tooltip>
```

### Help Icon

```html
<style>
  .help-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #3b82f6;
    color: white;
    font-size: 12px;
    cursor: help;
  }
</style>

<div style="display: flex; align-items: center; gap: 8px;">
  <label>Password</label>
  <snice-tooltip content="Must be at least 8 characters">
    <span class="help-icon">?</span>
  </snice-tooltip>
</div>
```

### Disabled Button Explanation

```html
<snice-tooltip content="Please fill out the form first">
  <span>
    <button disabled>Submit</button>
  </span>
</snice-tooltip>
```

**Note:** Wrap disabled buttons in a span since they don't trigger mouse events.

### Truncated Text

```html
<style>
  .truncated {
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>

<snice-tooltip content="This is the full text that gets truncated">
  <div class="truncated">
    This is the full text that gets truncated
  </div>
</snice-tooltip>
```

### Form Field Help

```html
<div style="display: flex; flex-direction: column; gap: 8px;">
  <div style="display: flex; align-items: center; gap: 8px;">
    <label for="email">Email</label>
    <snice-tooltip content="We'll never share your email with anyone" position="right">
      <span style="color: #666; cursor: help;">ℹ️</span>
    </snice-tooltip>
  </div>
  <input id="email" type="email">
</div>
```

### Toolbar Buttons

```html
<style>
  .toolbar {
    display: flex;
    gap: 4px;
    padding: 8px;
    background: #f3f4f6;
    border-radius: 8px;
  }

  .toolbar button {
    padding: 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 4px;
  }

  .toolbar button:hover {
    background: white;
  }
</style>

<div class="toolbar">
  <snice-tooltip content="Bold (Ctrl+B)" position="bottom">
    <button><b>B</b></button>
  </snice-tooltip>

  <snice-tooltip content="Italic (Ctrl+I)" position="bottom">
    <button><i>I</i></button>
  </snice-tooltip>

  <snice-tooltip content="Underline (Ctrl+U)" position="bottom">
    <button><u>U</u></button>
  </snice-tooltip>
</div>
```

### Chart Data Points

```html
<style>
  .chart-point {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
  }
</style>

<snice-tooltip content="Sales: $12,345" position="top">
  <div class="chart-point"></div>
</snice-tooltip>
```

### Status Indicators

```html
<style>
  .status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .status-dot.online { background: #10b981; }
  .status-dot.offline { background: #ef4444; }
</style>

<snice-tooltip content="Server is online and responding" position="right">
  <div class="status">
    <span class="status-dot online"></span>
    <span>Server Status</span>
  </div>
</snice-tooltip>
```

### Programmatic Control

```typescript
import type { SniceTooltipElement } from 'snice/components/tooltip/snice-tooltip.types';

const tooltip = document.querySelector<SniceTooltipElement>('snice-tooltip');

// Show/hide programmatically
tooltip.show();
setTimeout(() => tooltip.hide(), 2000);

// Toggle
tooltip.toggle();

// Update position after layout changes
window.addEventListener('resize', () => {
  tooltip.updatePosition();
});

// Change properties
tooltip.content = 'Updated content';
tooltip.position = 'bottom';
tooltip.arrow = false;
```

### Dynamic Content

```html
<snice-tooltip id="dynamicTip" content="Loading..." trigger="manual">
  <button id="fetchBtn">Fetch Data</button>
</snice-tooltip>

<script type="module">
  import 'snice/components/tooltip/snice-tooltip';

  const btn = document.querySelector('#fetchBtn');
  const tooltip = document.querySelector('#dynamicTip');

  btn.addEventListener('click', async () => {
    tooltip.content = 'Loading...';
    tooltip.open = true;

    const data = await fetch('/api/data').then(r => r.json());

    tooltip.content = `Loaded ${data.count} items`;

    setTimeout(() => {
      tooltip.open = false;
    }, 2000);
  });
</script>
```

## Smart Positioning

Tooltips automatically reposition themselves if they would overflow the viewport:

```html
<!-- Will flip to bottom if no room above -->
<snice-tooltip content="Smart positioning" position="top">
  <button>Near top edge</button>
</snice-tooltip>
```

To disable auto-repositioning:

```html
<snice-tooltip
  content="Stays on top"
  position="top"
  strict-positioning>
  <button>Fixed position</button>
</snice-tooltip>
```

## Accessibility

- **role="tooltip"**: Proper ARIA role on tooltip element
- **Keyboard accessible**: Focus trigger works with keyboard navigation
- **Screen reader friendly**: Content announced when tooltip appears
- **Visible focus**: Trigger elements maintain focus indicators
- **Disabled elements**: Wrap in span to enable tooltips on disabled buttons

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support

## Best Practices

1. **Keep content brief**: Tooltips should provide quick, scannable information
2. **Don't repeat visible text**: Add value with additional context
3. **Avoid interactive content**: Tooltips should be informational only
4. **Use consistent triggers**: Stick to one trigger type per interface
5. **Position appropriately**: Consider available screen space
6. **Test on mobile**: Hover doesn't work on touch devices
7. **Wrap disabled elements**: Disabled elements don't fire events
8. **Provide alternatives**: Don't rely solely on tooltips for critical info

## Common Patterns

### Help Text Pattern
```html
<snice-tooltip content="Additional context">
  <span class="help-icon">?</span>
</snice-tooltip>
```

### Truncation Pattern
```html
<snice-tooltip content="Full text">
  <div class="truncated">Full text</div>
</snice-tooltip>
```

### Icon Button Pattern
```html
<snice-tooltip content="Action description">
  <button aria-label="Action description">
    <icon>
  </button>
</snice-tooltip>
```

### Status Pattern
```html
<snice-tooltip content="Detailed status">
  <span class="status-indicator"></span>
</snice-tooltip>
```
