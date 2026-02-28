[//]: # (AI: For a low-token version of this doc, use docs/ai/components/step-input.md instead)

# Step Input
`<snice-step-input>`

A numeric stepper control with visible increment and decrement buttons flanking an input field.

## Basic Usage

```typescript
import 'snice/components/step-input/snice-step-input';
```

```html
<snice-step-input value="5"></snice-step-input>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/step-input/snice-step-input';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-step-input.min.js"></script>
```

## Examples

### Sizes

Use the `size` attribute to change the stepper's size.

```html
<snice-step-input size="small" value="3"></snice-step-input>
<snice-step-input size="medium" value="5"></snice-step-input>
<snice-step-input size="large" value="7"></snice-step-input>
```

### Min, Max, and Step

Use the `min`, `max`, and `step` attributes to constrain and control the value range.

```html
<snice-step-input min="0" max="10" step="1" value="5"></snice-step-input>
<snice-step-input min="0" max="100" step="5" value="50"></snice-step-input>
```

### Wrap Around

Set the `wrap` attribute to cycle through values when reaching the min or max boundary.

```html
<snice-step-input min="1" max="12" value="12" wrap></snice-step-input>
```

### Disabled

Set the `disabled` attribute to prevent user interaction.

```html
<snice-step-input value="3" disabled></snice-step-input>
```

### Read Only

Set the `readonly` attribute to prevent value changes while keeping the input focusable.

```html
<snice-step-input value="42" readonly></snice-step-input>
```

### Programmatic Control

Use the `increment()` and `decrement()` methods for programmatic control.

```html
<snice-step-input id="qty" min="1" max="99" value="1"></snice-step-input>

<script>
  const stepper = document.getElementById('qty');
  stepper.increment(); // value becomes 2
  stepper.decrement(); // value becomes 1
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `number` | `0` | Current value |
| `min` | `number` | `-Infinity` | Minimum allowed value |
| `max` | `number` | `Infinity` | Maximum allowed value |
| `step` | `number` | `1` | Increment/decrement amount |
| `disabled` | `boolean` | `false` | Disables all interaction |
| `readonly` | `boolean` | `false` | Prevents value changes |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Control size |
| `wrap` | `boolean` | `false` | Wrap around at min/max boundaries |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `value-change` | `{ value: number, oldValue: number, component: SniceStepInputElement }` | Fired when the value changes |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `increment()` | -- | Increase value by step |
| `decrement()` | -- | Decrease value by step |
| `focus()` | `options?: FocusOptions` | Focus the input field |
| `blur()` | -- | Remove focus |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The outer container |
| `decrement-button` | The minus (-) button |
| `increment-button` | The plus (+) button |
| `input` | The number input field |
