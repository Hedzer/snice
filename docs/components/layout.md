<!-- AI: For a low-token version of this doc, use docs/ai/components/layout.md instead -->

# Layout
`<snice-layout>`

Application layout with header navigation, main content area, and footer.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/layout/snice-layout';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-layout.min.js"></script>
```

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `update()` | `appContext: AppContext, placards: Placard[], currentRoute: string, routeParams: RouteParams` | Updates navigation from router state |

## Slots

| Name | Description |
|------|-------------|
| `brand` | Logo or brand content in the header |
| `page` | Main page content area |
| `footer` | Footer content |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer layout container |
| `header` | `<header>` | Header element with navigation |
| `brand` | `<div>` | Brand/logo area within header |
| `main` | `<main>` | Main content area |
| `footer` | `<footer>` | Footer element |

```css
snice-layout::part(header) {
  background: #1a1a2e;
  color: white;
}

snice-layout::part(footer) {
  border-top: 1px solid #e2e2e2;
  padding: 1rem;
}
```

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

### Basic Layout

Use slots to fill the brand, page, and footer areas.

```html
<snice-layout>
  <div slot="brand">
    <h1>Dashboard</h1>
  </div>
  <div slot="page">
    <h2>Welcome</h2>
    <p>Main content goes here.</p>
  </div>
  <div slot="footer">
    <p>&copy; 2025 Acme Corp</p>
  </div>
</snice-layout>
```

### With Router Integration

Use the `update()` method to sync navigation with the router.

```html
<snice-layout id="app-layout">
  <img slot="brand" src="/logo.svg" alt="Logo" />
  <div slot="page" id="page-content"></div>
</snice-layout>
```

```javascript
const layout = document.querySelector('#app-layout');
layout.update(appContext, placards, currentRoute, routeParams);
```
