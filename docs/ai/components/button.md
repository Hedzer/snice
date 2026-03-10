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

- `button-click` -> `{ originalEvent: MouseEvent }`

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
<snice-button href="/file.pdf" download>Download</snice-button>

<!-- Form -->
<snice-button type="submit" variant="primary">Submit</snice-button>
<snice-button type="reset">Reset</snice-button>
```

## Accessibility

- Keyboard accessible (Enter, Space)
- Focus ring on `:focus-visible`
- Form-associated (`formAssociated: true`)
