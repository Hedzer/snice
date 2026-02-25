[//]: # (AI: For a low-token version of this doc, use docs/ai/components/book.md instead)

# Book Component

The book component displays content as a page-flipping book with realistic 3D page-turn animations. It supports spread (two-page) and single-page modes, a customizable cover page, keyboard and touch navigation, and programmatic page control.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Slots](#slots)
- [Methods](#methods)
- [Events](#events)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Examples](#examples)
- [Accessibility](#accessibility)

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

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `currentPage` (attr: `current-page`) | `number` | `0` | Current page number (0-indexed) |
| `coverImage` (attr: `cover-image`) | `string` | `''` | URL for the cover page image |
| `title` | `string` | `''` | Book title displayed on the cover |
| `author` | `string` | `''` | Author name displayed on the cover |
| `totalPages` | `number` | _(read-only)_ | Total number of pages (count of slotted child elements) |

## Slots

| Name | Description |
|------|-------------|
| (default) | Page elements. Each child element becomes one page in the book. |

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

## CSS Custom Properties

| Property | Description |
|----------|-------------|
| `--book-bg` | Page background color |
| `--book-text` | Primary text color |
| `--book-text-secondary` | Secondary text color |
| `--book-border` | Border color |
| `--book-primary` | Primary accent color |
| `--book-shadow` | Book shadow |
| `--book-page-bg` | Individual page background |
| `--book-page-line` | Ruled line color on pages |
| `--book-spine-bg` | Spine color |
| `--book-cover-bg` | Cover background color |
| `--book-flip-duration` | Flip animation duration (default: `0.6s`) |

## CSS Parts

| Part | Description |
|------|-------------|
| `spine` | The book spine element |
| `pages` | The pages container |
| `nav` | The navigation controls bar |

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

### Single Page Mode

Use `mode="single"` for narrow viewports or when you want one page visible at a time.

```html
<snice-book mode="single" title="User Guide">
  <div>Welcome to the application...</div>
  <div>Getting started with your first project...</div>
  <div>Advanced features and configuration...</div>
</snice-book>
```

### Spread Mode (Two-Page View)

The default `mode="spread"` displays two pages side by side like an open book.

```html
<snice-book mode="spread" title="Photo Album" author="Jane Doe">
  <div><img src="/photos/1.jpg" alt="Vacation day 1"></div>
  <div><img src="/photos/2.jpg" alt="Vacation day 2"></div>
  <div><img src="/photos/3.jpg" alt="Vacation day 3"></div>
  <div><img src="/photos/4.jpg" alt="Vacation day 4"></div>
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
<snice-book title="Product Catalog" mode="spread">
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
