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
--book-bg           /* Page background */
--book-text          /* Text color */
--book-text-secondary /* Secondary text */
--book-border        /* Border color */
--book-primary       /* Primary accent */
--book-shadow        /* Book shadow */
--book-page-bg       /* Individual page background */
--book-page-line     /* Ruled line color */
--book-spine-bg      /* Spine color */
--book-cover-bg      /* Cover background */
--book-flip-duration /* Flip animation duration, default 0.6s */
```

## CSS Parts

- `spine` — The book spine element
- `pages` — The pages container
- `nav` — Navigation controls bar

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

```js
const book = document.querySelector('snice-book');
book.goToPage(2);
book.addEventListener('page-turn', e => console.log(e.detail.page));
```
