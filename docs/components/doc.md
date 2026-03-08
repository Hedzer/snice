<!-- AI: For a low-token version of this doc, use docs/ai/components/doc.md instead -->

# snice-doc

A simple WYSIWYG document editor component with formatting toolbar and content insertion capabilities.

## Properties

| Property          | Attribute          | Type      | Default              | Description                                      |
| ----------------- | ------------------ | --------- | -------------------- | ------------------------------------------------ |
| `placeholder`     | `placeholder`      | `string`  | `"Start typing..."`  | Placeholder text when empty                      |
| `readonly`        | `readonly`         | `boolean` | `false`              | Whether the editor is readonly                   |
| `icons`           | `icons`            | `string`  | `"default"`          | Icon set: `"default"`, `"material"`, `"fontawesome"` |

## Methods

### `getHTML(): string`

Get the current HTML content of the editor.

```javascript
const html = editor.getHTML();
```

### `setHTML(html: string): void`

Set the HTML content of the editor.

```javascript
editor.setHTML(`
  <h1>Welcome!</h1>
  <p>This is a <b>simple</b> document editor.</p>
`);
```

### `getText(): string`

Get the document content as plain text.

```javascript
const text = editor.getText();
```

### `getMarkdown(): string`

Get the document content converted to Markdown. Supports headings, bold, italic, strikethrough, links, images, lists, tables, horizontal rules, and inline code.

```javascript
const md = editor.getMarkdown();
```

### `downloadAs(format: 'html' | 'markdown' | 'text', filename?: string): void`

Download the document in the specified format. If no filename is provided, defaults to `document.html`, `document.md`, or `document.txt`.

```javascript
editor.downloadAs('markdown', 'my-document.md');
editor.downloadAs('html');
editor.downloadAs('text', 'notes.txt');
```

### `clear(): void`

Clear all content and reset to an empty paragraph.

```javascript
editor.clear();
```

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The outer document wrapper |
| `editor` | `<div>` | The editable content area |
| `toolbar` | `<div>` | The formatting toolbar |
| `icon` | `<span>` | Toolbar icon element |

```css
snice-doc::part(base) {
  border-radius: 8px;
  overflow: hidden;
}

snice-doc::part(toolbar) {
  padding: 0.5rem;
  background: #f6f8fa;
}

snice-doc::part(editor) {
  min-height: 300px;
  padding: 1.5rem;
}
```

## Basic Usage

```html
<snice-doc id="editor"></snice-doc>
```

```typescript
import 'snice';

// Set initial content
editor.setHTML('<h1>Welcome</h1><p>Start editing...</p>');

// Get content
const html = editor.getHTML();
console.log(html);
```

## Toolbar Features

The toolbar includes:

- **B** - Bold text (Ctrl/Cmd+B)
- **I** - Italic text (Ctrl/Cmd+I)
- **U** - Underline text (Ctrl/Cmd+U)
- **S** - Strikethrough text
- **H1, H2, H3, P** - Heading formats and paragraph
- **• / 1.** - Bulleted and numbered lists
- **🔗** - Insert link
- **🖼** - Insert image
- **📊** - Insert table
- **―** - Insert divider
- **⬇** - Download menu (HTML, Markdown, Plain Text)

## Examples

### Export and Download

```html
<snice-doc id="editor"></snice-doc>
<button id="save-md">Save as Markdown</button>
<button id="save-html">Save as HTML</button>
```

```typescript
saveMd.addEventListener('click', () => {
  editor.downloadAs('markdown', 'my-doc.md');
});

saveHtml.addEventListener('click', () => {
  editor.downloadAs('html', 'my-doc.html');
});
```

### Material Icons

```html
<snice-doc icons="material"></snice-doc>
```

### Readonly Document Viewer

```html
<snice-doc readonly></snice-doc>
```

```typescript
viewer.setHTML(`
  <h1>Read Only Document</h1>
  <p>This document cannot be edited.</p>
`);
```

### Save and Load Content

```html
<snice-doc id="editor"></snice-doc>
<button id="save">Save</button>
<button id="load">Load</button>
```

```typescript
save.addEventListener('click', () => {
  localStorage.setItem('document', editor.getHTML());
});

load.addEventListener('click', () => {
  const html = localStorage.getItem('document');
  if (html) editor.setHTML(html);
});
```

## Features

- **WYSIWYG editing** - Direct HTML content editing
- **Formatting toolbar** - Bold, italic, underline, strikethrough, headings, lists
- **Content insertion** - Links, images, tables, dividers
- **Download/Export** - Save as HTML, Markdown, or Plain Text
- **Icon sets** - Default text labels, Material Icons, or Font Awesome
- **Paste image support** - Paste images directly from clipboard
- **Keyboard shortcuts** - Ctrl/Cmd+B for bold, Ctrl/Cmd+I for italic, Ctrl/Cmd+U for underline
- **Readonly mode** - Display documents without editing capabilities
- **Dark mode** - Automatic dark mode via prefers-color-scheme
- **Customizable styling** - CSS custom properties for theming

## Icon Sets

The `icons` property controls which icon set the toolbar uses:

### Default (text/emoji)

```html
<snice-doc></snice-doc>
```

Uses text labels (B, I, U, H1, etc.) and emoji for action buttons.

### Material Symbols

```html
<!-- Load the font in your document -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined">

<snice-doc icons="material"></snice-doc>
```

Uses [Material Symbols Outlined](https://fonts.google.com/icons). You must load the font stylesheet in your document — the font cascades from light DOM into the shadow DOM automatically.

### Font Awesome

```html
<!-- Load the font in your document -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">

<snice-doc icons="fontawesome"></snice-doc>
```

Uses [Font Awesome 6](https://fontawesome.com/icons) solid icons. You must load the Font Awesome stylesheet in your document.

## Keyboard Shortcuts

- **Ctrl/Cmd+B** - Toggle bold
- **Ctrl/Cmd+I** - Toggle italic
- **Ctrl/Cmd+U** - Toggle underline

## Styling

The component can be styled using CSS custom properties:

```css
snice-doc {
  /* Colors */
  --snice-doc-text-color: #333;
  --snice-doc-background: #fff;
  --snice-doc-muted-color: #999;
  --snice-doc-placeholder-color: #999;
  --snice-doc-primary-color: #0969da;
  --snice-doc-link-color: #0969da;

  /* Code */
  --snice-doc-inline-code-background: rgba(175, 184, 193, 0.2);

  /* Toolbar */
  --snice-doc-toolbar-background: #f6f8fa;

  /* Borders */
  --snice-doc-border: #e1e4e8;
  --snice-doc-hover-background: #e8eaed;

  /* Sidebar */
  --snice-doc-sidebar-background: #f6f8fa;
}
```

Dark mode is supported automatically via `prefers-color-scheme: dark`.

## Accessibility

- Supports keyboard navigation
- Uses contentEditable for native text editing
- Semantic HTML output

## Browser Support

Works in all modern browsers that support:
- Custom Elements v1
- Shadow DOM
- contentEditable
- ES2020+

## TypeScript

Full TypeScript support:

```typescript
const html = editor.getHTML();
const markdown = editor.getMarkdown();
editor.downloadAs('markdown', 'export.md');
```
