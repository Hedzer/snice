# snice-drawer

Slide-out panel from any viewport side with focus trap and dismissal options.

## Properties

```typescript
open: boolean = false;                         // Visibility state
position: 'left'|'right'|'top'|'bottom' = 'left';
size: 'small'|'medium'|'large'|'xl'|'xxl'|'xxxl'|'full' = 'medium';
noBackdrop: boolean = false;                   // Hide backdrop overlay
noBackdropDismiss: boolean = false;            // Prevent backdrop click close
noEscapeDismiss: boolean = false;              // Prevent Escape key close
noFocusTrap: boolean = false;                  // Disable focus trapping
persistent: boolean = false;                   // Hide close button, prevent all dismiss
pushContent: boolean = false;                  // Push main content instead of overlay
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
const drawer = document.querySelector('snice-drawer');
drawer.show();
drawer.hide();
drawer.toggle();
```

## Features

- Slides from any edge (left, right, top, bottom)
- Multiple size options
- Focus trap with Tab navigation
- Focus restoration on close
- Backdrop click to close
- Escape key to close
- Push content mode
- Persistent mode (no close button)
- ARIA attributes (role, aria-modal, aria-hidden)

## Notes

- Push content targets first `<main>` or `<body>`
- Contained mode positions relative to parent
- Default dismissal: close button, backdrop click, Escape key
