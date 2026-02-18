# snice-breadcrumbs & snice-crumb

Navigation breadcrumb trail.

## snice-breadcrumbs

```typescript
items: BreadcrumbItem[] = [];
separator: '/'|'>'|'»'|'•'|'|' = '/';
size: 'small'|'medium'|'large' = 'medium';
maxItems: number = 0;  // 0 = show all
```

**Methods:**
- `setItems(items)` - Update breadcrumb items

**BreadcrumbItem:**
```typescript
interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
  iconImage?: string;
  active?: boolean;
}
```

## Usage

```html
<!-- Basic -->
<snice-breadcrumbs></snice-breadcrumbs>

<script>
const breadcrumbs = document.querySelector('snice-breadcrumbs');
breadcrumbs.items = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Laptop', active: true }
];
</script>

<!-- Or use crumb elements -->
<snice-breadcrumbs>
  <snice-crumb href="/" label="Home"></snice-crumb>
  <snice-crumb href="/products" label="Products"></snice-crumb>
  <snice-crumb label="Laptop" active></snice-crumb>
</snice-breadcrumbs>

<!-- Custom separator -->
<snice-breadcrumbs separator=">"></snice-breadcrumbs>

<!-- With icons (supports: URL, image files, emoji, text) -->
<snice-breadcrumbs></snice-breadcrumbs>
<script>
breadcrumbs.items = [
  { label: 'Home', href: '/', icon: '🏠' },
  { label: 'Products', href: '/products', icon: '/icons/box.svg' },
  { label: 'Details', icon: 'info' } // Material Symbols ligature
];
</script>

<!-- Max items (collapse middle) -->
<snice-breadcrumbs max-items="3"></snice-breadcrumbs>
```

## Features

- Item array or crumb elements
- 5 separator options
- 3 sizes
- Max items with collapse
- Icons support (URL, image files, emoji, font ligatures)
- Active state
- Accessible: nav role, aria-label
