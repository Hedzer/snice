# Color Picker

`snice-color-picker` is a form-associated color control with hex/RGB/HSL display, a browser color dialog, optional presets, and optional editable text.

```html
<label for="brand-color">Brand color</label>
<snice-color-picker
  id="brand-color"
  name="brand"
  value="#3b82f6"
  show-presets
  helper-text="Choose the primary brand color"
></snice-color-picker>
```

External `<label for="id">`, wrapping labels, and multiple labels are supported. The live `labels` property follows DOM changes. Label activation focuses the text input, or the swatch when `show-input="false"`, without opening the browser dialog. Accessible names use associated labels, then `label`, then `Color`; the companion swatch and presets receive distinct derived names.

The hidden native color input is unnamed and hidden from the accessibility tree. ElementInternals provides the single form value. One stable `aria-describedby` connects helper/error text, with error replacing helper and using `role="alert"`. Authored disabled, inherited fieldset disabled, and loading states block every interaction path without rewriting authored `disabled`.

`value` is live state; `defaultValue` reflects the `value` content attribute and is the authored form-reset default. Pristine pickers follow default changes, while user selection, property assignment, and browser restoration dirty only live state. Reset/restoration are silent and survive reconnects and form moves.

Six-digit hex, bounded RGB, and bounded HSL input canonicalize to hex. Malformed editable text remains visible and reports `badInput`; an empty `required` picker reports `valueMissing`. The host exposes `form`, `validity`, `validationMessage`, `willValidate`, `labels`, `checkValidity()`, `reportValidity()`, and `setCustomValidity()`. Calculated errors block validated submission and drive `aria-invalid`; the authored `invalid` property is presentation only.

See [`docs/components/color-picker.md`](../../../../docs/components/color-picker.md) for the complete human reference. AI-oriented reference: [`docs/ai/components/color-picker.md`](../../../../docs/ai/components/color-picker.md).
