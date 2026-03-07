<!-- AI: For a low-token version of this doc, use docs/ai/components/markdown.md instead -->

# Markdown Component

`<snice-markdown>`

A lightweight GFM-compatible markdown renderer that converts markdown text to styled HTML inside shadow DOM. Includes built-in sanitization to prevent XSS attacks.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Events](#events)
- [CSS Custom Properties](#css-custom-properties)
- [Supported Syntax](#supported-syntax)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Basic Usage

```typescript
import 'snice/components/markdown/snice-markdown';
```

```html
<snice-markdown># Hello World</snice-markdown>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/markdown/snice-markdown';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-markdown.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `sanitize` | `boolean` | `true` | Whether to sanitize the HTML output to prevent XSS |
| `theme` | `'default' \| 'github'` | `'default'` | Visual theme for the rendered output |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `markdown-render` | `{ html: string }` | Fired after the markdown has been rendered to HTML |
| `link-click` | `{ href: string; text: string }` | Fired when a link in the rendered content is clicked. Default navigation is prevented |

## CSS Custom Properties

| Property | Description |
|----------|-------------|
| `--snice-font-family` | Font family for rendered text |
| `--snice-color-text` | Primary text color |
| `--snice-color-primary` | Link color |
| `--snice-color-border` | Border color for headings, tables, code blocks, and blockquotes |
| `--snice-color-text-secondary` | Color for strikethrough text and blockquote text |
| `--snice-color-text-tertiary` | Color for h6 headings |
| `--snice-color-background-element` | Background color for code blocks, blockquotes, and alternating table rows |
| `--snice-line-height-normal` | Line height for body text |
| `--snice-font-size-md` | Base font size |
| `--snice-spacing-*` | Various spacing tokens for margins and padding |
| `--snice-border-radius-md` | Border radius for inline code |
| `--snice-border-radius-lg` | Border radius for code blocks |
| `--snice-font-weight-semibold` | Font weight for headings and bold text |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The rendered markdown body container |

```css
snice-markdown::part(base) {
  padding: 1rem;
  max-width: 65ch;
}
```

## Supported Syntax

The component supports GitHub Flavored Markdown (GFM):

- **Headings** (h1 through h6)
- **Inline formatting**: bold, italic, strikethrough
- **Lists**: ordered, unordered, and task lists with checkboxes
- **Code**: inline code and fenced code blocks with language class
- **Blockquotes**
- **Tables** (GFM pipe-delimited)
- **Images** and **links** (including autolinks)
- **Horizontal rules**

## Examples

### Rendering Static Content

Use slotted text to render markdown:

```html
<snice-markdown># Welcome

This is **bold** and *italic* text.

- Item one
- Item two
- Item three
</snice-markdown>
```

### Dynamic Content Updates

Use `setContent()` to update the rendered markdown programmatically:

```html
<snice-markdown id="preview"></snice-markdown>
<textarea id="editor" rows="10" cols="60">## Write Markdown Here

Type some **markdown** and see it render in real time.</textarea>

<script type="module">
  import 'snice/components/markdown/snice-markdown';

  const preview = document.getElementById('preview');
  const editor = document.getElementById('editor');

  // Set initial content
  preview.setContent(editor.value);

  // Update on input
  editor.addEventListener('input', () => {
    preview.setContent(editor.value);
  });
</script>
```

### GitHub Theme

Use the `theme="github"` attribute for GitHub-style markdown rendering.

```html
<snice-markdown theme="github"># GitHub Style

> This blockquote uses GitHub-style rendering.

| Feature | Supported |
|---------|-----------|
| Tables  | Yes       |
| GFM     | Yes       |
</snice-markdown>
```

### Intercepting Link Clicks

Listen for the `link-click` event to handle navigation within your application instead of following the default link behavior.

```html
<snice-markdown id="docs">Check out [the documentation](/docs) or visit [our website](https://example.com).</snice-markdown>

<script type="module">
  import 'snice/components/markdown/snice-markdown';

  const md = document.getElementById('docs');

  md.addEventListener('link-click', (e) => {
    const { href, text } = e.detail;
    console.log(`Link clicked: "${text}" -> ${href}`);

    // Handle internal navigation
    if (href.startsWith('/')) {
      window.history.pushState({}, '', href);
    } else {
      window.open(href, '_blank');
    }
  });
</script>
```

### Code Blocks and Tables

Render markdown that includes fenced code blocks and GFM tables.

```html
<snice-markdown>## API Response

The endpoint returns the following JSON:

| Code | Meaning |
|------|---------|
| 200  | Success |
| 404  | Not found |
| 500  | Server error |

- [x] GET endpoint
- [x] POST endpoint
- [ ] DELETE endpoint
</snice-markdown>
```

## Accessibility

- Rendered HTML preserves semantic heading hierarchy (h1-h6) for screen readers
- Links within rendered content are fully keyboard accessible
- Task list checkboxes are rendered as visual indicators
- Tables include proper `<thead>` and `<tbody>` structure for assistive technology
- The `link-click` event allows developers to implement custom navigation while maintaining accessibility
