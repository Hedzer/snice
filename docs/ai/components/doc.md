# snice-doc

Simple WYSIWYG document editor with toolbar and sidebar.

## Usage

```html
<snice-doc></snice-doc>
<snice-doc icons="material"></snice-doc>
<snice-doc icons="fontawesome"></snice-doc>
```

## Properties

- `placeholder: string` - Placeholder text (default: `"Start typing..."`)
- `readonly: boolean` - Readonly mode (default: `false`)
- `icons: 'default' | 'material' | 'fontawesome'` - Toolbar icon set (default: `"default"`)

## Methods

- `getHTML(): string` - Get HTML content
- `setHTML(html: string): void` - Set HTML content
- `getText(): string` - Get plain text content
- `getMarkdown(): string` - Get content as markdown
- `downloadAs(format: 'html' | 'markdown' | 'text', filename?: string): void` - Download document
- `clear(): void` - Clear all content

## Toolbar

- **B, I, U, S** - Bold, italic, underline, strikethrough
- **H1, H2, H3, P** - Heading formats and paragraph
- **•, 1.** - Bulleted and numbered lists
- **🔗** - Insert link
- **🖼** - Insert image
- **📊** - Insert table
- **―** - Insert divider
- **⬇** - Download (HTML, Markdown, or Plain Text)

## Icon Sets

- `default` - Text labels and emoji icons
- `material` - Material Symbols Outlined (user must load the font in the document)
- `fontawesome` - Font Awesome 6 solid icons (user must load the font in the document)
- Fonts cascade from light DOM into shadow DOM — no auto-loading

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
`);

// Export formats
const html = doc.getHTML();
const markdown = doc.getMarkdown();
const text = doc.getText();

// Download
doc.downloadAs('markdown', 'my-doc.md');
doc.downloadAs('html');
doc.downloadAs('text');
```

## Features

- WYSIWYG contentEditable editing
- Formatting toolbar with configurable icon sets
- Insert images, tables, dividers, links
- Download as HTML, Markdown, or Plain Text
- Paste images from clipboard
- Keyboard shortcuts
- Readonly mode
- Dark mode (prefers-color-scheme)
- Material Icons and Font Awesome support
