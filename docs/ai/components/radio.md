# snice-radio

Form radio button input with grouping.

## Properties

```typescript
checked: boolean = false;
disabled: boolean = false;
required: boolean = false;
invalid: boolean = false;
size: 'small'|'medium'|'large' = 'medium';
name: string = '';
value: string = '';
label: string = '';
loading: boolean = false;
```

## Methods

- `focus()` - Focus radio
- `blur()` - Blur radio
- `click()` - Programmatic click
- `select()` - Programmatic selection

## Events

- `radio-change` - {checked, value, radio}

## Usage

```html
<!-- Basic radio group -->
<snice-radio name="color" value="red" label="Red"></snice-radio>
<snice-radio name="color" value="green" label="Green"></snice-radio>
<snice-radio name="color" value="blue" label="Blue"></snice-radio>

<!-- Pre-selected -->
<snice-radio name="size" value="s" label="Small"></snice-radio>
<snice-radio name="size" value="m" label="Medium" checked></snice-radio>
<snice-radio name="size" value="l" label="Large"></snice-radio>

<!-- Disabled -->
<snice-radio label="Unavailable" disabled></snice-radio>
<snice-radio label="Selected but disabled" checked disabled></snice-radio>

<!-- Required -->
<snice-radio name="accept" value="yes" label="Accept" required></snice-radio>

<!-- Invalid -->
<snice-radio label="Invalid option" invalid></snice-radio>

<!-- Sizes -->
<snice-radio label="Small" size="small"></snice-radio>
<snice-radio label="Medium" size="medium"></snice-radio>
<snice-radio label="Large" size="large"></snice-radio>

<!-- Form integration -->
<form>
  <snice-radio name="plan" value="free" label="Free"></snice-radio>
  <snice-radio name="plan" value="pro" label="Pro"></snice-radio>
  <snice-radio name="plan" value="enterprise" label="Enterprise"></snice-radio>
</form>

<!-- Event handling -->
<snice-radio id="rb" name="opt" value="a"></snice-radio>
<script>
document.querySelector('#rb').addEventListener('radio-change', (e) => {
  console.log('Selected:', e.detail.value);
});
</script>
```

## Features

- Form-associated custom element
- Automatic radio group management by name
- 3 sizes
- Keyboard accessible (arrow keys navigate group)
- Change events
- Invalid state styling
