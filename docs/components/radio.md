<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/radio.md -->

# Radio

A form radio button input with automatic group management by name.

## Table of Contents

- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `checked` | `boolean` | `false` | Whether the radio is selected |
| `disabled` | `boolean` | `false` | Disables interaction |
| `loading` | `boolean` | `false` | Shows spinner instead of dot |
| `required` | `boolean` | `false` | Marks as required for forms |
| `invalid` | `boolean` | `false` | Shows invalid state styling |
| `variant` | `'default' \| 'block'` | `'default'` | Visual variant. `block` renders card-style layout |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Radio button size |
| `name` | `string` | `''` | Group name for mutual exclusion |
| `value` | `string` | `''` | Form value when selected |
| `label` | `string` | `''` | Label text |
| `description` | `string` | `''` | Description text below the label (block variant only) |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `focus()` | — | Focuses the radio input |
| `blur()` | — | Removes focus |
| `click()` | — | Programmatic click |
| `select()` | — | Selects the radio and fires change event |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `radio-change` | `{ checked: boolean, value: string, radio: SniceRadioElement }` | Fired when the selection changes |

## Slots

| Name | Description |
|------|-------------|
| `suffix` | End content for block variant (badges, prices, labels) |

## CSS Parts

| Part | Description |
|------|-------------|
| `input` | The hidden native radio input |
| `radio` | The radio circle container |
| `dot` | The inner dot indicator |
| `spinner` | The loading spinner |
| `content` | The content wrapper (block variant) |
| `label` | The label text |
| `description` | The description text (block variant) |

## Basic Usage

```typescript
import 'snice/components/radio/snice-radio';
```

```html
<snice-radio name="color" value="red" label="Red"></snice-radio>
<snice-radio name="color" value="green" label="Green"></snice-radio>
<snice-radio name="color" value="blue" label="Blue"></snice-radio>
```

## Examples

### Pre-selected

Set the `checked` attribute to pre-select a radio button.

```html
<snice-radio name="size" value="s" label="Small"></snice-radio>
<snice-radio name="size" value="m" label="Medium" checked></snice-radio>
<snice-radio name="size" value="l" label="Large"></snice-radio>
```

### Sizes

Use the `size` attribute to change the radio button size.

```html
<snice-radio label="Small" size="small"></snice-radio>
<snice-radio label="Medium" size="medium"></snice-radio>
<snice-radio label="Large" size="large"></snice-radio>
```

### Disabled

Set the `disabled` attribute to prevent interaction.

```html
<snice-radio label="Unavailable" disabled></snice-radio>
<snice-radio label="Selected but disabled" checked disabled></snice-radio>
```

### Required

Set the `required` attribute to mark the field as required in forms.

```html
<snice-radio name="terms" value="accept" label="I accept the terms" required></snice-radio>
```

### Invalid

Set the `invalid` attribute to show validation error styling.

```html
<snice-radio label="Invalid selection" invalid></snice-radio>
```

### Loading

Set the `loading` attribute to show a spinner instead of the radio dot.

```html
<snice-radio label="Processing..." loading></snice-radio>
```

### Block Variant

Use `variant="block"` to render card-style radio buttons. Add a `description` for subtitle text and use the `suffix` slot for end content.

```html
<snice-radio
  variant="block"
  name="plan"
  value="free"
  label="Free"
  description="For individuals getting started"
  checked
>
  <span slot="suffix">Free forever</span>
</snice-radio>

<snice-radio
  variant="block"
  name="plan"
  value="pro"
  label="Pro"
  description="For growing teams and businesses"
>
  <span slot="suffix">$12/mo</span>
</snice-radio>

<snice-radio
  variant="block"
  name="plan"
  value="enterprise"
  label="Enterprise"
  description="For large organizations with custom needs"
>
  <span slot="suffix">Contact us</span>
</snice-radio>
```

### Event Handling

Listen for `radio-change` to respond to selection changes.

```typescript
document.querySelectorAll('snice-radio[name="plan"]').forEach(radio => {
  radio.addEventListener('radio-change', (e) => {
    console.log('Selected:', e.detail.value);
  });
});
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `ArrowDown` / `ArrowRight` | Move to next radio in group |
| `ArrowUp` / `ArrowLeft` | Move to previous radio in group |

Arrow keys wrap around the group and automatically select the focused radio.

## Accessibility

- Contains a native `<input type="radio">` for form participation
- Radios with the same `name` form a group with mutual exclusion
- Focus ring shown on keyboard navigation
- `aria-invalid` set when `invalid` is true
- Required indicator (`*`) shown on label when `required` is true
- Disabled state reduces opacity and prevents interaction
