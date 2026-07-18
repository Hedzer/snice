# snice-button

Interactive button with variants, states, and form association.

## Properties

```typescript
variant: 'default'|'primary'|'success'|'warning'|'danger'|'text' = 'default';
size: 'small'|'medium'|'large' = 'medium';
type: 'button'|'submit'|'reset' = 'button';
disabled: boolean = false;
loading: boolean = false;
outline: boolean = false;
pill: boolean = false;
circle: boolean = false;
href: string = '';
target: string = '';
download: string = '';
icon: string = '';                        // emoji, URL, image file
iconPlacement: 'start'|'end' = 'start';  // attr: icon-placement
```

## Methods

- `focus(options?)` - Focus button
- `blur()` - Blur button
- `click()` - Programmatic click
- `setLoading(loading)` - Set loading state
- `setDisabled(disabled)` - Set disabled state
- `setVariant(variant)` - Set variant

## Events

- `button-click` -> `{ originalEvent: MouseEvent }`; only after an enabled, non-loading activation passes `href` validation

## Slots

- `(default)` - Button label content
- `icon` - Custom icon content (overrides `icon` property)

## CSS Parts

- `base` - The button element
- `spinner` - Loading spinner
- `label` - Button label text
- `icon` - Icon container

## Basic Usage

```html
<snice-button>Click me</snice-button>

<!-- Variants -->
<snice-button variant="primary">Primary</snice-button>
<snice-button variant="success">Success</snice-button>
<snice-button variant="warning">Warning</snice-button>
<snice-button variant="danger">Danger</snice-button>
<snice-button variant="text">Text</snice-button>

<!-- Sizes -->
<snice-button size="small">Small</snice-button>
<snice-button size="large">Large</snice-button>

<!-- States -->
<snice-button disabled>Disabled</snice-button>
<snice-button loading>Loading...</snice-button>

<!-- Styles -->
<snice-button outline>Outline</snice-button>
<snice-button pill>Pill</snice-button>
<snice-button circle icon="x"></snice-button>

<!-- Icon SLOT -- for Material Symbols, Font Awesome, SVGs -->
<snice-button>
  <span slot="icon" class="material-symbols-outlined">save</span>
  Save
</snice-button>
<snice-button>
  <i slot="icon" class="fa-solid fa-trash"></i>
  Delete
</snice-button>

<!-- Icon PROPERTY -- for emoji, URLs, image files only -->
<!-- icon="home" renders as PLAIN TEXT, NOT a Material icon -->
<snice-button icon="->">Next</snice-button>
<snice-button icon="/icons/save.svg">Save</snice-button>
<snice-button icon="img://filename">Force img</snice-button>

<!-- As link -->
<snice-button href="/page">Link</snice-button>
<snice-button href="#section">Hash</snice-button>
<snice-button href="mailto:team@example.com">Email</snice-button>
<snice-button href="/report" target="_blank">Isolated tab</snice-button>
<snice-button href="/report" target="report-window">Isolated named window</snice-button>
<snice-button href="/file.pdf" download="file.pdf">Download</snice-button>

<!-- Form -->
<snice-button type="submit" variant="primary">Submit</snice-button>
<snice-button type="reset">Reset</snice-button>
```

## URL Policy

- `href` is trimmed, then checked with shared `isSafeUrl()`.
- A non-empty safe `href` is navigation mode and takes precedence over `type="submit"` or `type="reset"`.
- Allowed by default: relative/root/hash/query references, HTTP(S) network-path references, and explicit `http:`, `https:`, `mailto:`, `tel:` URLs.
- Rejected: malformed URLs, raw ASCII controls, and every other explicit scheme (`javascript:`, `data:`, `vbscript:`, `file:`, custom, etc.).
- HTML character references are decoded by the browser before validation; mixed-case, whitespace-prefixed, control-obfuscated, attribute, and property inputs follow the same policy.
- A rejected `href` stops activation: no location/history change, popup, download, form submit/reset, native click propagation, or `button-click` event.
- Direct non-string `href` assignments fail closed.

## Target and Download Semantics

- No `target`: navigate the current page.
- `_self`, `_parent`, `_top` (ASCII case-insensitive): retain native same-context behavior.
- `_blank` or a named target: `window.open(trimmedHref, exactTarget, 'noopener')`; every newly created context has `window.opener === null` at creation.
- Repeated use of a named target creates separate isolated contexts rather than reusing an earlier named window.
- Non-empty `download` takes precedence over `target`: activate a detached anchor with the validated `href` and filename; do not call `window.open`.
- Successful targeted navigation or download occurs before `button-click` is dispatched.

## Disabled Fieldset Contract

- As a form-associated custom element, `snice-button` inherits effective disabledness from an ancestor `<fieldset disabled>`.
- Effective disabledness blocks pointer, keyboard, internal synthetic, and public `click()` activation for `button`, `submit`, `reset`, and `href` modes.
- A blocked activation performs no form action, navigation, popup, download, or `button-click` dispatch.
- `button.disabled` and the `disabled` attribute always represent authored state. Fieldset state is tracked separately and never overwrites or reflects them.
- The first `<legend>` child of a disabled fieldset retains the native exception: descendant buttons remain enabled. Later legends and the fieldset body do not.
- Nested fieldsets obey every disabling ancestor. Moving or reconnecting a button recalculates effective disabledness and `ElementInternals.form` ownership.

```html
<form>
  <fieldset disabled>
    <legend>
      Actions
      <snice-button>Enabled legend action</snice-button>
    </legend>
    <snice-button type="submit">Disabled submit</snice-button>
    <snice-button type="reset">Disabled reset</snice-button>
    <snice-button href="/report">Disabled navigation</snice-button>
  </fieldset>
</form>
```

## Accessibility

- Keyboard accessible (Enter, Space)
- Focus ring on `:focus-visible`
- Form-associated (`formAssociated: true`), including disabled fieldsets and the first-legend exception
