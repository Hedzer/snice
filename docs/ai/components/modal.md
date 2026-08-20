# snice-modal

Dialog overlay with focus trap, backdrop dismiss, and accessibility.

## Properties

```ts
open: boolean = false;
size: 'small'|'medium'|'large'|'fullscreen' = 'medium';
noBackdropDismiss: boolean = false;  // attr: no-backdrop-dismiss
noEscapeDismiss: boolean = false;    // attr: no-escape-dismiss
noFocusTrap: boolean = false;        // attr: no-focus-trap
noCloseButton: boolean = false;      // attr: no-close-button
noHeader: boolean = false;           // attr: no-header
noFooter: boolean = false;           // attr: no-footer
label: string = '';                  // Accessible label
topLayer: boolean = false;           // attr: top-layer — show in browser top layer (Popover API)
container?: string | Element;        // attr: container — center inside this element's box (CSS selector or Element)
```

- `top-layer` renders the overlay in the browser TOP LAYER (native `popover="manual"` + `showPopover()`), immune to ancestor stacking contexts — no z-index can lose to `header { z-index: 1020 }`. Unsupported engines fall back to class-only toggle. z-index is irrelevant while in the top layer.
- `container` pins the fixed overlay to the container's bounding box; the panel centers inside it (exclude a sidebar: `container="main"`). Unresolvable selector → viewport fallback + console.warn. Re-measured on container resize/scroll and window resize while open. Panel `max-height` becomes container-relative when set.

## Methods

- `show()` → Open modal
- `close()` → Close modal

## Events

- `modal-open` → `{ modal: SniceModalElement }`
- `modal-close` → `{ modal: SniceModalElement }`

## Slots

- `(default)` - Modal body content
- `header` - Header content (title)
- `footer` - Footer content (action buttons)

## CSS Parts

- `backdrop` - Backdrop overlay
- `panel` - Modal panel container
- `header` - Header section
- `close` - Close button
- `body` - Body content section
- `footer` - Footer section

## Basic Usage

```typescript
import 'snice/components/modal/snice-modal';
```

```html
<snice-modal label="Confirm Action">
  <div slot="header"><h2>Confirm</h2></div>
  <p>Are you sure?</p>
  <div slot="footer">
    <button onclick="this.closest('snice-modal').close()">Cancel</button>
    <button onclick="this.closest('snice-modal').close()">Confirm</button>
  </div>
</snice-modal>
```

```typescript
modal.show();
modal.close();
modal.addEventListener('modal-close', () => console.log('Closed'));
```

## Examples

```html
<!-- Overlay above any ancestor stacking context (e.g. a shell header) -->
<snice-modal top-layer label="Confirm Action">...</snice-modal>

<!-- Center inside a container instead of the viewport (excludes a sidebar) -->
<snice-modal container=".main" label="Edit Profile">...</snice-modal>
```

```typescript
// Both at once: top layer, constrained to the container's box
modal.topLayer = true;
modal.container = document.querySelector('.main');
```

## CSS Custom Properties

- `--snice-modal-backdrop` - Modal backdrop

## Keyboard Navigation

- Escape closes (unless `no-escape-dismiss`)
- Tab/Shift+Tab cycle focus within modal

## Accessibility

- `role="dialog"` + `aria-modal="true"` + `aria-label`
- Focus trapped by default (`no-focus-trap` disables); first focusable element focused on open, previous focus restored on close
- Body scroll locked while open
- Close button labelled `Close modal`
