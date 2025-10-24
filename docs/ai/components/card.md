# snice-card

Container for grouped content.

## Properties

```typescript
variant: 'elevated'|'bordered'|'flat' = 'elevated';
size: 'small'|'medium'|'large' = 'medium';
clickable: boolean = false;
selected: boolean = false;
disabled: boolean = false;
```

## Slots

- `header` - Card header
- `footer` - Card footer
- default - Card body content

## Usage

```html
<!-- Basic -->
<snice-card>
  <p>Card content</p>
</snice-card>

<!-- With header and footer -->
<snice-card>
  <div slot="header">Card Title</div>
  <p>Card body content</p>
  <div slot="footer">
    <button>Action</button>
  </div>
</snice-card>

<!-- Variants -->
<snice-card variant="elevated">Elevated (shadow)</snice-card>
<snice-card variant="bordered">Bordered</snice-card>
<snice-card variant="flat">Flat</snice-card>

<!-- Sizes -->
<snice-card size="small">Small padding</snice-card>
<snice-card size="medium">Medium padding</snice-card>
<snice-card size="large">Large padding</snice-card>

<!-- Interactive -->
<snice-card clickable>Click me</snice-card>
<snice-card clickable selected>Selected</snice-card>
<snice-card clickable disabled>Disabled</snice-card>
```

## Features

- 3 style variants (elevated/bordered/flat)
- 3 size options for padding
- Clickable with hover/focus states
- Selected state
- Disabled state
- Header/footer slots
