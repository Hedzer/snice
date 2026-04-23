<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/nav.md -->

# Nav
`<snice-nav>`

A navigation menu that renders from placard configurations and integrates with Snice's routing system.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'flat' \| 'hierarchical' \| 'grouped'` | `'flat'` | Navigation display style |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction |
| `activeStyle` (attr: `active-style`) | `'fill' \| 'text'` | `'fill'` | Active item style. `'fill'` (default) paints a background on the active link; `'text'` applies only the color change (no fill) |
| `isTopLevel` (attr: `is-top-level`) | `boolean` | `false` | Receive context updates automatically |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `update()` | `placards, appContext?, currentRoute?, routeParams?` | Update navigation with placard data |

## Slots

| Name | Description |
|------|-------------|
| (default) | Additional content rendered after the navigation |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The outer content wrapper |
| `nav` | `<nav>` | The navigation element |
| `link` | `<a>` | An individual navigation link |
| `icon` | `<img>` or `<span>` | Nav item icon element |

```css
snice-nav::part(nav) {
  gap: 0.5rem;
}

snice-nav::part(link) {
  font-weight: 500;
  text-decoration: none;
}
```

## Basic Usage

```typescript
import 'snice/components/nav/snice-nav';
```

```html
<snice-nav id="nav" variant="flat" orientation="horizontal"></snice-nav>

<script type="module">
  const nav = document.getElementById('nav');
  nav.update([
    { name: 'home', title: 'Home', icon: '🏠', order: 0 },
    { name: 'products', title: 'Products', icon: '📦', order: 1 },
    { name: 'about', title: 'About', order: 2 },
  ], undefined, 'home');
</script>
```

## Examples

### Flat Navigation

The default variant renders a simple list of navigation items.

```html
<snice-nav id="flatNav" variant="flat"></snice-nav>

<script type="module">
  document.getElementById('flatNav').update([
    { name: 'home', title: 'Home', href: '#/', order: 0 },
    { name: 'products', title: 'Products', href: '#/products', order: 1 },
    { name: 'services', title: 'Services', href: '#/services', order: 2 },
    { name: 'contact', title: 'Contact', href: '#/contact', order: 3 },
  ]);
</script>
```

### Hierarchical Navigation

Use the `parent` property on placards to create nested navigation.

```html
<snice-nav id="hierNav" variant="hierarchical"></snice-nav>

<script type="module">
  document.getElementById('hierNav').update([
    { name: 'products', title: 'Products', href: '#/products', order: 0 },
    { name: 'electronics', title: 'Electronics', href: '#/products/electronics', parent: 'products', order: 0 },
    { name: 'clothing', title: 'Clothing', href: '#/products/clothing', parent: 'products', order: 1 },
  ]);
</script>
```

### Grouped Navigation

Use the `group` property on placards to organize items into labeled groups.

```html
<snice-nav id="groupNav" variant="grouped"></snice-nav>

<script type="module">
  document.getElementById('groupNav').update([
    { name: 'home', title: 'Home', href: '#/', group: 'Main', order: 0 },
    { name: 'dashboard', title: 'Dashboard', href: '#/dashboard', group: 'Main', order: 1 },
    { name: 'profile', title: 'Profile', href: '#/profile', group: 'Account', order: 0 },
    { name: 'settings', title: 'Settings', href: '#/settings', group: 'Account', order: 1 },
  ]);
</script>
```

### Active Style (text highlight vs fill)

By default the active nav item is drawn with a subtle background fill. Use `active-style="text"` when you want the active item to be indicated only by the accent color, with no background — useful on dense headers or sidebars where a filled pill looks heavy.

```html
<snice-nav active-style="text"></snice-nav>
```

`active-style="fill"` (the default) keeps the filled appearance. The attribute is orthogonal to `variant`, so any variant can use either style.

### Vertical Orientation

Use `orientation="vertical"` for sidebar-style navigation.

```html
<snice-nav variant="flat" orientation="vertical"></snice-nav>
```

### With Icons

```typescript
nav.update([
  { name: 'dashboard', title: 'Dashboard', href: '#/dashboard', icon: '📊', order: 0 },
  { name: 'analytics', title: 'Analytics', href: '#/analytics', icon: '📈', order: 1 },
  { name: 'settings', title: 'Settings', href: '#/settings', icon: '⚙️', order: 2 },
]);
```

### Conditional Visibility

Use `visibleOn` guards to conditionally show navigation items.

```typescript
nav.update([
  { name: 'home', title: 'Home', href: '#/', order: 0 },
  {
    name: 'admin',
    title: 'Admin',
    href: '#/admin',
    order: 1,
    visibleOn: (ctx) => ctx.user?.isAdmin
  },
], { user: { isAdmin: true } });

// Async guard — item hidden until promise resolves true
nav.update([
  { name: 'home', title: 'Home', href: '#/', order: 0 },
  {
    name: 'billing',
    title: 'Billing',
    href: '#/billing',
    order: 1,
    visibleOn: async (ctx) => {
      const perms = await fetch('/api/me/permissions').then(r => r.json());
      return perms.includes('billing');
    }
  },
], appContext);
```

### Active Route Tracking

Pass the current route to highlight the active item.

```typescript
nav.update(placards, undefined, 'products');
// The active item receives 'nav__link--active' class and aria-current="page"
```

### Context Integration

Set `is-top-level` to automatically receive placards and routes from the Snice context system.

```html
<snice-nav is-top-level></snice-nav>
```

## Accessibility

- The `<nav>` element has `role="navigation"` for screen readers
- Active items receive `aria-current="page"`
- Items with `description` get `aria-label` for accessible names
- Focus-visible styles are provided for keyboard navigation
- All navigation links are keyboard-focusable

## Placard Structure

```typescript
interface Placard {
  name: string;                      // Route identifier
  title: string;                     // Display text
  icon?: string;                     // Icon character/emoji
  order?: number;                    // Sort order
  parent?: string;                   // Parent name (hierarchical)
  group?: string;                    // Group name (grouped)
  show?: boolean;                    // Visibility flag
  description?: string;              // Accessible label and tooltip
  tooltip?: string;                  // Hover tooltip
  hotkeys?: string[];                // Keyboard shortcuts
  helpUrl?: string;                  // Help documentation URL
  searchTerms?: string[];            // Search keywords
  attributes?: Record<string, any>;  // Custom data attributes
  visibleOn?: Function | Function[]; // Visibility guard functions
}
```
