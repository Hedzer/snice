<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/slider.md -->

# Slider

An interactive range slider for selecting numeric values with mouse, touch, and keyboard support. Form-associated.

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
| `value` | `number` | `0` | Current slider value |
| `min` | `number` | `0` | Minimum value |
| `max` | `number` | `100` | Maximum value |
| `step` | `number` | `1` | Step increment |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant |
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger'` | `'default'` | Color variant |
| `label` | `string` | `''` | Label text |
| `helperText` (attr: `helper-text`) | `string` | `''` | Helper text below slider |
| `errorText` (attr: `error-text`) | `string` | `''` | Error message (shown when invalid) |
| `disabled` | `boolean` | `false` | Disables the slider |
| `readonly` | `boolean` | `false` | Makes the slider read-only |
| `required` | `boolean` | `false` | Makes the slider required |
| `invalid` | `boolean` | `false` | Shows invalid state |
| `loading` | `boolean` | `false` | Shows loading spinner |
| `name` | `string` | `''` | Form field name |
| `showValue` (attr: `show-value`) | `boolean` | `false` | Display current value |
| `showTicks` (attr: `show-ticks`) | `boolean` | `false` | Show tick marks along the track |
| `vertical` | `boolean` | `false` | Vertical orientation |

The `form-align` HTML attribute (CSS-only, no JS property) gives the track area `min-height: 2.5rem` to align with input/select fields in form rows.

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `focus()` | `options?: FocusOptions` | Focus the slider thumb |
| `blur()` | — | Remove focus |
| `checkValidity()` | — | Check validation, returns `boolean` |
| `reportValidity()` | — | Report validation to user, returns `boolean` |
| `setCustomValidity()` | `message: string` | Set custom validation message |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `slider-input` | `{ value: number, slider: SniceSliderElement }` | Fired continuously while dragging |
| `slider-change` | `{ value: number, slider: SniceSliderElement }` | Fired when value is committed |

## CSS Parts

| Part | Description |
|------|-------------|
| `track` | The slider track |
| `fill` | The filled portion of the track |
| `thumb` | The draggable thumb |
| `spinner` | Loading spinner |
| `error-text` | Error message container |
| `helper-text` | Helper text container |

## Basic Usage

```typescript
import 'snice/components/slider/snice-slider';
```

```html
<snice-slider label="Volume" min="0" max="100" value="50"></snice-slider>
```

## Examples

### Variants

Use `variant` to change the slider color.

```html
<snice-slider variant="primary" label="Primary"></snice-slider>
<snice-slider variant="success" label="Success"></snice-slider>
<snice-slider variant="danger" label="Danger"></snice-slider>
```

### Sizes

Use `size` to change the slider size.

```html
<snice-slider size="small" label="Small"></snice-slider>
<snice-slider size="large" label="Large"></snice-slider>
```

### Value Display and Tick Marks

Set `show-value` and `show-ticks` to display additional visual information.

```html
<snice-slider label="Rating" min="0" max="10" step="1" show-ticks show-value></snice-slider>
```

### Vertical

Set `vertical` for vertical orientation.

```html
<snice-slider label="Volume" min="0" max="100" value="60" vertical show-value></snice-slider>
```

### Error State

Set `invalid` with `error-text` to show validation errors.

```html
<snice-slider label="Age" invalid error-text="Value out of range"></snice-slider>
```

### Form Alignment

Use the `form-align` attribute to align the slider with adjacent form fields.

```html
<div style="display: flex; gap: 1rem; align-items: flex-start;">
  <snice-input label="Price"></snice-input>
  <snice-slider label="Quantity" min="0" max="100" form-align></snice-slider>
</div>
```

### Form Integration

The slider is form-associated and participates in form submission.

```html
<form>
  <snice-slider name="volume" label="Volume" min="0" max="100" value="50" required></snice-slider>
  <button type="submit">Save</button>
</form>
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `ArrowLeft` / `ArrowDown` | Decrease by one step |
| `ArrowRight` / `ArrowUp` | Increase by one step |
| `Home` | Set to minimum |
| `End` | Set to maximum |

## Accessibility

- Form-associated via `ElementInternals`
- `role="slider"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Focus ring on keyboard navigation
- Supports mouse, touch, and keyboard input
- Validation with `checkValidity()`, `reportValidity()`, and `setCustomValidity()`
