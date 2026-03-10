<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/button.md -->

# Button Component
`<snice-button>`

The button component provides an interactive element for user actions. It supports multiple variants, sizes, states (loading, disabled), styles (outline, pill, circle), and icons. When `href` is set, clicking navigates via `window.location` (not rendered as an anchor). Form-associated for `submit`/`reset` support.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

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
| `href` | `string` | `''` | URL to navigate to on click |
| `target` | `string` | `''` | Link target (e.g. `_blank`) |
| `download` | `string` | `''` | Download attribute for file downloads |
| `icon` | `string` | `''` | Icon (emoji, URL, image file). Use the `icon` slot for icon fonts. |
| `iconPlacement` (attr: `icon-placement`) | `'start' \| 'end'` | `'start'` | Icon position relative to label |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `focus()` | `options?: FocusOptions` | Focus the button |
| `blur()` | -- | Remove focus |
| `click()` | -- | Programmatic click |
| `setLoading()` | `loading: boolean` | Set loading state |
| `setDisabled()` | `disabled: boolean` | Set disabled state |
| `setVariant()` | `variant: ButtonVariant` | Set variant |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `button-click` | `{ originalEvent: MouseEvent }` | Fired when the button is clicked |

## Slots

| Name | Description |
|------|-------------|
| (default) | Button label content |
| `icon` | Custom icon content. Overrides the `icon` property. Use for icon fonts (Material Symbols, Font Awesome, etc.). |

### Icon Slot Usage

Use the `icon` slot for icon fonts or inline SVGs:

```html
<!-- Material Symbols -->
<snice-button variant="primary">
  <span slot="icon" class="material-symbols-outlined">save</span>
  Save
</snice-button>

<!-- Font Awesome -->
<snice-button variant="danger">
  <i slot="icon" class="fa-solid fa-trash"></i>
  Delete
</snice-button>

<!-- Inline SVG -->
<snice-button>
  <svg slot="icon" viewBox="0 0 24 24" width="20" height="20">
    <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/>
  </svg>
  Upload
</snice-button>
```

The `icon-placement` property works with both the slot and the `icon` property:

```html
<snice-button icon-placement="end">
  <span slot="icon" class="material-symbols-outlined">arrow_forward</span>
  Next
</snice-button>
```

> **Note**: The `icon` slot takes precedence over the `icon` property when both are present.

> **Note**: `icon="home"` renders as plain text, not a Material icon. Use the `icon` slot for icon fonts.

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The button element |
| `spinner` | Loading spinner |
| `label` | Button label text |
| `icon` | Icon container |

## Basic Usage

```typescript
import 'snice/components/button/snice-button';
```

```html
<snice-button>Click me</snice-button>
```

## Examples

### Variants

Use the `variant` attribute to set the button's visual style.

```html
<snice-button>Default</snice-button>
<snice-button variant="primary">Primary</snice-button>
<snice-button variant="success">Success</snice-button>
<snice-button variant="warning">Warning</snice-button>
<snice-button variant="danger">Danger</snice-button>
<snice-button variant="text">Text Only</snice-button>
```

### Sizes

Use the `size` attribute to change the button's size.

```html
<snice-button size="small">Small</snice-button>
<snice-button size="medium">Medium</snice-button>
<snice-button size="large">Large</snice-button>
```

### Outline Buttons

Use the `outline` attribute for a transparent background with a border.

```html
<snice-button outline>Default Outline</snice-button>
<snice-button variant="primary" outline>Primary Outline</snice-button>
<snice-button variant="danger" outline>Danger Outline</snice-button>
```

### Pill Buttons

Use the `pill` attribute for fully rounded corners.

```html
<snice-button pill>Default Pill</snice-button>
<snice-button variant="primary" pill>Primary Pill</snice-button>
```

### Circle Buttons

Use `circle` for icon-only circular buttons.

```html
<snice-button circle icon="/icons/plus.svg"></snice-button>
<snice-button variant="primary" circle icon="/icons/edit.svg"></snice-button>
```

### States

```html
<snice-button disabled>Disabled</snice-button>
<snice-button variant="primary" disabled>Primary Disabled</snice-button>
<snice-button loading>Loading...</snice-button>
<snice-button variant="primary" loading>Saving...</snice-button>
```

### Buttons with Icons

The `icon` **property** is for emoji, image URLs, and image files:

```html
<snice-button icon="->">Next</snice-button>
<snice-button icon="/icons/save.svg" variant="primary">Save</snice-button>
<snice-button icon="->" icon-placement="end">Next</snice-button>
```

### Link Buttons

Use `href` to navigate on click.

```html
<snice-button href="/page">Go to Page</snice-button>
<snice-button href="https://example.com" target="_blank">Visit Site</snice-button>
<snice-button href="/files/document.pdf" download="document.pdf">Download PDF</snice-button>
```

### Form Buttons

```html
<form id="user-form">
  <input type="text" name="name" required>
  <snice-button type="reset">Reset</snice-button>
  <snice-button variant="primary" type="submit">Submit</snice-button>
</form>
```

### Async Action Handling

```typescript
const button = document.querySelector('snice-button');

button.addEventListener('click', async () => {
  button.loading = true;
  try {
    await saveData();
    button.variant = 'success';
    button.textContent = 'Saved!';
  } catch (error) {
    button.variant = 'danger';
    button.textContent = 'Failed';
  } finally {
    button.loading = false;
  }
});
```

## Accessibility

- **Keyboard support**: Fully keyboard accessible with Enter and Space
- **Focus indicators**: Clear focus states for keyboard navigation
- **ARIA attributes**: Proper roles and states for screen readers
- **Disabled state**: Properly disabled buttons cannot be focused or activated
