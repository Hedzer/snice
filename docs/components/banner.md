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

## Methods

### `show(): void`
Show the banner.

### `hide(): void`
Hide the banner.

### `toggle(): void`
Toggle banner visibility.

## Events

### `@snice/banner-open`
Fired when banner opens.

### `@snice/banner-close`
Fired when banner closes.

### `@snice/banner-action`
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
document.querySelector('snice-banner').addEventListener('@snice/banner-action', () => {
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
