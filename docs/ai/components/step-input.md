# snice-step-input

Numeric stepper control with visible +/- buttons flanking an input field.

## Properties

```typescript
value: number = 0;
min: number = -Infinity;
max: number = Infinity;
step: number = 1;
disabled: boolean = false;
readonly: boolean = false;
size: 'small'|'medium'|'large' = 'medium';
wrap: boolean = false;              // wrap around at min/max boundaries
```

## Methods

- `increment()` - Increase value by step
- `decrement()` - Decrease value by step
- `focus()` - Focus the input
- `blur()` - Remove focus

## Events

- `value-change` → `{ value, oldValue, component }`

## CSS Parts

- `base` - Outer container
- `decrement-button` - Minus button
- `increment-button` - Plus button
- `input` - Number input field

## Basic Usage

```html
<snice-step-input value="5"></snice-step-input>
<snice-step-input min="0" max="10" value="5" step="1"></snice-step-input>
<snice-step-input min="1" max="12" value="1" wrap></snice-step-input>
<snice-step-input size="small"></snice-step-input>
<snice-step-input size="large"></snice-step-input>
<snice-step-input value="3" disabled></snice-step-input>
```

## Keyboard Navigation

- ArrowUp: increment by step
- ArrowDown: decrement by step

## Accessibility

- Buttons keyboard accessible with focus indicators
- Direct keyboard entry in input field
- Buttons disabled at min/max (unless `wrap` is set)
