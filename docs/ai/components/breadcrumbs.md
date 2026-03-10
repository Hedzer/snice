# snice-breadcrumbs & snice-crumb

Navigation breadcrumb trail.

## Components

- `<snice-breadcrumbs>` - Container (imperative `items` array or declarative `<snice-crumb>` children)
- `<snice-crumb>` - Individual breadcrumb item (data element, no shadow DOM)

## Properties

### snice-breadcrumbs

```typescript
items: BreadcrumbItem[] = [];                              // JS property only
separator: '/'|'>'|'>>'|'.'|'|' = '/';
size: 'small'|'medium'|'large' = 'medium';
maxItems: number = 0;                                      // 0 = show all, attr: max-items
```

### snice-crumb

```typescript
label: string = '';
href: string = '';
icon: string = '';
iconImage: string = '';           // attr: icon-image (deprecated)
active: boolean = false;
```

## Methods

- `setItems(items: BreadcrumbItem[])` - Update breadcrumb items

## Events

- `breadcrumb-click` -> `{ item: BreadcrumbItem, index: number, href: string, label: string }`

## Slots

### snice-breadcrumbs
- `(default)` - `<snice-crumb>` elements (declarative API)

### snice-crumb
- `icon` - Custom icon element (for CSS icon fonts)

## CSS Parts

- `base` - The `<nav>` container
- `list` - The `<ol>` breadcrumb list
- `link` - Individual breadcrumb `<a>` links
- `separator` - Separator characters between items
- `ellipsis` - Collapse ellipsis button

## CSS Custom Properties

```css
--breadcrumb-font-size: 0.875rem;
--breadcrumb-spacing: 0.5rem;
--breadcrumb-color: var(--snice-color-text-secondary, rgb(82 82 82));
--breadcrumb-hover-color: var(--snice-color-primary, rgb(37 99 235));
--breadcrumb-active-color: var(--snice-color-text, rgb(23 23 23));
--breadcrumb-separator-color: var(--snice-color-text-tertiary, rgb(163 163 163));
```

## BreadcrumbItem

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

## Basic Usage

```html
<!-- Imperative -->
<snice-breadcrumbs></snice-breadcrumbs>
```

```typescript
breadcrumbs.items = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Laptop', active: true }
];
```

```html
<!-- Declarative -->
<snice-breadcrumbs>
  <snice-crumb href="/" label="Home"></snice-crumb>
  <snice-crumb href="/products" label="Products"></snice-crumb>
  <snice-crumb label="Laptop" active></snice-crumb>
</snice-breadcrumbs>

<!-- Custom separator + max items -->
<snice-breadcrumbs separator=">" max-items="3"></snice-breadcrumbs>

<!-- Icon slots via snice-crumb (for CSS icon fonts) -->
<snice-breadcrumbs>
  <snice-crumb href="/" label="Home">
    <span slot="icon" class="material-symbols-outlined">home</span>
  </snice-crumb>
</snice-breadcrumbs>
```

## Accessibility

- `<nav>` with `aria-label="Breadcrumb"`
- `aria-current="page"` on active/last item
- All links and ellipsis button are keyboard accessible
