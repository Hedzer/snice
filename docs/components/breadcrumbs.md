<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/breadcrumbs.md -->

# Breadcrumbs Components
`<snice-breadcrumbs>` `<snice-crumb>`

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

## Components

### `<snice-breadcrumbs>`
Container for breadcrumb navigation trail. Can be driven by the `items` array property or by slotted `<snice-crumb>` elements.

### `<snice-crumb>`
Individual breadcrumb item (data element, no shadow DOM).

## Properties

### snice-breadcrumbs

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `items` | -- | `BreadcrumbItem[]` | `[]` | Array of breadcrumb items (JS property only) |
| `separator` | `separator` | `'/' \| '>' \| '>>' \| '.' \| '\|'` | `'/'` | Separator between items |
| `size` | `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Breadcrumb size |
| `maxItems` | `max-items` | `number` | `0` | Max items to show (0 = show all). Collapsed items show an ellipsis. |

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

### snice-crumb

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `label` | `label` | `string` | `''` | Display text |
| `href` | `href` | `string` | `''` | Link URL |
| `icon` | `icon` | `string` | `''` | Icon (URL, image file, emoji) |
| `iconImage` | `icon-image` | `string` | `''` | Icon image URL (deprecated) |
| `active` | `active` | `boolean` | `false` | Current/active state |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `setItems()` | `items: BreadcrumbItem[]` | Programmatically set breadcrumb items |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `breadcrumb-click` | `{ item: BreadcrumbItem, index: number, href: string, label: string }` | Fired when a breadcrumb link is clicked |

```typescript
breadcrumbs.addEventListener('breadcrumb-click', (e) => {
  console.log('Clicked:', e.detail.label, 'at index', e.detail.index);
});
```

## Slots

### snice-breadcrumbs

| Name | Description |
|------|-------------|
| (default) | `<snice-crumb>` elements (declarative API) |

### snice-crumb

| Name | Description |
|------|-------------|
| `icon` | Custom icon element (for CSS icon fonts like Material Symbols or Font Awesome) |

> **Note**: Icon slots only work when using `<snice-crumb>` elements, not when using the `items` array property.

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
```

## CSS Parts

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

## Basic Usage

```typescript
import 'snice/components/breadcrumbs/snice-breadcrumbs';
```

### Using items array (imperative)

```html
<snice-breadcrumbs></snice-breadcrumbs>
```

```typescript
breadcrumbs.items = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Laptops', active: true }
];
```

### Using crumb elements (declarative)

```html
<snice-breadcrumbs>
  <snice-crumb href="/" label="Home"></snice-crumb>
  <snice-crumb href="/products" label="Products"></snice-crumb>
  <snice-crumb label="Laptops" active></snice-crumb>
</snice-breadcrumbs>
```

## Examples

### Custom Separators

```html
<snice-breadcrumbs separator="/"></snice-breadcrumbs>
<snice-breadcrumbs separator=">"></snice-breadcrumbs>
<snice-breadcrumbs separator="|"></snice-breadcrumbs>
```

### Different Sizes

```html
<snice-breadcrumbs size="small"></snice-breadcrumbs>
<snice-breadcrumbs size="medium"></snice-breadcrumbs>
<snice-breadcrumbs size="large"></snice-breadcrumbs>
```

### With Icons

```typescript
breadcrumbs.items = [
  { label: 'Home', href: '/', icon: '/icons/home.svg' },
  { label: 'Settings', href: '/settings', icon: '/icons/settings.svg' },
  { label: 'Profile', active: true }
];
```

### Collapsed Breadcrumbs

Use `max-items` to collapse middle items behind an ellipsis button.

```html
<snice-breadcrumbs max-items="3"></snice-breadcrumbs>
```

```typescript
breadcrumbs.items = [
  { label: 'Home', href: '/' },
  { label: 'Level 1', href: '/level1' },
  { label: 'Level 2', href: '/level2' },
  { label: 'Level 3', href: '/level3' },
  { label: 'Current Page', active: true }
];
```

### Dynamic Breadcrumbs

```typescript
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

breadcrumbs.addEventListener('breadcrumb-click', (e) => {
  if (e.detail.href) {
    updateBreadcrumbs(e.detail.href);
  }
});
```

## Accessibility

- **Semantic HTML**: Uses `<nav>` with `aria-label="Breadcrumb"`
- **Current page**: Last item has `aria-current="page"`
- **Keyboard support**: All links and the ellipsis button are keyboard accessible
- **Screen reader friendly**: Proper navigation landmark and structure
