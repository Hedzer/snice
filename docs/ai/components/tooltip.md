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

**CSS Parts:**
- `trigger` - Wrapper around the slot/trigger content
- `tooltip` - The tooltip popup div
- `content` - Text content inside tooltip
- `arrow` - Arrow element

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

## Attribute-Based Tooltips (`useTooltips`)

Opt-in observer for `tooltip` attribute on any element. No wrapper element — safe inside strict-children components (tabs, accordion, etc.).

### Setup

```typescript
import { useTooltips } from 'snice';
useTooltips(); // idempotent
```

### Usage

```html
<button tooltip="Save changes">Save</button>
<button tooltip="Below" style="--tooltip-position: bottom">Bottom</button>

<!-- Inside strict-children components -->
<snice-tabs>
  <snice-tab slot="nav" tooltip="User settings">Settings</snice-tab>
</snice-tabs>

<!-- Scoped config via CSS -->
<style>
  .toolbar [tooltip] { --tooltip-position: bottom; --tooltip-delay: 200; }
</style>
```

### CSS Variable API

| Variable | Default | Description |
|---|---|---|
| `--tooltip-position` | `top` | top/bottom/left/right + -start/-end |
| `--tooltip-trigger` | `hover` | hover, click, focus |
| `--tooltip-delay` | `0` | Show delay (ms) |
| `--tooltip-hide-delay` | `0` | Hide delay (ms) |
| `--tooltip-offset` | `12` | Distance from trigger (px) |
| `--tooltip-arrow` | (shown) | `none` to hide |
| `--tooltip-max-width` | `250` | Max width (px) |
| `--tooltip-z-index` | `10000` | Z-index |
| `--tooltip-strict-positioning` | (false) | `true` to disable auto-flip |
| `--tooltip-bg` | `hsl(0 0% 20%)` | Background color |
| `--tooltip-color` | `white` | Text color |
| `--tooltip-padding` | `8px 12px` | Content padding |
| `--tooltip-radius` | `6px` | Border radius |
| `--tooltip-font-size` | `14px` | Font size |

### Cleanup

```typescript
import { cleanupTooltips } from 'snice';
cleanupTooltips(); // disconnect observer, remove portals
```
