# snice-nav

Navigation menu from placard configurations, integrates with Snice routing.

## Properties

```typescript
variant: 'flat'|'hierarchical'|'grouped' = 'flat';
orientation: 'horizontal'|'vertical' = 'horizontal';
isTopLevel: boolean = false;              // Receive context updates
```

## Methods

```typescript
update(placards, appContext?, currentRoute?, routeParams?)  // Update nav with placard data
```

## Placard Structure

```typescript
interface Placard {
  name: string;                    // Route identifier
  title: string;                   // Display text
  icon?: string;                   // Icon character
  order?: number;                  // Sort order
  parent?: string;                 // Parent name (hierarchical)
  group?: string;                  // Group name (grouped)
  show?: boolean;                  // Visibility
  description?: string;            // Accessible label/tooltip
  tooltip?: string;                // Hover tooltip
  hotkeys?: string[];              // Keyboard shortcuts
  helpUrl?: string;                // Help URL
  searchTerms?: string[];          // Search keywords
  attributes?: Record<string, any>; // Custom data attributes
  visibleOn?: Function | Function[]; // Visibility guards
}
```

## Usage

```html
<snice-nav id="nav" variant="flat" orientation="horizontal"></snice-nav>
```

```typescript
const nav = document.querySelector('snice-nav');
const placards = [
  { name: 'home', title: 'Home', icon: '🏠', order: 0 },
  { name: 'products', title: 'Products', icon: '📦', order: 1 },
];
nav.update(placards, undefined, 'home');
```

## Variants

- **flat**: Simple list (default)
- **hierarchical**: Nested with parent-child relationships
- **grouped**: Organized into labeled groups

## Context Integration

```html
<snice-nav is-top-level></snice-nav>
```

Auto-receives placards, routes, and app context from Snice context system.

## Features

- Active route tracking with `.nav__link--active` class
- `aria-current="page"` on active links
- `role="navigation"` on container
- Hotkeys via `data-hotkeys` attribute
- Custom attributes via placard `attributes` property
- Conditional visibility via `visibleOn` guards
