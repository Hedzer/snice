<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/segmented-control.md -->

# Segmented Control

A multi-option switcher with a sliding indicator. One option is selected at a time. Unlike tabs, this is purely a value selector without content panes.

## Table of Contents

- [Properties](#properties)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Selected option value |
| `options` | `SegmentedControlOption[]` | `[]` | Array of `{ value, label, icon?, disabled? }` (JS only) |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Control size |
| `disabled` | `boolean` | `false` | Disables the entire control |

### Type Interface

```typescript
interface SegmentedControlOption {
  value: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `value-change` | `{ value: string, previousValue: string, option: SegmentedControlOption, control }` | Selection changed |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The control container |
| `indicator` | The sliding selection indicator |
| `segment` | Each segment button |

## Basic Usage

```typescript
import 'snice/components/segmented-control/snice-segmented-control';
```

```html
<snice-segmented-control></snice-segmented-control>
```

```typescript
control.options = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' }
];
```

## Examples

### Pre-selected Value

Set the `value` attribute to pre-select an option.

```html
<snice-segmented-control value="week"></snice-segmented-control>
```

### Sizes

Use the `size` attribute to change the control size.

```html
<snice-segmented-control size="small"></snice-segmented-control>
<snice-segmented-control size="medium"></snice-segmented-control>
<snice-segmented-control size="large"></snice-segmented-control>
```

### With Icons

Pass an `icon` URL in option objects to display icons alongside labels.

```typescript
control.options = [
  { value: 'grid', label: 'Grid', icon: '/icons/grid.svg' },
  { value: 'list', label: 'List', icon: '/icons/list.svg' }
];
```

### Disabled Options

Options with `disabled: true` cannot be selected.

```typescript
control.options = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise', disabled: true }
];
```

### Disabled Control

Disable the entire control with the `disabled` attribute.

```html
<snice-segmented-control disabled></snice-segmented-control>
```

### Event Handling

Listen to `value-change` to respond to selection changes.

```typescript
control.addEventListener('value-change', (e) => {
  console.log('New value:', e.detail.value);
  console.log('Previous:', e.detail.previousValue);
});
```

## Accessibility

- Uses `role="radiogroup"` with `role="radio"` per segment
- Sliding indicator animates between selections
- If no value set, first non-disabled option is selected
- Disabled segments are not focusable
