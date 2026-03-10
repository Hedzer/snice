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
  { name: 'home', title: 'Home', icon: '🏠', order: 0 },
  { name: 'products', title: 'Products', order: 1 },
], undefined, 'home');
```

## Examples

```typescript
// Hierarchical
nav.update([
  { name: 'products', title: 'Products', order: 0 },
  { name: 'electronics', title: 'Electronics', parent: 'products', order: 0 },
]);

// Grouped
nav.update([
  { name: 'home', title: 'Home', group: 'Main', order: 0 },
  { name: 'profile', title: 'Profile', group: 'Account', order: 0 },
]);

// Conditional visibility
nav.update([
  { name: 'admin', title: 'Admin', visibleOn: (ctx) => ctx.user?.isAdmin },
], { user: { isAdmin: true } });
```

## Accessibility

- `role="navigation"` on container
- `aria-current="page"` on active item
- `aria-label` from placard `description`
- Focus-visible styles for keyboard navigation
