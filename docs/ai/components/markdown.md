# snice-markdown

Lightweight GFM-compatible markdown renderer with built-in sanitization.

## Properties

```ts
sanitize: boolean = true;          // Sanitize HTML output
theme: 'default'|'github' = 'default';
```

> `content` is a plain class field, not `@property`. Use `setContent()` or slotted text.

## Methods

- `setContent(markdown: string)` → Set markdown source and re-render

## Events

- `markdown-render` → `{ html: string }` (after render)
- `link-click` → `{ href: string, text: string }` (default prevented)

## Slots

- `(default)` - Markdown source text

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

## CSS Parts

- `base` - Rendered markdown body container

## Supported Syntax

Headings (h1-h6), bold, italic, strikethrough, ordered/unordered/task lists, code blocks with language class, inline code, blockquotes, tables (GFM), images, links, autolinks, horizontal rules.

## Basic Usage

```typescript
import 'snice/components/markdown/snice-markdown';
```

```html
<snice-markdown># Hello

This is **bold** and *italic*.
</snice-markdown>
```

```typescript
md.setContent('## Dynamic Content\n\n- Item 1\n- Item 2');

md.addEventListener('link-click', (e) => {
  console.log('Navigating to:', e.detail.href);
});
```
