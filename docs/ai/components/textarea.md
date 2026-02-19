# snice-textarea

Multi-line text input field with auto-grow and character count.

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
helperText: string = '';
errorText: string = '';
rows: number = 3;
cols: number = -1;
minlength: number = -1;
maxlength: number = -1;
autocomplete: string = '';
name: string = '';
autoGrow: boolean = false;
loading: boolean = false;
```

## Methods

- `focus()` - Focus textarea
- `blur()` - Blur textarea
- `select()` - Select text

## Events

- `textarea-input` - {value, textarea}
- `textarea-change` - {value, textarea}
- `textarea-focus` - {textarea}
- `textarea-blur` - {textarea}

## Usage

```html
<!-- Basic -->
<snice-textarea label="Comments" placeholder="Enter comments"></snice-textarea>

<!-- Variants -->
<snice-textarea variant="outlined"></snice-textarea>
<snice-textarea variant="filled"></snice-textarea>
<snice-textarea variant="underlined"></snice-textarea>

<!-- Rows -->
<snice-textarea rows="5"></snice-textarea>

<!-- Auto-grow -->
<snice-textarea auto-grow></snice-textarea>

<!-- Character count -->
<snice-textarea maxlength="500"></snice-textarea>

<!-- Resize options -->
<snice-textarea resize="none"></snice-textarea>
<snice-textarea resize="both"></snice-textarea>

<!-- Sizes -->
<snice-textarea size="small"></snice-textarea>
<snice-textarea size="medium"></snice-textarea>
<snice-textarea size="large"></snice-textarea>

<!-- Helper text -->
<snice-textarea helper-text="Max 500 characters"></snice-textarea>

<!-- Error state -->
<snice-textarea invalid error-text="Required field"></snice-textarea>
```

## Features

- Form-associated custom element
- 3 visual variants
- Auto-grow height option
- Character counter
- Resizable (4 modes)
- Helper and error text
- 3 sizes
- Keyboard accessible
