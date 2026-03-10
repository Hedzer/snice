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
```

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

## Keyboard Navigation

- Escape closes (unless `no-escape-dismiss`)
- Tab/Shift+Tab cycle focus within modal
