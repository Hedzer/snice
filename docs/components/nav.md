# Navigation Component

The `<snice-nav>` component renders navigation menus from placard configurations. It integrates with Snice's routing system and supports multiple display variants.

## Basic Usage

```html
<snice-nav id="mainNav" variant="flat" orientation="horizontal"></snice-nav>

<script type="module">
  import 'snice/components/nav/snice-nav';

  const nav = document.querySelector('#mainNav');

  const placards = [
    { name: 'home', title: 'Home', icon: '🏠', order: 0 },
    { name: 'products', title: 'Products', icon: '📦', order: 1 },
    { name: 'about', title: 'About', icon: 'ℹ️', order: 2 },
  ];

  nav.update(placards, undefined, 'home');
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'flat' \| 'hierarchical' \| 'grouped'` | `'flat'` | Display style for navigation |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction |
| `isTopLevel` | `boolean` | `false` | Whether to receive context updates |

## Methods

### `update(placards, appContext?, currentRoute?, routeParams?): void`
Update the navigation with new placard data and routing information.

```typescript
nav.update(
  placards,           // Array of placard objects
  appContext,         // Optional app context
  'products',         // Current route
  { id: '123' }       // Route parameters
);
```

## Placard Structure

```typescript
interface Placard {
  name: string;              // Unique identifier and route
  title: string;             // Display text
  icon?: string;             // Icon character/emoji
  order?: number;            // Sort order
  parent?: string;           // Parent placard name (for hierarchical)
  group?: string;            // Group name (for grouped variant)
  show?: boolean;            // Whether to show the item
  description?: string;      // Accessible label and tooltip
  tooltip?: string;          // Hover tooltip
  hotkeys?: string[];        // Keyboard shortcuts
  helpUrl?: string;          // Help documentation URL
  searchTerms?: string[];    // Search keywords
  attributes?: Record<string, any>; // Custom data attributes
  visibleOn?: Function | Function[]; // Visibility guards
}
```

## Variants

### Flat (Default)
Simple horizontal or vertical list of navigation items.

```html
<snice-nav variant="flat"></snice-nav>
```

### Hierarchical
Nested navigation with parent-child relationships.

```html
<snice-nav variant="hierarchical"></snice-nav>
```

```javascript
const placards = [
  { name: 'products', title: 'Products', order: 0 },
  { name: 'electronics', title: 'Electronics', parent: 'products', order: 0 },
  { name: 'clothing', title: 'Clothing', parent: 'products', order: 1 },
];
```

### Grouped
Navigation items organized into labeled groups.

```html
<snice-nav variant="grouped"></snice-nav>
```

```javascript
const placards = [
  { name: 'home', title: 'Home', group: 'Main', order: 0 },
  { name: 'about', title: 'About', group: 'Main', order: 1 },
  { name: 'settings', title: 'Settings', group: 'Account', order: 2 },
];
```

## Examples

### Basic Navigation

```html
<snice-nav id="nav"></snice-nav>

<script type="module">
  import 'snice/components/nav/snice-nav';

  const nav = document.querySelector('#nav');

  const placards = [
    { name: 'home', title: 'Home', order: 0 },
    { name: 'products', title: 'Products', order: 1 },
    { name: 'services', title: 'Services', order: 2 },
    { name: 'contact', title: 'Contact', order: 3 },
  ];

  nav.update(placards, undefined, 'home');
</script>
```

### With Icons

```javascript
const placards = [
  { name: 'dashboard', title: 'Dashboard', icon: '📊', order: 0 },
  { name: 'analytics', title: 'Analytics', icon: '📈', order: 1 },
  { name: 'reports', title: 'Reports', icon: '📋', order: 2 },
  { name: 'settings', title: 'Settings', icon: '⚙️', order: 3 },
];

nav.update(placards);
```

### Hierarchical Menu

```javascript
const placards = [
  { name: 'products', title: 'Products', order: 0 },
  { name: 'electronics', title: 'Electronics', parent: 'products', order: 0 },
  { name: 'computers', title: 'Computers', parent: 'electronics', order: 0 },
  { name: 'phones', title: 'Phones', parent: 'electronics', order: 1 },
  { name: 'clothing', title: 'Clothing', parent: 'products', order: 1 },
];

const nav = document.querySelector('snice-nav');
nav.variant = 'hierarchical';
nav.update(placards);
```

### Grouped Navigation

```javascript
const placards = [
  { name: 'home', title: 'Home', group: 'Main', order: 0 },
  { name: 'dashboard', title: 'Dashboard', group: 'Main', order: 1 },
  { name: 'profile', title: 'Profile', group: 'Account', order: 0 },
  { name: 'settings', title: 'Settings', group: 'Account', order: 1 },
  { name: 'help', title: 'Help', group: 'Support', order: 0 },
];

const nav = document.querySelector('snice-nav');
nav.variant = 'grouped';
nav.update(placards);
```

### With Keyboard Shortcuts

```javascript
const placards = [
  { name: 'home', title: 'Home', hotkeys: ['h', 'Ctrl+H'], order: 0 },
  { name: 'search', title: 'Search', hotkeys: ['/', 'Ctrl+K'], order: 1 },
];

nav.update(placards);

// Access hotkeys via data attribute
const links = nav.shadowRoot.querySelectorAll('[data-hotkeys]');
```

### Conditional Visibility

```javascript
const placards = [
  { name: 'home', title: 'Home', order: 0 },
  {
    name: 'admin',
    title: 'Admin',
    order: 1,
    visibleOn: (appContext) => appContext.user?.isAdmin
  },
];

nav.update(placards, { user: { isAdmin: true } });
```

### Active Route Tracking

```javascript
// Update current route
nav.update(placards, undefined, 'products');

// The corresponding nav item will have 'nav__link--active' class
// and aria-current="page" attribute
```

## Accessibility

- `role="navigation"` on nav container
- `aria-current="page"` on active links
- `aria-label` from placard descriptions
- Keyboard navigation support
- Screen reader friendly

## Integration with Snice Context

When `isTopLevel` is true, the nav component automatically receives updates from the Snice context system:

```html
<snice-nav is-top-level></snice-nav>
```

The context provides:
- Placards from routing configuration
- Current route and parameters
- Application context for visibility guards

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support
