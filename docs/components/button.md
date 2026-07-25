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
- [URL Safety](#url-safety)
- [Target Isolation](#target-isolation)
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
| `href` | `string` | `''` | Safe URL to navigate to on click; see [URL Safety](#url-safety) |
| `target` | `string` | `''` | Link target; newly created contexts are isolated from `window.opener` |
| `download` | `string` | `''` | Download filename; download behavior takes precedence over `target` |
| `icon` | `string` | `''` | Icon (emoji, URL, image file). Use the `icon` slot for icon fonts. |
| `iconPlacement` (attr: `icon-placement`) | `'start' \| 'end'` | `'start'` | Icon position relative to label |
| `justifyText` (attr: `justify-text`) | `'start' \| 'center' \| 'end'` | `'center'` | Alignment of the label within the button |
| `form` (read-only) | `HTMLFormElement \| null` | — | Current owning form, including `form="id"` |
| `labels` (read-only) | `NodeList \| null` | — | Labels associated with the form-associated host |

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
| `button-click` | `{ originalEvent: MouseEvent }` | Fired after an enabled, non-loading activation is accepted |

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

A non-empty safe `href` is the activation mode and takes precedence over `type="submit"` or `type="reset"`; one activation never both navigates and performs a form action.

```html
<snice-button href="/page">Go to Page</snice-button>
<snice-button href="https://example.com" target="_blank">Visit Site</snice-button>
<snice-button href="/reports/latest" target="report-window">Open Isolated Report</snice-button>
<snice-button href="/files/document.pdf" download="document.pdf">Download PDF</snice-button>
```

Accepted relative references include ordinary paths, root-relative paths, hashes, and queries. Absolute URLs use the shared Snice URL policy: `http:`, `https:`, `mailto:`, and `tel:` are allowed. HTTP(S) network-path references such as `//cdn.example.com/file` are also allowed.

Surrounding whitespace is trimmed. Malformed URLs, raw ASCII control characters, and all other explicit schemes—including `javascript:`, `data:`, `vbscript:`, `file:`, and custom schemes—are blocked. A blocked activation does not navigate, open a target, start a download, submit or reset a form, or emit `button-click`.

### Form Buttons

```html
<form id="user-form">
  <input type="text" name="name" required>
  <snice-button type="reset">Reset</snice-button>
  <snice-button variant="primary" type="submit">Submit</snice-button>
</form>
```

### Disabled Fieldsets

Because `snice-button` is form-associated, an ancestor `<fieldset disabled>` disables it exactly like a native button. Effective fieldset disabledness applies to ordinary, submit, reset, and `href` buttons: pointer, keyboard, and programmatic `click()` activation are suppressed; no form action, navigation, download, popup, or `button-click` event occurs.

The browser's native first-`legend` exception is preserved. A button inside the disabled fieldset's first legend remains enabled, while buttons in later legends and the fieldset body are disabled.

```html
<form>
  <fieldset disabled>
    <legend>
      Account actions
      <snice-button type="button">Still enabled in first legend</snice-button>
    </legend>

    <snice-button type="button">Disabled action</snice-button>
    <snice-button type="submit">Disabled submit</snice-button>
    <snice-button type="reset">Disabled reset</snice-button>
    <snice-button href="/account/export">Disabled navigation</snice-button>
  </fieldset>
</form>
```

Fieldset state is effective state, not authored state. It never changes or reflects the public `button.disabled` property. Moving a button between forms, fieldsets, or a first legend updates its effective state and form owner automatically.

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

## URL Safety

`snice-button` applies Snice's shared `isSafeUrl()` policy automatically whenever `href` is present. For other components or native elements that receive untrusted navigational URLs, validate before assigning the URL:

```typescript
import { isSafeUrl } from 'snice';

if (isSafeUrl(candidate)) {
  link.href = candidate;
}

// Replace the default absolute-protocol list when a context needs another
// browser-supported protocol. Relative references remain accepted.
isSafeUrl(objectUrl, { allowed: ['blob:'] });
```

HTML escaping and URL validation solve different problems: an escaped string cannot inject markup, but it may still contain an executable URL scheme. Use `isSafeUrl()` at navigation sinks; use `unsafeHTML()` only for explicitly trusted markup.

## Target Isolation

When `target` is absent, an accepted `href` navigates the current page. The special targets `_self`, `_parent`, and `_top` retain their normal same-context behavior. Target matching for those special names is ASCII case-insensitive, as it is for native browser navigation.

`_blank` and named targets can create a new browsing context. `snice-button` requests `noopener` when it performs any targeted navigation, so a newly opened page sees `window.opener === null` from the moment it is created. This prevents the destination from reading or redirecting the page that opened it.

Opener isolation changes one native named-target behavior: repeated activations of a name such as `target="report-window"` open separate isolated contexts instead of reusing an earlier named window. Use `_self`, `_parent`, or `_top` when same-context navigation is intended.

When `download` is non-empty, download behavior takes precedence over `target`. Snice activates a detached anchor with the validated URL and requested filename; it does not open a browsing context.

## Accessibility

- **Keyboard support**: Fully keyboard accessible with Enter and Space
- **Focus indicators**: Clear focus states for keyboard navigation
- **ARIA attributes**: Proper roles and states for screen readers
- **Disabled state**: Authored and disabled-fieldset states cannot be focused or activated; the first-legend exception follows native HTML behavior
