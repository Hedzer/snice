<!-- AI: For a low-token version of this doc, use docs/ai/components/radio.md instead -->

# Radio
`<snice-radio>`

A form radio button input with automatic group management by name.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/radio/snice-radio';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-radio.min.js"></script>
```

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
| `description` | `string` | `''` | Description text below the label (block variant) |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `focus()` | -- | Focuses the radio input |
| `blur()` | -- | Removes focus |
| `click()` | -- | Programmatic click |
| `select()` | -- | Selects the radio and fires change event |

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
| `input` | The hidden radio input |
| `radio` | The radio circle container |
| `dot` | The inner dot indicator |
| `spinner` | The loading spinner |
| `label` | The label text |
| `content` | The content wrapper (block variant) |
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

### Form Integration

Radio buttons with the same `name` automatically form a group where only one can be selected.

```html
<form>
  <snice-radio name="plan" value="free" label="Free"></snice-radio>
  <snice-radio name="plan" value="pro" label="Pro"></snice-radio>
  <snice-radio name="plan" value="enterprise" label="Enterprise"></snice-radio>
</form>
```

### Block Variant

Use `variant="block"` to render card-style radio buttons, ideal for plan pickers or option selectors. Add a `description` for subtitle text and use the `suffix` slot for end content like badges or prices.

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

```html
<snice-radio id="option" name="choice" value="a" label="Option A"></snice-radio>

<script type="module">
  import 'snice/components/radio/snice-radio';

  document.getElementById('option').addEventListener('radio-change', (e) => {
    console.log('Selected:', e.detail.value);
  });
</script>
```
