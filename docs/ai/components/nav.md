# snice-nav

Navigation menu from placard configurations, integrates with Snice routing.

## Properties

```typescript
variant: 'flat'|'hierarchical'|'grouped' = 'flat';
orientation: 'horizontal'|'vertical' = 'horizontal';
isTopLevel: boolean = false;  // attr: is-top-level, receive context updates
```

## Methods

- `update(placards, appContext?, currentRoute?, routeParams?)` - Update nav with placard data

## Slots

- `(default)` - Additional content after navigation

## CSS Parts

- `base` - Outer content wrapper
- `nav` - Navigation element
- `link` - Individual nav link
- `icon` - Nav item icon (img or span)

## Basic Usage

```html
<snice-nav id="nav" variant="flat" orientation="horizontal"></snice-nav>

<!-- Auto context integration -->
<snice-nav is-top-level></snice-nav>
```

```typescript
nav.update([
  { name: 'home', title: 'Home', href: '#/', icon: '🏠', order: 0 },
  { name: 'products', title: 'Products', href: '#/products', order: 1 },
], undefined, 'home');
```

Placard `href` is used as-is for the link — consumer picks routing mode (`#/path`, `/path`, full URL).

## Examples

```typescript
// Hierarchical
nav.update([
  { name: 'products', title: 'Products', href: '#/products', order: 0 },
  { name: 'electronics', title: 'Electronics', href: '#/products/electronics', parent: 'products', order: 0 },
]);

// Grouped
nav.update([
  { name: 'home', title: 'Home', href: '#/', group: 'Main', order: 0 },
  { name: 'profile', title: 'Profile', href: '#/profile', group: 'Account', order: 0 },
]);

// Sync conditional visibility
nav.update([
  { name: 'admin', title: 'Admin', href: '#/admin', visibleOn: (ctx) => ctx.user?.isAdmin },
], { user: { isAdmin: true } });

// Async visibility — hidden until resolves true; silent on false/reject
nav.update([
  { name: 'billing', title: 'Billing', href: '#/billing',
    visibleOn: async () => (await fetch('/api/perms').then(r => r.json())).includes('billing') },
], appContext);
```

## Accessibility

- `role="navigation"` on container
- `aria-current="page"` on active item
- `aria-label` from placard `description`
- Focus-visible styles for keyboard navigation
