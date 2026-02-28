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

## Events

- `value-change` -> `{ value: number, oldValue: number, component: SniceStepInputElement }`

## Methods

- `increment()` - Increase value by step
- `decrement()` - Decrease value by step
- `focus()` - Focus the input
- `blur()` - Remove focus

## CSS Parts

- `base` - Outer container
- `decrement-button` - Minus button
- `increment-button` - Plus button
- `input` - The number input

## Usage

```html
<!-- Basic -->
<snice-step-input value="5"></snice-step-input>

<!-- With min/max -->
<snice-step-input min="0" max="10" value="5" step="1"></snice-step-input>

<!-- Wrap around -->
<snice-step-input min="1" max="12" value="1" wrap></snice-step-input>

<!-- Sizes -->
<snice-step-input size="small"></snice-step-input>
<snice-step-input size="large"></snice-step-input>

<!-- Disabled -->
<snice-step-input value="3" disabled></snice-step-input>
```
