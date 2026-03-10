<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/doc.md -->

# Doc
`<snice-doc>`

A simple WYSIWYG document editor component with formatting toolbar and content insertion capabilities.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `placeholder` | `placeholder` | `string` | `"Start typing..."` | Placeholder text when empty |
| `readonly` | `readonly` | `boolean` | `false` | Whether the editor is readonly |
| `icons` | `icons` | `'default' \| 'material' \| 'fontawesome'` | `'default'` | Toolbar icon set |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `getHTML()` | -- | Returns the current HTML content |
| `setHTML()` | `html: string` | Sets the HTML content |
| `getText()` | -- | Returns the content as plain text |
| `getMarkdown()` | -- | Returns the content converted to Markdown |
| `downloadAs()` | `format: 'html' \| 'markdown' \| 'text', filename?: string` | Downloads the document in the specified format |
| `clear()` | -- | Clears all content and resets to empty paragraph |

## CSS Custom Properties

| Property | Description |
|----------|-------------|
| `--snice-doc-font-family` | Editor font family |
| `--snice-doc-font-size` | Editor font size |
| `--snice-doc-text-color` | Text color |
| `--snice-doc-background` | Editor background |
| `--snice-doc-muted-color` | Muted text color |
| `--snice-doc-placeholder-color` | Placeholder text color |
| `--snice-doc-primary-color` | Primary accent color |
| `--snice-doc-link-color` | Link color |
| `--snice-doc-inline-code-background` | Inline code background |
| `--snice-doc-toolbar-background` | Toolbar background |
| `--snice-doc-border` | Border color |
| `--snice-doc-hover-background` | Hover state background |
| `--snice-doc-sidebar-background` | Sidebar background |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The outer document wrapper |
| `editor` | The editable content area |
| `toolbar` | The formatting toolbar |
| `icon` | Toolbar icon element |

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

```typescript
import 'snice/components/doc/snice-doc';
```

```html
<snice-doc id="editor"></snice-doc>

<script>
  editor.setHTML('<h1>Welcome</h1><p>Start editing...</p>');
  const html = editor.getHTML();
</script>
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-doc.min.js"></script>
```

## Examples

### Toolbar Features

The toolbar includes:

- **B** - Bold text (Ctrl/Cmd+B)
- **I** - Italic text (Ctrl/Cmd+I)
- **U** - Underline text (Ctrl/Cmd+U)
- **S** - Strikethrough text
- **H1, H2, H3, P** - Heading formats and paragraph
- **Bullet / Number** - Bulleted and numbered lists
- **Link** - Insert link
- **Image** - Insert image
- **Table** - Insert table
- **Divider** - Insert horizontal rule
- **Download** - Download menu (HTML, Markdown, Plain Text)

### Export and Download

Use `downloadAs()` to save the document in different formats.

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

### Icon Sets

Use the `icons` attribute to switch toolbar icon sets.

**Default (text/emoji)**
```html
<snice-doc></snice-doc>
```

**Material Symbols** - requires loading the font in your document:
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined">
<snice-doc icons="material"></snice-doc>
```

**Font Awesome** - requires loading the Font Awesome stylesheet:
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
<snice-doc icons="fontawesome"></snice-doc>
```

Fonts cascade from light DOM into the shadow DOM automatically.

### Readonly Document Viewer

Set `readonly` to display documents without editing capabilities.

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

Use `getHTML()` and `setHTML()` to persist content.

```typescript
// Save
localStorage.setItem('document', editor.getHTML());

// Load
const html = localStorage.getItem('document');
if (html) editor.setHTML(html);
```

## Keyboard Navigation

- **Ctrl/Cmd+B** - Toggle bold
- **Ctrl/Cmd+I** - Toggle italic
- **Ctrl/Cmd+U** - Toggle underline

## Accessibility

- Uses `contentEditable` for native text editing behavior
- Semantic HTML output
- Keyboard shortcuts for formatting
- Dark mode support via `prefers-color-scheme: dark`
- Paste images directly from clipboard
