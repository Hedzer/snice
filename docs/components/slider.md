<!-- AI: For a low-token version of this doc, use docs/ai/components/slider.md instead -->

# Slider
`<snice-slider>`

An interactive range slider for selecting numeric values with mouse, touch, and keyboard support.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/slider/snice-slider';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-slider.min.js"></script>
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
| `helperText` (attr: `helper-text`) | `string` | `''` | Helper text below slider |
| `errorText` (attr: `error-text`) | `string` | `''` | Error message (shown when invalid) |
| `disabled` | `boolean` | `false` | Disables the slider |
| `readonly` | `boolean` | `false` | Makes the slider read-only |
| `required` | `boolean` | `false` | Makes the slider required |
| `invalid` | `boolean` | `false` | Shows invalid state |
| `name` | `string` | `''` | Form field name |
| `showValue` (attr: `show-value`) | `boolean` | `false` | Display current value |
| `showTicks` (attr: `show-ticks`) | `boolean` | `false` | Show tick marks |
| `vertical` | `boolean` | `false` | Vertical orientation |
| `form-align` | (CSS-only attribute) | -- | Gives the track area `min-height: 2.5rem` to align with input/select fields in form rows |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `focus()` | `options?: FocusOptions` | Focus the slider thumb |
| `blur()` | -- | Remove focus |
| `checkValidity()` | -- | Check validation, returns `boolean` |
| `reportValidity()` | -- | Report validation to user, returns `boolean` |
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
| `spinner` | Loading spinner (when loading) |
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

Use the `variant` attribute to change the slider's color.

```html
<snice-slider variant="default" label="Default"></snice-slider>
<snice-slider variant="primary" label="Primary"></snice-slider>
<snice-slider variant="success" label="Success"></snice-slider>
<snice-slider variant="warning" label="Warning"></snice-slider>
<snice-slider variant="danger" label="Danger"></snice-slider>
```

### Sizes

Use the `size` attribute to change the slider's size.

```html
<snice-slider size="small" label="Small"></snice-slider>
<snice-slider size="medium" label="Medium"></snice-slider>
<snice-slider size="large" label="Large"></snice-slider>
```

### Value Display

Set the `show-value` attribute to display the current value.

```html
<snice-slider label="Brightness" min="0" max="100" value="75" show-value></snice-slider>
```

### Tick Marks

Set the `show-ticks` attribute to display step indicators along the track.

```html
<snice-slider label="Rating" min="0" max="10" step="1" show-ticks show-value></snice-slider>
```

### Custom Range and Step

Use the `min`, `max`, and `step` attributes to define the slider range.

```html
<snice-slider label="Temperature" min="60" max="80" step="0.5" value="72" show-value></snice-slider>
```

### Vertical

Set the `vertical` attribute for a vertical orientation.

```html
<snice-slider label="Volume" min="0" max="100" value="60" vertical show-value></snice-slider>
```

### Error State

Set the `invalid` attribute with `error-text` to show validation errors.

```html
<snice-slider label="Age" min="0" max="120" value="150" invalid error-text="Value must be between 0 and 120"></snice-slider>
```

### Form Alignment

When placing a slider alongside text inputs or selects in a form row, add the `form-align` attribute. This gives the slider track area the same height as a standard form field (40px), so the track vertically centers at the same level as adjacent input fields.

```html
<div style="display: flex; gap: 1rem; align-items: flex-start;">
  <snice-input label="Price" placeholder="0.00"></snice-input>
  <snice-slider label="Quantity" min="0" max="100" value="50" form-align></snice-slider>
</div>
```

### In a Form

The slider is form-associated and participates in form submission.

```html
<form id="settings-form">
  <snice-slider name="volume" label="Volume" min="0" max="100" value="50" required></snice-slider>
  <button type="submit">Save Settings</button>
</form>
```
