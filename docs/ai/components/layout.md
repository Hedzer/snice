# snice-layout

Application layout with header navigation, main content area, and footer.

## Methods

- `update(appContext, placards, currentRoute, routeParams)` - Update layout navigation from router state

## Slots

- `brand` - Logo/brand in header
- `page` - Main page content
- `footer` - Footer content

## CSS Parts

- `base` - Outer layout container div
- `header` - Header element with navigation
- `brand` - Brand/logo area within header
- `main` - Main content area
- `footer` - Footer element

## Basic Usage

```typescript
import 'snice/components/layout/snice-layout';
```

```html
<snice-layout>
  <div slot="brand"><h1>My App</h1></div>
  <div slot="page">Page content</div>
  <div slot="footer"><p>&copy; 2025 My Company</p></div>
</snice-layout>
```

## Examples

```html
<!-- Router integration -->
<snice-layout id="app-layout">
  <img slot="brand" src="/logo.svg" alt="Logo" />
  <div slot="page"></div>
</snice-layout>
```

```typescript
layout.update(appContext, placards, currentRoute, routeParams);
```
