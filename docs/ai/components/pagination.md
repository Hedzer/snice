# snice-pagination

Pagination navigation component with page numbers, ellipsis, and navigation buttons.

## Properties

```typescript
current: number = 1;
total: number = 1;
siblings: number = 1;                    // Pages shown each side of current
showFirst: boolean = true;               // attr: show-first
showLast: boolean = true;                // attr: show-last
showPrev: boolean = true;               // attr: show-prev
showNext: boolean = true;               // attr: show-next
size: 'small'|'medium'|'large' = 'medium';
variant: 'default'|'rounded'|'text' = 'default';
```

## Methods

- `goToPage(page: number)` - Navigate to specific page
- `nextPage()` - Go to next page
- `previousPage()` - Go to previous page
- `firstPage()` - Go to first page
- `lastPage()` - Go to last page

## Events

- `pagination-change` → `{ page: number, previousPage: number }` - Page changed

## CSS Parts

- `base` - Nav container
- `button` - All navigation buttons (shared)
- `first-button` - First page button
- `prev-button` - Previous page button
- `pages` - Page numbers container
- `ellipsis` - Ellipsis span
- `next-button` - Next page button
- `last-button` - Last page button

## CSS Custom Properties

```css
--pagination-gap: 4px;
--pagination-button-size: 32px;
--pagination-button-padding: 8px;
--pagination-font-size: 14px;
--pagination-border-radius: 4px;
```

## Basic Usage

```html
<snice-pagination current="1" total="10"></snice-pagination>
```

```typescript
import 'snice/components/pagination/snice-pagination';

pagination.addEventListener('pagination-change', (e) => {
  console.log('Page:', e.detail.page);
});
```

## Accessibility

- Uses `<nav>` with `aria-label="Pagination"`
- Active page has `aria-current="page"`
- Navigation buttons have `aria-label` attributes
- Disabled state for boundary buttons
