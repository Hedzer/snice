# snice-color-picker

Color picker with format conversion and presets.

## Properties

```typescript
value: string = '#000000';
format: 'hex'|'rgb'|'hsl' = 'hex';
size: 'small'|'medium'|'large' = 'medium';
label: string = '';
helperText: string = '';       // attribute: helper-text
errorText: string = '';        // attribute: error-text
disabled: boolean = false;
required: boolean = false;
invalid: boolean = false;
name: string = '';
showInput: boolean = true;     // attribute: show-input
showPresets: boolean = false;  // attribute: show-presets
presets: string[] = [...];
loading: boolean = false;
```

## Methods

- `focus()` - Focus picker
- `blur()` - Blur picker

## CSS Parts

- `spinner` - Loading spinner
- `error-text` - Error text element
- `helper-text` - Helper text element

## Events

- `color-picker-input` → `{ value, colorPicker }`
- `color-picker-change` → `{ value, colorPicker }`
- `color-picker-focus` → `{ colorPicker }`
- `color-picker-blur` → `{ colorPicker }`

## Usage

```html
<!-- Basic -->
<snice-color-picker label="Color" value="#ff0000"></snice-color-picker>

<!-- Formats -->
<snice-color-picker format="hex"></snice-color-picker>
<snice-color-picker format="rgb"></snice-color-picker>
<snice-color-picker format="hsl"></snice-color-picker>

<!-- With presets -->
<snice-color-picker show-presets></snice-color-picker>

<!-- No input -->
<snice-color-picker show-input="false"></snice-color-picker>

<!-- Sizes -->
<snice-color-picker size="small"></snice-color-picker>
<snice-color-picker size="medium"></snice-color-picker>
<snice-color-picker size="large"></snice-color-picker>

<!-- Events -->
<snice-color-picker id="picker"></snice-color-picker>
<script>
const picker = document.querySelector('#picker');
picker.addEventListener('color-picker-change', (e) => {
  console.log('Color:', e.detail.value);
});
</script>
```

## Features

- Form-associated custom element
- Native color picker integration
- 3 color formats (hex, rgb, hsl)
- Format conversion
- Color presets
- 3 sizes
- Accessible
