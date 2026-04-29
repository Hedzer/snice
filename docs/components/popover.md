<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/popover.md -->

# Popover

A click-triggered, interactive floating panel anchored to a trigger element. Use it for content that needs to live outside the document flow but interact with the user — filter builders, sort configurators, lightweight forms, color pickers.

`<snice-popover>` complements two existing components:

- **`<snice-tooltip>`** is hover-triggered, non-interactive text/HTML.
- **`<snice-menu>`** is a popover specialised for menu items with keyboard navigation.

If your content is a list of selectable actions, prefer `<snice-menu>`. If it's a brief explanatory string, prefer `<snice-tooltip>`. Otherwise, reach for `<snice-popover>`.

## Table of Contents

- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [CSS Custom Properties](#css-custom-properties)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `open` | `open` | `boolean` | `false` | Panel visibility |
| `placement` | `placement` | `string` | `'bottom-end'` | Panel position relative to trigger. One of: `top`, `top-start`, `top-end`, `bottom`, `bottom-start`, `bottom-end`, `left`, `left-start`, `left-end`, `right`, `right-start`, `right-end` |
| `distance` | `distance` | `number` | `6` | Pixel gap between trigger and panel |
| `noOutsideDismiss` | `no-outside-dismiss` | `boolean` | `false` | Disable outside-click dismissal |
| `noEscapeDismiss` | `no-escape-dismiss` | `boolean` | `false` | Disable Escape-key dismissal |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `show()` | -- | Open the panel |
| `hide()` | -- | Close the panel |
| `toggle()` | -- | Toggle open/closed |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `popover-open` | `{ popover }` | Fired after the panel opens |
| `popover-close` | `{ popover }` | Fired after the panel closes |

## Slots

| Slot | Description |
|------|-------------|
| `trigger` | The element users click to toggle the panel (required) |
| (default) | Panel content |

## CSS Parts

| Part | Description |
|------|-------------|
| `trigger` | Trigger wrapper |
| `panel` | Floating panel |
| `content` | Inner content wrapper |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--snice-popover-bg` | `var(--snice-color-surface)` | Panel background |
| `--snice-popover-text` | `var(--snice-color-text)` | Panel text color |
| `--snice-popover-border` | `var(--snice-color-border)` | Panel border |
| `--snice-popover-shadow` | `var(--snice-shadow-lg)` | Panel shadow |
| `--snice-popover-radius` | `var(--snice-border-radius-lg)` | Corner radius |
| `--snice-popover-padding` | `var(--snice-spacing-sm)` | Inner padding |
| `--snice-popover-min-width` | `12rem` | Minimum width |
| `--snice-popover-max-width` | `28rem` | Maximum width |

## Basic Usage

```ts
import 'snice/components/popover/snice-popover';
```

```html
<snice-popover placement="bottom-start" distance="8">
  <snice-button slot="trigger">Open</snice-button>
  <div>
    <h4>Settings</h4>
    <snice-input placeholder="Search..."></snice-input>
  </div>
</snice-popover>
```

## Examples

### Imperative control

```ts
const popover = document.querySelector('snice-popover');
popover.addEventListener('popover-open', () => console.log('opened'));
popover.show();
```

### Stay open until explicit close

```html
<snice-popover no-outside-dismiss no-escape-dismiss>
  <button slot="trigger">Edit</button>
  <div>
    <p>Form content goes here.</p>
    <button onclick="this.closest('snice-popover').hide()">Done</button>
  </div>
</snice-popover>
```

### Custom styling

```html
<snice-popover style="--snice-popover-min-width: 20rem; --snice-popover-padding: 1rem;">
  <button slot="trigger">Open wide</button>
  <div>...</div>
</snice-popover>
```

## Accessibility

- Trigger renders with `role="button"`, `aria-haspopup="dialog"`, and `aria-expanded` reflecting the open state.
- Panel renders with `role="dialog"` and uses the platform `popover="manual"` API for top-layer rendering.
- Outside-click and Escape dismiss the panel by default. Opt out with `no-outside-dismiss` and `no-escape-dismiss`.
- Pressing Escape returns focus to the trigger.

Pair with a clear label on the trigger (`aria-label` or visible text) so screen-reader users understand what the popover controls.
