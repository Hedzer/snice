# snice-doc

Notion-like document editor with block-based editing.

## Usage

```html
<snice-doc></snice-doc>
```

## Properties

- `blocks: DocBlock[]` - Document blocks (property only)
- `placeholder: string` - Placeholder text (default: `"Type '/' for commands..."`)
- `readonly: boolean` - Readonly mode (default: `false`)

## Methods

- `getBlocks(): DocBlock[]` - Get blocks copy
- `setBlocks(blocks: DocBlock[]): void` - Set blocks
- `toJSON(): string` - Export as JSON
- `fromJSON(json: string): void` - Import from JSON
- `toMarkdown(): string` - Export as Markdown
- `toHTML(): string` - Export as HTML
- `focus(): void` - Focus editor
- `clear(): void` - Clear all content

## Events

- `doc-change: CustomEvent<{ blocks: DocBlock[] }>` - Content changed
- `doc-focus: CustomEvent<{ blockId: string }>` - Block focused
- `doc-blur: CustomEvent<{ blockId: string }>` - Block blurred

## Block Types

- `paragraph` - Text paragraph
- `heading-1` - H1 heading
- `heading-2` - H2 heading
- `heading-3` - H3 heading
- `bulleted-list` - Bulleted list item
- `numbered-list` - Numbered list item
- `todo` - To-do with checkbox
- `code` - Code block
- `quote` - Blockquote
- `divider` - Horizontal rule

## Keyboard Shortcuts

- **/** - Open block menu
- **Enter** - New block
- **Backspace** (empty) - Delete block
- **Ctrl/Cmd+B** - Bold (planned)
- **Ctrl/Cmd+I** - Italic (planned)
- **Ctrl/Cmd+U** - Underline (planned)

## Block Menu

- **ArrowDown/Up** - Navigate
- **Enter** - Select
- **Escape** - Close

## CSS Variables

```css
--snice-doc-text-color
--snice-doc-background
--snice-doc-muted-color
--snice-doc-placeholder-color
--snice-doc-primary-color
--snice-doc-link-color
--snice-doc-code-background
--snice-doc-code-border
--snice-doc-inline-code-background
--snice-doc-quote-border
--snice-doc-divider-color
--snice-doc-menu-background
--snice-doc-menu-border
--snice-doc-menu-hover
--snice-doc-toolbar-background
--snice-doc-toolbar-text
--snice-doc-toolbar-hover
--snice-doc-toolbar-active
--snice-doc-padding
--snice-doc-min-height
--snice-doc-max-width
```

## Types

```typescript
type BlockType =
  | 'paragraph'
  | 'heading-1'
  | 'heading-2'
  | 'heading-3'
  | 'bulleted-list'
  | 'numbered-list'
  | 'todo'
  | 'code'
  | 'quote'
  | 'divider';

interface DocBlock {
  id: string;
  type: BlockType;
  content: string;
  formats: TextRange[];
  checked?: boolean;
  indent?: number;
}

interface TextRange {
  start: number;
  end: number;
  format: InlineFormat;
  value?: string;
}

type InlineFormat = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link';
```

## Example

```javascript
const doc = document.querySelector('snice-doc');

doc.setBlocks([
  { id: '1', type: 'heading-1', content: 'Title', formats: [] },
  { id: '2', type: 'paragraph', content: 'Content', formats: [] },
  { id: '3', type: 'todo', content: 'Task', formats: [], checked: false },
]);

doc.addEventListener('doc-change', (e) => {
  console.log(e.detail.blocks);
});

// Export
const json = doc.toJSON();
const markdown = doc.toMarkdown();
const html = doc.toHTML();
```

## Features

- Block-based editing
- Type `/` for block menu
- Drag to reorder
- Export JSON/Markdown/HTML
- Readonly mode
- Keyboard shortcuts
- To-do lists with checkboxes
- Code blocks
- Quotes
- Dividers
