[//]: # (AI: For a low-token version of this doc, use docs/ai/components/button.md instead)

# Button Component

The button component provides an interactive element for user actions. It supports multiple variants, sizes, states (loading, disabled), styles (outline, pill, circle), and icons. When `href` is set, clicking navigates via `window.location` (not rendered as an anchor).

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Slots](#slots)
- [Methods](#methods)
- [Examples](#examples)

## Basic Usage

```html
<snice-button>Click me</snice-button>
```

```typescript
import 'snice/components/button/snice-button';
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'text'` | `'default'` | Visual style variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Button type for form integration |
| `disabled` | `boolean` | `false` | Disable the button |
| `loading` | `boolean` | `false` | Show loading spinner |
| `outline` | `boolean` | `false` | Use outline style |
| `pill` | `boolean` | `false` | Use pill (fully rounded) shape |
| `circle` | `boolean` | `false` | Use circle shape (icon only) |
| `href` | `string` | `''` | URL to navigate to (uses window.location, not an anchor tag) |
| `target` | `string` | `''` | Link target attribute |
| `download` | `string` | `''` | Download attribute for file downloads |
| `icon` | `string` | `''` | Icon (URL, image file, emoji, or font ligature) |
| `iconPlacement` | `'start' \| 'end'` | `'start'` | Icon position relative to label |

## Slots

| Slot Name | Description |
|-----------|-------------|
| `icon` | Custom icon content. Overrides the `icon` property when present. Useful for external CSS icon fonts like Material Symbols or Font Awesome that require specific styling to work inside shadow DOM. |
| (default) | Button label content |

### Icon Slot Usage

The `icon` slot allows you to use external CSS-based icon fonts (like Material Symbols, Font Awesome) inside the button's shadow DOM. This is necessary because external fonts cannot style content inside shadow DOM boundaries.

```html
<!-- Material Symbols icon -->
<snice-button variant="primary">
  <span slot="icon" class="material-symbols-outlined">save</span>
  Save Document
</snice-button>

<!-- Font Awesome icon -->
<snice-button variant="danger">
  <i slot="icon" class="fa-solid fa-trash"></i>
  Delete
</snice-button>

<!-- SVG icon -->
<snice-button>
  <svg slot="icon" viewBox="0 0 24 24" width="20" height="20">
    <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/>
  </svg>
  Upload
</snice-button>

<!-- Icon at end position -->
<snice-button icon-placement="end">
  <span slot="icon" class="material-symbols-outlined">arrow_forward</span>
  Next
</snice-button>
```

> **Note**: When using the `icon` slot, the slotted content takes precedence over the `icon` property. The `iconPlacement` property still controls positioning.

## Events

#### `button-click`
Fired when the button is clicked.

**Event Detail:**
```typescript
{
  originalEvent: MouseEvent;
}
```

## Methods

#### `focus(options?: FocusOptions): void`
Focus the button programmatically.

```typescript
button.focus();
button.focus({ preventScroll: true });
```

#### `blur(): void`
Remove focus from the button.

```typescript
button.blur();
```

#### `click(): void`
Programmatically click the button.

```typescript
button.click();
```

## Examples

### Basic Buttons

```html
<!-- Default button -->
<snice-button>Default</snice-button>

<!-- Primary button -->
<snice-button variant="primary">Primary</snice-button>

<!-- Success button -->
<snice-button variant="success">Success</snice-button>

<!-- Warning button -->
<snice-button variant="warning">Warning</snice-button>

<!-- Danger button -->
<snice-button variant="danger">Danger</snice-button>

<!-- Text button -->
<snice-button variant="text">Text Only</snice-button>
```

### Button Sizes

```html
<snice-button size="small">Small</snice-button>
<snice-button size="medium">Medium</snice-button>
<snice-button size="large">Large</snice-button>
```

### Outline Buttons

```html
<snice-button outline>Default Outline</snice-button>
<snice-button variant="primary" outline>Primary Outline</snice-button>
<snice-button variant="success" outline>Success Outline</snice-button>
<snice-button variant="warning" outline>Warning Outline</snice-button>
<snice-button variant="danger" outline>Danger Outline</snice-button>
```

### Pill Buttons

```html
<snice-button pill>Default Pill</snice-button>
<snice-button variant="primary" pill>Primary Pill</snice-button>
<snice-button variant="success" pill>Success Pill</snice-button>
```

### Circle Buttons

```html
<snice-button circle icon="/icons/plus.svg"></snice-button>
<snice-button variant="primary" circle icon="/icons/edit.svg"></snice-button>
<snice-button variant="danger" circle icon="/icons/delete.svg"></snice-button>
```

### Button States

```html
<!-- Disabled -->
<snice-button disabled>Disabled</snice-button>
<snice-button variant="primary" disabled>Primary Disabled</snice-button>

<!-- Loading -->
<snice-button loading>Loading...</snice-button>
<snice-button variant="primary" loading>Saving...</snice-button>

<!-- Disabled and loading cannot be clicked -->
<snice-button disabled loading>Processing...</snice-button>
```

### Buttons with Icons

The `icon` property supports multiple formats:
- **URLs**: Image files (`/icons/save.svg`, `https://...`)
- **Inline SVG**: `<svg viewBox="...">...</svg>`
- **Inline HTML**: `<span class="material-symbols-rounded">save</span>`
- **Emoji**: Direct emoji characters (`→`, `🔍`)
- **Font ligatures**: Text for icon fonts like Material Symbols (`save`, `home`)

```html
<!-- Icon URL -->
<snice-button icon="/icons/arrow-right.svg">Next</snice-button>

<!-- Emoji icon -->
<snice-button icon="→">Next</snice-button>

<!-- Font ligature (Material Symbols) -->
<snice-button icon="arrow_forward">Next</snice-button>

<!-- Inline SVG -->
<snice-button icon="<svg viewBox='0 0 24 24'><path d='M12 2L2 7l10 5 10-5-10-5z'/></svg>">
  Upload
</snice-button>

<!-- Icon at end -->
<snice-button icon="/icons/external-link.svg" icon-placement="end">
  Open Link
</snice-button>

<!-- Icon only (circle button) -->
<snice-button circle icon="⚙️"></snice-button>
<snice-button circle icon="settings"></snice-button>

<!-- With variants -->
<snice-button variant="primary" icon="💾">Save</snice-button>
<snice-button variant="danger" icon="🗑️" outline>Delete</snice-button>
```

### Link Buttons

```html
<!-- Basic link -->
<snice-button href="/page">Go to Page</snice-button>

<!-- External link -->
<snice-button href="https://example.com" target="_blank">
  Visit Site
</snice-button>

<!-- Download link -->
<snice-button href="/files/document.pdf" download="document.pdf">
  Download PDF
</snice-button>

<!-- Link with icon -->
<snice-button
  href="/docs"
  icon="/icons/book.svg"
  variant="primary">
  View Docs
</snice-button>
```

### Button Groups

```html
<style>
  .button-group {
    display: inline-flex;
    gap: 0.5rem;
  }

  .button-group--attached {
    display: inline-flex;
    gap: 0;
  }

  .button-group--attached snice-button:not(:first-child):not(:last-child) {
    border-radius: 0;
  }

  .button-group--attached snice-button:first-child {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  .button-group--attached snice-button:last-child {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
</style>

<!-- Spaced group -->
<div class="button-group">
  <snice-button>Cancel</snice-button>
  <snice-button variant="primary">Save</snice-button>
</div>

<!-- Attached group -->
<div class="button-group--attached">
  <snice-button outline>Left</snice-button>
  <snice-button outline>Center</snice-button>
  <snice-button outline>Right</snice-button>
</div>
```

### Form Buttons

```html
<form id="user-form">
  <label>
    Name:
    <input type="text" name="name" required>
  </label>

  <label>
    Email:
    <input type="email" name="email" required>
  </label>

  <div class="button-group">
    <snice-button type="reset">Reset</snice-button>
    <snice-button variant="primary" type="submit">Submit</snice-button>
  </div>
</form>

<script type="module">
  import 'snice/components/button/snice-button';

  const form = document.getElementById('user-form');
  const submitButton = form.querySelector('snice-button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Show loading state
    submitButton.loading = true;
    submitButton.textContent = 'Submitting...';

    try {
      const formData = new FormData(form);
      const response = await fetch('/api/users', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Submission failed');

      alert('Form submitted successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      // Reset loading state
      submitButton.loading = false;
      submitButton.textContent = 'Submit';
    }
  });
</script>
```

### Async Action Handling

```html
<snice-button
  id="save-btn"
  variant="primary"
  icon="/icons/save.svg">
  Save Changes
</snice-button>

<script type="module">
  import type { SniceButtonElement } from 'snice/components/button/snice-button.types';

  const button = document.getElementById('save-btn') as SniceButtonElement;

  button.addEventListener('click', async () => {
    // Show loading state
    button.loading = true;
    const originalText = button.textContent;
    button.textContent = 'Saving...';

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Success feedback
      button.variant = 'success';
      button.textContent = 'Saved!';

      setTimeout(() => {
        button.variant = 'primary';
        button.textContent = originalText;
        button.loading = false;
      }, 1500);

    } catch (error) {
      // Error feedback
      button.variant = 'danger';
      button.textContent = 'Save Failed';
      button.loading = false;

      setTimeout(() => {
        button.variant = 'primary';
        button.textContent = originalText;
      }, 2000);
    }
  });
</script>
```

### Confirmation Dialog

```html
<snice-button
  id="delete-btn"
  variant="danger"
  outline
  icon="/icons/trash.svg">
  Delete Account
</snice-button>

<script type="module">
  import type { SniceButtonElement } from 'snice/components/button/snice-button.types';

  const button = document.getElementById('delete-btn') as SniceButtonElement;

  button.addEventListener('click', async () => {
    const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');

    if (!confirmed) return;

    button.loading = true;
    button.disabled = true;

    try {
      await fetch('/api/account', { method: 'DELETE' });
      alert('Account deleted successfully');
      window.location.href = '/goodbye';
    } catch (error) {
      alert('Failed to delete account');
      button.loading = false;
      button.disabled = false;
    }
  });
</script>
```

### Icon Buttons with Tooltips

```html
<style>
  .icon-button-group {
    display: inline-flex;
    gap: 0.5rem;
  }
</style>

<div class="icon-button-group">
  <snice-button
    circle
    icon="/icons/bold.svg"
    variant="default"
    outline
    title="Bold">
  </snice-button>

  <snice-button
    circle
    icon="/icons/italic.svg"
    variant="default"
    outline
    title="Italic">
  </snice-button>

  <snice-button
    circle
    icon="/icons/underline.svg"
    variant="default"
    outline
    title="Underline">
  </snice-button>
</div>
```

### Call-to-Action Buttons

```html
<style>
  .cta-section {
    text-align: center;
    padding: 3rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 0.5rem;
  }

  .cta-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 2rem;
  }
</style>

<div class="cta-section">
  <h2>Ready to get started?</h2>
  <p>Join thousands of users already using our platform.</p>

  <div class="cta-buttons">
    <snice-button size="large" variant="default">
      Learn More
    </snice-button>
    <snice-button size="large" variant="primary">
      Get Started Free
    </snice-button>
  </div>
</div>
```

### Toolbar Buttons

```html
<style>
  .toolbar {
    display: flex;
    gap: 0.25rem;
    padding: 0.5rem;
    background: #f3f4f6;
    border-radius: 0.375rem;
    width: fit-content;
  }
</style>

<div class="toolbar">
  <snice-button circle icon="/icons/undo.svg" size="small" outline title="Undo"></snice-button>
  <snice-button circle icon="/icons/redo.svg" size="small" outline title="Redo"></snice-button>
  <div style="width: 1px; background: #d1d5db; margin: 0 0.25rem;"></div>
  <snice-button circle icon="/icons/copy.svg" size="small" outline title="Copy"></snice-button>
  <snice-button circle icon="/icons/paste.svg" size="small" outline title="Paste"></snice-button>
  <snice-button circle icon="/icons/cut.svg" size="small" outline title="Cut"></snice-button>
  <div style="width: 1px; background: #d1d5db; margin: 0 0.25rem;"></div>
  <snice-button circle icon="/icons/align-left.svg" size="small" outline title="Align Left"></snice-button>
  <snice-button circle icon="/icons/align-center.svg" size="small" outline title="Align Center"></snice-button>
  <snice-button circle icon="/icons/align-right.svg" size="small" outline title="Align Right"></snice-button>
</div>
```

### Social Login Buttons

```html
<style>
  .social-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 20rem;
  }
</style>

<div class="social-buttons">
  <snice-button
    variant="default"
    icon="/icons/google.svg"
    style="width: 100%;">
    Continue with Google
  </snice-button>

  <snice-button
    variant="default"
    icon="/icons/github.svg"
    style="width: 100%;">
    Continue with GitHub
  </snice-button>

  <snice-button
    variant="default"
    icon="/icons/twitter.svg"
    style="width: 100%;">
    Continue with Twitter
  </snice-button>
</div>
```

### Pagination Buttons

```html
<style>
  .pagination {
    display: flex;
    gap: 0.25rem;
    align-items: center;
  }
</style>

<div class="pagination">
  <snice-button icon="/icons/chevron-left.svg" outline disabled>Previous</snice-button>

  <snice-button outline>1</snice-button>
  <snice-button variant="primary">2</snice-button>
  <snice-button outline>3</snice-button>
  <snice-button outline>4</snice-button>
  <snice-button outline>5</snice-button>

  <snice-button icon="/icons/chevron-right.svg" icon-placement="end" outline>Next</snice-button>
</div>
```

### Upload Button

```html
<input type="file" id="file-input" style="display: none;" accept="image/*">

<snice-button
  id="upload-btn"
  variant="primary"
  icon="/icons/upload.svg">
  Upload Image
</snice-button>

<script type="module">
  import type { SniceButtonElement } from 'snice/components/button/snice-button.types';

  const button = document.getElementById('upload-btn') as SniceButtonElement;
  const input = document.getElementById('file-input');

  button.addEventListener('click', () => {
    input.click();
  });

  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    button.loading = true;
    button.textContent = 'Uploading...';

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      button.variant = 'success';
      button.textContent = 'Uploaded!';

      setTimeout(() => {
        button.variant = 'primary';
        button.textContent = 'Upload Image';
        button.loading = false;
      }, 2000);

    } catch (error) {
      alert('Upload failed: ' + error.message);
      button.textContent = 'Upload Image';
      button.loading = false;
    }
  });
</script>
```

## Accessibility

- **Keyboard support**: Fully keyboard accessible with Enter and Space
- **Focus indicators**: Clear focus states for keyboard navigation
- **ARIA attributes**: Proper roles and states for screen readers
- **Disabled state**: Properly disabled buttons cannot be focused or activated
- **Link semantics**: When using href, renders as accessible link

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support

## Best Practices

1. **Use appropriate variants**: Choose colors that match the action's importance
2. **Provide clear labels**: Button text should describe the action
3. **Show loading states**: Indicate async operations with loading prop
4. **Disable during actions**: Prevent double-clicks during processing
5. **Use icons wisely**: Icons should enhance, not replace text (except circle buttons)
6. **Group related buttons**: Use button groups for related actions
7. **Make primary actions prominent**: Use primary variant for main actions
8. **Avoid too many buttons**: Limit choices to prevent decision fatigue
9. **Test keyboard navigation**: Ensure all buttons work without a mouse
10. **Provide feedback**: Show success/error states after actions

## Common Patterns

### Primary Action
```html
<snice-button variant="primary">Save Changes</snice-button>
```

### Secondary Action
```html
<snice-button variant="default">Cancel</snice-button>
```

### Destructive Action
```html
<snice-button variant="danger" outline>Delete</snice-button>
```

### Icon-Only Action
```html
<snice-button circle icon="/icons/edit.svg"></snice-button>
```

### Form Submit
```html
<snice-button variant="primary" type="submit">Submit</snice-button>
```

## Variant Colors

| Variant | Color Scheme | Use Case |
|---------|-------------|----------|
| `default` | Gray | Secondary actions, cancel |
| `primary` | Blue | Primary actions, submit |
| `success` | Green | Confirmations, positive actions |
| `warning` | Orange | Caution actions, important notices |
| `danger` | Red | Destructive actions, delete |
| `text` | Transparent | Tertiary actions, links |
