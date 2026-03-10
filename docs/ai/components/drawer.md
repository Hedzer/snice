# snice-drawer

Slide-out panel from any viewport side with focus trap and dismissal options. Supports inline mode for persistent sidebars and responsive breakpoint switching.

## Properties

```typescript
open: boolean = false;
position: 'left'|'right'|'top'|'bottom' = 'left';
size: 'small'|'medium'|'large'|'xl'|'xxl'|'xxxl'|'full' = 'medium';
inline: boolean = false;                       // Sit in document flow (no overlay/backdrop/focus-trap)
breakpoint: number = 0;                        // Viewport px width: above → inline, below → overlay
noHeader: boolean = false;                     // attribute: no-header
noFooter: boolean = false;                     // attribute: no-footer
noBackdrop: boolean = false;                   // attribute: no-backdrop
noBackdropDismiss: boolean = false;            // attribute: no-backdrop-dismiss
noEscapeDismiss: boolean = false;              // attribute: no-escape-dismiss
noFocusTrap: boolean = false;                  // attribute: no-focus-trap
persistent: boolean = false;                   // Hide close button, prevent all dismiss
pushContent: boolean = false;                  // attribute: push-content
contained: boolean = false;                    // Position relative to parent
```

## Methods

- `show()` - Open drawer
- `hide()` - Close drawer
- `toggle()` - Toggle drawer

## Events

- `drawer-open` → `{ drawer }` - Drawer opened
- `drawer-close` → `{ drawer }` - Drawer closed

## Slots

- `(default)` - Body content
- `title` - Header title text
- `footer` - Footer actions

## CSS Custom Properties

- `--drawer-width-small` through `--drawer-width-xxxl` - Width per size
- `--drawer-height-small` through `--drawer-height-xxxl` - Height per size (top/bottom)
- `--drawer-bg` - Background (default: `var(--snice-color-background, white)`)
- `--drawer-shadow` - Shadow (default: `var(--snice-shadow-lg)`)
- `--drawer-backdrop` - Backdrop color (default: `rgba(0, 0, 0, 0.5)`)
- `--drawer-transition` - Transition timing
- `--drawer-z-index` - Z-index (default: `1050`)

## CSS Parts

- `backdrop` - Backdrop overlay
- `base` - Drawer panel container
- `header` - Header section
- `title` - Title wrapper (h2)
- `close` - Close button
- `body` - Body content section
- `footer` - Footer section

## Basic Usage

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

Renders in document flow — no overlay, backdrop, focus trap, or escape handler.

```html
<div style="display:flex; height:100vh">
  <snice-drawer inline position="left" size="small">
    <span slot="title">Sidebar</span>
    <nav>...</nav>
  </snice-drawer>
  <main>...</main>
</div>
```

## Breakpoint Mode

Responsive: inline above breakpoint, overlay below. Uses `window.matchMedia`.

```html
<snice-drawer breakpoint="768" position="left" size="small">...</snice-drawer>
```

## Push Content with `<snice-drawer-target>`

```html
<snice-drawer id="nav" position="left" size="small" contained push-content>...</snice-drawer>
<snice-drawer-target for="nav">
  <main>Content slides when drawer opens</main>
</snice-drawer-target>
```

Target properties: `for: string` (drawer ID), `push: string` (auto-set amount).

## Keyboard Navigation

- Escape closes drawer (unless no-escape-dismiss/persistent)
- Tab/Shift+Tab cycles focusable elements (focus trapped)

## Accessibility

- role=dialog, aria-modal=true on drawer
- aria-hidden reflects visibility
- Focus trap + focus restoration
- Contained mode skips focus trap and body scroll lock
