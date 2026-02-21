# Link Preview Component

The link preview component displays social media-style link preview cards, similar to Open Graph or Twitter Card previews. It is purely visual -- all data is passed via properties (no fetching).

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Events](#events)
- [Examples](#examples)

## Basic Usage

```html
<snice-link-preview
  title="My Article"
  description="A brief description of the article content."
  image="https://example.com/og-image.jpg"
  site-name="example.com"
  url="https://example.com/article"
></snice-link-preview>
```

```typescript
import 'snice/components/link-preview/snice-link-preview';
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `url` | `string` | `''` | Target URL. Clicking the card opens this in a new tab. |
| `title` | `string` | `''` | Title text. Truncated to 2 lines. |
| `description` | `string` | `''` | Description text. Truncated to 3 lines. |
| `image` | `string` | `''` | Image URL. Shows a placeholder icon when empty. |
| `site-name` | `string` | `''` | Name of the source site. |
| `favicon` | `string` | `''` | URL of the site favicon icon. |
| `variant` | `'horizontal' \| 'vertical'` | `'vertical'` | Layout direction. Vertical shows image on top; horizontal shows image on left. |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Controls padding, font sizes, and image dimensions. |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `@snice/link-click` | `{ url: string }` | Fired when the card is clicked, before opening the URL. |

## Examples

### Vertical Card (Default)

```html
<snice-link-preview
  title="Snice - Beautiful Decorators for Custom Elements"
  description="Write clean, reactive web components with TypeScript decorators. No framework. No virtual DOM."
  image="https://picsum.photos/600/300"
  site-name="snice.dev"
  url="https://snice.dev"
></snice-link-preview>
```

### Horizontal Card

```html
<snice-link-preview
  variant="horizontal"
  title="Getting Started Guide"
  description="Learn to build elements step by step"
  site-name="snice.dev"
  url="https://snice.dev/guide"
></snice-link-preview>
```

### Small Horizontal Cards

```html
<snice-link-preview
  variant="horizontal"
  size="small"
  title="Quick Link"
  description="A short description"
  site-name="example.com"
  url="https://example.com"
></snice-link-preview>
```

### Large Card

```html
<snice-link-preview
  size="large"
  title="In-Depth Article Title"
  description="A longer description that can span up to four lines in the large size variant, giving more room for content summaries."
  image="https://picsum.photos/800/400"
  site-name="blog.example.com"
  favicon="https://example.com/favicon.ico"
  url="https://blog.example.com/article"
></snice-link-preview>
```

### Without Image

```html
<snice-link-preview
  title="Text-Only Preview"
  description="When no image is provided, a placeholder icon is shown."
  site-name="example.com"
  url="https://example.com"
></snice-link-preview>
```

### With Favicon

```html
<snice-link-preview
  title="Article with Favicon"
  description="Shows the site favicon next to the site name."
  image="https://picsum.photos/600/300"
  site-name="example.com"
  favicon="https://example.com/favicon.ico"
  url="https://example.com/article"
></snice-link-preview>
```

### Listening for Click Events

```html
<snice-link-preview
  id="preview"
  title="Clickable Preview"
  description="Listen for link-click events."
  url="https://example.com"
></snice-link-preview>

<script type="module">
  const preview = document.getElementById('preview');
  preview.addEventListener('@snice/link-click', (e) => {
    console.log('Link clicked:', e.detail.url);
  });
</script>
```

## Accessibility

- **ARIA role**: Card has `role="article"` for screen reader context
- **ARIA label**: Uses the title as the accessible label
- **Keyboard navigation**: Card is focusable and activates with Enter or Space
- **Focus ring**: Visible focus indicator for keyboard users
- **Image alt**: Images use empty alt text (decorative) since the title provides context

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support

## Best Practices

1. **Always set a title**: The title is the primary content of the preview card
2. **Provide meaningful descriptions**: Keep descriptions concise but informative
3. **Use appropriate images**: Wide aspect ratio images (1.91:1) work best for vertical cards
4. **Set the URL**: Without a URL, clicking the card does nothing
5. **Use horizontal for compact layouts**: The horizontal variant works well in sidebars or lists
6. **Use small size for dense UIs**: Small cards work well when showing multiple previews
