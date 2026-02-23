# snice-markdown

Lightweight GFM-compatible markdown renderer with built-in sanitization.

## Properties

```ts
content: string                          // Markdown source text
sanitize: boolean                        // Sanitize HTML output (default: true)
theme: 'default' | 'github'             // Visual theme
```

## Events

- `markdown-render` -> `{ html: string }` -- Fired after markdown is rendered
- `link-click` -> `{ href: string; text: string }` -- Fired when a link is clicked (default prevented)

## CSS Custom Properties

```css
--snice-font-family
--snice-color-text
--snice-color-primary              /* Link color */
--snice-color-border               /* Headings, tables, code, blockquote borders */
--snice-color-text-secondary       /* Strikethrough, blockquote text */
--snice-color-text-tertiary        /* h6 color */
--snice-color-background-element   /* Code, blockquote, table row backgrounds */
--snice-line-height-normal
--snice-font-size-md
--snice-spacing-*                  /* Various spacing tokens */
--snice-border-radius-md
--snice-border-radius-lg
--snice-font-weight-semibold
```

## Supported Markdown

- Headings (h1-h6)
- Bold, italic, strikethrough
- Ordered/unordered lists, task lists
- Code blocks with language class, inline code
- Blockquotes
- Tables (GFM)
- Images, links, autolinks
- Horizontal rules

## Usage

```html
<snice-markdown
  content="# Hello\n\nThis is **bold** and *italic*."
  theme="github"
></snice-markdown>
```

```js
const md = document.querySelector('snice-markdown');
md.content = '## Dynamic Content\n\n- Item 1\n- Item 2';

md.addEventListener('link-click', (e) => {
  console.log('Navigating to:', e.detail.href);
});
```
