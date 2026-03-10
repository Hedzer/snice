<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/book.md -->

# Book Component
`<snice-book>`

The book component displays content as a page-flipping book with realistic 3D page-turn animations. It supports a customizable cover page, keyboard navigation, and programmatic page control.

## Table of Contents
- [Components](#components)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Components

### `<snice-book>`
Main book container with page-flip animation.

### `<snice-book-page>`
Individual page element. Each child becomes one page in the book. Supports `front` and `back` named slots for double-sided pages.

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `currentPage` (attr: `current-page`) | `number` | `0` | Current page number (0 = cover closed) |
| `coverImage` (attr: `cover-image`) | `string` | `''` | URL for the cover page image |
| `title` | `string` | `''` | Book title displayed on the cover |
| `author` | `string` | `''` | Author name displayed on the cover |
| `totalPages` | `number` | _(read-only)_ | Total number of pages (count of slotted `<snice-book-page>` elements) |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `goToPage()` | `page: number` | Navigate to a specific page |
| `nextPage()` | -- | Advance forward by 1 page |
| `prevPage()` | -- | Go back by 1 page |
| `firstPage()` | -- | Jump to the first page (page 0) |
| `lastPage()` | -- | Jump to the last page |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `page-turn` | `{ page: number, direction: 'forward' \| 'backward' }` | Fired when a page turn completes |
| `page-flip-start` | `{ fromPage: number, toPage: number, direction: 'forward' \| 'backward' }` | Fired when a page flip animation starts |
| `page-flip-end` | `{ page: number, direction: 'forward' \| 'backward' }` | Fired when a page flip animation finishes |

## Slots

| Name | Description |
|------|-------------|
| (default) | `<snice-book-page>` elements. Each child element becomes one page in the book. |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--page-bg` | Page background color | `#F5F5F5` |
| `--dark-text` | Primary text color | `#2A2935` |
| `--baseline` | Base spacing unit | `12px` |
| `--book-title` | Book title font family | `'Tulpen One', sans-serif` |
| `--title` | Section title / body heading font | `'Cormorant Garamond', serif` |
| `--body` | Body text font | `'Cormorant Garamond', serif` |
| `--base-size` | Base font size, derived from baseline | `calc(var(--baseline) * 1.2)` |

## CSS Parts

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The outer cover container |
| `book` | `<div>` | The inner book element |

```css
snice-book::part(base) {
  border-radius: 8px;
  overflow: hidden;
}

snice-book::part(book) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

## Basic Usage

```typescript
import 'snice/components/book/snice-book';
```

```html
<snice-book>
  <snice-book-page>
    <div>Page 1 content</div>
  </snice-book-page>
  <snice-book-page>
    <div>Page 2 content</div>
  </snice-book-page>
  <snice-book-page>
    <div>Page 3 content</div>
  </snice-book-page>
</snice-book>
```

## Examples

### Basic Book with Cover

Use the `title`, `author`, and `cover-image` attributes to create a book with a styled cover page.

```html
<snice-book title="The Great Gatsby" author="F. Scott Fitzgerald" cover-image="/covers/gatsby.jpg">
  <snice-book-page>
    <div>In my younger and more vulnerable years...</div>
  </snice-book-page>
  <snice-book-page>
    <div>Chapter 2 content here...</div>
  </snice-book-page>
</snice-book>
```

### Programmatic Navigation

Use methods to control the book from JavaScript.

```html
<snice-book id="tutorial-book" title="Tutorial">
  <snice-book-page><div>Step 1: Install</div></snice-book-page>
  <snice-book-page><div>Step 2: Import</div></snice-book-page>
  <snice-book-page><div>Step 3: Use</div></snice-book-page>
</snice-book>

<button onclick="document.getElementById('tutorial-book').prevPage()">Previous</button>
<button onclick="document.getElementById('tutorial-book').nextPage()">Next</button>
```

```typescript
const book = document.getElementById('tutorial-book');
book.addEventListener('page-turn', (e) => {
  console.log(`Turned to page ${e.detail.page} (${e.detail.direction})`);
});
```

### Rich HTML Content Pages

Each page can contain arbitrary HTML including text, images, and interactive elements.

```html
<snice-book title="Product Catalog">
  <snice-book-page>
    <div style="padding: 2rem;">
      <h2>Introduction</h2>
      <p>Browse our latest collection.</p>
    </div>
  </snice-book-page>
  <snice-book-page>
    <div style="padding: 2rem;">
      <h3>Widget Pro</h3>
      <img src="/products/widget-pro.jpg" alt="Widget Pro" style="width: 100%;">
      <p>Starting at $29.99.</p>
    </div>
  </snice-book-page>
</snice-book>
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Arrow Right | Next page |
| Arrow Left | Previous page |

The book must be focused (it sets `tabindex="0"` on ready).

## Accessibility

- **Keyboard support**: Arrow keys for page navigation when focused
- **Focus management**: The book is focusable and responds to keyboard input
- **Screen readers**: Page turn events provide feedback on current position
