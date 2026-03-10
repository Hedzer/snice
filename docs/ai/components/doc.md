# snice-doc

Simple WYSIWYG document editor with formatting toolbar and content insertion.

## Properties

```typescript
placeholder: string = 'Start typing...';
readonly: boolean = false;
icons: 'default'|'material'|'fontawesome' = 'default';
```

## Methods

- `getHTML()` → `string` - Get HTML content
- `setHTML(html)` - Set HTML content
- `getText()` → `string` - Get plain text content
- `getMarkdown()` → `string` - Get content as Markdown
- `downloadAs(format, filename?)` - Download as `'html'`|`'markdown'`|`'text'`
- `clear()` - Clear all content

## CSS Custom Properties

```css
--snice-doc-font-family
--snice-doc-font-size
--snice-doc-text-color
--snice-doc-background
--snice-doc-muted-color
--snice-doc-placeholder-color
--snice-doc-primary-color
--snice-doc-link-color
--snice-doc-inline-code-background
--snice-doc-toolbar-background
--snice-doc-border
--snice-doc-hover-background
--snice-doc-sidebar-background
```

## CSS Parts

- `base` - Outer document wrapper
- `editor` - Editable content area
- `toolbar` - Formatting toolbar
- `icon` - Toolbar icon element

## Basic Usage

```html
<snice-doc></snice-doc>
<snice-doc icons="material"></snice-doc>
<snice-doc icons="fontawesome"></snice-doc>
<snice-doc readonly></snice-doc>
```

```typescript
doc.setHTML('<h1>Title</h1><p>Content with <b>bold</b>.</p>');
const html = doc.getHTML();
const markdown = doc.getMarkdown();
doc.downloadAs('markdown', 'my-doc.md');
```

## Icon Sets

- `default` - Text labels and emoji
- `material` - Material Symbols Outlined (load font in document)
- `fontawesome` - Font Awesome 6 solid (load font in document)
- Fonts cascade from light DOM into shadow DOM

## Keyboard Navigation

- Ctrl/Cmd+B - Bold
- Ctrl/Cmd+I - Italic
- Ctrl/Cmd+U - Underline

## Accessibility

- contentEditable for native text editing
- Semantic HTML output
- Dark mode via prefers-color-scheme
- Paste images from clipboard
