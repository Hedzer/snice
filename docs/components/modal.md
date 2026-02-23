[//]: # (AI: For a low-token version of this doc, use docs/ai/components/modal.md instead)

# Modal
`<snice-modal>`

A dialog overlay with focus trapping, backdrop dismiss, and keyboard navigation.

## Basic Usage

```typescript
import 'snice/components/modal/snice-modal';
```

```html
<snice-modal label="Confirm Action">
  <div slot="header"><h2>Confirm</h2></div>
  <p>Are you sure you want to proceed?</p>
  <div slot="footer">
    <button>Cancel</button>
    <button>Confirm</button>
  </div>
</snice-modal>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/modal/snice-modal';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-modal.min.js"></script>
```

## Examples

### Sizes

Use the `size` attribute to set the modal width.

```html
<snice-modal size="small" label="Small Modal">
  <div slot="header"><h2>Small</h2></div>
  <p>Compact dialog for simple confirmations.</p>
</snice-modal>

<snice-modal size="large" label="Large Modal">
  <div slot="header"><h2>Large</h2></div>
  <p>Spacious dialog for detailed forms.</p>
</snice-modal>

<snice-modal size="fullscreen" label="Fullscreen Modal">
  <div slot="header"><h2>Fullscreen</h2></div>
  <p>Takes up the entire viewport.</p>
</snice-modal>
```

### Without Close Button

Set `no-close-button` to hide the default close button.

```html
<snice-modal no-close-button label="Choose an Option">
  <div slot="header"><h2>Required Choice</h2></div>
  <p>Select one of the options below.</p>
  <div slot="footer">
    <button onclick="this.closest('snice-modal').close()">Option A</button>
    <button onclick="this.closest('snice-modal').close()">Option B</button>
  </div>
</snice-modal>
```

### Prevent Backdrop Dismiss

Set `no-backdrop-dismiss` to prevent closing when clicking outside.

```html
<snice-modal no-backdrop-dismiss label="Important Notice">
  <div slot="header"><h2>Important</h2></div>
  <p>Clicking outside won't close this modal.</p>
  <div slot="footer">
    <button onclick="this.closest('snice-modal').close()">I Understand</button>
  </div>
</snice-modal>
```

### Prevent Escape Dismiss

Set `no-escape-dismiss` to prevent closing with the Escape key.

```html
<snice-modal no-escape-dismiss label="Confirmation Required">
  <div slot="header"><h2>Confirm Action</h2></div>
  <p>Pressing Escape won't close this modal.</p>
  <div slot="footer">
    <button onclick="this.closest('snice-modal').close()">Confirm</button>
  </div>
</snice-modal>
```

### Confirmation Dialog

```html
<button id="deleteBtn">Delete Item</button>

<snice-modal id="confirmModal" size="small" label="Confirm Delete">
  <div slot="header"><h2>Confirm Delete</h2></div>
  <p>Are you sure? This action cannot be undone.</p>
  <div slot="footer">
    <button id="cancelBtn">Cancel</button>
    <button id="confirmBtn">Delete</button>
  </div>
</snice-modal>

<script type="module">
  import 'snice/components/modal/snice-modal';

  const modal = document.getElementById('confirmModal');
  document.getElementById('deleteBtn').addEventListener('click', () => modal.show());
  document.getElementById('cancelBtn').addEventListener('click', () => modal.close());
  document.getElementById('confirmBtn').addEventListener('click', () => {
    console.log('Item deleted');
    modal.close();
  });
</script>
```

### Form in Modal

```html
<button id="editBtn">Edit Profile</button>

<snice-modal id="formModal" label="Edit Profile">
  <div slot="header"><h2>Edit Profile</h2></div>
  <form id="profileForm" style="display:flex;flex-direction:column;gap:1rem;">
    <label>Name: <input type="text" name="name" required></label>
    <label>Email: <input type="email" name="email" required></label>
  </form>
  <div slot="footer">
    <button onclick="this.closest('snice-modal').close()">Cancel</button>
    <button type="submit" form="profileForm">Save</button>
  </div>
</snice-modal>

<script type="module">
  import 'snice/components/modal/snice-modal';

  const modal = document.getElementById('formModal');
  document.getElementById('editBtn').addEventListener('click', () => modal.show());
  document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Saved:', Object.fromEntries(new FormData(e.target)));
    modal.close();
  });
</script>
```

### Programmatic Control

```typescript
const modal = document.querySelector('snice-modal');

modal.show();  // Open
modal.close(); // Close

modal.addEventListener('modal-open', () => console.log('Opened'));
modal.addEventListener('modal-close', () => console.log('Closed'));
```

## Slots

| Name | Description |
|------|-------------|
| (default) | Modal body content |
| `header` | Header content (typically a title) |
| `footer` | Footer content (typically action buttons) |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` | `boolean` | `false` | Whether the modal is visible |
| `size` | `'small' \| 'medium' \| 'large' \| 'fullscreen'` | `'medium'` | Modal width variant |
| `noBackdropDismiss` (attr: `no-backdrop-dismiss`) | `boolean` | `false` | Prevent closing on backdrop click |
| `noEscapeDismiss` (attr: `no-escape-dismiss`) | `boolean` | `false` | Prevent closing with Escape key |
| `noFocusTrap` (attr: `no-focus-trap`) | `boolean` | `false` | Disable focus trapping |
| `noCloseButton` (attr: `no-close-button`) | `boolean` | `false` | Hide the close button |
| `label` | `string` | `''` | Accessible label for screen readers |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `modal-open` | `{ modal: SniceModalElement }` | Fired when the modal opens |
| `modal-close` | `{ modal: SniceModalElement }` | Fired when the modal closes |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `show()` | -- | Opens the modal |
| `close()` | -- | Closes the modal |
