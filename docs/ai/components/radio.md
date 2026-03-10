# snice-radio

Form radio button input with automatic group management by name.

## Properties

```typescript
checked: boolean = false;
disabled: boolean = false;
loading: boolean = false;
required: boolean = false;
invalid: boolean = false;
variant: 'default'|'block' = 'default'; // 'block' = card-style radio
size: 'small'|'medium'|'large' = 'medium';
name: string = '';           // Group name for mutual exclusion
value: string = '';
label: string = '';
description: string = '';    // Subtitle text (block variant only)
```

## Methods

- `focus()` - Focus radio input
- `blur()` - Remove focus
- `click()` - Programmatic click
- `select()` - Select and fire change event

## Events

- `radio-change` → `{ checked: boolean, value: string, radio: SniceRadioElement }`

## Slots

- `suffix` - End content for block variant (badges, prices)

## CSS Parts

- `input` - Hidden native radio input
- `radio` - Radio circle container
- `dot` - Inner dot indicator
- `spinner` - Loading spinner
- `content` - Content wrapper (block variant)
- `label` - Label text
- `description` - Description text (block variant)

## Basic Usage

```html
<!-- Radio group -->
<snice-radio name="color" value="red" label="Red"></snice-radio>
<snice-radio name="color" value="green" label="Green"></snice-radio>
<snice-radio name="color" value="blue" label="Blue" checked></snice-radio>

<!-- Sizes -->
<snice-radio label="Small" size="small"></snice-radio>
<snice-radio label="Large" size="large"></snice-radio>

<!-- States -->
<snice-radio label="Disabled" disabled></snice-radio>
<snice-radio label="Loading" loading></snice-radio>
<snice-radio label="Invalid" invalid></snice-radio>

<!-- Block variant (card-style) -->
<snice-radio variant="block" name="plan" value="free" label="Free" description="For individuals" checked>
  <span slot="suffix">Free forever</span>
</snice-radio>
<snice-radio variant="block" name="plan" value="pro" label="Pro" description="For teams">
  <span slot="suffix">$12/mo</span>
</snice-radio>
```

```typescript
radio.addEventListener('radio-change', (e) => {
  console.log('Selected:', e.detail.value);
});
```

## Keyboard Navigation

- Arrow keys navigate within group (wraps around)
- Focused radio is auto-selected

## Accessibility

- Native `<input type="radio">` for form participation
- `aria-invalid` when invalid
- Focus ring on keyboard navigation
- Required indicator on label
