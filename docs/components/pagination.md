[//]: # (AI: For a low-token version of this doc, use docs/ai/components/pagination.md instead)

# Pagination
`<snice-pagination>`

A pagination navigation component for navigating through multi-page content.

## Basic Usage

```typescript
import 'snice/components/pagination/snice-pagination';
```

```html
<snice-pagination current="1" total="10"></snice-pagination>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/pagination/snice-pagination';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-pagination.min.js"></script>
```

## Examples

### Sizes

Use the `size` attribute to change the pagination size.

```html
<snice-pagination total="10" size="small"></snice-pagination>
<snice-pagination total="10" size="medium"></snice-pagination>
<snice-pagination total="10" size="large"></snice-pagination>
```

### Variants

Use the `variant` attribute to change the visual style.

```html
<snice-pagination total="10" variant="default"></snice-pagination>
<snice-pagination total="10" variant="rounded"></snice-pagination>
<snice-pagination total="10" variant="text"></snice-pagination>
```

### Controlling Siblings

Use the `siblings` attribute to set how many page buttons appear on each side of the current page.

```html
<!-- 1 page each side (default): [1] ... [4] [5] [6] ... [20] -->
<snice-pagination current="5" total="20" siblings="1"></snice-pagination>

<!-- 3 pages each side: [1] ... [7] [8] [9] [10] [11] [12] [13] ... [20] -->
<snice-pagination current="10" total="20" siblings="3"></snice-pagination>
```

### Without Navigation Buttons

Hide the first, last, previous, or next buttons as needed.

```html
<snice-pagination total="10" show-first="false" show-last="false"></snice-pagination>

<!-- Page numbers only -->
<snice-pagination
  total="10"
  show-first="false"
  show-last="false"
  show-prev="false"
  show-next="false">
</snice-pagination>
```

### Event Handling

```html
<snice-pagination id="pager" total="20"></snice-pagination>

<script type="module">
  import 'snice/components/pagination/snice-pagination';

  document.getElementById('pager').addEventListener('pagination-change', (e) => {
    console.log(`Page ${e.detail.previousPage} → ${e.detail.page}`);
  });
</script>
```

### Programmatic Control

```typescript
const pagination = document.querySelector('snice-pagination');

pagination.goToPage(5);
pagination.nextPage();
pagination.previousPage();
pagination.firstPage();
pagination.lastPage();
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `current` | `number` | `1` | Active page number |
| `total` | `number` | `1` | Total number of pages |
| `siblings` | `number` | `1` | Page buttons on each side of current |
| `showFirst` (attr: `show-first`) | `boolean` | `true` | Show "First" button |
| `showLast` (attr: `show-last`) | `boolean` | `true` | Show "Last" button |
| `showPrev` (attr: `show-prev`) | `boolean` | `true` | Show "Previous" button |
| `showNext` (attr: `show-next`) | `boolean` | `true` | Show "Next" button |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Pagination size |
| `variant` | `'default' \| 'rounded' \| 'text'` | `'default'` | Visual style |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `pagination-change` | `{ page: number, previousPage: number }` | Fired when the page changes |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `goToPage()` | `page: number` | Navigate to a specific page |
| `nextPage()` | -- | Go to the next page |
| `previousPage()` | -- | Go to the previous page |
| `firstPage()` | -- | Go to the first page |
| `lastPage()` | -- | Go to the last page |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--pagination-gap` | Gap between buttons | `4px` |
| `--pagination-button-size` | Button dimensions | `32px` |
| `--pagination-button-padding` | Button padding | `8px` |
| `--pagination-font-size` | Font size | `14px` |
| `--pagination-border-radius` | Button border radius | `4px` |
