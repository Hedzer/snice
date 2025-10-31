# snice-doc

Simple WYSIWYG document editor with toolbar and sidebar.

## Usage

```html
<snice-doc></snice-doc>
```

## Properties

- `placeholder: string` - Placeholder text (default: `"Start typing..."`)
- `readonly: boolean` - Readonly mode (default: `false`)

## Methods

- `getHTML(): string` - Get HTML content
- `setHTML(html: string): void` - Set HTML content
- `clear(): void` - Clear all content

## Toolbar

- **B, I, U, S** - Bold, italic, underline, strikethrough
- **H1, H2, H3, P** - Heading formats and paragraph
- **•, 1.** - Bulleted and numbered lists
- **🔗** - Insert link
- **🖼** - Insert image

## Sidebar

- **Image** - Insert image via URL
- **Table** - Insert table (rows × cols)
- **Divider** - Insert horizontal rule

## Keyboard Shortcuts

- **Ctrl/Cmd+B** - Bold
- **Ctrl/Cmd+I** - Italic
- **Ctrl/Cmd+U** - Underline

## CSS Variables

```css
--snice-doc-text-color
--snice-doc-background
--snice-doc-muted-color
--snice-doc-placeholder-color
--snice-doc-primary-color
--snice-doc-link-color
--snice-doc-inline-code-background
--snice-doc-toolbar-background
--snice-doc-toolbar-border
--snice-doc-sidebar-background
--snice-doc-sidebar-border
--snice-doc-padding
```

## Example

```javascript
const doc = document.querySelector('snice-doc');

doc.setHTML(`
  <h1>Title</h1>
  <p>Content with <b>bold</b> and <i>italic</i>.</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
`);

// Get content
const html = doc.getHTML();

// Save/load
localStorage.setItem('doc', doc.getHTML());
doc.setHTML(localStorage.getItem('doc'));
```

## Features

- WYSIWYG contentEditable editing
- Formatting toolbar
- Insert images, tables, dividers
- Collapsible sidebar
- Paste images from clipboard
- Keyboard shortcuts
- Readonly mode
