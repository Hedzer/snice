<!-- AI: For a low-token version of this doc, use docs/ai/components/banner.md instead -->

# Banner Component

The `<snice-banner>` component displays fixed-position notification banners at the top or bottom of the viewport.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | Visual variant |
| `position` | `'top' \| 'bottom'` | `'top'` | Position on screen |
| `message` | `string` | `''` | Banner message |
| `dismissible` | `boolean` | `true` | Show close button |
| `icon` | `string` | `''` | Custom icon (default icons per variant) |
| `actionText` | `string` | `''` | Action button text |
| `open` | `boolean` | `false` | Banner visibility |

## Methods

#### `show(): void`
Show the banner.

```typescript
banner.show();
```

#### `hide(): void`
Hide the banner.

```typescript
banner.hide();
```

#### `toggle(): void`
Toggle banner visibility.

```typescript
banner.toggle();
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `banner-open` | `{ banner }` | Fired when banner opens |
| `banner-close` | `{ banner }` | Fired when banner closes |
| `banner-action` | `{ banner }` | Fired when action button is clicked |

## Slots

| Slot Name | Description |
|-----------|-------------|
| `icon` | Custom icon content. Overrides the `icon` property and default variant icons. |
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

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `banner` | `<div>` | The main banner container |
| `icon` | `<span>` | The icon wrapper |
| `message` | `<span>` | The message text |
| `action` | `<button>` | The action button (when `actionText` is set) |
| `close` | `<button>` | The close/dismiss button |

## Basic Usage

```html
<snice-banner
  variant="info"
  message="This is an informational message"
  open
></snice-banner>
```

## Examples

### Variants

```html
<snice-banner variant="info" message="Info message" open></snice-banner>
<snice-banner variant="success" message="Success!" open></snice-banner>
<snice-banner variant="warning" message="Warning" open></snice-banner>
<snice-banner variant="error" message="Error occurred" open></snice-banner>
```

### With Action Button

```html
<snice-banner
  message="A new version is available"
  action-text="Update Now"
  open
></snice-banner>

<script>
document.querySelector('snice-banner').addEventListener('banner-action', () => {
  console.log('Update clicked');
});
</script>
```

### Bottom Position

```html
<snice-banner
  position="bottom"
  message="Cookie notice"
  action-text="Accept"
  open
></snice-banner>
```

### Not Dismissible

```html
<snice-banner
  message="Maintenance mode active"
  dismissible="false"
  variant="warning"
  open
></snice-banner>
```

### Programmatic Control

```html
<snice-banner id="myBanner" message="Hello"></snice-banner>

<button onclick="myBanner.show()">Show</button>
<button onclick="myBanner.hide()">Hide</button>
<button onclick="myBanner.toggle()">Toggle</button>
```
