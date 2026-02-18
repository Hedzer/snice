# snice-button

Interactive button with variants and states.

## Properties

```typescript
variant: 'default'|'primary'|'success'|'warning'|'danger'|'text' = 'default';
size: 'small'|'medium'|'large' = 'medium';
disabled: boolean = false;
loading: boolean = false;
outline: boolean = false;
pill: boolean = false;
circle: boolean = false;
href: string = '';
target: string = '';
download: string = '';
icon: string = '';
iconPlacement: 'start'|'end' = 'start';
```

## Methods

- `focus(options?)` - Focus button
- `blur()` - Blur button
- `click()` - Programmatic click

## Usage

```html
<!-- Basic -->
<snice-button>Click me</snice-button>

<!-- Variants -->
<snice-button variant="primary">Primary</snice-button>
<snice-button variant="success">Success</snice-button>
<snice-button variant="warning">Warning</snice-button>
<snice-button variant="danger">Danger</snice-button>
<snice-button variant="text">Text</snice-button>

<!-- Sizes -->
<snice-button size="small">Small</snice-button>
<snice-button size="medium">Medium</snice-button>
<snice-button size="large">Large</snice-button>

<!-- States -->
<snice-button disabled>Disabled</snice-button>
<snice-button loading>Loading...</snice-button>

<!-- Styles -->
<snice-button outline>Outline</snice-button>
<snice-button pill>Pill</snice-button>
<snice-button circle icon="×"></snice-button>

<!-- With icon (auto-detects: URL, file extension, emoji, text) -->
<snice-button icon="→">Next</snice-button>
<snice-button icon="/icons/save.svg">Save</snice-button>
<snice-button icon="icon.png">Image file</snice-button>
<snice-button icon="save">Ligature</snice-button>
<!-- Scheme overrides: img://, text:// -->
<snice-button icon="img://filename">Force img</snice-button>
<snice-button icon="text:///not/a/path">Force text</snice-button>

<!-- As link -->
<snice-button href="/page">Link</snice-button>
<snice-button href="/file.pdf" download>Download</snice-button>
```

## Features

- 6 color variants
- 3 sizes
- Outline style
- Pill (rounded) shape
- Circle (icon only) shape
- Loading state with spinner
- Disabled state
- Link mode (href)
- Icon support with placement (URL, image files, emoji, font ligatures)
- Download attribute support
