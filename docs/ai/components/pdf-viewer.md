# snice-pdf-viewer

PDF document viewer with toolbar for page navigation, zoom, fit modes, download, and print. Uses vendored PDF.js.

## Properties

```typescript
src: string = '';                                    // PDF file URL
page: number = 1;                                    // Current page number
zoom: number = 1;                                    // Zoom level (0.25-5)
fit: 'width'|'height'|'page' = 'width';             // Fit mode
readonly totalPages: number = 0;                     // Total pages in document
```

## Methods

- `goToPage(page: number)` - Navigate to specific page
- `nextPage()` - Go to next page
- `prevPage()` - Go to previous page
- `print()` - Open PDF in new window for printing
- `download()` - Trigger PDF file download

## Events

- `page-change` → `{ page: number, totalPages: number }` - Page navigation
- `pdf-loaded` → `{ totalPages: number }` - Document loaded
- `pdf-error` → `{ error: string }` - Loading or rendering error

## CSS Parts

- `base` - Outer viewer container
- `toolbar` - Navigation and zoom toolbar
- `viewport` - PDF page display area

## Basic Usage

```html
<snice-pdf-viewer src="/documents/report.pdf" fit="width"></snice-pdf-viewer>
```

```typescript
import 'snice/components/pdf-viewer/snice-pdf-viewer';

viewer.addEventListener('pdf-loaded', (e) => {
  console.log('Pages:', e.detail.totalPages);
});
```

## Keyboard Navigation

- `ArrowRight` / `PageDown` - Next page
- `ArrowLeft` / `PageUp` - Previous page
- `Ctrl/Cmd +` - Zoom in
- `Ctrl/Cmd -` - Zoom out

## Accessibility

- Container is keyboard-focusable with `tabindex="0"`
- Toolbar buttons have title attributes
- Page input allows direct page navigation
