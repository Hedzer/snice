# snice-pagination

Pagination navigation component.

## Properties

```typescript
current: number = 1;         // Active page
total: number = 1;           // Total pages
siblings: number = 1;        // Pages shown each side of current
showFirst: boolean = true;   // Show first button
showLast: boolean = true;    // Show last button
showPrev: boolean = true;    // Show previous button
showNext: boolean = true;    // Show next button
size: 'small'|'medium'|'large' = 'medium';
variant: 'default'|'rounded'|'text' = 'default';
```

## Methods

```typescript
goToPage(page: number)   // Navigate to page
nextPage()               // Next page
previousPage()           // Previous page
firstPage()              // First page
lastPage()               // Last page
```

## Events

```typescript
'@snice/pagination-change' // { page, previousPage }
```

## Usage

```html
<snice-pagination current="1" total="10"></snice-pagination>
```

```typescript
pagination.addEventListener('@snice/pagination-change', (e) => {
  console.log(e.detail.page);
});
```

## CSS Variables

```css
--pagination-gap: 4px;
--pagination-button-size: 32px;
--pagination-button-padding: 8px;
--pagination-font-size: 14px;
--pagination-border-radius: 4px;
```
