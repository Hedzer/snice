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
'modal-open'   // Emitted when modal opens. Detail: { modal }
'modal-close'  // Emitted when modal closes. Detail: { modal }
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

**Template syntax:**
```typescript
html`
  <snice-modal
    ?open=${this.isOpen}
    label="Confirm Action"
    @modal-close=${() => this.handleClose()}>
    <span slot="header">Title</span>
    <p>Content</p>
    <div slot="footer">
      <snice-button @click=${() => this.close()}>Cancel</snice-button>
    </div>
  </snice-modal>
`
```

**Imperative:**
```typescript
const modal = document.querySelector('snice-modal');
modal.show();
modal.close();

modal.addEventListener('modal-close', (e) => {
  console.log('Modal closed');
});
```

## Features

- Body scroll lock when open
- Focus trap with Tab navigation
- Focus restoration on close
- Backdrop click to close
- Escape key to close
- ARIA attributes (role, aria-modal, aria-label, aria-hidden)
