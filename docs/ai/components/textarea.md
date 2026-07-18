# snice-textarea

Multi-line text input with auto-grow and character count. Form-associated.

## Properties

```typescript
value: string = '';              // live property only
defaultValue: string = '';       // attr: value; authored/reset default
variant: 'outlined'|'filled'|'underlined' = 'outlined';
size: 'small'|'medium'|'large' = 'medium';
resize: 'none'|'vertical'|'horizontal'|'both' = 'vertical';
placeholder: string = '';
disabled: boolean = false;
required: boolean = false;
invalid: boolean = false;
readonly: boolean = false;
label: string = '';
helperText: string = '';       // attr: helper-text
errorText: string = '';        // attr: error-text
rows: number = 3;
cols: number = -1;
minlength: number = -1;
maxlength: number = -1;
autocomplete: string = '';
name: string = '';
autoGrow: boolean = false;    // attr: auto-grow
loading: boolean = false;

readonly type: 'textarea';
readonly form: HTMLFormElement | null;
readonly validity: ValidityState;
readonly validationMessage: string;
readonly willValidate: boolean;
readonly labels: NodeList | null;
```

## Value and form lifecycle

- `value` is live and `defaultValue`/the `value` attribute is authored reset state.
- Pristine live state follows default mutations. Input, browser restore, or any `value` assignment (even unchanged) dirties it.
- Reset restores the latest default silently and clears dirtiness. Repeated reset, reconnect, form moves, and disabled fieldsets preserve the native-style contract.

## Form and validation contract

- Listed in `form.elements`; supports `FormData`, explicit `form="id"`, external/wrapping labels, reset, browser restoration, and disabled fieldsets.
- Enabled + non-empty `name` contributes the exact live value. Disabled controls are omitted. `readonly` remains successful but is barred. `loading` is inert and barred while preserving the successful value.
- `required` maps to `valueMissing`. `minlength`/`maxlength` map to `tooShort`/`tooLong` only after customer editing, matching native textarea behavior; programmatic assignment does not manufacture length errors.
- Dynamic values and constraints clear or replace validity immediately. `setCustomValidity(message)` controls `customError`; pass `''` to clear it.
- Calculated errors drive styling, `aria-invalid`, form reporting, and submission blocking. `invalid`/`errorText` are presentation only.

## Methods

- `focus()` - Focus textarea
- `blur()` - Blur textarea
- `select()` - Select text
- `checkValidity()` - Check validation, returns `boolean`
- `reportValidity()` - Report validation to user, returns `boolean`
- `setCustomValidity(message)` - Set custom validation message

## Events

- `textarea-input` -> `{ value, textarea }` - On input
- `textarea-change` -> `{ value, textarea }` - On change
- `textarea-focus` -> `{ textarea }` - On focus
- `textarea-blur` -> `{ textarea }` - On blur

## CSS Parts

- `textarea` - The native textarea element
- `spinner` - Loading spinner
- `error-text` - Error message container
- `helper-text` - Helper text container

## Basic Usage

```html
<snice-textarea label="Comments" placeholder="Enter comments"></snice-textarea>
<snice-textarea variant="filled"></snice-textarea>
<snice-textarea auto-grow></snice-textarea>
<snice-textarea maxlength="500"></snice-textarea>
<snice-textarea resize="both"></snice-textarea>
<snice-textarea invalid error-text="Required field"></snice-textarea>
```

## Accessibility

- External and wrapping labels name/focus the real textarea; `labels` remains live as associations change.
- Helper/error text has one stable `aria-describedby` target; error replaces helper and is announced once.
- `aria-invalid` reflects authored or calculated invalid state.
