# Action Bar
`<snice-action-bar>`

A positioned, animated container for contextual actions that appears on hover, focus, or programmatic trigger.

## Basic Usage

```typescript
import 'snice/components/action-bar/snice-action-bar';
```

```html
<div style="position: relative">
  <p>Card content</p>
  <snice-action-bar position="bottom">
    <button>Edit</button>
    <button>Delete</button>
  </snice-action-bar>
</div>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/action-bar/snice-action-bar';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-action-bar.min.js"></script>
```

## Examples

### Variants

Use the `variant` attribute to change the bar's visual style.

```html
<snice-action-bar variant="default">
  <button>Edit</button>
  <button>Delete</button>
</snice-action-bar>

<snice-action-bar variant="pill">
  <button>Save</button>
  <button>Share</button>
</snice-action-bar>
```

### Sizes

Use the `size` attribute to change the bar's padding and gap.

```html
<snice-action-bar size="small">
  <button>A</button>
  <button>B</button>
</snice-action-bar>

<snice-action-bar size="medium">
  <button>A</button>
  <button>B</button>
</snice-action-bar>
```

### Positions

Use the `position` attribute to place the bar relative to its positioned parent.

```html
<snice-action-bar position="top">...</snice-action-bar>
<snice-action-bar position="bottom">...</snice-action-bar>
<snice-action-bar position="left">...</snice-action-bar>
<snice-action-bar position="right">...</snice-action-bar>
<snice-action-bar position="top-left">...</snice-action-bar>
<snice-action-bar position="top-right">...</snice-action-bar>
<snice-action-bar position="bottom-left">...</snice-action-bar>
<snice-action-bar position="bottom-right">...</snice-action-bar>
```

### Animated Show/Hide

Show and hide the action bar programmatically or via hover. The bar animates with a fade + slide from its anchored edge.

```html
<div class="card"
     onmouseenter="this.querySelector('snice-action-bar').show()"
     onmouseleave="this.querySelector('snice-action-bar').hide()">
  <p>Hover me</p>
  <snice-action-bar position="bottom" variant="pill">
    <button>Save</button>
    <button>Share</button>
  </snice-action-bar>
</div>
```

### Always Visible

Set `no-animation` to make the bar always visible with no transitions.

```html
<snice-action-bar no-animation position="top-right" size="small">
  <button>Edit</button>
  <button>Delete</button>
</snice-action-bar>
```

### Keyboard Navigation

The action bar uses `role="toolbar"` and supports roving keyboard navigation. Arrow keys move focus between slotted children. `Escape` closes the bar (unless `no-escape-dismiss` is set).

```html
<snice-action-bar open no-escape-dismiss>
  <button>First</button>
  <button>Second</button>
  <button>Third</button>
</snice-action-bar>
```

## Slots

| Name | Description |
|------|-------------|
| (default) | Action content (buttons, icons, etc.) |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` | `boolean` | `false` | Whether the action bar is visible |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right' \| 'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'bottom'` | Position relative to parent |
| `size` | `'small' \| 'medium'` | `'medium'` | Bar size |
| `variant` | `'default' \| 'pill'` | `'default'` | Visual style |
| `noAnimation` (attr: `no-animation`) | `boolean` | `false` | Always visible, no transitions |
| `noEscapeDismiss` (attr: `no-escape-dismiss`) | `boolean` | `false` | Prevent Escape key from closing |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `action-bar-open` | `{ actionBar: SniceActionBarElement }` | Fired when the bar opens |
| `action-bar-close` | `{ actionBar: SniceActionBarElement }` | Fired when the bar closes |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `show()` | -- | Opens the action bar |
| `hide()` | -- | Closes the action bar |
| `toggle()` | -- | Toggles the open state |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--action-bar-background` | Background color | `var(--snice-color-background-element)` |
| `--action-bar-border` | Border style | `1px solid var(--snice-color-border)` |
| `--action-bar-border-radius` | Border radius | `var(--snice-border-radius-lg)` |
| `--action-bar-padding` | Inner padding | `var(--snice-spacing-xs)` |
| `--action-bar-gap` | Gap between items | `var(--snice-spacing-2xs)` |
| `--action-bar-shadow` | Box shadow | `var(--snice-shadow-md)` |
| `--action-bar-z-index` | Z-index | `10` |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The inner toolbar container |
