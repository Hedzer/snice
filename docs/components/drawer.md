<!-- AI: For a low-token version of this doc, use docs/ai/components/drawer.md instead -->

# Drawer Component

The `<snice-drawer>` component provides a slide-out panel that appears from any side of the viewport. It's commonly used for navigation menus, filters, settings panels, or additional content that shouldn't occupy permanent screen space.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)
- [Behavior](#behavior)
- [Browser Support](#browser-support)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` | `boolean` | `false` | Whether the drawer is visible |
| `position` | `'left' \| 'right' \| 'top' \| 'bottom'` | `'left'` | Side from which the drawer slides in |
| `size` | `'small' \| 'medium' \| 'large' \| 'xl' \| 'xxl' \| 'xxxl' \| 'full'` | `'medium'` | Width/height of the drawer |
| `noHeader` | `boolean` | `false` | Hide the header (title + close button) entirely |
| `noFooter` | `boolean` | `false` | Hide the footer slot entirely |
| `noBackdrop` | `boolean` | `false` | Hide the backdrop overlay |
| `noBackdropDismiss` | `boolean` | `false` | Prevent closing when clicking backdrop |
| `noEscapeDismiss` | `boolean` | `false` | Prevent closing with Escape key |
| `noFocusTrap` | `boolean` | `false` | Disable focus trapping |
| `persistent` | `boolean` | `false` | Hide close button and prevent all dismissal |
| `pushContent` | `boolean` | `false` | Push main content instead of overlaying |
| `contained` | `boolean` | `false` | Position relative to parent instead of viewport |
| `inline` | `boolean` | `false` | Render in document flow as a persistent sidebar |
| `breakpoint` | `number` | `0` | Viewport width (px) above which drawer switches to inline mode |

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

### `drawer-open`
Fired when the drawer opens.

**Event Detail:**
```typescript
{
  drawer: SniceDrawerElement; // Reference to the drawer element
}
```

**Usage:**
```typescript
drawer.addEventListener('drawer-open', (e) => {
  console.log('Drawer opened:', e.detail.drawer);
});
```

### `drawer-close`
Fired when the drawer closes.

**Event Detail:**
```typescript
{
  drawer: SniceDrawerElement; // Reference to the drawer element
}
```

**Usage:**
```typescript
drawer.addEventListener('drawer-close', (e) => {
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

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `backdrop` | `<div>` | Backdrop overlay |
| `base` | `<div>` | The drawer panel container |
| `header` | `<div>` | Header section |
| `title` | `<h2>` | Title wrapper |
| `close` | `<button>` | Close button |
| `body` | `<div>` | Body content section |
| `footer` | `<div>` | Footer section |

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

openDrawer.addEventListener('click', () => myDrawer.show());
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
```

```typescript
toggle.addEventListener('click', () => drawer.toggle());
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

Use `<snice-drawer-target>` to wrap content that should be pushed aside when a drawer opens. Link it to a drawer using the `for` attribute.

```html
<div style="position: relative; height: 400px; overflow: hidden;">
  <snice-drawer id="sidebar" position="left" size="small" contained push-content>
    <span slot="title">Navigation</span>
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
    </nav>
  </snice-drawer>

  <snice-drawer-target for="sidebar">
    <main>
      <h1>Main Content</h1>
      <p>This content slides when the drawer opens.</p>
    </main>
  </snice-drawer-target>
</div>
```

The `<snice-drawer-target>` component:
- Watches the linked drawer's `open` attribute via MutationObserver
- Measures the drawer panel's actual width/height
- Applies a smooth `translateX()` or `translateY()` transform
- Automatically resets when the drawer closes
- Handles `overflow:hidden` parent scroll reset

#### Drawer Target Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `for` | `string` | `''` | ID of the linked `<snice-drawer>` element |
| `push` | `string` | `''` | Current push amount (e.g. `'240px'`). Set automatically when linked to a drawer, or set manually for custom control. |

### Inline Mode

The `inline` attribute renders the drawer directly in the document flow as a persistent sidebar. No overlay, backdrop, focus trap, or escape handler is used. The drawer is always visible and participates in the parent's layout.

```html
<div style="display: flex; height: 100vh;">
  <snice-drawer inline position="left" size="small">
    <span slot="title">Sidebar</span>
    <nav>
      <a href="/">Home</a>
      <a href="/explore">Explore</a>
      <a href="/settings">Settings</a>
    </nav>
  </snice-drawer>

  <main style="flex: 1; padding: 1rem;">
    <h1>Main Content</h1>
    <p>The sidebar sits alongside this content.</p>
  </main>
</div>
```

A border separator is automatically applied based on the `position`:
- `left` → right border
- `right` → left border
- `top` → bottom border
- `bottom` → top border

### Responsive Breakpoint

The `breakpoint` attribute enables responsive behavior: the drawer renders inline when the viewport is at or above the specified width (in pixels), and switches to a standard overlay drawer below it.

```html
<!-- Inline sidebar on desktop (≥768px), overlay drawer on mobile (<768px) -->
<snice-drawer breakpoint="768" position="left" size="small">
  <span slot="title">Navigation</span>
  <nav>
    <a href="/">Home</a>
    <a href="/products">Products</a>
    <a href="/settings">Settings</a>
  </nav>
</snice-drawer>
```

The breakpoint uses `window.matchMedia` internally. When the viewport crosses the breakpoint:
- **Above breakpoint**: The `inline` attribute is set automatically. Overlay behaviors (backdrop, focus trap, escape handler) are torn down.
- **Below breakpoint**: The `inline` attribute is removed. The drawer reverts to standard overlay mode.

You can combine `breakpoint` with `open` to control the overlay state on mobile:

```html
<snice-drawer id="nav" breakpoint="1024" position="left" size="small">
  <span slot="title">Menu</span>
  <nav>...</nav>
</snice-drawer>

<button onclick="document.getElementById('nav').toggle()">
  Toggle Menu
</button>
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
```

```typescript
showFilters.addEventListener('click', () => filtersDrawer.show());
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
```

```typescript
showSettings.addEventListener('click', () => settingsDrawer.show());

settingsForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(settingsForm);
  console.log('Settings:', Object.fromEntries(data));
  settingsDrawer.hide();
});
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
```

```typescript
menuBtn.addEventListener('click', () => navDrawer.show());

// Close drawer when clicking a link
navDrawer.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navDrawer.hide());
});
```

### With Event Handling

```typescript
drawer.addEventListener('drawer-open', () => {
  console.log('Drawer opened');
  // Pause video, load content, etc.
});

drawer.addEventListener('drawer-close', () => {
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
```

```typescript
showDetails.addEventListener('click', async () => {
  detailsDrawer.show();

  // Fetch data
  const response = await fetch('/api/item/123');
  const item = await response.json();

  // Update content
  itemTitle.textContent = item.name;
  itemContent.innerHTML = `
    <dl>
      <dt>Price:</dt>
      <dd>$${item.price}</dd>
      <dt>Description:</dt>
      <dd>${item.description}</dd>
    </dl>
  `;
});
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

    menuBtn.addEventListener('click', () => navDrawer.show());

    // Close drawer on link click
    navDrawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navDrawer.hide();
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

When `push-content` is set on a drawer, use `<snice-drawer-target for="drawer-id">` to wrap the content that should be pushed aside. The target element watches the drawer's open state and applies a CSS transform to slide its contents. This approach uses transforms (not margins) for smooth 60fps animations and avoids layout thrash.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support
