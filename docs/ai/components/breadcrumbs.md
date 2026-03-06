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

**Events:**
- `breadcrumb-click` - {item, index, href, label}

**BreadcrumbItem:**
```typescript
interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
  iconImage?: string;
  active?: boolean;
  iconNode?: Element;  // For slotted icons via snice-crumb
}
```

## snice-crumb Slots

- `icon` - Custom icon element (child of snice-crumb with `slot="icon"` attribute)

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

<!-- With icons (supports: URL, image files, emoji) -->
<snice-breadcrumbs></snice-breadcrumbs>
<script>
breadcrumbs.items = [
  { label: 'Home', href: '/', icon: '🏠' },
  { label: 'Products', href: '/products', icon: '/icons/box.svg' },
  { label: 'Details', icon: 'ℹ️' }
  // ⚠️ icon: 'info' renders as PLAIN TEXT. Use emoji or URL, or snice-crumb with icon slot.
];
</script>

<!-- Max items (collapse middle) -->
<snice-breadcrumbs max-items="3"></snice-breadcrumbs>

<!-- Icon slots via snice-crumb (for external CSS icon fonts) -->
<snice-breadcrumbs>
  <snice-crumb href="/" label="Home">
    <span slot="icon" class="material-symbols-outlined">home</span>
  </snice-crumb>
  <snice-crumb href="/products" label="Products">
    <span slot="icon" class="material-symbols-outlined">inventory_2</span>
  </snice-crumb>
  <snice-crumb label="Details" active></snice-crumb>
</snice-breadcrumbs>
```

**CSS Parts:**
- `base` - The `<nav>` container
- `list` - The `<ol>` breadcrumb list
- `link` - Individual breadcrumb `<a>` links
- `separator` - Separator characters between items
- `ellipsis` - Collapse ellipsis button

## Features

- Item array or crumb elements
- 5 separator options
- 3 sizes
- Max items with collapse
- Icons support (URL, image files, emoji). Use snice-crumb slot for icon fonts.
- Active state
- Accessible: nav role, aria-label
