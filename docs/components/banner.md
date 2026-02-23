[//]: # (AI: For a low-token version of this doc, use docs/ai/components/banner.md instead)

# Banner Component

The `<snice-banner>` component displays fixed-position notification banners at the top or bottom of the viewport.

## Basic Usage

```html
<snice-banner
  variant="info"
  message="This is an informational message"
  open
></snice-banner>
```

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

## Methods

### `show(): void`
Show the banner.

### `hide(): void`
Hide the banner.

### `toggle(): void`
Toggle banner visibility.

## Events

### `banner-open`
Fired when banner opens.

### `banner-close`
Fired when banner closes.

### `banner-action`
Fired when action button is clicked.

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
