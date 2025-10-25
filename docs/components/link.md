# Link Component

A customizable link component with multiple variants, external link handling, and accessibility features.

## Features

- **Multiple Variants**: default, primary, secondary, muted
- **External Link Handling**: Automatic `target="_blank"` and security attributes
- **Hash Routing**: Built-in support for hash-based navigation
- **Router Integration**: Emits events for custom router integration
- **Accessibility**: Proper ARIA attributes and keyboard navigation
- **Disabled State**: Visual and functional disabled state
- **Customizable**: Full theme integration

## Basic Usage

```html
<snice-link href="/about">About Us</snice-link>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `href` | `string` | `''` | Link URL |
| `target` | `LinkTarget` | `'_self'` | Target attribute ('_self', '_blank', '_parent', '_top') |
| `variant` | `LinkVariant` | `'default'` | Visual style variant |
| `disabled` | `boolean` | `false` | Disable the link |
| `external` | `boolean` | `false` | Treat as external link (auto _blank + security) |
| `underline` | `boolean` | `false` | Show text underline |
| `hash` | `boolean` | `false` | Automatically prepend # to href (for hash routing) |

## Variants

### Default
```html
<snice-link href="/page">Default link</snice-link>
```

### Primary
```html
<snice-link href="/page" variant="primary">Primary link</snice-link>
```

### Secondary
```html
<snice-link href="/page" variant="secondary">Secondary link</snice-link>
```

### Muted
```html
<snice-link href="/page" variant="muted">Muted link</snice-link>
```

## External Links

External links automatically open in a new tab with security attributes:

```html
<snice-link href="https://example.com" external>
  External Link
</snice-link>
```

This automatically adds:
- `target="_blank"`
- `rel="noopener noreferrer"`
- External link icon (↗)

## Underline

```html
<snice-link href="/page" underline>Underlined link</snice-link>
```

## Disabled State

```html
<snice-link href="/page" disabled>Disabled link</snice-link>
```

## Hash Routing

For hash-based navigation (Single Page Applications):

```html
<!-- Automatically prepends # to href -->
<snice-link href="home" hash>Home</snice-link>
<snice-link href="about" hash>About</snice-link>
<snice-link href="contact" hash>Contact</snice-link>

<!-- Renders as: <a href="#home">Home</a> -->
```

### Router Integration

The `navigate` event allows decoupled router integration:

```html
<snice-link href="profile" hash id="profile-link">Profile</snice-link>

<script>
  document.getElementById('profile-link').addEventListener('navigate', (e) => {
    console.log('Navigating to:', e.detail.href);

    // Custom routing logic
    myRouter.navigate(e.detail.href);

    // Optionally prevent default navigation
    // e.preventDefault();
  });
</script>
```

### Example Router Setup

```html
<nav>
  <snice-link href="home" hash>Home</snice-link>
  <snice-link href="products" hash>Products</snice-link>
  <snice-link href="about" hash>About</snice-link>
</nav>

<script>
  // Listen to all navigate events
  document.addEventListener('navigate', (e) => {
    const route = e.detail.href;

    // Update view based on route
    switch(route) {
      case 'home':
        showHomeView();
        break;
      case 'products':
        showProductsView();
        break;
      case 'about':
        showAboutView();
        break;
    }
  });
</script>
```

## In Context

Links work naturally within text:

```html
<p>
  This is a paragraph with an <snice-link href="/page">inline link</snice-link>
  in the middle of the text.
</p>
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `click` | `MouseEvent` | Emitted when link is clicked (prevented if disabled) |
| `navigate` | `{ href: string }` | Emitted on hash link click (bubbles, composed, cancelable) |

## CSS Parts

Use `::part()` to style internal elements:

```css
snice-link::part(link) {
  font-weight: bold;
}

snice-link::part(external-icon) {
  color: blue;
}
```

## Theming

The component uses these CSS custom properties:

```css
--snice-color-primary
--snice-color-primary-dark
--snice-color-primary-darker
--snice-color-text
--snice-color-text-secondary
--snice-color-text-muted
--snice-color-text-disabled
--snice-transition-fast
```

## Accessibility

- Proper `href` attribute for keyboard navigation
- Correct `rel` attributes for external links
- Disabled state prevents interaction
- Screen reader friendly

## Examples

### Navigation Menu
```html
<nav>
  <snice-link href="/">Home</snice-link>
  <snice-link href="/about">About</snice-link>
  <snice-link href="/contact">Contact</snice-link>
</nav>
```

### Footer Links
```html
<footer>
  <snice-link href="/privacy" variant="muted">Privacy</snice-link>
  <snice-link href="/terms" variant="muted">Terms</snice-link>
  <snice-link href="https://twitter.com" external variant="muted">
    Twitter
  </snice-link>
</footer>
```

### Action Links
```html
<snice-link href="/download" variant="primary">
  Download Now
</snice-link>
<snice-link href="/learn-more" variant="secondary">
  Learn More
</snice-link>
```
