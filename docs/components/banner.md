<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/banner.md -->

# Banner Component
`<snice-banner>`

The banner component displays fixed-position notification banners at the top or bottom of the viewport. Supports multiple variants, dismissible close button, and optional action button.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | Visual variant |
| `position` | `'top' \| 'bottom'` | `'top'` | Position on screen |
| `message` | `string` | `''` | Banner message |
| `dismissible` | `boolean` | `true` | Show close button |
| `icon` | `string` | `''` | Custom icon (emoji, URL, image file). Default icons per variant. |
| `actionText` (attr: `action-text`) | `string` | `''` | Action button text |
| `open` | `boolean` | `false` | Banner visibility |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `show()` | -- | Show the banner |
| `hide()` | -- | Hide the banner |
| `toggle()` | -- | Toggle banner visibility |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `banner-open` | `{ banner }` | Fired when banner opens |
| `banner-close` | `{ banner }` | Fired when banner closes |
| `banner-action` | `{ banner }` | Fired when action button is clicked |

## Slots

| Name | Description |
|------|-------------|
| `icon` | Custom icon content. Overrides the `icon` property and default variant icons. Use for icon fonts. |
| (default) | Additional content after the message |

### Icon Slot Usage

Use the `icon` slot for external CSS-based icon fonts:

```html
<snice-banner message="Update available" open>
  <span slot="icon" class="material-symbols-outlined">update</span>
</snice-banner>

<snice-banner variant="success" message="Changes saved" open>
  <i slot="icon" class="fa-solid fa-check-circle"></i>
</snice-banner>
```

## CSS Parts

| Part | Element | Description |
|------|---------|-------------|
| `banner` | `<div>` | The main banner container |
| `icon` | `<span>` | The icon wrapper |
| `message` | `<span>` | The message text |
| `action` | `<button>` | The action button (when `actionText` is set) |
| `close` | `<button>` | The close/dismiss button |

```css
snice-banner::part(banner) {
  font-size: 1rem;
}

snice-banner::part(action) {
  font-weight: 600;
}
```

## Basic Usage

```typescript
import 'snice/components/banner/snice-banner';
```

```html
<snice-banner
  variant="info"
  message="This is an informational message"
  open
></snice-banner>
```

## Examples

### Variants

Use the `variant` attribute to set the banner style.

```html
<snice-banner variant="info" message="Info message" open></snice-banner>
<snice-banner variant="success" message="Success!" open></snice-banner>
<snice-banner variant="warning" message="Warning" open></snice-banner>
<snice-banner variant="error" message="Error occurred" open></snice-banner>
```

### With Action Button

Use `action-text` to show an action button. Listen for `banner-action` to handle clicks.

```html
<snice-banner
  message="A new version is available"
  action-text="Update Now"
  open
></snice-banner>
```

```typescript
banner.addEventListener('banner-action', () => {
  console.log('Update clicked');
});
```

### Bottom Position

Use `position="bottom"` to anchor the banner to the bottom of the viewport.

```html
<snice-banner
  position="bottom"
  message="Cookie notice"
  action-text="Accept"
  open
></snice-banner>
```

### Not Dismissible

Set `dismissible="false"` to hide the close button.

```html
<snice-banner
  message="Maintenance mode active"
  dismissible="false"
  variant="warning"
  open
></snice-banner>
```

### Programmatic Control

Use `show()`, `hide()`, and `toggle()` methods.

```html
<snice-banner id="myBanner" message="Hello"></snice-banner>

<button onclick="myBanner.show()">Show</button>
<button onclick="myBanner.hide()">Hide</button>
<button onclick="myBanner.toggle()">Toggle</button>
```

## Accessibility

- **ARIA role**: Banner has `role="alert"` for screen reader announcements
- **Close button**: Has `aria-label="Close"` for screen readers
- **Keyboard accessible**: Close and action buttons are keyboard focusable
