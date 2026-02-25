# snice-doc

Simple WYSIWYG document editor with toolbar and sidebar.

## Usage

```html
<snice-doc></snice-doc>
<snice-doc icons="material"></snice-doc>
<snice-doc icons="fontawesome" icon-stylesheet="/path/to/fa.css"></snice-doc>
```

## Properties

- `placeholder: string` - Placeholder text (default: `"Start typing..."`)
- `readonly: boolean` - Readonly mode (default: `false`)
- `icons: 'default' | 'material' | 'fontawesome'` - Toolbar icon set (default: `"default"`)
- `icon-stylesheet: string` - Custom URL for icon font CSS (overrides built-in defaults)

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
- `material` - Google Material Icons (auto-loads from Google Fonts CDN)
- `fontawesome` - Font Awesome 6 (auto-loads from cdnjs CDN)
- Use `icon-stylesheet` attribute to provide a custom/self-hosted CSS URL

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
