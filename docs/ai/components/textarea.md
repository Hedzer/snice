# snice-textarea

Multi-line text input with auto-grow and character count. Form-associated.

## Properties

```typescript
value: string = '';
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
