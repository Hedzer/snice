<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/tooltip.md -->

# Tooltip
`<snice-tooltip>`

Provides contextual information when users hover, click, or focus an element. Supports smart repositioning near viewport edges.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Attribute-Based Tooltips](#attribute-based-tooltips)

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

## Slots

| Name | Description |
|------|-------------|
| (default) | Trigger content the tooltip attaches to |

## CSS Parts

| Part | Description |
|------|-------------|
| `trigger` | Wrapper around the slot/trigger content |
| `tooltip` | The tooltip popup element |
| `content` | The text content inside the tooltip |
| `arrow` | The arrow/caret element pointing to the trigger |

## Basic Usage

```typescript
import 'snice/components/tooltip/snice-tooltip';
```

```html
<snice-tooltip content="This is a tooltip">
  <button>Hover me</button>
</snice-tooltip>
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

## Attribute-Based Tooltips

Wrapping elements in `<snice-tooltip>` can break parent-child relationships in components that require direct children (accordion, tabs, stepper, breadcrumbs, table, etc.). The attribute-based approach uses a plain `tooltip` attribute on any element, avoiding DOM disruption entirely.

The tooltip observer activates automatically when any tooltip component is loaded -- no setup needed.

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

This is the primary use case -- adding tooltips without disrupting component structure:

```html
<snice-tabs>
  <snice-tab slot="nav" tooltip="User settings">Settings</snice-tab>
  <snice-tab slot="nav" tooltip="Account info">Profile</snice-tab>
</snice-tabs>
```

### CSS Variable Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `--tooltip-position` | `top` | Position: top/bottom/left/right + -start/-end |
| `--tooltip-trigger` | `hover` | Trigger: hover, click, focus |
| `--tooltip-delay` | `0` | Show delay in milliseconds |
| `--tooltip-hide-delay` | `0` | Hide delay in milliseconds |
| `--tooltip-offset` | `12` | Distance from trigger element in pixels |
| `--tooltip-arrow` | *(shown)* | Set to `none` to hide the arrow |
| `--tooltip-max-width` | `250` | Maximum tooltip width in pixels |
| `--tooltip-z-index` | `10000` | Z-index stacking order |
| `--tooltip-strict-positioning` | *(false)* | Set to `true` to disable auto-flip |
| `--tooltip-bg` | `hsl(0 0% 20%)` | Background color |
| `--tooltip-color` | `white` | Text color |
| `--tooltip-padding` | `8px 12px` | Content padding |
| `--tooltip-radius` | `6px` | Border radius |
| `--tooltip-font-size` | `14px` | Font size |
