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

## Placard Structure

```typescript
interface Placard {
  name: string;                      // Route identifier
  title: string;                     // Display text
  icon?: string;                     // Icon character
  order?: number;                    // Sort order
  parent?: string;                   // Parent name (hierarchical)
  group?: string;                    // Group name (grouped)
  show?: boolean;
  description?: string;              // Accessible label/tooltip
  tooltip?: string;
  hotkeys?: string[];
  helpUrl?: string;
  searchTerms?: string[];
  attributes?: Record<string, any>;
  visibleOn?: Function | Function[];
}
```

## Usage

```html
<snice-nav id="nav" variant="flat" orientation="horizontal"></snice-nav>

<!-- Auto context integration -->
<snice-nav is-top-level></snice-nav>
```

```typescript
const nav = document.querySelector('snice-nav');
nav.update([
  { name: 'home', title: 'Home', icon: '🏠', order: 0 },
  { name: 'products', title: 'Products', order: 1 },
], undefined, 'home');
```

**CSS Parts:**
- `base` - Outer content wrapper
- `nav` - Navigation element
- `link` - Individual nav link

## Features

- Flat, hierarchical, and grouped variants
- Active route tracking (`.nav__link--active`, `aria-current="page"`)
- `role="navigation"` on container
- Hotkeys via `data-hotkeys` attribute
- Conditional visibility via `visibleOn` guards
- Custom attributes via placard `attributes`
