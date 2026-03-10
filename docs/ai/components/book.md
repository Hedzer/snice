# snice-book

Page-flipping book component with cover page, keyboard navigation, and animated page turns.

## Components

- `<snice-book>` - Main book container
- `<snice-book-page>` - Individual page element

## Properties

```ts
currentPage: number = 0          // attr: current-page
coverImage: string = ''          // attr: cover-image -- URL for cover page image
title: string = ''               // Book title shown on cover
author: string = ''              // Author name shown on cover
readonly totalPages: number      // Getter, count of slotted page elements
```

## Methods

- `goToPage(page: number): void` -- Navigate to specific page
- `nextPage(): void` -- Advance by 1 page
- `prevPage(): void` -- Go back by 1 page
- `firstPage(): void` -- Jump to page 0
- `lastPage(): void` -- Jump to last page

## Events

- `page-turn` -> `{ page: number, direction: 'forward' | 'backward' }`
- `page-flip-start` -> `{ fromPage: number, toPage: number, direction: 'forward' | 'backward' }`
- `page-flip-end` -> `{ page: number, direction: 'forward' | 'backward' }`

## Slots

- `(default)` -- `<snice-book-page>` elements; each child becomes one page

## CSS Custom Properties

```css
--page-bg            /* Page background color (default: #F5F5F5) */
--dark-text          /* Primary text color (default: #2A2935) */
--baseline           /* Base spacing unit (default: 12px) */
--book-title         /* Book title font family */
--title              /* Section title / body heading font */
--body               /* Body text font */
--base-size          /* Base font size, derived from baseline */
```

## CSS Parts

- `base` - Outer cover container
- `book` - Inner book element

## Keyboard Navigation

- ArrowRight -- Next page
- ArrowLeft -- Previous page

## Basic Usage

```html
<snice-book title="My Book" author="Jane Doe" cover-image="/cover.jpg">
  <snice-book-page><div>Page 1 content</div></snice-book-page>
  <snice-book-page><div>Page 2 content</div></snice-book-page>
  <snice-book-page><div>Page 3 content</div></snice-book-page>
</snice-book>
```

```typescript
book.goToPage(2);
book.addEventListener('page-turn', e => console.log(e.detail.page));
```
