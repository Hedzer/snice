<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/step-input.md -->

# Step Input

A numeric stepper control with visible increment and decrement buttons flanking an input field. Supports value constraints, wrapping, and keyboard input.

## Table of Contents

- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `number` | `0` | Current value |
| `min` | `number` | `-Infinity` | Minimum allowed value |
| `max` | `number` | `Infinity` | Maximum allowed value |
| `step` | `number` | `1` | Increment/decrement amount |
| `disabled` | `boolean` | `false` | Disables all interaction |
| `readonly` | `boolean` | `false` | Prevents value changes (input remains focusable) |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Control size |
| `wrap` | `boolean` | `false` | Wrap around at min/max boundaries |

## Methods

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `increment()` | -- | `void` | Increase value by step |
| `decrement()` | -- | `void` | Decrease value by step |
| `focus()` | `options?: FocusOptions` | `void` | Focus the input field |
| `blur()` | -- | `void` | Remove focus |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `value-change` | `{ value: number, oldValue: number, component: SniceStepInputElement }` | Fired when the value changes |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The outer container |
| `decrement-button` | The minus (-) button |
| `increment-button` | The plus (+) button |
| `input` | The number input field |

## Basic Usage

```typescript
import 'snice/components/step-input/snice-step-input';
```

```html
<snice-step-input value="5"></snice-step-input>
```

## Examples

### Sizes

Use `size` to change the stepper's dimensions.

```html
<snice-step-input size="small" value="3"></snice-step-input>
<snice-step-input size="medium" value="5"></snice-step-input>
<snice-step-input size="large" value="7"></snice-step-input>
```

### Min, Max, and Step

Use `min`, `max`, and `step` to constrain and control the value range.

```html
<snice-step-input min="0" max="10" step="1" value="5"></snice-step-input>
<snice-step-input min="0" max="100" step="5" value="50"></snice-step-input>
```

### Wrap Around

Set `wrap` to cycle through values when reaching the min or max boundary.

```html
<snice-step-input min="1" max="12" value="12" wrap></snice-step-input>
```

### Disabled and Read Only

```html
<snice-step-input value="3" disabled></snice-step-input>
<snice-step-input value="42" readonly></snice-step-input>
```

### Programmatic Control

```typescript
const stepper = document.querySelector('snice-step-input');
stepper.increment(); // value becomes 6
stepper.decrement(); // value becomes 5
```

### Event Handling

```typescript
stepper.addEventListener('value-change', (e) => {
  console.log(`Changed from ${e.detail.oldValue} to ${e.detail.value}`);
});
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `ArrowUp` | Increment by step |
| `ArrowDown` | Decrement by step |

## Accessibility

- Buttons are keyboard accessible with visible focus indicators
- Input field accepts direct keyboard entry
- Disabled buttons at min/max boundaries (unless `wrap` is set)
