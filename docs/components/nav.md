[//]: # (AI: For a low-token version of this doc, use docs/ai/components/nav.md instead)

# Nav
`<snice-nav>`

A navigation menu that renders from placard configurations and integrates with Snice's routing system.

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

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/nav/snice-nav';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-nav.min.js"></script>
```

## Examples

### Flat Navigation

The default variant renders a simple list of navigation items.

```html
<snice-nav id="flatNav" variant="flat"></snice-nav>

<script type="module">
  document.getElementById('flatNav').update([
    { name: 'home', title: 'Home', order: 0 },
    { name: 'products', title: 'Products', order: 1 },
    { name: 'services', title: 'Services', order: 2 },
    { name: 'contact', title: 'Contact', order: 3 },
  ]);
</script>
```

### Hierarchical Navigation

Use the `parent` property on placards to create nested navigation.

```html
<snice-nav id="hierNav" variant="hierarchical"></snice-nav>

<script type="module">
  document.getElementById('hierNav').update([
    { name: 'products', title: 'Products', order: 0 },
    { name: 'electronics', title: 'Electronics', parent: 'products', order: 0 },
    { name: 'clothing', title: 'Clothing', parent: 'products', order: 1 },
  ]);
</script>
```

### Grouped Navigation

Use the `group` property on placards to organize items into labeled groups.

```html
<snice-nav id="groupNav" variant="grouped"></snice-nav>

<script type="module">
  document.getElementById('groupNav').update([
    { name: 'home', title: 'Home', group: 'Main', order: 0 },
    { name: 'dashboard', title: 'Dashboard', group: 'Main', order: 1 },
    { name: 'profile', title: 'Profile', group: 'Account', order: 0 },
    { name: 'settings', title: 'Settings', group: 'Account', order: 1 },
  ]);
</script>
```

### Vertical Orientation

Use `orientation="vertical"` for sidebar-style navigation.

```html
<snice-nav variant="flat" orientation="vertical"></snice-nav>
```

### With Icons

```typescript
nav.update([
  { name: 'dashboard', title: 'Dashboard', icon: '📊', order: 0 },
  { name: 'analytics', title: 'Analytics', icon: '📈', order: 1 },
  { name: 'settings', title: 'Settings', icon: '⚙️', order: 2 },
]);
```

### Conditional Visibility

Use `visibleOn` guards to conditionally show navigation items.

```typescript
nav.update([
  { name: 'home', title: 'Home', order: 0 },
  {
    name: 'admin',
    title: 'Admin',
    order: 1,
    visibleOn: (ctx) => ctx.user?.isAdmin
  },
], { user: { isAdmin: true } });
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

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'flat' \| 'hierarchical' \| 'grouped'` | `'flat'` | Navigation display style |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction |
| `isTopLevel` (attr: `is-top-level`) | `boolean` | `false` | Receive context updates automatically |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `update()` | `placards, appContext?, currentRoute?, routeParams?` | Update navigation with placard data |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The outer content wrapper |
| `nav` | `<nav>` | The navigation element |
| `link` | `<a>` | An individual navigation link |

```css
snice-nav::part(nav) {
  gap: 0.5rem;
}

snice-nav::part(link) {
  font-weight: 500;
  text-decoration: none;
}
```
