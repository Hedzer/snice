# snice-form-layout

Structured grid layout for forms with label/field alignment and responsive columns.

## Properties

```typescript
columns: number = 1;                                      // Number of columns
labelPosition: 'top'|'left'|'right' = 'top';              // attribute: label-position
labelWidth: string = '8rem';                               // attribute: label-width, width when labels left/right
gap: 'small'|'medium'|'large' = 'medium';
variant: 'default'|'compact'|'inline' = 'default';
```

## Slots

- `(default)` - Form fields (inputs, selects, textareas, etc.)

## Events

None — this is a layout-only component.

## CSS Custom Properties

- `--form-columns` - Number of grid columns (set automatically from `columns` prop)
- `--form-label-width` - Label width for left/right positions (set from `label-width` prop)

## Usage

```html
<!-- Single column -->
<snice-form-layout>
  <snice-input label="Name"></snice-input>
  <snice-input label="Email"></snice-input>
</snice-form-layout>

<!-- Two columns -->
<snice-form-layout columns="2">
  <snice-input label="First Name"></snice-input>
  <snice-input label="Last Name"></snice-input>
</snice-form-layout>

<!-- Labels on left -->
<snice-form-layout label-position="left" label-width="10rem">
  <snice-input label="Username"></snice-input>
  <snice-input label="Password" type="password"></snice-input>
</snice-form-layout>

<!-- Compact with small gap -->
<snice-form-layout variant="compact" gap="small" columns="3">
  <snice-input label="City"></snice-input>
  <snice-input label="State"></snice-input>
  <snice-input label="Zip"></snice-input>
</snice-form-layout>

<!-- Inline variant (flex row) -->
<snice-form-layout variant="inline">
  <snice-input label="Search"></snice-input>
  <snice-select label="Category"></snice-select>
</snice-form-layout>
```

## Features

- Responsive: collapses to single column on mobile (<640px)
- Labels go top on mobile regardless of `label-position`
- Three gap sizes, three layout variants
- CSS custom properties exposed for slotted children label positioning
