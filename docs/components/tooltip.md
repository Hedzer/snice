[//]: # (AI: For a low-token version of this doc, use docs/ai/components/tooltip.md instead)

# Tooltip
`<snice-tooltip>`

Provides contextual information when users hover, click, or focus an element.

## Basic Usage

```typescript
import 'snice/components/tooltip/snice-tooltip';
```

```html
<snice-tooltip content="This is a tooltip">
  <button>Hover me</button>
</snice-tooltip>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/tooltip/snice-tooltip';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-tooltip.min.js"></script>
```

## Examples

### Positions

Use the `position` attribute to place the tooltip relative to its trigger.

```html
<snice-tooltip content="Above" position="top">
  <button>Top</button>
</snice-tooltip>

<snice-tooltip content="Below" position="bottom">
  <button>Bottom</button>
</snice-tooltip>

<snice-tooltip content="Left side" position="left">
  <button>Left</button>
</snice-tooltip>

<snice-tooltip content="Right side" position="right">
  <button>Right</button>
</snice-tooltip>
```

### Aligned Positions

Use `-start` or `-end` suffixes for aligned placement.

```html
<snice-tooltip content="Left aligned" position="top-start">
  <button>Top Start</button>
</snice-tooltip>

<snice-tooltip content="Right aligned" position="top-end">
  <button>Top End</button>
</snice-tooltip>
```

### Click Trigger

Use `trigger="click"` to show on click instead of hover.

```html
<snice-tooltip content="Click to toggle" trigger="click">
  <button>Click me</button>
</snice-tooltip>
```

### Focus Trigger

Use `trigger="focus"` to show when the element receives focus.

```html
<snice-tooltip content="Enter your email address" trigger="focus">
  <input type="email" placeholder="Email">
</snice-tooltip>
```

### Manual Control

Use `trigger="manual"` with the `open` property for programmatic control.

```html
<snice-tooltip id="manual-tip" content="Manually controlled" trigger="manual">
  <span>Target element</span>
</snice-tooltip>

<script>
  const tooltip = document.getElementById('manual-tip');
  tooltip.open = true;   // Show
  tooltip.open = false;  // Hide
</script>
```

### With Delay

Use the `delay` and `hide-delay` attributes to add show/hide delays.

```html
<snice-tooltip content="Delayed tooltip" delay="500" hide-delay="200">
  <button>Hover and wait</button>
</snice-tooltip>
```

### Without Arrow

Set `arrow="false"` to hide the arrow indicator.

```html
<snice-tooltip content="No arrow" arrow="false">
  <button>No arrow</button>
</snice-tooltip>
```

### Strict Positioning

Set the `strict-positioning` attribute to disable automatic repositioning when near viewport edges.

```html
<snice-tooltip content="Won't flip" position="top" strict-positioning>
  <button>Fixed position</button>
</snice-tooltip>
```

### Toolbar Buttons

```html
<div style="display: flex; gap: 4px;">
  <snice-tooltip content="Bold (Ctrl+B)" position="bottom">
    <button><b>B</b></button>
  </snice-tooltip>
  <snice-tooltip content="Italic (Ctrl+I)" position="bottom">
    <button><i>I</i></button>
  </snice-tooltip>
</div>
```

## Slots

| Name | Description |
|------|-------------|
| (default) | Trigger content the tooltip attaches to |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `content` | `string` | `''` | Tooltip text |
| `position` | `'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'left' \| 'left-start' \| 'left-end' \| 'right' \| 'right-start' \| 'right-end'` | `'top'` | Position relative to trigger |
| `trigger` | `'hover' \| 'click' \| 'focus' \| 'manual'` | `'hover'` | Interaction that shows tooltip |
| `delay` | `number` | `0` | Show delay in milliseconds |
| `hideDelay` (attr: `hide-delay`) | `number` | `0` | Hide delay in milliseconds |
| `offset` | `number` | `12` | Distance from trigger in pixels |
| `arrow` | `boolean` | `true` | Show arrow indicator |
| `open` | `boolean` | `false` | Visibility state |
| `maxWidth` (attr: `max-width`) | `number` | `250` | Maximum width in pixels |
| `zIndex` (attr: `z-index`) | `number` | `10000` | Stacking order |
| `strictPositioning` (attr: `strict-positioning`) | `boolean` | `false` | Disable auto-repositioning |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `show()` | -- | Show the tooltip |
| `hide()` | -- | Hide the tooltip |
| `toggle()` | -- | Toggle visibility |
| `updatePosition()` | -- | Recalculate position |

## Attribute-Based Tooltips (`useTooltips`)

Wrapping elements in `<snice-tooltip>` can break parent-child relationships in components that require direct children (accordion, tabs, stepper, breadcrumbs, table, etc.). The attribute-based approach uses a plain `tooltip` attribute on any element, avoiding DOM disruption entirely.

### Setup

Call `useTooltips()` once in your app entry point. It's idempotent — safe to call multiple times.

```typescript
import { useTooltips } from 'snice';
useTooltips();
```

### Basic Usage

```html
<button tooltip="Save changes">Save</button>

<button tooltip="Below the button" style="--tooltip-position: bottom">
  Bottom tooltip
</button>

<button tooltip="With delay" style="--tooltip-delay: 300">
  Hover and wait
</button>
```

### Inside Strict-Children Components

This is the primary use case — adding tooltips without disrupting component structure:

```html
<snice-tabs>
  <snice-tab slot="nav" tooltip="User settings">Settings</snice-tab>
  <snice-tab slot="nav" tooltip="Account info">Profile</snice-tab>
</snice-tabs>

<snice-accordion>
  <snice-accordion-item tooltip="Click to expand">
    <span slot="header">Section 1</span>
    <p>Content here</p>
  </snice-accordion-item>
</snice-accordion>

<snice-breadcrumbs>
  <a href="/" tooltip="Go to homepage">Home</a>
  <a href="/docs" tooltip="Documentation">Docs</a>
</snice-breadcrumbs>
```

### Scoped Configuration via CSS

Use CSS custom properties to configure tooltips. Properties cascade, so you can scope config with CSS selectors:

```html
<style>
  /* All toolbar tooltips appear below with a delay */
  .toolbar [tooltip] {
    --tooltip-position: bottom;
    --tooltip-delay: 200;
  }

  /* Sidebar tooltips appear to the right */
  .sidebar [tooltip] {
    --tooltip-position: right;
    --tooltip-offset: 16;
  }

  /* Custom themed tooltips */
  .dark-section [tooltip] {
    --tooltip-bg: hsl(220 20% 15%);
    --tooltip-color: hsl(220 20% 90%);
    --tooltip-radius: 8px;
    --tooltip-font-size: 13px;
  }
</style>

<div class="toolbar">
  <button tooltip="Bold (Ctrl+B)"><b>B</b></button>
  <button tooltip="Italic (Ctrl+I)"><i>I</i></button>
</div>
```

### Click Trigger

```html
<button tooltip="Click to toggle" style="--tooltip-trigger: click">
  Click me
</button>
```

### Focus Trigger

```html
<input tooltip="Enter your email" style="--tooltip-trigger: focus" type="email">
```

### Without Arrow

```html
<button tooltip="No arrow" style="--tooltip-arrow: none">
  Hover me
</button>
```

### CSS Variable Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `--tooltip-position` | `top` | Position: `top`, `top-start`, `top-end`, `bottom`, `bottom-start`, `bottom-end`, `left`, `left-start`, `left-end`, `right`, `right-start`, `right-end` |
| `--tooltip-trigger` | `hover` | Trigger: `hover`, `click`, `focus` |
| `--tooltip-delay` | `0` | Show delay in milliseconds |
| `--tooltip-hide-delay` | `0` | Hide delay in milliseconds |
| `--tooltip-offset` | `12` | Distance from trigger element in pixels |
| `--tooltip-arrow` | *(shown)* | Set to `none` to hide the arrow |
| `--tooltip-max-width` | `250` | Maximum tooltip width in pixels |
| `--tooltip-z-index` | `10000` | Z-index stacking order |
| `--tooltip-strict-positioning` | *(false)* | Set to `true` to disable automatic repositioning when near viewport edges |
| `--tooltip-bg` | `hsl(0 0% 20%)` | Background color |
| `--tooltip-color` | `white` | Text color |
| `--tooltip-padding` | `8px 12px` | Content padding |
| `--tooltip-radius` | `6px` | Border radius |
| `--tooltip-font-size` | `14px` | Font size |

### Cleanup

To disconnect the observer and remove all tooltip portals:

```typescript
import { cleanupTooltips } from 'snice';
cleanupTooltips();
```
