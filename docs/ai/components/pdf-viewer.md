# snice-pdf-viewer

PDF document viewer with toolbar (page navigation, zoom, fit modes, download, print). Uses PDF.js loaded from CDN.

## Properties

```ts
src: string                              // PDF file URL
page: number                             // Current page (default: 1)
zoom: number                             // Zoom level (default: 1, range: 0.25-5)
fit: 'width' | 'height' | 'page'        // Fit mode (default: 'width')
readonly totalPages: number              // Total pages in document
```

## Methods

- `goToPage(page: number)` -- Navigate to specific page
- `nextPage()` -- Go to next page
- `prevPage()` -- Go to previous page
- `print()` -- Open PDF in new window for printing
- `download()` -- Trigger PDF file download

## Events

- `page-change` -> `{ page: number; totalPages: number }` -- Page navigation
- `pdf-loaded` -> `{ totalPages: number }` -- Document loaded successfully
- `pdf-error` -> `{ error: string }` -- Loading or rendering error

## Keyboard Shortcuts

- `ArrowRight` / `PageDown` -- Next page
- `ArrowLeft` / `PageUp` -- Previous page
- `Ctrl/Cmd +` -- Zoom in
- `Ctrl/Cmd -` -- Zoom out

## Usage

```html
<snice-pdf-viewer
  src="/documents/report.pdf"
  fit="width"
  zoom="1"
></snice-pdf-viewer>
```

```js
const viewer = document.querySelector('snice-pdf-viewer');
viewer.src = '/documents/report.pdf';

viewer.addEventListener('pdf-loaded', (e) => {
  console.log('Pages:', e.detail.totalPages);
});

viewer.addEventListener('page-change', (e) => {
  console.log(`Page ${e.detail.page} of ${e.detail.totalPages}`);
});
```
