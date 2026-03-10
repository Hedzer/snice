# snice-form-layout

Structured grid layout for forms with label/field alignment and responsive columns.

## Properties

```typescript
columns: number = 1;
labelPosition: 'top'|'left'|'right' = 'top';    // attribute: label-position
labelWidth: string = '8rem';                       // attribute: label-width
gap: 'small'|'medium'|'large' = 'medium';
variant: 'default'|'compact'|'inline' = 'default';
```

## Slots

- `(default)` - Form fields (inputs, selects, textareas, etc.)

## CSS Parts

- `base` - Root layout container

## CSS Custom Properties

- `--form-columns` - Number of grid columns (set from `columns` prop)
- `--form-label-width` - Label width for left/right positions (set from `label-width` prop)

## Basic Usage

```typescript
import 'snice/components/form-layout/snice-form-layout';
```

```html
<snice-form-layout>
  <snice-input label="Name"></snice-input>
  <snice-input label="Email"></snice-input>
</snice-form-layout>

<snice-form-layout columns="2">
  <snice-input label="First Name"></snice-input>
  <snice-input label="Last Name"></snice-input>
</snice-form-layout>

<snice-form-layout label-position="left" label-width="10rem">
  <snice-input label="Username"></snice-input>
  <snice-input label="Password" type="password"></snice-input>
</snice-form-layout>

<snice-form-layout variant="compact" gap="small" columns="3">
  <snice-input label="City"></snice-input>
  <snice-input label="State"></snice-input>
  <snice-input label="Zip"></snice-input>
</snice-form-layout>

<snice-form-layout variant="inline">
  <snice-input label="Search"></snice-input>
  <snice-select label="Category"></snice-select>
</snice-form-layout>
```

No events -- layout-only component. Responsive: collapses to single column on mobile (<640px).
