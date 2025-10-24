# Modal Component

The `<snice-modal>` component provides a dialog overlay for displaying content on top of the main page. It includes features like focus trapping, backdrop dismiss, keyboard navigation, and accessibility support.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [Examples](#examples)

## Basic Usage

```html
<snice-modal label="Confirm Action">
  <div slot="header">
    <h2>Confirm</h2>
  </div>

  <p>Are you sure you want to proceed?</p>

  <div slot="footer">
    <button>Cancel</button>
    <button>Confirm</button>
  </div>
</snice-modal>
```

```typescript
import 'snice/components/modal/snice-modal';

const modal = document.querySelector('snice-modal');

// Open the modal
modal.show();

// Listen for events
modal.addEventListener('@snice/modal-close', () => {
  console.log('Modal closed');
});
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` | `boolean` | `false` | Whether the modal is visible |
| `size` | `'small' \| 'medium' \| 'large' \| 'fullscreen'` | `'medium'` | Size variant of the modal |
| `noBackdropDismiss` | `boolean` | `false` | Prevent closing when clicking backdrop |
| `noEscapeDismiss` | `boolean` | `false` | Prevent closing with Escape key |
| `noFocusTrap` | `boolean` | `false` | Disable focus trapping |
| `noCloseButton` | `boolean` | `false` | Hide the close button in header |
| `label` | `string` | `''` | Accessible label for the modal |

## Methods

### `show(): void`
Open the modal.

```typescript
modal.show();
```

### `close(): void`
Close the modal.

```typescript
modal.close();
```

## Events

### `@snice/modal-open`
Fired when the modal opens.

**Event Detail:**
```typescript
{
  modal: SniceModalElement; // Reference to the modal element
}
```

**Usage:**
```typescript
modal.addEventListener('@snice/modal-open', (e) => {
  console.log('Modal opened:', e.detail.modal);
});
```

### `@snice/modal-close`
Fired when the modal closes.

**Event Detail:**
```typescript
{
  modal: SniceModalElement; // Reference to the modal element
}
```

**Usage:**
```typescript
modal.addEventListener('@snice/modal-close', (e) => {
  console.log('Modal closed:', e.detail.modal);
});
```

## Slots

### `header` (named slot)
Content for the modal header. Typically used for titles.

```html
<snice-modal>
  <div slot="header">
    <h2>Modal Title</h2>
  </div>
</snice-modal>
```

### Default slot
Main content of the modal body.

```html
<snice-modal>
  <p>This goes in the body</p>
</snice-modal>
```

### `footer` (named slot)
Content for the modal footer. Typically used for action buttons.

```html
<snice-modal>
  <div slot="footer">
    <button>Cancel</button>
    <button>OK</button>
  </div>
</snice-modal>
```

## Examples

### Basic Modal

```html
<button id="openModal">Open Modal</button>

<snice-modal id="myModal" label="Example Modal">
  <div slot="header">
    <h2>Hello</h2>
  </div>

  <p>This is a basic modal example.</p>

  <div slot="footer">
    <button id="closeModal">Close</button>
  </div>
</snice-modal>

<script type="module">
  import 'snice/components/modal/snice-modal';

  const modal = document.querySelector('#myModal');
  const openBtn = document.querySelector('#openModal');
  const closeBtn = document.querySelector('#closeModal');

  openBtn.addEventListener('click', () => modal.show());
  closeBtn.addEventListener('click', () => modal.close());
</script>
```

### Size Variants

```html
<!-- Small -->
<snice-modal size="small" label="Small Modal">
  <div slot="header"><h2>Small</h2></div>
  <p>This is a small modal.</p>
</snice-modal>

<!-- Medium (default) -->
<snice-modal size="medium" label="Medium Modal">
  <div slot="header"><h2>Medium</h2></div>
  <p>This is a medium modal.</p>
</snice-modal>

<!-- Large -->
<snice-modal size="large" label="Large Modal">
  <div slot="header"><h2>Large</h2></div>
  <p>This is a large modal.</p>
</snice-modal>

<!-- Fullscreen -->
<snice-modal size="fullscreen" label="Fullscreen Modal">
  <div slot="header"><h2>Fullscreen</h2></div>
  <p>This modal takes up the entire screen.</p>
</snice-modal>
```

### Without Close Button

```html
<snice-modal no-close-button label="Forced Choice">
  <div slot="header">
    <h2>Choose an Option</h2>
  </div>

  <p>You must select one of the options below.</p>

  <div slot="footer">
    <button onclick="this.closest('snice-modal').close()">Option A</button>
    <button onclick="this.closest('snice-modal').close()">Option B</button>
  </div>
</snice-modal>
```

### Prevent Backdrop Dismiss

```html
<snice-modal no-backdrop-dismiss label="Important">
  <div slot="header">
    <h2>Important Information</h2>
  </div>

  <p>Click the button to close, clicking outside won't work.</p>

  <div slot="footer">
    <button onclick="this.closest('snice-modal').close()">I Understand</button>
  </div>
</snice-modal>
```

### Prevent Escape Dismiss

```html
<snice-modal no-escape-dismiss label="Confirmation Required">
  <div slot="header">
    <h2>Confirm Action</h2>
  </div>

  <p>Press Escape won't close this modal.</p>

  <div slot="footer">
    <button onclick="this.closest('snice-modal').close()">Confirm</button>
  </div>
</snice-modal>
```

### Confirmation Dialog

```html
<button id="deleteBtn">Delete Item</button>

<snice-modal id="confirmModal" size="small" label="Confirm Delete">
  <div slot="header">
    <h2>Confirm Delete</h2>
  </div>

  <p>Are you sure you want to delete this item? This action cannot be undone.</p>

  <div slot="footer">
    <button id="cancelBtn">Cancel</button>
    <button id="confirmBtn" style="background: #dc2626; color: white;">Delete</button>
  </div>
</snice-modal>

<script type="module">
  import 'snice/components/modal/snice-modal';

  const deleteBtn = document.querySelector('#deleteBtn');
  const modal = document.querySelector('#confirmModal');
  const cancelBtn = document.querySelector('#cancelBtn');
  const confirmBtn = document.querySelector('#confirmBtn');

  deleteBtn.addEventListener('click', () => {
    modal.show();
  });

  cancelBtn.addEventListener('click', () => {
    modal.close();
  });

  confirmBtn.addEventListener('click', () => {
    // Perform delete action
    console.log('Item deleted');
    modal.close();
  });
</script>
```

### Form in Modal

```html
<button id="showFormModal">Edit Profile</button>

<snice-modal id="formModal" label="Edit Profile">
  <div slot="header">
    <h2>Edit Profile</h2>
  </div>

  <form id="profileForm">
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <div>
        <label for="name">Name:</label>
        <input type="text" id="name" name="name" required>
      </div>
      <div>
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" required>
      </div>
    </div>
  </form>

  <div slot="footer">
    <button type="button" onclick="this.closest('snice-modal').close()">Cancel</button>
    <button type="submit" form="profileForm">Save</button>
  </div>
</snice-modal>

<script type="module">
  import 'snice/components/modal/snice-modal';

  const showBtn = document.querySelector('#showFormModal');
  const modal = document.querySelector('#formModal');
  const form = document.querySelector('#profileForm');

  showBtn.addEventListener('click', () => modal.show());

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    console.log('Saving:', Object.fromEntries(formData));
    modal.close();
  });
</script>
```

### With Event Handling

```typescript
import type { SniceModalElement } from 'snice/components/modal/snice-modal.types';

const modal = document.querySelector<SniceModalElement>('snice-modal');

modal.addEventListener('@snice/modal-open', () => {
  console.log('Modal opened');
  // Pause video, etc.
});

modal.addEventListener('@snice/modal-close', () => {
  console.log('Modal closed');
  // Resume video, etc.
});

// Open programmatically
modal.show();

// Close programmatically
modal.close();

// Toggle based on state
if (modal.open) {
  modal.close();
} else {
  modal.show();
}
```

### Dynamic Content

```html
<button id="showDetails">Show Details</button>

<snice-modal id="detailsModal" label="Item Details">
  <div slot="header">
    <h2 id="itemTitle">Loading...</h2>
  </div>

  <div id="itemContent">
    <p>Loading...</p>
  </div>

  <div slot="footer">
    <button onclick="this.closest('snice-modal').close()">Close</button>
  </div>
</snice-modal>

<script type="module">
  import 'snice/components/modal/snice-modal';

  const showBtn = document.querySelector('#showDetails');
  const modal = document.querySelector('#detailsModal');
  const title = document.querySelector('#itemTitle');
  const content = document.querySelector('#itemContent');

  showBtn.addEventListener('click', async () => {
    modal.show();

    // Fetch data
    const response = await fetch('/api/item/123');
    const item = await response.json();

    // Update modal content
    title.textContent = item.name;
    content.innerHTML = `
      <p><strong>ID:</strong> ${item.id}</p>
      <p><strong>Description:</strong> ${item.description}</p>
      <p><strong>Price:</strong> $${item.price}</p>
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
    .demo-container {
      padding: 2rem;
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .demo-container button {
      padding: 0.5rem 1rem;
      cursor: pointer;
    }

    snice-modal h2 {
      margin: 0;
    }

    snice-modal [slot="footer"] {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }
  </style>

  <script type="module">
    import 'snice/components/modal/snice-modal';

    document.addEventListener('DOMContentLoaded', () => {
      // Setup all modals
      document.querySelectorAll('[data-modal-trigger]').forEach(btn => {
        const modalId = btn.getAttribute('data-modal-trigger');
        const modal = document.querySelector(`#${modalId}`);

        btn.addEventListener('click', () => modal?.show());
      });

      // Setup close buttons
      document.querySelectorAll('[data-modal-close]').forEach(btn => {
        btn.addEventListener('click', () => {
          btn.closest('snice-modal')?.close();
        });
      });
    });
  </script>
</head>
<body>
  <div class="demo-container">
    <button data-modal-trigger="modal1">Small Modal</button>
    <button data-modal-trigger="modal2">Medium Modal</button>
    <button data-modal-trigger="modal3">Large Modal</button>
    <button data-modal-trigger="modal4">Fullscreen Modal</button>
  </div>

  <snice-modal id="modal1" size="small" label="Small Modal">
    <div slot="header"><h2>Small Modal</h2></div>
    <p>This is a small modal with minimal content.</p>
    <div slot="footer">
      <button data-modal-close>Close</button>
    </div>
  </snice-modal>

  <snice-modal id="modal2" size="medium" label="Medium Modal">
    <div slot="header"><h2>Medium Modal</h2></div>
    <p>This is a medium-sized modal with more content.</p>
    <p>It can hold paragraphs, images, forms, and more.</p>
    <div slot="footer">
      <button data-modal-close>Cancel</button>
      <button data-modal-close>OK</button>
    </div>
  </snice-modal>

  <snice-modal id="modal3" size="large" label="Large Modal">
    <div slot="header"><h2>Large Modal</h2></div>
    <p>This is a large modal for displaying lots of content.</p>
    <p>Perfect for detailed forms or extensive information.</p>
    <div slot="footer">
      <button data-modal-close>Close</button>
    </div>
  </snice-modal>

  <snice-modal id="modal4" size="fullscreen" label="Fullscreen Modal">
    <div slot="header"><h2>Fullscreen Modal</h2></div>
    <p>This modal takes up the entire viewport.</p>
    <p>Ideal for immersive experiences or complex workflows.</p>
    <div slot="footer">
      <button data-modal-close>Close</button>
    </div>
  </snice-modal>
</body>
</html>
```

## Accessibility

The modal component includes comprehensive accessibility features:

- `role="dialog"` on the modal container
- `aria-modal="true"` to indicate modal behavior
- `aria-label` for screen reader context
- `aria-hidden` reflects visibility state
- Focus trap keeps keyboard navigation within modal
- Focus restoration returns focus to trigger element on close
- Escape key support for closing
- Close button is keyboard accessible

### Keyboard Support

- **Escape**: Close modal (unless `noEscapeDismiss` is true)
- **Tab**: Cycle through focusable elements within modal (trapped)
- **Shift + Tab**: Reverse cycle through focusable elements

## Behavior

### Focus Management

When a modal opens:
1. Current focus is stored
2. Body scroll is locked
3. Focus moves to first focusable element in modal
4. Tab navigation is trapped within the modal

When a modal closes:
1. Body scroll is restored
2. Focus returns to the previously focused element

### Dismissal

By default, modals can be dismissed by:
- Clicking the close button
- Clicking the backdrop
- Pressing Escape

This behavior can be customized with `noBackdropDismiss`, `noEscapeDismiss`, and `noCloseButton` properties.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support
