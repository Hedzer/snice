# Slider Component

The `<snice-slider>` component provides an interactive range slider for selecting numeric values with mouse, touch, and keyboard support.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Keyboard Navigation](#keyboard-navigation)
- [Features](#features)
- [Examples](#examples)

## Basic Usage

```html
<snice-slider
  label="Volume"
  min="0"
  max="100"
  value="50"
  show-value
></snice-slider>
```

```typescript
import 'snice/components/slider/snice-slider';

const slider = document.querySelector('snice-slider');
slider.addEventListener('slider-change', (e) => {
  console.log('Value:', e.detail.value);
});
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `number` | `0` | Current slider value |
| `min` | `number` | `0` | Minimum value |
| `max` | `number` | `100` | Maximum value |
| `step` | `number` | `1` | Step increment |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant |
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger'` | `'default'` | Color variant |
| `label` | `string` | `''` | Label text |
| `helperText` | `string` | `''` | Helper text below slider |
| `errorText` | `string` | `''` | Error message (shown when invalid) |
| `disabled` | `boolean` | `false` | Whether slider is disabled |
| `readonly` | `boolean` | `false` | Whether slider is readonly |
| `required` | `boolean` | `false` | Whether slider is required |
| `invalid` | `boolean` | `false` | Whether to show invalid state |
| `name` | `string` | `''` | Form field name |
| `showValue` | `boolean` | `false` | Display current value |
| `showTicks` | `boolean` | `false` | Show tick marks |
| `vertical` | `boolean` | `false` | Vertical orientation |

## Methods

### `focus(): void`
Give focus to the slider thumb.

```typescript
slider.focus();
```

### `blur(): void`
Remove focus from the slider thumb.

```typescript
slider.blur();
```

### `checkValidity(): boolean`
Check if the slider passes validation.

```typescript
const isValid = slider.checkValidity();
```

### `reportValidity(): boolean`
Report validation status to the user.

```typescript
slider.reportValidity();
```

### `setCustomValidity(message: string): void`
Set a custom validation message.

```typescript
slider.setCustomValidity('Value must be between 10 and 90');
```

## Events

### `slider-input`
Fired continuously while dragging the slider.

**Detail**: `{ value: number, slider: SniceSliderElement }`

```typescript
slider.addEventListener('slider-input', (e) => {
  console.log('Current value:', e.detail.value);
});
```

### `slider-change`
Fired when the slider value is committed (after drag ends or keyboard input).

**Detail**: `{ value: number, slider: SniceSliderElement }`

```typescript
slider.addEventListener('slider-change', (e) => {
  console.log('Final value:', e.detail.value);
});
```

## Keyboard Navigation

The slider supports full keyboard navigation:

| Key | Action |
|-----|--------|
| `←` / `↓` | Decrease by step |
| `→` / `↑` | Increase by step |
| `Home` | Jump to minimum |
| `End` | Jump to maximum |
| `Page Down` | Decrease by 10× step |
| `Page Up` | Increase by 10× step |

## Features

- **Input Devices**: Full mouse, touch, and keyboard support
- **Form Integration**: Form-associated custom element with validation
- **Visual Variants**: Five color options (default, primary, success, warning, danger)
- **Orientations**: Horizontal (default) or vertical layout
- **Value Display**: Optional current value indicator
- **Tick Marks**: Optional visual step indicators
- **Step Control**: Configure increment size
- **Accessibility**: Full ARIA support with keyboard navigation

## Examples

### Basic Slider

```html
<snice-slider
  label="Volume"
  min="0"
  max="100"
  value="50"
></snice-slider>
```

### With Value Display

```html
<snice-slider
  label="Brightness"
  min="0"
  max="100"
  value="75"
  show-value
></snice-slider>
```

### With Tick Marks

```html
<snice-slider
  label="Rating"
  min="0"
  max="10"
  step="1"
  show-ticks
  show-value
></snice-slider>
```

### Different Variants

```html
<snice-slider variant="default" label="Default"></snice-slider>
<snice-slider variant="primary" label="Primary"></snice-slider>
<snice-slider variant="success" label="Success"></snice-slider>
<snice-slider variant="warning" label="Warning"></snice-slider>
<snice-slider variant="danger" label="Danger"></snice-slider>
```

### Different Sizes

```html
<snice-slider size="small" label="Small"></snice-slider>
<snice-slider size="medium" label="Medium"></snice-slider>
<snice-slider size="large" label="Large"></snice-slider>
```

### Custom Range and Step

```html
<!-- Temperature: 60-80°F in 0.5° increments -->
<snice-slider
  label="Temperature"
  min="60"
  max="80"
  step="0.5"
  value="72"
  show-value
></snice-slider>

<!-- Percentage: 0-100 in 5% increments -->
<snice-slider
  label="Discount"
  min="0"
  max="100"
  step="5"
  value="20"
  show-value
  show-ticks
></snice-slider>
```

### Vertical Slider

```html
<snice-slider
  label="Volume"
  min="0"
  max="100"
  value="60"
  vertical
  show-value
></snice-slider>
```

### Error State

```html
<snice-slider
  label="Age"
  min="0"
  max="120"
  value="150"
  invalid
  error-text="Value must be between 0 and 120"
></snice-slider>
```

### In a Form

```html
<form id="settings-form">
  <snice-slider
    name="volume"
    label="Volume"
    min="0"
    max="100"
    value="50"
    required
  ></snice-slider>

  <snice-slider
    name="brightness"
    label="Brightness"
    min="0"
    max="100"
    value="75"
  ></snice-slider>

  <button type="submit">Save Settings</button>
</form>

<script>
document.getElementById('settings-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  console.log('Volume:', formData.get('volume'));
  console.log('Brightness:', formData.get('brightness'));
});
</script>
```

### Real-time Value Display

```html
<snice-slider id="volume-slider" min="0" max="100" value="50"></snice-slider>
<div id="volume-display">Volume: 50</div>

<script>
const slider = document.getElementById('volume-slider');
const display = document.getElementById('volume-display');

slider.addEventListener('slider-input', (e) => {
  display.textContent = `Volume: ${e.detail.value}`;
});
</script>
```
