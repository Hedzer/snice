<!-- AI: For a low-token version of this doc, use docs/ai/components/link-preview.md instead -->

# Link Preview
`<snice-link-preview>`

Displays a rich preview card for a URL with image, title, description, and site info.

## Basic Usage

```typescript
import 'snice/components/link-preview/snice-link-preview';
```

```html
<snice-link-preview
  url="https://example.com"
  title="Example Website"
  description="An example website for demonstration."
  image="https://example.com/og-image.jpg">
</snice-link-preview>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/link-preview/snice-link-preview';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-link-preview.min.js"></script>
```

## Examples

### Vertical Card

The default layout stacks the image above the content.

```html
<snice-link-preview
  url="https://snice.dev"
  title="Snice - Beautiful Decorators for Custom Elements"
  description="Write clean, reactive web components with TypeScript decorators."
  image="https://picsum.photos/600/300"
  site-name="snice.dev">
</snice-link-preview>
```

### Horizontal Card

Use `variant="horizontal"` to display the image beside the content.

```html
<snice-link-preview
  variant="horizontal"
  url="https://snice.dev/guide"
  title="Getting Started Guide"
  description="Learn to build elements step by step."
  site-name="snice.dev">
</snice-link-preview>
```

### Sizes

Use the `size` attribute to adjust padding, font sizes, and image dimensions.

```html
<snice-link-preview size="small" url="https://example.com" title="Compact Card" description="A short summary."></snice-link-preview>
<snice-link-preview size="large" url="https://example.com" title="Expanded Card" description="A longer description with more room for content." image="https://picsum.photos/800/400"></snice-link-preview>
```

### Without Image

When no image is provided, a placeholder link icon is shown.

```html
<snice-link-preview
  url="https://example.com"
  title="Text-Only Preview"
  description="When no image is provided, a placeholder icon is shown."
  site-name="example.com">
</snice-link-preview>
```

### With Favicon

```html
<snice-link-preview
  url="https://example.com/article"
  title="Article with Favicon"
  description="Shows the site favicon next to the site name."
  image="https://picsum.photos/600/300"
  site-name="example.com"
  favicon="https://example.com/favicon.ico">
</snice-link-preview>
```

### Click Event

```html
<snice-link-preview
  id="preview"
  title="Clickable Preview"
  description="Listen for click events."
  url="https://example.com">
</snice-link-preview>

<script type="module">
  document.getElementById('preview').addEventListener('link-click', (e) => {
    console.log('Link clicked:', e.detail.url);
  });
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `url` | `string` | `''` | Target URL (opens on click) |
| `title` | `string` | `''` | Preview title (clamped to 2 lines) |
| `description` | `string` | `''` | Preview description (clamped to 3 lines) |
| `image` | `string` | `''` | Preview image URL |
| `siteName` (attr: `site-name`) | `string` | `''` | Site name in footer |
| `favicon` | `string` | `''` | Favicon URL in footer |
| `variant` | `'vertical' \| 'horizontal'` | `'vertical'` | Card layout direction |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Card size |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The outer preview card container |
| `content` | `<div>` | The text content area (title, description, footer) |
| `title` | `<p>` | The title text element |

```css
snice-link-preview::part(base) {
  border-radius: 1rem;
  border: 2px solid #e2e8f0;
}

snice-link-preview::part(title) {
  font-weight: 700;
  color: #1e293b;
}
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `link-click` | `{ url: string }` | Fired when the card is clicked |
