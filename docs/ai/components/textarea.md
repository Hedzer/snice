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
```

## Value and form lifecycle

- `value` is live and `defaultValue`/the `value` attribute is authored reset state.
- Pristine live state follows default mutations. Input, browser restore, or any `value` assignment (even unchanged) dirties it.
- Reset restores the latest default silently and clears dirtiness. Repeated reset, reconnect, form moves, and disabled fieldsets preserve the native-style contract.

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
