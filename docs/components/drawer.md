<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/drawer.md -->

# Drawer Component
`<snice-drawer>`

Slide-out panel from any viewport side with focus trap and dismissal options. Supports inline mode for persistent sidebars and responsive breakpoint switching.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `open` | `open` | `boolean` | `false` | Whether the drawer is visible |
| `position` | `position` | `'left' \| 'right' \| 'top' \| 'bottom'` | `'left'` | Side from which the drawer slides in |
| `size` | `size` | `'small' \| 'medium' \| 'large' \| 'xl' \| 'xxl' \| 'xxxl' \| 'full'` | `'medium'` | Width/height of the drawer |
| `inline` | `inline` | `boolean` | `false` | Render in document flow as a persistent sidebar |
| `breakpoint` | `breakpoint` | `number` | `0` | Viewport width (px) above which drawer switches to inline mode |
| `noHeader` | `no-header` | `boolean` | `false` | Hide the header (title + close button) entirely |
| `noFooter` | `no-footer` | `boolean` | `false` | Hide the footer slot entirely |
| `noBackdrop` | `no-backdrop` | `boolean` | `false` | Hide the backdrop overlay |
| `noBackdropDismiss` | `no-backdrop-dismiss` | `boolean` | `false` | Prevent closing when clicking backdrop |
| `noEscapeDismiss` | `no-escape-dismiss` | `boolean` | `false` | Prevent closing with Escape key |
| `noFocusTrap` | `no-focus-trap` | `boolean` | `false` | Disable focus trapping |
| `persistent` | `persistent` | `boolean` | `false` | Hide close button and prevent all dismissal |
| `pushContent` | `push-content` | `boolean` | `false` | Push main content instead of overlaying |
| `contained` | `contained` | `boolean` | `false` | Position relative to parent instead of viewport |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `show()` | -- | Open the drawer |
| `hide()` | -- | Close the drawer |
| `toggle()` | -- | Toggle the drawer open/closed state |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `drawer-open` | `{ drawer }` | Fired when the drawer opens |
| `drawer-close` | `{ drawer }` | Fired when the drawer closes |

## Slots

| Name | Description |
|------|-------------|
| (default) | Main content of the drawer body |
| `title` | Content for the drawer header/title area |
| `footer` | Content for the drawer footer, typically action buttons |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--drawer-width-small` | Small drawer width | `var(--snice-size-drawer-small, 15rem)` |
| `--drawer-width-medium` | Medium drawer width | `var(--snice-size-drawer-medium, 20rem)` |
| `--drawer-width-large` | Large drawer width | `var(--snice-size-drawer-large, 30rem)` |
| `--drawer-width-xl` | XL drawer width | `var(--snice-size-drawer-xl, 40rem)` |
| `--drawer-width-xxl` | XXL drawer width | `var(--snice-size-drawer-xxl, 50rem)` |
| `--drawer-width-xxxl` | XXXL drawer width | `var(--snice-size-drawer-xxxl, 60rem)` |
| `--drawer-height-small` | Small drawer height (top/bottom) | `12.5rem` |
| `--drawer-height-medium` | Medium drawer height (top/bottom) | `25rem` |
| `--drawer-height-large` | Large drawer height (top/bottom) | `37.5rem` |
| `--drawer-height-xl` | XL drawer height (top/bottom) | `70vh` |
| `--drawer-height-xxl` | XXL drawer height (top/bottom) | `80vh` |
| `--drawer-height-xxxl` | XXXL drawer height (top/bottom) | `90vh` |
| `--drawer-bg` | Drawer background color | `var(--snice-color-background, white)` |
| `--drawer-shadow` | Drawer shadow | `var(--snice-shadow-lg)` |
| `--drawer-backdrop` | Backdrop color | `rgba(0, 0, 0, 0.5)` |
| `--drawer-transition` | Transition timing | `transform 250ms cubic-bezier(0.4, 0, 0.2, 1)` |
| `--drawer-z-index` | Z-index | `var(--snice-z-index-modal, 1050)` |

## CSS Parts

| Part | Description |
|------|-------------|
| `backdrop` | Backdrop overlay |
| `base` | The drawer panel container |
| `header` | Header section |
| `title` | Title wrapper (h2) |
| `close` | Close button |
| `body` | Body content section |
| `footer` | Footer section |

## Basic Usage

```typescript
import 'snice/components/drawer/snice-drawer';
```

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
openDrawer.addEventListener('click', () => myDrawer.show());
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-drawer.min.js"></script>
```

## Examples

### Position Variants

Use the `position` attribute to control which side the drawer slides in from.

```html
<snice-drawer position="left">
  <h2 slot="title">Left Drawer</h2>
  <p>Slides in from the left</p>
</snice-drawer>

<snice-drawer position="right">
  <h2 slot="title">Right Drawer</h2>
  <p>Slides in from the right</p>
</snice-drawer>

<snice-drawer position="top">
  <h2 slot="title">Top Drawer</h2>
  <p>Slides in from the top</p>
</snice-drawer>

<snice-drawer position="bottom">
  <h2 slot="title">Bottom Drawer</h2>
  <p>Slides in from the bottom</p>
</snice-drawer>
```

### Size Variants

Use the `size` attribute to control the drawer's width (or height for top/bottom).

```html
<snice-drawer size="small"><h2 slot="title">Small</h2></snice-drawer>
<snice-drawer size="medium"><h2 slot="title">Medium</h2></snice-drawer>
<snice-drawer size="large"><h2 slot="title">Large</h2></snice-drawer>
<snice-drawer size="xl"><h2 slot="title">XL</h2></snice-drawer>
<snice-drawer size="full"><h2 slot="title">Full</h2></snice-drawer>
```

### Without Backdrop

Set `no-backdrop` to remove the background overlay.

```html
<snice-drawer no-backdrop>
  <h2 slot="title">No Backdrop</h2>
  <p>This drawer has no background overlay.</p>
</snice-drawer>
```

### Persistent Drawer

Set `persistent` to hide the close button and prevent all user-initiated dismissal.

```html
<snice-drawer persistent>
  <h2 slot="title">Persistent Drawer</h2>
  <p>No close button, must be closed programmatically.</p>
</snice-drawer>
```

### Push Content

Use `<snice-drawer-target>` to wrap content that should be pushed aside when a drawer opens.

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

#### Drawer Target Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `for` | `string` | `''` | ID of the linked `<snice-drawer>` element |
| `push` | `string` | `''` | Current push amount (e.g. `'240px'`), set automatically |

The target watches the drawer's `open` attribute via MutationObserver, measures the drawer panel's width/height, and applies a smooth CSS transform.

### Inline Mode

Set `inline` to render the drawer as a persistent sidebar in document flow.

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
  </main>
</div>
```

In inline mode: no overlay, backdrop, focus trap, or escape handler. A border separator is applied based on position (left = right border, etc.).

### Responsive Breakpoint

Use `breakpoint` to switch between inline (above breakpoint) and overlay (below breakpoint) modes.

```html
<snice-drawer breakpoint="768" position="left" size="small">
  <span slot="title">Navigation</span>
  <nav>
    <a href="/">Home</a>
    <a href="/products">Products</a>
  </nav>
</snice-drawer>
```

Uses `window.matchMedia` internally. Above the breakpoint, the `inline` attribute is set automatically. Below, it reverts to overlay mode.

### Filters Panel

Use a right-side drawer for filter controls.

```html
<snice-drawer id="filtersDrawer" position="right" size="small">
  <h2 slot="title">Filters</h2>

  <div style="display: flex; flex-direction: column; gap: 1rem;">
    <label><input type="checkbox"> In Stock</label>
    <label><input type="checkbox"> On Sale</label>
    <label>Price Range <input type="range" min="0" max="1000"></label>
  </div>

  <div slot="footer">
    <button onclick="this.closest('snice-drawer').hide()">Apply</button>
  </div>
</snice-drawer>
```

### Event Handling

Listen for open/close events.

```typescript
drawer.addEventListener('drawer-open', () => {
  console.log('Drawer opened');
});

drawer.addEventListener('drawer-close', () => {
  console.log('Drawer closed');
});
```

## Keyboard Navigation

- **Escape** - Close drawer (unless `no-escape-dismiss` or `persistent`)
- **Tab** - Cycle through focusable elements within drawer (trapped)
- **Shift + Tab** - Reverse cycle through focusable elements

## Accessibility

- `role="dialog"` and `aria-modal="true"` on the drawer container
- `aria-hidden` reflects visibility state on the host element
- Focus trap keeps keyboard navigation within the drawer
- Focus restoration returns focus to the trigger element on close
- Escape key support for closing (configurable)
- Close button is keyboard accessible with `aria-label="Close"`
- Contained mode skips focus trap and body scroll lock (in-page, not modal)
