# snice-color-picker

Color picker with format conversion, presets, and form integration.

## Properties

```typescript
size: 'small'|'medium'|'large' = 'medium';
value: string = '#000000';
format: 'hex'|'rgb'|'hsl' = 'hex';
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

- `focus()` - Focus picker input
- `blur()` - Remove focus

## Events

- `color-picker-input` -> `{ value, colorPicker }` - During color adjustment
- `color-picker-change` -> `{ value, colorPicker }` - Color committed
- `color-picker-focus` -> `{ colorPicker }` - Input focused
- `color-picker-blur` -> `{ colorPicker }` - Input blurred

## CSS Parts

- `spinner` - Loading spinner
- `error-text` - Error text element
- `helper-text` - Helper text element

## Basic Usage

```html
<snice-color-picker label="Color" value="#ff0000"></snice-color-picker>
```

```typescript
import 'snice/components/color-picker/snice-color-picker';

picker.addEventListener('color-picker-change', (e) => {
  console.log('Color:', e.detail.value);
});
```

## Accessibility

- Form-associated custom element
- Label association, error/helper text announced
- Keyboard accessible
