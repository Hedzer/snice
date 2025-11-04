# Pagination Component

The `<snice-pagination>` component provides a flexible pagination interface for navigating through large datasets or multi-page content.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Variants](#variants)
- [Examples](#examples)

## Basic Usage

```html
<snice-pagination current="1" total="10"></snice-pagination>
```

```typescript
import 'snice/components/pagination/snice-pagination';

const pagination = document.querySelector('snice-pagination');
pagination.addEventListener('pagination-change', (e) => {
  console.log('Page changed to:', e.detail.page);
});
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `current` | `number` | `1` | The currently active page number |
| `total` | `number` | `1` | Total number of pages |
| `siblings` | `number` | `1` | Number of page buttons to show on each side of current page |
| `showFirst` | `boolean` | `true` | Whether to show the "First" button |
| `showLast` | `boolean` | `true` | Whether to show the "Last" button |
| `showPrev` | `boolean` | `true` | Whether to show the "Previous" button |
| `showNext` | `boolean` | `true` | Whether to show the "Next" button |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant of the pagination |
| `variant` | `'default' \| 'rounded' \| 'text'` | `'default'` | Visual style variant |

## Methods

### `goToPage(page: number): void`
Navigate to a specific page number.

```typescript
pagination.goToPage(5);
```

### `nextPage(): void`
Navigate to the next page (if not on last page).

```typescript
pagination.nextPage();
```

### `previousPage(): void`
Navigate to the previous page (if not on first page).

```typescript
pagination.previousPage();
```

### `firstPage(): void`
Navigate to the first page.

```typescript
pagination.firstPage();
```

### `lastPage(): void`
Navigate to the last page.

```typescript
pagination.lastPage();
```

## Events

### `pagination-change`
Fired when the page changes.

**Event Detail:**
```typescript
{
  page: number;        // New page number
  previousPage: number; // Previous page number
}
```

**Usage:**
```typescript
pagination.addEventListener('pagination-change', (e) => {
  const { page, previousPage } = e.detail;
  console.log(`Changed from page ${previousPage} to ${page}`);
});
```

## Variants

### Size Variants

```html
<!-- Small -->
<snice-pagination total="10" size="small"></snice-pagination>

<!-- Medium (default) -->
<snice-pagination total="10" size="medium"></snice-pagination>

<!-- Large -->
<snice-pagination total="10" size="large"></snice-pagination>
```

### Style Variants

```html
<!-- Default (squared corners) -->
<snice-pagination total="10" variant="default"></snice-pagination>

<!-- Rounded (circular buttons) -->
<snice-pagination total="10" variant="rounded"></snice-pagination>

<!-- Text (minimal styling) -->
<snice-pagination total="10" variant="text"></snice-pagination>
```

## Examples

### Basic Pagination

```html
<snice-pagination
  current="1"
  total="20">
</snice-pagination>
```

### Controlling Siblings

The `siblings` property controls how many page buttons appear on each side of the current page.

```html
<!-- Show 1 page on each side (default) -->
<!-- Current: 5 → Shows: [1] ... [4] [5] [6] ... [20] -->
<snice-pagination current="5" total="20" siblings="1"></snice-pagination>

<!-- Show 3 pages on each side -->
<!-- Current: 10 → Shows: [1] ... [7] [8] [9] [10] [11] [12] [13] ... [20] -->
<snice-pagination current="10" total="20" siblings="3"></snice-pagination>
```

### Without Navigation Buttons

```html
<!-- No first/last buttons -->
<snice-pagination
  total="10"
  show-first="false"
  show-last="false">
</snice-pagination>

<!-- Only page numbers -->
<snice-pagination
  total="10"
  show-first="false"
  show-last="false"
  show-prev="false"
  show-next="false">
</snice-pagination>
```

### Programmatic Navigation

```typescript
import type { SnicePaginationElement } from 'snice/components/pagination/snice-pagination.types';

const pagination = document.querySelector<SnicePaginationElement>('snice-pagination');

// Navigate to specific page
pagination.goToPage(7);

// Navigate step by step
pagination.nextPage();
pagination.previousPage();

// Jump to extremes
pagination.firstPage();
pagination.lastPage();
```

### With Event Handling

```typescript
const pagination = document.querySelector('snice-pagination');

pagination.addEventListener('pagination-change', (e) => {
  const { page } = e.detail;

  // Fetch data for the new page
  fetchPageData(page);
});

async function fetchPageData(page: number) {
  const response = await fetch(`/api/data?page=${page}`);
  const data = await response.json();
  renderData(data);
}
```

### Custom Styling with CSS Variables

```html
<style>
  snice-pagination {
    --pagination-gap: 8px;
    --pagination-button-size: 40px;
    --pagination-button-padding: 12px;
    --pagination-font-size: 16px;
    --pagination-border-radius: 8px;
  }
</style>

<snice-pagination total="10"></snice-pagination>
```

### Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import 'snice/components/pagination/snice-pagination';

    const pagination = document.querySelector('snice-pagination');
    const dataContainer = document.querySelector('#data');
    const itemsPerPage = 10;

    // Sample data
    const allData = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`
    }));

    // Update total pages
    pagination.total = Math.ceil(allData.length / itemsPerPage);

    // Render data for current page
    function renderPage(page) {
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const pageData = allData.slice(start, end);

      dataContainer.innerHTML = pageData
        .map(item => `<div>${item.id}. ${item.name}</div>`)
        .join('');
    }

    // Listen for page changes
    pagination.addEventListener('pagination-change', (e) => {
      renderPage(e.detail.page);
    });

    // Render initial page
    renderPage(1);
  </script>
</head>
<body>
  <div id="data"></div>
  <snice-pagination current="1"></snice-pagination>
</body>
</html>
```

## Accessibility

The pagination component includes proper ARIA attributes:

- `role="navigation"` on the container
- `aria-label="Pagination"` on the nav element
- `aria-label` on each button describing its action
- `aria-current="page"` on the active page button
- `disabled` state for unavailable navigation buttons

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support
