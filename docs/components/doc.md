# snice-doc

A Notion-like document editor component with block-based editing, multiple content types, and rich export capabilities.

## Features

- **Block-based editing** - Create and organize content using blocks
- **Multiple block types** - Headings, paragraphs, lists, code, quotes, dividers, and to-dos
- **Block menu** - Type `/` to open a searchable block type menu
- **Keyboard shortcuts** - Ctrl/Cmd+B for bold, Ctrl/Cmd+I for italic, Ctrl/Cmd+U for underline
- **Drag and drop** - Reorder blocks by dragging the handle
- **Export formats** - JSON, Markdown, and HTML export
- **Readonly mode** - Display documents without editing capabilities
- **Customizable styling** - CSS custom properties for theming

## Basic Usage

```html
<snice-doc id="editor"></snice-doc>

<script type="module">
  import 'snice';

  const editor = document.getElementById('editor');

  // Listen for changes
  editor.addEventListener('doc-change', (e) => {
    console.log('Document changed:', e.detail.blocks);
  });
</script>
```

## Block Types

The editor supports the following block types:

- `paragraph` - Regular text paragraph
- `heading-1` - Top-level heading
- `heading-2` - Second-level heading
- `heading-3` - Third-level heading
- `bulleted-list` - Bulleted list item
- `numbered-list` - Numbered list item
- `todo` - To-do list item with checkbox
- `code` - Code block with monospace font
- `quote` - Blockquote for citations
- `divider` - Horizontal divider line

## Properties

| Property      | Attribute     | Type        | Default                       | Description                        |
| ------------- | ------------- | ----------- | ----------------------------- | ---------------------------------- |
| `blocks`      | -             | `DocBlock[]` | `[{...}]`                     | Document blocks (property only)    |
| `placeholder` | `placeholder` | `string`    | `"Type '/' for commands..."` | Placeholder text when empty        |
| `readonly`    | `readonly`    | `boolean`   | `false`                       | Whether the editor is readonly     |

## Methods

### `getBlocks(): DocBlock[]`

Get a copy of all blocks in the document.

```javascript
const blocks = editor.getBlocks();
console.log(blocks);
```

### `setBlocks(blocks: DocBlock[]): void`

Set the document blocks.

```javascript
editor.setBlocks([
  { id: '1', type: 'heading-1', content: 'Title', formats: [] },
  { id: '2', type: 'paragraph', content: 'Content', formats: [] },
]);
```

### `toJSON(): string`

Export the document as formatted JSON.

```javascript
const json = editor.toJSON();
console.log(json);
```

### `fromJSON(json: string): void`

Import a document from JSON.

```javascript
const json = '[ {"id": "1", "type": "paragraph", "content": "Hello", "formats": []} ]';
editor.fromJSON(json);
```

### `toMarkdown(): string`

Export the document as Markdown.

```javascript
const markdown = editor.toMarkdown();
console.log(markdown);
// # Title
//
// Content
```

### `toHTML(): string`

Export the document as HTML.

```javascript
const html = editor.toHTML();
console.log(html);
// <h1>Title</h1>
// <p>Content</p>
```

### `focus(): void`

Focus the editor (focuses the first block).

```javascript
editor.focus();
```

### `clear(): void`

Clear all content and reset to a single empty paragraph.

```javascript
editor.clear();
```

## Events

### `doc-change`

Emitted when the document content changes.

```javascript
editor.addEventListener('doc-change', (e) => {
  console.log('Changed blocks:', e.detail.blocks);
});
```

**Detail:**
- `blocks: DocBlock[]` - The updated blocks array

### `doc-focus`

Emitted when a block receives focus.

```javascript
editor.addEventListener('doc-focus', (e) => {
  console.log('Focused block:', e.detail.blockId);
});
```

**Detail:**
- `blockId: string` - The ID of the focused block

### `doc-blur`

Emitted when a block loses focus.

```javascript
editor.addEventListener('doc-blur', (e) => {
  console.log('Blurred block:', e.detail.blockId);
});
```

**Detail:**
- `blockId: string` - The ID of the blurred block

## Keyboard Shortcuts

### Editor Shortcuts

- **Enter** - Create new paragraph block
- **Backspace** (on empty block) - Delete block
- **Ctrl/Cmd+B** - Toggle bold (planned)
- **Ctrl/Cmd+I** - Toggle italic (planned)
- **Ctrl/Cmd+U** - Toggle underline (planned)

### Block Menu Shortcuts

- **/** - Open block menu
- **ArrowDown** - Navigate down in menu
- **ArrowUp** - Navigate up in menu
- **Enter** - Select highlighted block type
- **Escape** - Close block menu

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

  /* Code blocks */
  --snice-doc-code-background: #f6f8fa;
  --snice-doc-code-border: #e1e4e8;
  --snice-doc-inline-code-background: rgba(175, 184, 193, 0.2);

  /* Quotes */
  --snice-doc-quote-border: #e1e4e8;

  /* Divider */
  --snice-doc-divider-color: #e1e4e8;

  /* Block menu */
  --snice-doc-menu-background: #fff;
  --snice-doc-menu-border: #e1e4e8;
  --snice-doc-menu-hover: #f6f8fa;

  /* Format toolbar */
  --snice-doc-toolbar-background: #1f2328;
  --snice-doc-toolbar-text: #fff;
  --snice-doc-toolbar-hover: rgba(255, 255, 255, 0.1);
  --snice-doc-toolbar-active: rgba(88, 166, 255, 0.3);

  /* Spacing */
  --snice-doc-padding: 40px 20px;
  --snice-doc-min-height: 400px;
  --snice-doc-max-width: 900px;
}
```

## Examples

### Readonly Document Viewer

```html
<snice-doc readonly></snice-doc>

<script type="module">
  import 'snice';

  const viewer = document.querySelector('snice-doc');
  viewer.setBlocks([
    { id: '1', type: 'heading-1', content: 'Read Only Document', formats: [] },
    { id: '2', type: 'paragraph', content: 'This document cannot be edited.', formats: [] },
  ]);
</script>
```

### Document with To-do List

```html
<snice-doc id="todos"></snice-doc>

<script type="module">
  import 'snice';

  const todos = document.getElementById('todos');
  todos.setBlocks([
    { id: '1', type: 'heading-2', content: 'My Tasks', formats: [] },
    { id: '2', type: 'todo', content: 'Write documentation', formats: [], checked: true },
    { id: '3', type: 'todo', content: 'Review PRs', formats: [], checked: false },
    { id: '4', type: 'todo', content: 'Deploy to production', formats: [], checked: false },
  ]);
</script>
```

### Export to Multiple Formats

```html
<snice-doc id="editor"></snice-doc>
<button id="export-json">Export JSON</button>
<button id="export-md">Export Markdown</button>
<button id="export-html">Export HTML</button>

<script type="module">
  import 'snice';

  const editor = document.getElementById('editor');

  document.getElementById('export-json').addEventListener('click', () => {
    const json = editor.toJSON();
    console.log(json);
    // Download or copy to clipboard
  });

  document.getElementById('export-md').addEventListener('click', () => {
    const markdown = editor.toMarkdown();
    console.log(markdown);
  });

  document.getElementById('export-html').addEventListener('click', () => {
    const html = editor.toHTML();
    console.log(html);
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
    --snice-doc-code-background: #161b22;
    --snice-doc-code-border: #30363d;
    --snice-doc-quote-border: #30363d;
    --snice-doc-divider-color: #21262d;
  }
</style>

<snice-doc class="dark"></snice-doc>
```

## Block Data Structure

Each block in the document has the following structure:

```typescript
interface DocBlock {
  id: string;              // Unique identifier
  type: BlockType;         // Block type (see Block Types section)
  content: string;         // Text content
  formats: TextRange[];    // Inline formatting (future)
  checked?: boolean;       // For todo blocks
  indent?: number;         // For nested lists (future)
}
```

## Accessibility

- Supports keyboard navigation
- Uses semantic HTML in exports
- ARIA attributes for better screen reader support (future improvement)

## Browser Support

Works in all modern browsers that support:
- Custom Elements v1
- Shadow DOM
- ES2020+

## TypeScript

Full TypeScript support with exported types:

```typescript
import type { DocBlock, BlockType, SniceDocElement } from 'snice/doc';
```
