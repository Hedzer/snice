[//]: # (AI: For a low-token version of this doc, use docs/ai/components/link.md instead)

# Link
`<snice-link>`

A customizable hyperlink component with variants, external link handling, and hash routing support.

## Basic Usage

```typescript
import 'snice/components/link/snice-link';
```

```html
<snice-link href="/about">About Us</snice-link>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/link/snice-link';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-link.min.js"></script>
```

## Examples

### Variants

Use the `variant` attribute to change the link's visual style.

```html
<snice-link href="/page" variant="default">Default</snice-link>
<snice-link href="/page" variant="primary">Primary</snice-link>
<snice-link href="/page" variant="secondary">Secondary</snice-link>
<snice-link href="/page" variant="muted">Muted</snice-link>
```

### External Links

Set the `external` attribute to open in a new tab with security attributes and an arrow icon.

```html
<snice-link href="https://example.com" external>Visit Example</snice-link>
```

### Underline

Use the `underline` attribute to show text decoration.

```html
<snice-link href="/docs" underline>Documentation</snice-link>
```

### Disabled State

Set the `disabled` attribute to prevent interaction.

```html
<snice-link href="/page" disabled>Unavailable</snice-link>
```

### Hash Routing

Set the `hash` attribute to auto-prepend `#` to href for single-page app routing.

```html
<snice-link href="home" hash>Home</snice-link>
<snice-link href="about" hash>About</snice-link>
<snice-link href="contact" hash>Contact</snice-link>
<!-- Renders as: <a href="#home">Home</a> -->
```

### Router Integration

Listen for the `navigate` event on hash links for custom routing.

```html
<snice-link href="profile" hash id="profile-link">Profile</snice-link>

<script>
  document.getElementById('profile-link').addEventListener('navigate', (e) => {
    console.log('Navigating to:', e.detail.href);
    // e.preventDefault() cancels default navigation
  });
</script>
```

### Inline Usage

Links display inline and work naturally within text.

```html
<p>
  Read our <snice-link href="/privacy" underline>privacy policy</snice-link>
  for more details.
</p>
```

### Footer Links

```html
<footer>
  <snice-link href="/privacy" variant="muted">Privacy</snice-link>
  <snice-link href="/terms" variant="muted">Terms</snice-link>
  <snice-link href="https://github.com" external variant="muted">GitHub</snice-link>
</footer>
```

## Slots

| Name | Description |
|------|-------------|
| (default) | Link text content |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `href` | `string` | `''` | Link URL |
| `target` | `'_self' \| '_blank' \| '_parent' \| '_top'` | `'_self'` | Link target |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'muted'` | `'default'` | Visual style |
| `disabled` | `boolean` | `false` | Disables the link |
| `external` | `boolean` | `false` | Opens in new tab with `noopener noreferrer` |
| `underline` | `boolean` | `false` | Shows text underline |
| `hash` | `boolean` | `false` | Auto-prepends `#` to href |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `click` | `MouseEvent` | Fired on click (prevented when disabled) |
| `navigate` | `{ href: string }` | Fired on hash link click, cancelable |

## CSS Parts

| Part | Description |
|------|-------------|
| `link` | The anchor element |
| `external-icon` | The external link arrow icon |
