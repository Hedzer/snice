<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/modal.md -->

# Modal
`<snice-modal>`

A dialog overlay with focus trapping, backdrop dismiss, and keyboard navigation.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` | `boolean` | `false` | Whether the modal is visible |
| `size` | `'small' \| 'medium' \| 'large' \| 'fullscreen'` | `'medium'` | Modal width variant |
| `noBackdropDismiss` (attr: `no-backdrop-dismiss`) | `boolean` | `false` | Prevent closing on backdrop click |
| `noEscapeDismiss` (attr: `no-escape-dismiss`) | `boolean` | `false` | Prevent closing with Escape key |
| `noFocusTrap` (attr: `no-focus-trap`) | `boolean` | `false` | Disable focus trapping |
| `noCloseButton` (attr: `no-close-button`) | `boolean` | `false` | Hide the close button |
| `noHeader` (attr: `no-header`) | `boolean` | `false` | Hide the header section entirely |
| `noFooter` (attr: `no-footer`) | `boolean` | `false` | Hide the footer section entirely |
| `label` | `string` | `''` | Accessible label for screen readers |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `show()` | -- | Opens the modal |
| `close()` | -- | Closes the modal |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `modal-open` | `{ modal: SniceModalElement }` | Fired when the modal opens |
| `modal-close` | `{ modal: SniceModalElement }` | Fired when the modal closes |

## Slots

| Name | Description |
|------|-------------|
| (default) | Modal body content |
| `header` | Header content (typically a title) |
| `footer` | Footer content (typically action buttons) |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `backdrop` | `<div>` | The backdrop overlay |
| `panel` | `<div>` | The modal panel container |
| `header` | `<div>` | Header section |
| `close` | `<button>` | Close button |
| `body` | `<div>` | Body content section |
| `footer` | `<div>` | Footer section |

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

### Confirmation Dialog

```html
<button id="deleteBtn">Delete Item</button>

<snice-modal id="confirmModal" size="small" label="Confirm Delete">
  <div slot="header"><h2>Confirm Delete</h2></div>
  <p>Are you sure? This action cannot be undone.</p>
  <div slot="footer">
    <button onclick="this.closest('snice-modal').close()">Cancel</button>
    <button id="confirmBtn">Delete</button>
  </div>
</snice-modal>
```

```typescript
deleteBtn.addEventListener('click', () => modal.show());
confirmBtn.addEventListener('click', () => {
  console.log('Item deleted');
  modal.close();
});
```

### Form in Modal

```html
<snice-modal label="Edit Profile">
  <div slot="header"><h2>Edit Profile</h2></div>
  <form style="display:flex;flex-direction:column;gap:1rem;">
    <label>Name: <input type="text" name="name" required></label>
    <label>Email: <input type="email" name="email" required></label>
  </form>
  <div slot="footer">
    <button onclick="this.closest('snice-modal').close()">Cancel</button>
    <button type="submit">Save</button>
  </div>
</snice-modal>
```

### Programmatic Control

```typescript
modal.show();  // Open
modal.close(); // Close

modal.addEventListener('modal-open', () => console.log('Opened'));
modal.addEventListener('modal-close', () => console.log('Closed'));
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Escape | Close the modal (unless `no-escape-dismiss` is set) |
| Tab | Cycle through focusable elements within the modal |
| Shift+Tab | Cycle backwards through focusable elements |

## Accessibility

- Uses `role="dialog"` with `aria-modal="true"` and `aria-label`
- Focus is trapped within the modal by default (disable with `no-focus-trap`)
- First focusable element receives focus on open
- Previous focus is restored on close
- Body scroll is locked while modal is open
- Close button has `aria-label="Close modal"`
