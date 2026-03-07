<!-- AI: For a low-token version of this doc, use docs/ai/components/segmented-control.md instead -->

# Segmented Control
`<snice-segmented-control>`

A multi-option switcher with a sliding indicator. One option is selected at a time. Unlike a switch (binary) or tabs (with content panes), this is purely a value selector for multiple options.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/segmented-control/snice-segmented-control';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-segmented-control.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Selected option value |
| `options` | `SegmentedControlOption[]` | `[]` | Array of `{ value, label, icon?, disabled? }` |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Control size |
| `disabled` | `boolean` | `false` | Disables the entire control |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `value-change` | `{ value, previousValue, option, control }` | Selection changed |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The control container |
| `indicator` | The sliding indicator |
| `segment` | Each segment button |

## Basic Usage

```typescript
import 'snice/components/segmented-control/snice-segmented-control';
```

```html
<snice-segmented-control></snice-segmented-control>
```

```typescript
const control = document.querySelector('snice-segmented-control');
control.options = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];
```

## Examples

### Sizes

Use the `size` attribute to change the control size.

```html
<snice-segmented-control size="small"></snice-segmented-control>
<snice-segmented-control size="medium"></snice-segmented-control>
<snice-segmented-control size="large"></snice-segmented-control>
```

### Pre-selected Value

Set the `value` attribute to pre-select an option.

```html
<snice-segmented-control value="week"></snice-segmented-control>
```

### Disabled Options

Options with `disabled: true` cannot be selected.

```typescript
control.options = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise', disabled: true },
];
```

### Disabled Control

Disable the entire control with the `disabled` attribute.

```html
<snice-segmented-control disabled></snice-segmented-control>
```

### With Icons

Pass an `icon` URL in option objects to display icons alongside labels.

```typescript
control.options = [
  { value: 'grid', label: 'Grid', icon: '/icons/grid.svg' },
  { value: 'list', label: 'List', icon: '/icons/list.svg' },
];
```

### Event Handling

```typescript
const control = document.querySelector('snice-segmented-control');

control.addEventListener('value-change', (e) => {
  console.log('New value:', e.detail.value);
  console.log('Previous value:', e.detail.previousValue);
  console.log('Selected option:', e.detail.option);
});
```

### Programmatic Control

```typescript
const control = document.querySelector('snice-segmented-control');
control.value = 'month';
```
