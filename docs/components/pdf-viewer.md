<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/pdf-viewer.md -->

# PDF Viewer
`<snice-pdf-viewer>`

A PDF document viewer with a toolbar for page navigation, zoom controls, fit modes, download, and print. Uses a vendored PDF.js library.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | `string` | `''` | PDF file URL |
| `page` | `number` | `1` | Current page number |
| `zoom` | `number` | `1` | Zoom level (range: 0.25 to 5) |
| `fit` | `'width' \| 'height' \| 'page'` | `'width'` | Fit mode for page display |
| `totalPages` (read-only) | `number` | `0` | Total number of pages in the document |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `goToPage()` | `page: number` | Navigate to a specific page |
| `nextPage()` | -- | Go to the next page |
| `prevPage()` | -- | Go to the previous page |
| `print()` | -- | Open the PDF in a new window for printing |
| `download()` | -- | Trigger a download of the PDF file |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `page-change` | `{ page: number, totalPages: number }` | Fired when the page changes |
| `pdf-loaded` | `{ totalPages: number }` | Fired when the PDF document loads successfully |
| `pdf-error` | `{ error: string }` | Fired on loading or rendering errors |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The outer viewer container |
| `toolbar` | `<div>` | The navigation and zoom toolbar |
| `viewport` | `<div>` | The PDF page display area |

## Basic Usage

```typescript
import 'snice/components/pdf-viewer/snice-pdf-viewer';
```

```html
<snice-pdf-viewer src="/documents/report.pdf" fit="width" style="height: 600px;"></snice-pdf-viewer>
```

## Examples

### Fit Modes

Use the `fit` attribute to control how the page fills the viewport.

```html
<snice-pdf-viewer src="/doc.pdf" fit="width"></snice-pdf-viewer>
<snice-pdf-viewer src="/doc.pdf" fit="height"></snice-pdf-viewer>
<snice-pdf-viewer src="/doc.pdf" fit="page"></snice-pdf-viewer>
```

### Event Handling

Listen for document and navigation events.

```typescript
viewer.addEventListener('pdf-loaded', (e) => {
  console.log('Loaded:', e.detail.totalPages, 'pages');
});

viewer.addEventListener('page-change', (e) => {
  console.log(`Page ${e.detail.page} of ${e.detail.totalPages}`);
});

viewer.addEventListener('pdf-error', (e) => {
  console.error('PDF error:', e.detail.error);
});
```

### Programmatic Navigation

Use methods to control the viewer from JavaScript.

```typescript
viewer.goToPage(5);
viewer.nextPage();
viewer.prevPage();
viewer.print();
viewer.download();
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `ArrowRight` / `PageDown` | Next page |
| `ArrowLeft` / `PageUp` | Previous page |
| `Ctrl/Cmd` + `+` | Zoom in |
| `Ctrl/Cmd` + `-` | Zoom out |

## Accessibility

- The viewer container is keyboard-focusable with `tabindex="0"`
- All toolbar buttons have descriptive `title` attributes
- The page input field allows direct page number entry
- Navigation buttons are disabled at page boundaries
