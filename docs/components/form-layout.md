<!-- AI: For a low-token version of this doc, use docs/ai/components/form-layout.md instead -->

# Form Layout
`<snice-form-layout>`

Structured grid layout for forms with label/field alignment and responsive columns.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/form-layout/snice-form-layout';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-form-layout.min.js"></script>
```

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `columns` | `columns` | `number` | `1` | Number of grid columns |
| `labelPosition` | `label-position` | `'top' \| 'left' \| 'right'` | `'top'` | Label placement relative to fields |
| `labelWidth` | `label-width` | `string` | `'8rem'` | Label width when position is left/right |
| `gap` | `gap` | `'small' \| 'medium' \| 'large'` | `'medium'` | Spacing between fields |
| `variant` | `variant` | `'default' \| 'compact' \| 'inline'` | `'default'` | Layout variant |

## Slots

| Name | Description |
|------|-------------|
| (default) | Form fields (inputs, selects, textareas, etc.) |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--form-columns` | Number of grid columns (set via `columns` prop) | `1` |
| `--form-label-width` | Width of labels in left/right mode (set via `label-width` prop) | `8rem` |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The form layout grid container |

## Basic Usage

```typescript
import 'snice/components/form-layout/snice-form-layout';
```

```html
<snice-form-layout>
  <snice-input label="Name"></snice-input>
  <snice-input label="Email"></snice-input>
</snice-form-layout>
```

## Examples

### Columns

Use the `columns` attribute to set the number of columns in the grid layout.

```html
<snice-form-layout columns="2">
  <snice-input label="First Name"></snice-input>
  <snice-input label="Last Name"></snice-input>
  <snice-input label="Email"></snice-input>
  <snice-input label="Phone"></snice-input>
</snice-form-layout>
```

### Three Column Layout

```html
<snice-form-layout columns="3" gap="small">
  <snice-input label="City"></snice-input>
  <snice-input label="State"></snice-input>
  <snice-input label="Zip"></snice-input>
</snice-form-layout>
```

### Label Position

Use the `label-position` attribute to control where labels appear relative to fields.

```html
<snice-form-layout label-position="left" label-width="10rem">
  <snice-input label="Username"></snice-input>
  <snice-input label="Password" type="password"></snice-input>
</snice-form-layout>

<snice-form-layout label-position="right">
  <snice-input label="First Name"></snice-input>
  <snice-input label="Last Name"></snice-input>
</snice-form-layout>
```

### Gap Sizes

Use the `gap` attribute to control the spacing between form fields.

```html
<snice-form-layout gap="small">...</snice-form-layout>
<snice-form-layout gap="medium">...</snice-form-layout>
<snice-form-layout gap="large">...</snice-form-layout>
```

### Variants

Use the `variant` attribute to change the layout behavior.

```html
<!-- Default: standard grid -->
<snice-form-layout variant="default" columns="2">
  <snice-input label="Field 1"></snice-input>
  <snice-input label="Field 2"></snice-input>
</snice-form-layout>

<!-- Compact: tighter spacing -->
<snice-form-layout variant="compact" columns="2">
  <snice-input label="Field 1" size="small"></snice-input>
  <snice-input label="Field 2" size="small"></snice-input>
</snice-form-layout>

<!-- Inline: horizontal flex layout -->
<snice-form-layout variant="inline">
  <snice-input label="Search" style="flex:1;"></snice-input>
  <snice-select label="Filter"></snice-select>
</snice-form-layout>
```

### Spanning Columns

Use CSS `grid-column` on slotted children to span multiple columns.

```html
<snice-form-layout columns="2">
  <snice-input label="First Name"></snice-input>
  <snice-input label="Last Name"></snice-input>
  <snice-textarea label="Bio" style="grid-column: 1 / -1;"></snice-textarea>
</snice-form-layout>
```

## Responsive Behavior

The form layout automatically collapses to a single column on screens smaller than 640px. When `label-position` is set to `left` or `right`, labels will switch to `top` position on mobile for better readability.
