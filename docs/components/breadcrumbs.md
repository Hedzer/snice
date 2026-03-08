<!-- AI: For a low-token version of this doc, use docs/ai/components/breadcrumbs.md instead -->

# Breadcrumbs Components

The breadcrumbs components provide navigation trail indicators showing the user's current location within a hierarchy. Supports icons, custom separators, collapsing for long trails, and multiple sizes.

## Table of Contents
- [Components](#components)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [CSS Custom Properties](#css-custom-properties)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)
- [Browser Support](#browser-support)
- [Common Patterns](#common-patterns)
- [When to Use](#when-to-use)

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
  icon?: string;        // Icon (URL, image file, emoji). Use slot for icon fonts.
  iconImage?: string;   // Icon image URL (deprecated, use icon)
  active?: boolean;     // Current/active state
}
```

### Crumb Element

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Display text |
| `href` | `string` | `''` | Link URL |
| `icon` | `string` | `''` | Icon (URL, image file, emoji). Use slot for icon fonts. |
| `iconImage` | `string` | `''` | Icon image URL (deprecated, use `icon` with URL) |
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

## Slots

### Crumb Element Slots

| Slot Name | Description |
|-----------|-------------|
| `icon` | Custom icon element inside `<snice-crumb>`. Takes precedence over `icon` and `iconImage` properties. |

### Icon Slot Usage

Use the `icon` slot within `<snice-crumb>` for external CSS-based icon fonts:

```html
<snice-breadcrumbs>
  <snice-crumb href="/" label="Home">
    <span slot="icon" class="material-symbols-outlined">home</span>
  </snice-crumb>
  <snice-crumb href="/products" label="Products">
    <span slot="icon" class="material-symbols-outlined">inventory_2</span>
  </snice-crumb>
  <snice-crumb label="Details" active></snice-crumb>
</snice-breadcrumbs>

<!-- With Font Awesome -->
<snice-breadcrumbs>
  <snice-crumb href="/" label="Dashboard">
    <i slot="icon" class="fa-solid fa-gauge"></i>
  </snice-crumb>
  <snice-crumb href="/settings" label="Settings">
    <i slot="icon" class="fa-solid fa-gear"></i>
  </snice-crumb>
  <snice-crumb label="Profile" active></snice-crumb>
</snice-breadcrumbs>
```

> **Note**: Icon slots only work when using `<snice-crumb>` elements, not when using the `items` array property. For icons with the `items` array, use the `icon` property.

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<nav>` | The navigation container |
| `list` | `<ol>` | The breadcrumb ordered list |
| `link` | `<a>` | Individual breadcrumb links |
| `separator` | `<span>` | Separator characters between items |
| `ellipsis` | `<button>` | Collapse ellipsis button |

```css
snice-breadcrumbs::part(link) {
  color: #3b82f6;
  font-weight: 500;
}

snice-breadcrumbs::part(separator) {
  color: #9ca3af;
  margin: 0 0.75rem;
}

snice-breadcrumbs::part(ellipsis) {
  background: transparent;
}
```

## Basic Usage

```html
<!-- Using items array -->
<snice-breadcrumbs></snice-breadcrumbs>
```

```typescript
breadcrumbs.items = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Laptops', active: true }
];
```

```html
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

## Examples

### Basic Breadcrumbs

```html
<snice-breadcrumbs></snice-breadcrumbs>
```

```typescript
breadcrumbs.items = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Electronics', href: '/products/electronics' },
  { label: 'Laptops', active: true }
];
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

```

```typescript
const items = [
  { label: 'Home', href: '/' },
  { label: 'Settings', href: '/settings' },
  { label: 'Profile', active: true }
];

// Apply to all breadcrumbs above
breadcrumbs.forEach(bc => {
  bc.items = items;
});
```

### Different Sizes

```html
<snice-breadcrumbs size="small"></snice-breadcrumbs>
<snice-breadcrumbs size="medium"></snice-breadcrumbs>
<snice-breadcrumbs size="large"></snice-breadcrumbs>
```

```typescript
const items = [
  { label: 'Home', href: '/' },
  { label: 'Catalog', href: '/catalog' },
  { label: 'Products', active: true }
];

// Apply to each breadcrumbs element above
breadcrumbs.items = items;
```

### With Icons

```html
<snice-breadcrumbs></snice-breadcrumbs>
```

```typescript
breadcrumbs.items = [
  { label: 'Home', href: '/', icon: '🏠' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
  { label: 'Profile', icon: '👤', active: true }
];
```

### With Icon Images

```html
<snice-breadcrumbs></snice-breadcrumbs>
```

```typescript
breadcrumbs.items = [
  { label: 'Home', href: '/', iconImage: '/icons/home.svg' },
  { label: 'Dashboard', href: '/dashboard', iconImage: '/icons/dashboard.svg' },
  { label: 'Analytics', iconImage: '/icons/analytics.svg', active: true }
];
```

### Collapsed Breadcrumbs

```html
<!-- Show first and last 2 items, collapse middle -->
<snice-breadcrumbs max-items="3"></snice-breadcrumbs>
```

```typescript
breadcrumbs.items = [
  { label: 'Home', href: '/' },
  { label: 'Level 1', href: '/level1' },
  { label: 'Level 2', href: '/level2' },
  { label: 'Level 3', href: '/level3' },
  { label: 'Level 4', href: '/level4' },
  { label: 'Current Page', active: true }
];
```

### Dynamic Breadcrumbs

```html
<snice-breadcrumbs></snice-breadcrumbs>
```

```typescript
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
```

### E-commerce Breadcrumbs

```html
<snice-breadcrumbs separator=">"></snice-breadcrumbs>
```

```typescript
breadcrumbs.items = [
  { label: 'Home', href: '/', icon: '🏠' },
  { label: 'Electronics', href: '/category/electronics', icon: '⚡' },
  { label: 'Computers', href: '/category/electronics/computers', icon: '💻' },
  { label: 'Laptops', href: '/category/electronics/computers/laptops', icon: '📱' },
  { label: 'MacBook Pro 16"', active: true }
];
```

### Documentation Breadcrumbs

```html
<snice-breadcrumbs separator="•"></snice-breadcrumbs>
```

```typescript
breadcrumbs.items = [
  { label: 'Docs', href: '/docs' },
  { label: 'API Reference', href: '/docs/api' },
  { label: 'Components', href: '/docs/api/components' },
  { label: 'Breadcrumbs', active: true }
];
```

### File System Navigation

```html
<snice-breadcrumbs separator="/"></snice-breadcrumbs>
```

```typescript
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
```

### Multi-level Navigation

```html
<snice-breadcrumbs max-items="4"></snice-breadcrumbs>
```

```typescript
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
```

### Breadcrumbs with Event Handling

```html
<snice-breadcrumbs></snice-breadcrumbs>

<div style="margin-top: 1rem; padding: 1rem; background: #f3f4f6; border-radius: 0.375rem;">
  <strong>Events:</strong>
  <div id="events"></div>
</div>
```

```typescript
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

<snice-breadcrumbs max-items="3"></snice-breadcrumbs>
```

```typescript
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

<snice-breadcrumbs></snice-breadcrumbs>
```

```typescript
breadcrumbs.items = [
  { label: 'Home', href: '/' },
  { label: 'Styled', href: '/styled' },
  { label: 'Breadcrumbs', active: true }
];
```

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--breadcrumb-font-size` | Font size of breadcrumb items | `0.875rem` |
| `--breadcrumb-spacing` | Spacing around separators | `0.5rem` |
| `--breadcrumb-color` | Default text color | `var(--snice-color-text-secondary)` |
| `--breadcrumb-hover-color` | Hover text color | `var(--snice-color-primary)` |
| `--breadcrumb-active-color` | Active item text color | `var(--snice-color-text)` |
| `--breadcrumb-separator-color` | Separator color | `var(--snice-color-text-tertiary)` |

## Accessibility

- **Semantic HTML**: Uses `<nav>` with `aria-label="Breadcrumb"`
- **Current page**: Last item has `aria-current="page"`
- **Keyboard support**: All links are keyboard accessible
- **Screen reader friendly**: Proper navigation landmark and structure

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support

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
