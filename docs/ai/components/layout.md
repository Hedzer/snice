# snice-layout

Application layout with header navigation, main content area, and footer.

## Slots

- `brand` - Logo/brand in header
- `page` - Main page content
- `footer` - Footer content

## Methods

- `update(appContext, placards, currentRoute, routeParams)` - Update layout navigation from router state

## Usage

```html
<snice-layout>
  <div slot="brand">
    <h1>My App</h1>
  </div>
  <div slot="page">
    <!-- Page content -->
  </div>
  <div slot="footer">
    <p>&copy; 2025 My Company</p>
  </div>
</snice-layout>
```

**CSS Parts:**
- `base` - Outer layout container div
- `header` - Header element with navigation
- `brand` - Brand/logo area within header
- `main` - Main content area
- `footer` - Footer element

## Features

- Grid layout: header, main, footer
- Integrated `snice-nav` in header
- Router integration via `update()` method
- Slotted brand, page, and footer areas
