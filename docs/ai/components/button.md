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
<snice-button href="/file.pdf" download="file.pdf">Download</snice-button>

<!-- Form -->
<snice-button type="submit" variant="primary">Submit</snice-button>
<snice-button type="reset">Reset</snice-button>
```

## URL Policy

- `href` is trimmed, then checked with shared `isSafeUrl()`.
- Allowed by default: relative/root/hash/query references, HTTP(S) network-path references, and explicit `http:`, `https:`, `mailto:`, `tel:` URLs.
- Rejected: malformed URLs, raw ASCII controls, and every other explicit scheme (`javascript:`, `data:`, `vbscript:`, `file:`, custom, etc.).
- HTML character references are decoded by the browser before validation; mixed-case, whitespace-prefixed, control-obfuscated, attribute, and property inputs follow the same policy.
- A rejected `href` stops activation: no location/history change, popup, download, form submit/reset, native click propagation, or `button-click` event.
- Direct non-string `href` assignments fail closed.

## Accessibility

- Keyboard accessible (Enter, Space)
- Focus ring on `:focus-visible`
- Form-associated (`formAssociated: true`)
