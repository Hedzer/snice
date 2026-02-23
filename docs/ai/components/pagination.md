# snice-pagination

Pagination navigation component.

## Properties

```typescript
current: number = 1;
total: number = 1;
siblings: number = 1;               // Pages shown each side of current
showFirst: boolean = true;          // attr: show-first
showLast: boolean = true;           // attr: show-last
showPrev: boolean = true;           // attr: show-prev
showNext: boolean = true;           // attr: show-next
size: 'small'|'medium'|'large' = 'medium';
variant: 'default'|'rounded'|'text' = 'default';
```

## Methods

- `goToPage(page: number)` - Navigate to page
- `nextPage()` - Next page
- `previousPage()` - Previous page
- `firstPage()` - First page
- `lastPage()` - Last page

## Events

- `pagination-change` → `{ page, previousPage }`

## Usage

```html
<snice-pagination current="1" total="10"></snice-pagination>
<snice-pagination total="20" siblings="3" variant="rounded" size="large"></snice-pagination>
```

```typescript
pagination.addEventListener('pagination-change', (e) => {
  console.log(e.detail.page);
});
pagination.goToPage(5);
```

## CSS Custom Properties

```css
--pagination-gap: 4px;
--pagination-button-size: 32px;
--pagination-button-padding: 8px;
--pagination-font-size: 14px;
--pagination-border-radius: 4px;
```
