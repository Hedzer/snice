# snice-book

Page-flipping book component with cover page, keyboard navigation, and animated page turns.

## Properties

```ts
currentPage: number = 0          // attr: current-page
coverImage: string = ''          // attr: cover-image — URL for cover page image
title: string = ''               // Book title shown on cover
author: string = ''              // Author name shown on cover
readonly totalPages: number      // Getter, count of slotted page elements
```

## Slots

- `(default)` — Page elements; each child becomes one page

## Events

- `page-turn` -> `{ page: number, direction: 'forward' | 'backward' }`
- `page-flip-start` -> `{ fromPage: number, toPage: number, direction: 'forward' | 'backward' }`
- `page-flip-end` -> `{ page: number, direction: 'forward' | 'backward' }`

## Methods

- `goToPage(page: number): void` — Navigate to specific page
- `nextPage(): void` — Advance by 1 page
- `prevPage(): void` — Go back by 1 page
- `firstPage(): void` — Jump to page 0
- `lastPage(): void` — Jump to last page

## CSS Custom Properties

```css
--page-bg            /* Page background color (default: #F5F5F5) */
--dark-text          /* Primary text color (default: #2A2935) */
--baseline           /* Base spacing unit (default: 12px) */
--book-title         /* Book title font family (default: 'Tulpen One', sans-serif) */
--title              /* Section title / body heading font (default: 'Cormorant Garamond', serif) */
--body               /* Body text font (default: 'Cormorant Garamond', serif) */
--base-size          /* Base font size, derived from baseline (default: calc(var(--baseline) * 1.2)) */
```

## CSS Parts

- `base` - Outer cover container
- `book` - Inner book element

## Keyboard

- ArrowRight/ArrowDown — Next page
- ArrowLeft/ArrowUp — Previous page
- Home — First page
- End — Last page

## Usage

```html
<snice-book title="My Book" author="Jane Doe" cover-image="/cover.jpg">
  <div>Page 1 content</div>
  <div>Page 2 content</div>
  <div>Page 3 content</div>
  <div>Page 4 content</div>
</snice-book>
```

```typescript
book.goToPage(2);
book.addEventListener('page-turn', e => console.log(e.detail.page));
```
