# snice-modal

Dialog overlay with focus trap, backdrop dismiss, and accessibility.

## Properties

```typescript
open: boolean = false;                        // Visibility state
size: 'small'|'medium'|'large'|'fullscreen' = 'medium';
noBackdropDismiss: boolean = false;           // Prevent backdrop click close
noEscapeDismiss: boolean = false;             // Prevent Escape key close
noFocusTrap: boolean = false;                 // Disable focus trapping
noCloseButton: boolean = false;               // Hide close button
label: string = '';                           // Accessible label
```

## Methods

```typescript
show()   // Open modal
close()  // Close modal
```

## Events

```typescript
'@snice/modal-open'   // { modal }
'@snice/modal-close'  // { modal }
```

## Slots

```html
<snice-modal>
  <div slot="header">Title</div>
  <div>Body content</div>
  <div slot="footer">Actions</div>
</snice-modal>
```

## Usage

```html
<snice-modal id="myModal" label="Confirm">
  <div slot="header"><h2>Confirm</h2></div>
  <p>Are you sure?</p>
  <div slot="footer">
    <button onclick="this.closest('snice-modal').close()">Cancel</button>
    <button onclick="this.closest('snice-modal').close()">OK</button>
  </div>
</snice-modal>
```

```typescript
const modal = document.querySelector('snice-modal');
modal.show();
modal.close();
```

## Features

- Body scroll lock when open
- Focus trap with Tab navigation
- Focus restoration on close
- Backdrop click to close
- Escape key to close
- ARIA attributes (role, aria-modal, aria-label, aria-hidden)
