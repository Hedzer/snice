# snice-drawer

Slide-out panel from any viewport side with focus trap and dismissal options. Supports inline mode for persistent sidebars and responsive breakpoint switching.

## Properties

```typescript
open: boolean = false;                         // Visibility state
position: 'left'|'right'|'top'|'bottom' = 'left';
size: 'small'|'medium'|'large'|'xl'|'xxl'|'xxxl'|'full' = 'medium';
inline: boolean = false;                       // Sit in document flow (no overlay/backdrop/focus-trap)
breakpoint: number = 0;                        // Viewport px width: above → inline, below → overlay
noHeader: boolean = false;                      // attribute: no-header — hide header entirely
noFooter: boolean = false;                      // attribute: no-footer — hide footer entirely
noBackdrop: boolean = false;                   // attribute: no-backdrop
noBackdropDismiss: boolean = false;            // attribute: no-backdrop-dismiss
noEscapeDismiss: boolean = false;              // attribute: no-escape-dismiss
noFocusTrap: boolean = false;                  // attribute: no-focus-trap
persistent: boolean = false;                   // Hide close button, prevent all dismiss
pushContent: boolean = false;                  // attribute: push-content
contained: boolean = false;                    // Position relative to parent
```

## Methods

```typescript
show()    // Open drawer
hide()    // Close drawer
toggle()  // Toggle drawer
```

## Events

```typescript
'drawer-open'   // { drawer }
'drawer-close'  // { drawer }
```

## Slots

```html
<snice-drawer>
  <h2 slot="title">Title</h2>
  <div>Body content</div>
  <div slot="footer">Actions</div>
</snice-drawer>
```

## Usage

```html
<snice-drawer id="menu" position="left">
  <h2 slot="title">Menu</h2>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
</snice-drawer>
```

```typescript
drawer.show();
drawer.hide();
drawer.toggle();
```

## Inline Mode

Renders in document flow — no overlay, backdrop, focus trap, or escape handler. Drawer panel is always visible.

```html
<!-- Always-visible sidebar -->
<div style="display:flex; height:100vh">
  <snice-drawer inline position="left" size="small">
    <span slot="title">Sidebar</span>
    <nav>...</nav>
  </snice-drawer>
  <main>...</main>
</div>
```

- CSS uses border separator instead of box-shadow
- `open` property is ignored (always visible)
- Border direction matches `position` (left→border-right, right→border-left, etc.)

## Breakpoint Mode

Responsive switching: inline above the breakpoint, overlay below. Uses `window.matchMedia`.

```html
<!-- Inline on desktop (≥768px), overlay on mobile (<768px) -->
<snice-drawer breakpoint="768" position="left" size="small">
  <span slot="title">Navigation</span>
  ...
</snice-drawer>
```

- Sets/removes the `inline` attribute dynamically via matchMedia listener
- Crossing the breakpoint while open: overlay behaviors torn down/set up automatically
- Listener cleaned up on `@dispose()`
- `@watch('breakpoint')` tears down old listener and sets up new one when value changes

## Features

- Slides from any edge (left, right, top, bottom)
- Multiple size options
- Focus trap with Tab navigation
- Focus restoration on close
- Backdrop click to close
- Escape key to close
- Push content mode
- Persistent mode (no close button)
- Inline mode (persistent sidebar in document flow)
- Breakpoint mode (responsive inline ↔ overlay switching)
- ARIA attributes (role, aria-modal, aria-hidden)

## CSS Parts

- `backdrop` - Backdrop overlay
- `base` - The drawer panel container
- `header` - Header section
- `title` - Title wrapper (h2)
- `close` - Close button
- `body` - Body content section
- `footer` - Footer section
