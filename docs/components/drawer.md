# Drawer Component

The `<snice-drawer>` component provides a slide-out panel that appears from any side of the viewport. It's commonly used for navigation menus, filters, settings panels, or additional content that shouldn't occupy permanent screen space.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [Examples](#examples)

## Basic Usage

```html
<button id="openDrawer">Open Drawer</button>

<snice-drawer id="myDrawer">
  <h2 slot="title">Menu</h2>

  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
  </nav>

  <div slot="footer">
    <button onclick="this.closest('snice-drawer').hide()">Close</button>
  </div>
</snice-drawer>
```

```typescript
import 'snice/components/drawer/snice-drawer';

const drawer = document.querySelector('snice-drawer');
const openBtn = document.querySelector('#openDrawer');

openBtn.addEventListener('click', () => drawer.show());
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` | `boolean` | `false` | Whether the drawer is visible |
| `position` | `'left' \| 'right' \| 'top' \| 'bottom'` | `'left'` | Side from which the drawer slides in |
| `size` | `'small' \| 'medium' \| 'large' \| 'xl' \| 'xxl' \| 'xxxl' \| 'full'` | `'medium'` | Width/height of the drawer |
| `noBackdrop` | `boolean` | `false` | Hide the backdrop overlay |
| `noBackdropDismiss` | `boolean` | `false` | Prevent closing when clicking backdrop |
| `noEscapeDismiss` | `boolean` | `false` | Prevent closing with Escape key |
| `noFocusTrap` | `boolean` | `false` | Disable focus trapping |
| `persistent` | `boolean` | `false` | Hide close button and prevent all dismissal |
| `pushContent` | `boolean` | `false` | Push main content instead of overlaying |
| `contained` | `boolean` | `false` | Position relative to parent instead of viewport |

## Methods

### `show(): void`
Open the drawer.

```typescript
drawer.show();
```

### `hide(): void`
Close the drawer.

```typescript
drawer.hide();
```

### `toggle(): void`
Toggle the drawer open/closed state.

```typescript
drawer.toggle();
```

## Events

### `@snice/drawer-open`
Fired when the drawer opens.

**Event Detail:**
```typescript
{
  drawer: SniceDrawerElement; // Reference to the drawer element
}
```

**Usage:**
```typescript
drawer.addEventListener('@snice/drawer-open', (e) => {
  console.log('Drawer opened:', e.detail.drawer);
});
```

### `@snice/drawer-close`
Fired when the drawer closes.

**Event Detail:**
```typescript
{
  drawer: SniceDrawerElement; // Reference to the drawer element
}
```

**Usage:**
```typescript
drawer.addEventListener('@snice/drawer-close', (e) => {
  console.log('Drawer closed:', e.detail.drawer);
});
```

## Slots

### `title` (named slot)
Content for the drawer header/title area.

```html
<snice-drawer>
  <h2 slot="title">Drawer Title</h2>
</snice-drawer>
```

### Default slot
Main content of the drawer body.

```html
<snice-drawer>
  <p>This goes in the body</p>
</snice-drawer>
```

### `footer` (named slot)
Content for the drawer footer. Typically used for action buttons.

```html
<snice-drawer>
  <div slot="footer">
    <button>Action</button>
  </div>
</snice-drawer>
```

## Examples

### Basic Drawer

```html
<button id="toggle">Toggle Drawer</button>

<snice-drawer id="drawer">
  <h2 slot="title">Navigation</h2>

  <nav>
    <a href="/">Home</a>
    <a href="/products">Products</a>
    <a href="/about">About</a>
  </nav>
</snice-drawer>

<script type="module">
  import 'snice/components/drawer/snice-drawer';

  const drawer = document.querySelector('#drawer');
  const toggleBtn = document.querySelector('#toggle');

  toggleBtn.addEventListener('click', () => drawer.toggle());
</script>
```

### Position Variants

```html
<!-- Left (default) -->
<snice-drawer position="left">
  <h2 slot="title">Left Drawer</h2>
  <p>Slides in from the left</p>
</snice-drawer>

<!-- Right -->
<snice-drawer position="right">
  <h2 slot="title">Right Drawer</h2>
  <p>Slides in from the right</p>
</snice-drawer>

<!-- Top -->
<snice-drawer position="top">
  <h2 slot="title">Top Drawer</h2>
  <p>Slides in from the top</p>
</snice-drawer>

<!-- Bottom -->
<snice-drawer position="bottom">
  <h2 slot="title">Bottom Drawer</h2>
  <p>Slides in from the bottom</p>
</snice-drawer>
```

### Size Variants

```html
<!-- Small -->
<snice-drawer size="small">
  <h2 slot="title">Small Drawer</h2>
</snice-drawer>

<!-- Medium (default) -->
<snice-drawer size="medium">
  <h2 slot="title">Medium Drawer</h2>
</snice-drawer>

<!-- Large -->
<snice-drawer size="large">
  <h2 slot="title">Large Drawer</h2>
</snice-drawer>

<!-- Extra Large -->
<snice-drawer size="xl">
  <h2 slot="title">XL Drawer</h2>
</snice-drawer>

<!-- Full Width/Height -->
<snice-drawer size="full">
  <h2 slot="title">Full Drawer</h2>
</snice-drawer>
```

### Without Backdrop

```html
<snice-drawer no-backdrop>
  <h2 slot="title">No Backdrop</h2>
  <p>This drawer has no background overlay.</p>
</snice-drawer>
```

### Persistent Drawer

```html
<snice-drawer persistent>
  <h2 slot="title">Persistent Drawer</h2>
  <p>No close button, must be closed programmatically.</p>
</snice-drawer>
```

### Push Content

```html
<snice-drawer push-content>
  <h2 slot="title">Push Content</h2>
  <p>Main content slides over when this opens.</p>
</snice-drawer>
```

### Filters Panel

```html
<button id="showFilters">Show Filters</button>

<snice-drawer id="filtersDrawer" position="right" size="small">
  <h2 slot="title">Filters</h2>

  <div style="display: flex; flex-direction: column; gap: 1rem;">
    <div>
      <label>
        <input type="checkbox"> In Stock
      </label>
    </div>
    <div>
      <label>
        <input type="checkbox"> On Sale
      </label>
    </div>
    <div>
      <label>Price Range</label>
      <input type="range" min="0" max="1000">
    </div>
  </div>

  <div slot="footer">
    <button onclick="this.closest('snice-drawer').hide()">Apply</button>
  </div>
</snice-drawer>

<script type="module">
  import 'snice/components/drawer/snice-drawer';

  document.querySelector('#showFilters').addEventListener('click', () => {
    document.querySelector('#filtersDrawer').show();
  });
</script>
```

### Settings Panel

```html
<button id="showSettings">Settings</button>

<snice-drawer id="settingsDrawer" position="right">
  <h2 slot="title">Settings</h2>

  <form id="settingsForm">
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <div>
        <label for="theme">Theme</label>
        <select id="theme" name="theme">
          <option>Light</option>
          <option>Dark</option>
          <option>Auto</option>
        </select>
      </div>

      <div>
        <label>
          <input type="checkbox" name="notifications">
          Enable notifications
        </label>
      </div>

      <div>
        <label>
          <input type="checkbox" name="autoSave">
          Auto-save
        </label>
      </div>
    </div>
  </form>

  <div slot="footer">
    <button type="button" onclick="this.closest('snice-drawer').hide()">
      Cancel
    </button>
    <button type="submit" form="settingsForm">
      Save
    </button>
  </div>
</snice-drawer>

<script type="module">
  import 'snice/components/drawer/snice-drawer';

  const drawer = document.querySelector('#settingsDrawer');
  const form = document.querySelector('#settingsForm');

  document.querySelector('#showSettings').addEventListener('click', () => {
    drawer.show();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    console.log('Settings:', Object.fromEntries(data));
    drawer.hide();
  });
</script>
```

### Mobile Navigation

```html
<button id="menuBtn">Menu</button>

<snice-drawer id="navDrawer" position="left" size="medium">
  <h2 slot="title">Menu</h2>

  <nav style="display: flex; flex-direction: column; gap: 0.5rem;">
    <a href="/" style="padding: 0.5rem;">Home</a>
    <a href="/products" style="padding: 0.5rem;">Products</a>
    <a href="/services" style="padding: 0.5rem;">Services</a>
    <a href="/about" style="padding: 0.5rem;">About</a>
    <a href="/contact" style="padding: 0.5rem;">Contact</a>
  </nav>
</snice-drawer>

<script type="module">
  import 'snice/components/drawer/snice-drawer';

  const drawer = document.querySelector('#navDrawer');
  const menuBtn = document.querySelector('#menuBtn');

  menuBtn.addEventListener('click', () => drawer.show());

  // Close drawer when clicking a link
  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => drawer.hide());
  });
</script>
```

### With Event Handling

```typescript
import type { SniceDrawerElement } from 'snice/components/drawer/snice-drawer.types';

const drawer = document.querySelector<SniceDrawerElement>('snice-drawer');

drawer.addEventListener('@snice/drawer-open', () => {
  console.log('Drawer opened');
  // Pause video, load content, etc.
});

drawer.addEventListener('@snice/drawer-close', () => {
  console.log('Drawer closed');
  // Resume video, save state, etc.
});

// Programmatic control
drawer.show();
drawer.hide();
drawer.toggle();
```

### Dynamic Content Loading

```html
<button id="showDetails">Show Details</button>

<snice-drawer id="detailsDrawer" position="right">
  <h2 slot="title" id="itemTitle">Loading...</h2>

  <div id="itemContent">
    <p>Loading...</p>
  </div>
</snice-drawer>

<script type="module">
  import 'snice/components/drawer/snice-drawer';

  const drawer = document.querySelector('#detailsDrawer');
  const title = document.querySelector('#itemTitle');
  const content = document.querySelector('#itemContent');

  document.querySelector('#showDetails').addEventListener('click', async () => {
    drawer.show();

    // Fetch data
    const response = await fetch('/api/item/123');
    const item = await response.json();

    // Update content
    title.textContent = item.name;
    content.innerHTML = `
      <dl>
        <dt>Price:</dt>
        <dd>$${item.price}</dd>
        <dt>Description:</dt>
        <dd>${item.description}</dd>
      </dl>
    `;
  });
</script>
```

### Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      font-family: system-ui;
    }

    .app-header {
      padding: 1rem;
      background: #1f2937;
      color: white;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .content {
      padding: 2rem;
    }

    snice-drawer nav {
      display: flex;
      flex-direction: column;
    }

    snice-drawer nav a {
      padding: 0.75rem 1rem;
      text-decoration: none;
      color: inherit;
      border-radius: 4px;
    }

    snice-drawer nav a:hover {
      background: #f3f4f6;
    }
  </style>

  <script type="module">
    import 'snice/components/drawer/snice-drawer';

    const drawer = document.querySelector('snice-drawer');
    const menuBtn = document.querySelector('#menuBtn');

    menuBtn.addEventListener('click', () => drawer.show());

    // Close drawer on link click
    drawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        drawer.hide();
        console.log('Navigate to:', link.getAttribute('href'));
      });
    });
  </script>
</head>
<body>
  <header class="app-header">
    <button id="menuBtn">☰ Menu</button>
    <h1>My App</h1>
  </header>

  <main class="content">
    <h2>Welcome</h2>
    <p>Click the menu button to open the navigation drawer.</p>
  </main>

  <snice-drawer id="navDrawer" position="left" size="medium">
    <h2 slot="title">Navigation</h2>

    <nav>
      <a href="/">🏠 Home</a>
      <a href="/dashboard">📊 Dashboard</a>
      <a href="/products">📦 Products</a>
      <a href="/orders">📋 Orders</a>
      <a href="/customers">👥 Customers</a>
      <a href="/analytics">📈 Analytics</a>
      <a href="/settings">⚙️ Settings</a>
    </nav>

    <div slot="footer">
      <button onclick="this.closest('snice-drawer').hide()">
        Close
      </button>
    </div>
  </snice-drawer>
</body>
</html>
```

## Accessibility

The drawer component includes comprehensive accessibility features:

- `role="dialog"` on the drawer container
- `aria-modal="true"` to indicate modal behavior
- `aria-hidden` reflects visibility state
- Focus trap keeps keyboard navigation within drawer
- Focus restoration returns focus to trigger element on close
- Escape key support for closing
- Close button is keyboard accessible

### Keyboard Support

- **Escape**: Close drawer (unless `noEscapeDismiss` or `persistent` is true)
- **Tab**: Cycle through focusable elements within drawer (trapped)
- **Shift + Tab**: Reverse cycle through focusable elements

## Behavior

### Focus Management

When a drawer opens:
1. Current focus is stored
2. Focus moves to the drawer container
3. Tab navigation is trapped within the drawer (unless `noFocusTrap` is true)

When a drawer closes:
1. Focus returns to the previously focused element

### Dismissal

By default, drawers can be dismissed by:
- Clicking the close button
- Clicking the backdrop
- Pressing Escape

This behavior can be customized:
- `noBackdropDismiss`: Prevents backdrop click dismissal
- `noEscapeDismiss`: Prevents Escape key dismissal
- `persistent`: Hides close button and prevents all dismissal

### Push Content Mode

When `pushContent` is enabled, the drawer pushes the main content aside instead of overlaying it. This is useful for persistent navigation panels. The pushed element is determined by:
1. First `<main>` element in the document
2. Falls back to `<body>` if no `<main>` exists

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support
