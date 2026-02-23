# snice-radio

Form radio button input with automatic group management.

## Properties

```typescript
checked: boolean = false;
disabled: boolean = false;
loading: boolean = false;
required: boolean = false;
invalid: boolean = false;
size: 'small'|'medium'|'large' = 'medium';
name: string = '';           // Group name for mutual exclusion
value: string = '';
label: string = '';
```

## Methods

- `focus()` - Focus radio
- `blur()` - Remove focus
- `click()` - Programmatic click
- `select()` - Select and fire change event

## Events

- `radio-change` → `{ checked, value, radio }`

## CSS Parts

- `input` - Hidden radio input
- `radio` - Radio circle container
- `dot` - Inner dot indicator
- `spinner` - Loading spinner
- `label` - Label text

## Usage

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
<snice-radio label="Required" required></snice-radio>
```

```typescript
radio.addEventListener('radio-change', (e) => {
  console.log('Selected:', e.detail.value);
});
```

## Features

- Automatic radio group management by name
- 3 sizes
- Loading state with spinner
- Keyboard accessible (arrow keys navigate group)
- Form-associated custom element
