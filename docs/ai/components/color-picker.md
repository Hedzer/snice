# snice-color-picker

Color picker with format conversion, presets, and form integration.

## Properties

```typescript
size: 'small'|'medium'|'large' = 'medium';
value: string = '#000000';        // live property only
defaultValue: string = '#000000'; // attr: value; authored/reset default
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
readonly labels: NodeList|null;
```

## Value and form lifecycle

- `value` is live; `defaultValue` reflects the `value` attribute.
- Pristine state follows default changes. Typing, native/preset choice, restore, or any `value` assignment dirties it.
- Reset/restoration are silent and preserve the default across reconnects/form moves.
- Disabled fieldsets disable input, swatch, native chooser, and presets without rewriting `disabled`.

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

- FACE form value is provided only by ElementInternals. The hidden native color input has no `name`, is `aria-hidden`, and has `tabindex="-1"`.
- Supports explicit `<label for="id">`, wrapping labels, and multiple labels combined in document order.
- Read-only `labels` is live across insertion, removal, reordering, retargeting, text changes, and reconnects.
- Base name precedence: associated labels, then `label`, then fallback `Color`.
- Label activation focuses the text input when `showInput`, otherwise the swatch, without activating the native dialog.
- Disabled, disabled-fieldset, and loading controls are inert to label, swatch, native-input, preset, and keyboard activation.
- With text input, the swatch is `<name> color chooser`; without it, the swatch owns the base name. Presets are `Set <name> to <color>`.
- One stable `aria-describedby` targets helper/error text; error replaces helper, uses `role="alert"`, and invalid state uses `aria-invalid`.
- Swatch and presets accept Enter and Space.
