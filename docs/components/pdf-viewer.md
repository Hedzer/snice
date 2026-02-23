[//]: # (AI: For a low-token version of this doc, use docs/ai/components/pdf-viewer.md instead)

# PDF Viewer Component

`<snice-pdf-viewer>`

A PDF document viewer with a built-in toolbar for page navigation, zoom control, fit modes, printing, and downloading. Uses PDF.js loaded from CDN for rendering.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Basic Usage

```typescript
import 'snice/components/pdf-viewer/snice-pdf-viewer';
```

```html
<snice-pdf-viewer src="/documents/report.pdf"></snice-pdf-viewer>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/pdf-viewer/snice-pdf-viewer';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-pdf-viewer.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | `string` | `''` | URL of the PDF file to display |
| `page` | `number` | `1` | Current page number |
| `zoom` | `number` | `1` | Zoom level (range: 0.25 to 5) |
| `fit` | `'width' \| 'height' \| 'page'` | `'width'` | How the PDF page fits within the viewer |
| `totalPages` | `number` (readonly) | `0` | Total number of pages in the loaded document |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `goToPage()` | `page: number` | Navigate to a specific page number |
| `nextPage()` | -- | Navigate to the next page |
| `prevPage()` | -- | Navigate to the previous page |
| `print()` | -- | Open the PDF in a new window for printing |
| `download()` | -- | Trigger a file download of the PDF |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `page-change` | `{ page: number; totalPages: number }` | Fired when the current page changes |
| `pdf-loaded` | `{ totalPages: number }` | Fired when the PDF document has been loaded successfully |
| `pdf-error` | `{ error: string }` | Fired when an error occurs during loading or rendering |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `ArrowRight` / `PageDown` | Next page |
| `ArrowLeft` / `PageUp` | Previous page |
| `Ctrl/Cmd + =` | Zoom in |
| `Ctrl/Cmd + -` | Zoom out |

## Examples

### Basic Document Viewer

Display a PDF with the default fit-to-width mode.

```html
<snice-pdf-viewer
  src="/documents/report.pdf"
  style="width: 100%; height: 600px;"
></snice-pdf-viewer>
```

### Zoom and Fit Modes

Control how the document is displayed using `zoom` and `fit` attributes.

```html
<!-- Fit to page width -->
<snice-pdf-viewer src="/docs/manual.pdf" fit="width"></snice-pdf-viewer>

<!-- Fit entire page -->
<snice-pdf-viewer src="/docs/manual.pdf" fit="page"></snice-pdf-viewer>

<!-- Custom zoom level -->
<snice-pdf-viewer src="/docs/manual.pdf" zoom="1.5"></snice-pdf-viewer>
```

### Handling Load and Error Events

Listen for document lifecycle events to show loading states or handle errors.

```html
<snice-pdf-viewer id="viewer" style="width: 100%; height: 600px;"></snice-pdf-viewer>
<div id="status"></div>

<script type="module">
  import 'snice/components/pdf-viewer/snice-pdf-viewer';

  const viewer = document.getElementById('viewer');
  const status = document.getElementById('status');

  viewer.addEventListener('pdf-loaded', (e) => {
    status.textContent = `Document loaded: ${e.detail.totalPages} pages`;
  });

  viewer.addEventListener('pdf-error', (e) => {
    status.textContent = `Error: ${e.detail.error}`;
  });

  viewer.addEventListener('page-change', (e) => {
    status.textContent = `Page ${e.detail.page} of ${e.detail.totalPages}`;
  });

  viewer.src = '/documents/report.pdf';
</script>
```

### Programmatic Navigation

Use methods to control page navigation from external buttons or logic.

```html
<snice-pdf-viewer id="viewer" src="/documents/slides.pdf" style="width: 100%; height: 500px;"></snice-pdf-viewer>

<div style="margin-top: 1rem;">
  <button id="prev">Previous</button>
  <span id="page-info">Page 1</span>
  <button id="next">Next</button>
  <button id="download">Download</button>
  <button id="print">Print</button>
</div>

<script type="module">
  import 'snice/components/pdf-viewer/snice-pdf-viewer';

  const viewer = document.getElementById('viewer');

  document.getElementById('prev').addEventListener('click', () => viewer.prevPage());
  document.getElementById('next').addEventListener('click', () => viewer.nextPage());
  document.getElementById('download').addEventListener('click', () => viewer.download());
  document.getElementById('print').addEventListener('click', () => viewer.print());

  viewer.addEventListener('page-change', (e) => {
    document.getElementById('page-info').textContent =
      `Page ${e.detail.page} of ${e.detail.totalPages}`;
  });
</script>
```

### Jump to a Specific Page

Use `goToPage()` to navigate directly to any page.

```html
<snice-pdf-viewer id="viewer" src="/documents/handbook.pdf" style="width: 100%; height: 600px;"></snice-pdf-viewer>

<label>
  Go to page:
  <input id="page-input" type="number" min="1" value="1" style="width: 60px;">
</label>
<button id="go-btn">Go</button>

<script type="module">
  import 'snice/components/pdf-viewer/snice-pdf-viewer';

  const viewer = document.getElementById('viewer');

  viewer.addEventListener('pdf-loaded', (e) => {
    document.getElementById('page-input').max = e.detail.totalPages;
  });

  document.getElementById('go-btn').addEventListener('click', () => {
    const page = parseInt(document.getElementById('page-input').value, 10);
    viewer.goToPage(page);
  });
</script>
```

## Accessibility

- The built-in toolbar provides page navigation, zoom controls, and fit mode selection
- Keyboard shortcuts allow page navigation and zoom without a mouse
- Arrow keys (Left/Right) and PageUp/PageDown navigate between pages
- Ctrl/Cmd with +/- controls zoom level
- Print and download functions are available via toolbar buttons
- The viewer displays the current page number and total pages for orientation
