<!-- AI: For a low-token version of this doc, use docs/ai/components/book.md instead -->

# Book Component

The book component displays content as a page-flipping book with realistic 3D page-turn animations. It supports a customizable cover page, keyboard and touch navigation, and programmatic page control.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `currentPage` (attr: `current-page`) | `number` | `0` | Current page number (0-indexed) |
| `coverImage` (attr: `cover-image`) | `string` | `''` | URL for the cover page image |
| `title` | `string` | `''` | Book title displayed on the cover |
| `author` | `string` | `''` | Author name displayed on the cover |
| `totalPages` | `number` | _(read-only)_ | Total number of pages (count of slotted child elements) |

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
| (default) | Page elements. Each child element becomes one page in the book. |

## CSS Custom Properties

| Property | Description |
|----------|-------------|
| `--page-bg` | Page background color (default: `#F5F5F5`) |
| `--dark-text` | Primary text color (default: `#2A2935`) |
| `--baseline` | Base spacing unit (default: `12px`) |
| `--book-title` | Book title font family (default: `'Tulpen One', sans-serif`) |
| `--title` | Section title / body heading font (default: `'Cormorant Garamond', serif`) |
| `--body` | Body text font (default: `'Cormorant Garamond', serif`) |
| `--base-size` | Base font size, derived from baseline (default: `calc(var(--baseline) * 1.2)`) |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

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

```html
<snice-book>
  <div>Page 1 content</div>
  <div>Page 2 content</div>
  <div>Page 3 content</div>
</snice-book>
```

```typescript
import 'snice/components/book/snice-book';
```

## Examples

### Basic Book with Cover

Use the `title`, `author`, and `cover-image` attributes to create a book with a styled cover page.

```html
<snice-book title="The Great Gatsby" author="F. Scott Fitzgerald" cover-image="/covers/gatsby.jpg">
  <div>In my younger and more vulnerable years my father gave me some advice...</div>
  <div>Chapter 2 content here...</div>
  <div>Chapter 3 content here...</div>
  <div>Chapter 4 content here...</div>
</snice-book>
```

### Programmatic Navigation

Use methods to control the book from JavaScript.

```html
<snice-book id="tutorial-book" title="Tutorial">
  <div>Step 1: Install the package</div>
  <div>Step 2: Import the component</div>
  <div>Step 3: Add it to your HTML</div>
  <div>Step 4: Customize with properties</div>
</snice-book>

<button onclick="document.getElementById('tutorial-book').prevPage()">Previous</button>
<button onclick="document.getElementById('tutorial-book').nextPage()">Next</button>

<script type="module">
  import 'snice/components/book/snice-book';

  const book = document.getElementById('tutorial-book');
  book.addEventListener('page-turn', (e) => {
    console.log(`Turned to page ${e.detail.page} (${e.detail.direction})`);
  });
</script>
```

### Rich HTML Content Pages

Each page can contain arbitrary HTML including text, images, and interactive elements.

```html
<snice-book title="Product Catalog">
  <div style="padding: 2rem;">
    <h2>Introduction</h2>
    <p>Browse our latest collection of premium products.</p>
  </div>
  <div style="padding: 2rem;">
    <h3>Widget Pro</h3>
    <img src="/products/widget-pro.jpg" alt="Widget Pro" style="width: 100%;">
    <p>Our most popular product. Starting at $29.99.</p>
  </div>
  <div style="padding: 2rem;">
    <h3>Gadget X</h3>
    <img src="/products/gadget-x.jpg" alt="Gadget X" style="width: 100%;">
    <p>Next-generation performance. Starting at $49.99.</p>
  </div>
</snice-book>
```

## Accessibility

- **Keyboard support**: Arrow Right/Down to go to the next page, Arrow Left/Up for the previous page, Home for the first page, End for the last page
- **Focus management**: The book is focusable and responds to keyboard input when focused
- **Screen readers**: Page turn events and navigation controls provide feedback on the current position
- **Touch support**: Swipe gestures on touch devices for natural page turning
