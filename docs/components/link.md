<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/link.md -->

# Link
`<snice-link>`

A customizable hyperlink component with variants, external link handling, and hash routing support.

## Table of Contents
- [Properties](#properties)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [URL Safety](#url-safety)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `href` | `string` | `''` | Link URL. Unsafe, malformed, control-obfuscated, and unlisted schemes are blocked. |
| `target` | `'_self' \| '_blank' \| '_parent' \| '_top'` | `'_self'` | Link target |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'muted'` | `'default'` | Visual style |
| `disabled` | `boolean` | `false` | Disables the link |
| `external` | `boolean` | `false` | Opens in new tab with `noopener noreferrer` and shows arrow icon |
| `underline` | `boolean` | `false` | Shows text underline |
| `hash` | `boolean` | `false` | Auto-prepends `#` to href for SPA routing |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `click` | `MouseEvent` | Native anchor click; default action is prevented when disabled or the URL is rejected |
| `navigate` | `{ href: string }` | Fired for accepted hash-link clicks only; cancelable |

## Slots

| Name | Description |
|------|-------------|
| (default) | Link text content |

## CSS Parts

| Part | Element | Description |
|------|---------|-------------|
| `link` | `<a>` | The anchor element |
| `external-icon` | `<span>` | The external link arrow icon (visible when `external` is set) |

## Basic Usage

```typescript
import 'snice/components/link/snice-link';
```

```html
<snice-link href="/about">About Us</snice-link>
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

Allowed links remain real anchors. Browser navigation, keyboard activation,
context-menu actions such as Copy Link, `target`, and the slotted accessible
name continue to use native anchor behavior.

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

## URL Safety

`snice-link` validates `href` with Snice's shared `isSafeUrl()` policy before
placing it on the internal anchor. This is the same core policy used by other
Snice navigation components; the link does not maintain its own scheme list.

- Relative paths, root-relative paths, hash references, query references,
  HTTP, HTTPS, `mailto:`, and `tel:` URLs are accepted.
- HTTP/HTTPS network-path references such as `//example.com/page` are accepted.
- `javascript:`, `data:`, `vbscript:`, `file:`, FTP, custom/unlisted schemes,
  malformed URLs, and values containing raw ASCII control characters are rejected.
- Surrounding whitespace is trimmed. An authored empty string keeps the
  component's existing `href="#"` fallback; whitespace-only and non-string
  runtime values are rejected.
- `hash` routing validates the authored value first, then prepends `#`.

For a rejected value, the internal `<a>` has no `href`, its click default is
prevented, and no `navigate` event is emitted. The slotted label remains visible
in a muted, non-link state, but the browser does not expose an executable or
copyable destination.

Use the same policy when assigning untrusted URLs to native elements or custom
navigation code:

```typescript
import { isSafeUrl } from 'snice';

if (isSafeUrl(candidate)) {
  anchor.href = candidate;
}
```

## Accessibility

- Renders a standard `<a>` element inside shadow DOM
- Accepted URLs retain native link semantics, focus, keyboard activation, context-menu behavior, and the slotted accessible name
- Rejected URLs have no internal `href` and use muted, non-link styling, so they are not exposed as actionable links
- External links automatically get `rel="noopener noreferrer"` and `target="_blank"`
- Disabled links prevent click events and use `pointer-events: none` with a `not-allowed` cursor
- The `navigate` event is cancelable for accepted hash routes, allowing routers to prevent default browser navigation
