# snice-checkbox

Form checkbox input with indeterminate state.

## Properties

```typescript
checked: boolean = false;
indeterminate: boolean = false;
disabled: boolean = false;
required: boolean = false;
invalid: boolean = false;
size: 'small'|'medium'|'large' = 'medium';
name: string = '';
value: string = 'on';
label: string = '';
loading: boolean = false;
```

## Methods

- `focus()` - Focus checkbox
- `blur()` - Blur checkbox
- `click()` - Programmatic click
- `toggle()` - Toggle checked state
- `setIndeterminate()` - Set indeterminate state

## Events

- `checkbox-change` - {checked, indeterminate, checkbox}

## Usage

```html
<!-- Basic -->
<snice-checkbox label="Accept terms"></snice-checkbox>

<!-- Checked -->
<snice-checkbox label="Enabled" checked></snice-checkbox>

<!-- Indeterminate (partial selection) -->
<snice-checkbox label="Select all" indeterminate></snice-checkbox>

<!-- Disabled -->
<snice-checkbox label="Disabled" disabled></snice-checkbox>

<!-- Required -->
<snice-checkbox label="Required" required></snice-checkbox>

<!-- Invalid -->
<snice-checkbox label="Invalid" invalid></snice-checkbox>

<!-- Sizes -->
<snice-checkbox label="Small" size="small"></snice-checkbox>
<snice-checkbox label="Medium" size="medium"></snice-checkbox>
<snice-checkbox label="Large" size="large"></snice-checkbox>

<!-- Form integration -->
<snice-checkbox name="newsletter" value="yes" label="Subscribe"></snice-checkbox>

<!-- Event handling -->
<snice-checkbox id="cb"></snice-checkbox>
<script>
document.querySelector('#cb').addEventListener('checkbox-change', (e) => {
  console.log('Checked:', e.detail.checked);
});
</script>
```

## CSS Parts

`input`, `checkbox`, `spinner`, `label`

## Features

- Form-associated custom element
- Indeterminate state
- 3 sizes
- Keyboard accessible
- Change events
- Invalid state styling
