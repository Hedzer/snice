# Breadcrumbs Components

The breadcrumbs components provide navigation trail indicators showing the user's current location within a hierarchy. Supports icons, custom separators, collapsing for long trails, and multiple sizes.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Components](#components)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Examples](#examples)

## Basic Usage

```html
<!-- Using items array -->
<snice-breadcrumbs id="breadcrumbs"></snice-breadcrumbs>

<script type="module">
  const breadcrumbs = document.getElementById('breadcrumbs');
  breadcrumbs.items = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Laptops', active: true }
  ];
</script>

<!-- Or using crumb elements -->
<snice-breadcrumbs>
  <snice-crumb href="/" label="Home"></snice-crumb>
  <snice-crumb href="/products" label="Products"></snice-crumb>
  <snice-crumb label="Laptops" active></snice-crumb>
</snice-breadcrumbs>
```

```typescript
import 'snice/components/breadcrumbs/snice-breadcrumbs';
import 'snice/components/breadcrumbs/snice-crumb';
```

## Components

### `<snice-breadcrumbs>`
Container for breadcrumb navigation trail.

### `<snice-crumb>`
Individual breadcrumb item.

## Properties

### Breadcrumbs Container

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | `BreadcrumbItem[]` | `[]` | Array of breadcrumb items |
| `separator` | `'/' \| '>' \| '»' \| '•' \| '\|'` | `'/'` | Separator between items |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Breadcrumb size |
| `maxItems` | `number` | `0` | Max items to show (0 = show all) |

### BreadcrumbItem Interface

```typescript
interface BreadcrumbItem {
  label: string;        // Display text
  href?: string;        // Link URL (optional)
  icon?: string;        // Icon text/emoji
  iconImage?: string;   // Icon image URL
  active?: boolean;     // Current/active state
}
```

### Crumb Element

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Display text |
| `href` | `string` | `''` | Link URL |
| `icon` | `string` | `''` | Icon text/emoji |
| `iconImage` | `string` | `''` | Icon image URL |
| `active` | `boolean` | `false` | Current/active state |

## Methods

#### `setItems(items: BreadcrumbItem[]): void`
Programmatically set breadcrumb items.

```typescript
breadcrumbs.setItems([
  { label: 'Home', href: '/' },
  { label: 'Docs', href: '/docs' },
  { label: 'Components', active: true }
]);
```

## Events

#### `breadcrumb-click`
Fired when a breadcrumb link is clicked.

**Event Detail:**
```typescript
{
  item: BreadcrumbItem;
  index: number;
  href: string;
  label: string;
}
```

**Usage:**
```typescript
breadcrumbs.addEventListener('breadcrumb-click', (e) => {
  console.log('Clicked:', e.detail.label);
  console.log('Index:', e.detail.index);
});
```

## Examples

### Basic Breadcrumbs

```html
<snice-breadcrumbs id="basic"></snice-breadcrumbs>

<script type="module">
  const breadcrumbs = document.getElementById('basic');
  breadcrumbs.items = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Electronics', href: '/products/electronics' },
    { label: 'Laptops', active: true }
  ];
</script>
```

### Using Crumb Elements

```html
<snice-breadcrumbs>
  <snice-crumb href="/" label="Home"></snice-crumb>
  <snice-crumb href="/docs" label="Documentation"></snice-crumb>
  <snice-crumb href="/docs/components" label="Components"></snice-crumb>
  <snice-crumb label="Breadcrumbs" active></snice-crumb>
</snice-breadcrumbs>
```

### Custom Separators

```html
<!-- Slash separator (default) -->
<snice-breadcrumbs separator="/"></snice-breadcrumbs>

<!-- Greater than -->
<snice-breadcrumbs separator=">"></snice-breadcrumbs>

<!-- Double angle -->
<snice-breadcrumbs separator="»"></snice-breadcrumbs>

<!-- Bullet -->
<snice-breadcrumbs separator="•"></snice-breadcrumbs>

<!-- Pipe -->
<snice-breadcrumbs separator="|"></snice-breadcrumbs>

<script type="module">
  const items = [
    { label: 'Home', href: '/' },
    { label: 'Settings', href: '/settings' },
    { label: 'Profile', active: true }
  ];

  document.querySelectorAll('snice-breadcrumbs').forEach(bc => {
    bc.items = items;
  });
</script>
```

### Different Sizes

```html
<snice-breadcrumbs size="small" id="small-bc"></snice-breadcrumbs>
<snice-breadcrumbs size="medium" id="medium-bc"></snice-breadcrumbs>
<snice-breadcrumbs size="large" id="large-bc"></snice-breadcrumbs>

<script type="module">
  const items = [
    { label: 'Home', href: '/' },
    { label: 'Catalog', href: '/catalog' },
    { label: 'Products', active: true }
  ];

  document.querySelectorAll('[id$="-bc"]').forEach(bc => {
    bc.items = items;
  });
</script>
```

### With Icons

```html
<snice-breadcrumbs id="icon-breadcrumbs"></snice-breadcrumbs>

<script type="module">
  const breadcrumbs = document.getElementById('icon-breadcrumbs');
  breadcrumbs.items = [
    { label: 'Home', href: '/', icon: '🏠' },
    { label: 'Settings', href: '/settings', icon: '⚙️' },
    { label: 'Profile', icon: '👤', active: true }
  ];
</script>
```

### With Icon Images

```html
<snice-breadcrumbs id="image-breadcrumbs"></snice-breadcrumbs>

<script type="module">
  const breadcrumbs = document.getElementById('image-breadcrumbs');
  breadcrumbs.items = [
    { label: 'Home', href: '/', iconImage: '/icons/home.svg' },
    { label: 'Dashboard', href: '/dashboard', iconImage: '/icons/dashboard.svg' },
    { label: 'Analytics', iconImage: '/icons/analytics.svg', active: true }
  ];
</script>
```

### Collapsed Breadcrumbs

```html
<!-- Show first and last 2 items, collapse middle -->
<snice-breadcrumbs max-items="3" id="collapsed"></snice-breadcrumbs>

<script type="module">
  const breadcrumbs = document.getElementById('collapsed');
  breadcrumbs.items = [
    { label: 'Home', href: '/' },
    { label: 'Level 1', href: '/level1' },
    { label: 'Level 2', href: '/level2' },
    { label: 'Level 3', href: '/level3' },
    { label: 'Level 4', href: '/level4' },
    { label: 'Current Page', active: true }
  ];
</script>
```

### Dynamic Breadcrumbs

```html
<snice-breadcrumbs id="dynamic"></snice-breadcrumbs>

<script type="module">
  import type { SniceBreadcrumbsElement } from 'snice/components/breadcrumbs/snice-breadcrumbs.types';

  const breadcrumbs = document.getElementById('dynamic') as SniceBreadcrumbsElement;

  // Simulate navigation
  function updateBreadcrumbs(path) {
    const segments = path.split('/').filter(Boolean);
    const items = [{ label: 'Home', href: '/' }];

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += '/' + segment;
      items.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        href: index < segments.length - 1 ? currentPath : undefined,
        active: index === segments.length - 1
      });
    });

    breadcrumbs.setItems(items);
  }

  // Update based on current path
  updateBreadcrumbs(window.location.pathname);

  // Listen for navigation
  breadcrumbs.addEventListener('breadcrumb-click', (e) => {
    if (e.detail.href) {
      console.log('Navigate to:', e.detail.href);
      // Update breadcrumbs based on new location
      updateBreadcrumbs(e.detail.href);
    }
  });
</script>
```

### E-commerce Breadcrumbs

```html
<snice-breadcrumbs id="ecommerce" separator=">"></snice-breadcrumbs>

<script type="module">
  const breadcrumbs = document.getElementById('ecommerce');
  breadcrumbs.items = [
    { label: 'Home', href: '/', icon: '🏠' },
    { label: 'Electronics', href: '/category/electronics', icon: '⚡' },
    { label: 'Computers', href: '/category/electronics/computers', icon: '💻' },
    { label: 'Laptops', href: '/category/electronics/computers/laptops', icon: '📱' },
    { label: 'MacBook Pro 16"', active: true }
  ];
</script>
```

### Documentation Breadcrumbs

```html
<snice-breadcrumbs id="docs" separator="•"></snice-breadcrumbs>

<script type="module">
  const breadcrumbs = document.getElementById('docs');
  breadcrumbs.items = [
    { label: 'Docs', href: '/docs' },
    { label: 'API Reference', href: '/docs/api' },
    { label: 'Components', href: '/docs/api/components' },
    { label: 'Breadcrumbs', active: true }
  ];
</script>
```

### File System Navigation

```html
<snice-breadcrumbs id="filesystem" separator="/"></snice-breadcrumbs>

<script type="module">
  const breadcrumbs = document.getElementById('filesystem');

  function navigateToFolder(path) {
    const folders = path.split('/').filter(Boolean);
    const items = [{ label: 'Root', href: '/' }];

    let currentPath = '';
    folders.forEach((folder, index) => {
      currentPath += '/' + folder;
      items.push({
        label: folder,
        href: index < folders.length - 1 ? currentPath : undefined,
        active: index === folders.length - 1
      });
    });

    breadcrumbs.setItems(items);
  }

  // Show current folder structure
  navigateToFolder('/Users/John/Documents/Projects/MyApp');

  breadcrumbs.addEventListener('breadcrumb-click', (e) => {
    if (e.detail.href) {
      navigateToFolder(e.detail.href);
    }
  });
</script>
```

### Multi-level Navigation

```html
<snice-breadcrumbs id="multilevel" max-items="4"></snice-breadcrumbs>

<script type="module">
  const breadcrumbs = document.getElementById('multilevel');

  const navigation = {
    '/': { label: 'Home' },
    '/products': { label: 'Products' },
    '/products/electronics': { label: 'Electronics' },
    '/products/electronics/computers': { label: 'Computers' },
    '/products/electronics/computers/laptops': { label: 'Laptops' },
    '/products/electronics/computers/laptops/gaming': { label: 'Gaming Laptops' }
  };

  function buildBreadcrumbs(currentPath) {
    const pathSegments = currentPath.split('/').filter(Boolean);
    const items = [{ label: 'Home', href: '/' }];

    let path = '';
    pathSegments.forEach((segment, index) => {
      path += '/' + segment;
      const navItem = navigation[path];

      if (navItem) {
        items.push({
          label: navItem.label,
          href: index < pathSegments.length - 1 ? path : undefined,
          active: index === pathSegments.length - 1
        });
      }
    });

    breadcrumbs.setItems(items);
  }

  buildBreadcrumbs('/products/electronics/computers/laptops/gaming');
</script>
```

### Breadcrumbs with Event Handling

```html
<snice-breadcrumbs id="event-breadcrumbs"></snice-breadcrumbs>

<div id="event-log" style="margin-top: 1rem; padding: 1rem; background: #f3f4f6; border-radius: 0.375rem;">
  <strong>Events:</strong>
  <div id="events"></div>
</div>

<script type="module">
  const breadcrumbs = document.getElementById('event-breadcrumbs');
  const eventsContainer = document.getElementById('events');

  breadcrumbs.items = [
    { label: 'Home', href: '/' },
    { label: 'Level 1', href: '/level1' },
    { label: 'Level 2', href: '/level2' },
    { label: 'Current', active: true }
  ];

  breadcrumbs.addEventListener('breadcrumb-click', (e) => {
    const event = document.createElement('div');
    event.style.padding = '0.5rem 0';
    event.textContent = `Clicked: ${e.detail.label} (index: ${e.detail.index})`;
    eventsContainer.prepend(event);

    // Prevent default navigation if needed
    // e.preventDefault();
  });
</script>
```

### Responsive Breadcrumbs

```html
<style>
  @media (max-width: 640px) {
    snice-breadcrumbs {
      font-size: 0.875rem;
    }
  }
</style>

<snice-breadcrumbs id="responsive" max-items="3"></snice-breadcrumbs>

<script type="module">
  const breadcrumbs = document.getElementById('responsive');

  // Adjust max items based on screen size
  function updateMaxItems() {
    if (window.innerWidth < 640) {
      breadcrumbs.maxItems = 2;
    } else if (window.innerWidth < 1024) {
      breadcrumbs.maxItems = 3;
    } else {
      breadcrumbs.maxItems = 0; // Show all
    }
  }

  breadcrumbs.items = [
    { label: 'Home', href: '/' },
    { label: 'Category', href: '/category' },
    { label: 'Subcategory', href: '/category/sub' },
    { label: 'Product Type', href: '/category/sub/type' },
    { label: 'Product', active: true }
  ];

  updateMaxItems();
  window.addEventListener('resize', updateMaxItems);
</script>
```

### Breadcrumbs with Custom Styling

```html
<style>
  #styled-breadcrumbs::part(breadcrumb-link) {
    color: #3b82f6;
    font-weight: 500;
  }

  #styled-breadcrumbs::part(breadcrumb-link):hover {
    color: #2563eb;
    text-decoration: underline;
  }

  #styled-breadcrumbs::part(breadcrumb-separator) {
    color: #9ca3af;
    margin: 0 0.75rem;
  }
</style>

<snice-breadcrumbs id="styled-breadcrumbs"></snice-breadcrumbs>

<script type="module">
  const breadcrumbs = document.getElementById('styled-breadcrumbs');
  breadcrumbs.items = [
    { label: 'Home', href: '/' },
    { label: 'Styled', href: '/styled' },
    { label: 'Breadcrumbs', active: true }
  ];
</script>
```

## Accessibility

- **Semantic HTML**: Uses `<nav>` with `aria-label="Breadcrumb"`
- **Current page**: Last item has `aria-current="page"`
- **Keyboard support**: All links are keyboard accessible
- **Screen reader friendly**: Proper navigation landmark and structure

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support

## Best Practices

1. **Show hierarchy**: Use breadcrumbs for multi-level navigation
2. **Keep labels concise**: Short, clear segment names work best
3. **Use appropriate separators**: Choose separators that match your design
4. **Collapse long trails**: Use `maxItems` for deep hierarchies
5. **Make links clickable**: All non-active items should be navigable
6. **Place consistently**: Usually at the top of the page content
7. **Don't duplicate navigation**: Breadcrumbs complement, not replace, main nav
8. **Test on mobile**: Consider responsive behavior for small screens
9. **Handle dynamic updates**: Update breadcrumbs when navigation changes
10. **Provide context**: Breadcrumbs should reflect actual page hierarchy

## Common Patterns

### Basic Navigation
```html
<snice-breadcrumbs items='[
  {"label": "Home", "href": "/"},
  {"label": "Products", "href": "/products"},
  {"label": "Item", "active": true}
]'></snice-breadcrumbs>
```

### E-commerce Category
```html
<snice-breadcrumbs separator=">"></snice-breadcrumbs>
```

### Documentation
```html
<snice-breadcrumbs separator="•"></snice-breadcrumbs>
```

### File System
```html
<snice-breadcrumbs separator="/"></snice-breadcrumbs>
```

## When to Use

✅ **Use breadcrumbs when:**
- Pages are organized in a clear hierarchy (2+ levels deep)
- Users might need to navigate back up the hierarchy
- The site has many categories or sections
- Users arrive from search and need context

❌ **Avoid breadcrumbs when:**
- Site has a flat structure (1-2 levels)
- Navigation is linear (wizards, onboarding)
- The hierarchy isn't clear or consistent
- Mobile-only experience with limited space
