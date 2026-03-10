<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/pagination.md -->

# Pagination
`<snice-pagination>`

A pagination navigation component with page numbers, ellipsis, and first/previous/next/last navigation buttons.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [CSS Custom Properties](#css-custom-properties)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `current` | `number` | `1` | Current active page |
| `total` | `number` | `1` | Total number of pages |
| `siblings` | `number` | `1` | Number of pages shown on each side of the current page |
| `showFirst` (attr: `show-first`) | `boolean` | `true` | Show first page button |
| `showLast` (attr: `show-last`) | `boolean` | `true` | Show last page button |
| `showPrev` (attr: `show-prev`) | `boolean` | `true` | Show previous page button |
| `showNext` (attr: `show-next`) | `boolean` | `true` | Show next page button |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `variant` | `'default' \| 'rounded' \| 'text'` | `'default'` | Visual style |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `goToPage()` | `page: number` | Navigate to a specific page |
| `nextPage()` | -- | Go to the next page |
| `previousPage()` | -- | Go to the previous page |
| `firstPage()` | -- | Go to the first page |
| `lastPage()` | -- | Go to the last page |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `pagination-change` | `{ page: number, previousPage: number }` | Fired when the page changes |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<nav>` | The pagination nav container |
| `button` | `<button>` | All navigation buttons (shared part) |
| `first-button` | `<button>` | The first page button |
| `prev-button` | `<button>` | The previous page button |
| `pages` | `<div>` | The page numbers container |
| `ellipsis` | `<span>` | The ellipsis indicators |
| `next-button` | `<button>` | The next page button |
| `last-button` | `<button>` | The last page button |

```css
snice-pagination::part(button) {
  border-radius: 50%;
  font-weight: 600;
}
```

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--pagination-gap` | Gap between buttons | `4px` |
| `--pagination-button-size` | Button width and height | `32px` |
| `--pagination-button-padding` | Button horizontal padding | `8px` |
| `--pagination-font-size` | Button font size | `14px` |
| `--pagination-border-radius` | Button border radius | `4px` |

## Basic Usage

```typescript
import 'snice/components/pagination/snice-pagination';
```

```html
<snice-pagination current="1" total="10"></snice-pagination>

<script type="module">
  document.querySelector('snice-pagination').addEventListener('pagination-change', (e) => {
    console.log('Page:', e.detail.page, 'Previous:', e.detail.previousPage);
  });
</script>
```

## Examples

### Variants

Use the `variant` attribute to change the button style.

```html
<snice-pagination total="20" variant="default"></snice-pagination>
<snice-pagination total="20" variant="rounded"></snice-pagination>
<snice-pagination total="20" variant="text"></snice-pagination>
```

### Sizes

Use the `size` attribute to adjust button dimensions.

```html
<snice-pagination total="10" size="small"></snice-pagination>
<snice-pagination total="10" size="medium"></snice-pagination>
<snice-pagination total="10" size="large"></snice-pagination>
```

### Extended Siblings

Use `siblings` to show more page numbers around the current page.

```html
<snice-pagination total="50" siblings="3"></snice-pagination>
```

### Minimal Navigation

Hide specific navigation buttons for a simpler layout.

```html
<snice-pagination total="10" show-first="false" show-last="false"></snice-pagination>
```

### Programmatic Navigation

Use methods to control pagination from JavaScript.

```typescript
const pagination = document.querySelector('snice-pagination');
pagination.goToPage(5);
pagination.nextPage();
pagination.previousPage();
```

## Accessibility

- The component uses a `<nav>` element with `aria-label="Pagination"`
- The active page has `aria-current="page"`
- Each button has an `aria-label` describing its action
- Boundary buttons are automatically disabled when at the first or last page
