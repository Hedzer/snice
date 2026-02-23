[//]: # (AI: For a low-token version of this doc, use docs/ai/components/doc.md instead)

# snice-doc

A simple WYSIWYG document editor component with formatting toolbar and content insertion capabilities.

## Features

- **WYSIWYG editing** - Direct HTML content editing
- **Formatting toolbar** - Bold, italic, underline, strikethrough, headings, lists
- **Content insertion** - Links, images, tables, dividers
- **Sidebar controls** - Quick access to insert images, tables, and dividers
- **Paste image support** - Paste images directly from clipboard
- **Keyboard shortcuts** - Ctrl/Cmd+B for bold, Ctrl/Cmd+I for italic, Ctrl/Cmd+U for underline
- **Readonly mode** - Display documents without editing capabilities
- **Customizable styling** - CSS custom properties for theming

## Basic Usage

```html
<snice-doc id="editor"></snice-doc>

<script type="module">
  import 'snice';

  const editor = document.getElementById('editor');

  // Set initial content
  editor.setHTML('<h1>Welcome</h1><p>Start editing...</p>');

  // Get content
  const html = editor.getHTML();
  console.log(html);
</script>
```

## Properties

| Property      | Attribute     | Type      | Default              | Description                      |
| ------------- | ------------- | --------- | -------------------- | -------------------------------- |
| `placeholder` | `placeholder` | `string`  | `"Start typing..."` | Placeholder text when empty      |
| `readonly`    | `readonly`    | `boolean` | `false`              | Whether the editor is readonly   |

## Methods

### `getHTML(): string`

Get the current HTML content of the editor.

```javascript
const html = editor.getHTML();
console.log(html);
```

### `setHTML(html: string): void`

Set the HTML content of the editor.

```javascript
editor.setHTML(`
  <h1>Welcome!</h1>
  <p>This is a <b>simple</b> document editor.</p>
`);
```

### `clear(): void`

Clear all content and reset to an empty paragraph.

```javascript
editor.clear();
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

## Sidebar Features

The collapsible sidebar provides quick access to:

- **Image** - Insert image via URL dialog
- **Table** - Insert table with custom rows/columns
- **Divider** - Insert horizontal rule

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
  --snice-doc-toolbar-border: #e1e4e8;

  /* Sidebar */
  --snice-doc-sidebar-background: #f6f8fa;
  --snice-doc-sidebar-border: #e1e4e8;

  /* Spacing */
  --snice-doc-padding: 20px;
}
```

## Examples

### Readonly Document Viewer

```html
<snice-doc readonly></snice-doc>

<script type="module">
  import 'snice';

  const viewer = document.querySelector('snice-doc');
  viewer.setHTML(`
    <h1>Read Only Document</h1>
    <p>This document cannot be edited.</p>
  `);
</script>
```

### Rich Content Document

```html
<snice-doc id="editor"></snice-doc>

<script type="module">
  import 'snice';

  const editor = document.getElementById('editor');
  editor.setHTML(`
    <h1>Welcome to the Document Editor!</h1>
    <p>This is a simple document editor with:</p>
    <ul>
      <li><b>Bold</b>, <i>italic</i>, <u>underline</u> formatting</li>
      <li>Headings (H1, H2, H3)</li>
      <li>Bullet and numbered lists</li>
      <li>Images and links</li>
      <li>Tables</li>
    </ul>
    <p>Try typing with <b>bold</b> and hitting Enter - the formatting continues naturally!</p>
  `);
</script>
```

### Save and Load Content

```html
<snice-doc id="editor"></snice-doc>
<button id="save">Save</button>
<button id="load">Load</button>

<script type="module">
  import 'snice';

  const editor = document.getElementById('editor');

  document.getElementById('save').addEventListener('click', () => {
    const html = editor.getHTML();
    localStorage.setItem('document', html);
    console.log('Saved!');
  });

  document.getElementById('load').addEventListener('click', () => {
    const html = localStorage.getItem('document');
    if (html) {
      editor.setHTML(html);
      console.log('Loaded!');
    }
  });
</script>
```

### Custom Styling

```html
<style>
  snice-doc.dark {
    --snice-doc-text-color: #e6edf3;
    --snice-doc-background: #0d1117;
    --snice-doc-muted-color: #7d8590;
    --snice-doc-placeholder-color: #484f58;
    --snice-doc-toolbar-background: #161b22;
    --snice-doc-toolbar-border: #30363d;
    --snice-doc-sidebar-background: #161b22;
    --snice-doc-sidebar-border: #30363d;
  }
</style>

<snice-doc class="dark"></snice-doc>
```

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
import type { SniceDoc } from 'snice/doc';

const editor = document.querySelector<SniceDoc>('snice-doc');
const html = editor?.getHTML();
```
