# snice-input

Text input field with validation and icons.

## Properties

```typescript
value: string = '';
type: 'text'|'password'|'email'|'number'|'tel'|'url'|'search'|'date'|'time'|'datetime-local' = 'text';
variant: 'outlined'|'filled'|'underlined' = 'outlined';
size: 'small'|'medium'|'large' = 'medium';
placeholder: string = '';
disabled: boolean = false;
required: boolean = false;
invalid: boolean = false;
readonly: boolean = false;
clearable: boolean = false;
label: string = '';
helperText: string = '';
errorText: string = '';
prefix: string = '';
suffix: string = '';
prefixIcon: string = '';
suffixIcon: string = '';
min: string = '';
max: string = '';
minlength: number = 0;
maxlength: number = 0;
pattern: string = '';
autocomplete: string = '';
name: string = '';
```

## Methods

- `focus()` - Focus input
- `blur()` - Blur input
- `select()` - Select text
- `clear()` - Clear value

## Events

- `input` - {value, input}
- `change` - {value, input}
- `focus` - {input}
- `blur` - {input}

## Usage

```html
<!-- Basic -->
<snice-input label="Name" placeholder="Enter name"></snice-input>

<!-- Variants -->
<snice-input variant="outlined"></snice-input>
<snice-input variant="filled"></snice-input>
<snice-input variant="underlined"></snice-input>

<!-- Input types -->
<snice-input type="email" label="Email"></snice-input>
<snice-input type="password" label="Password"></snice-input>
<snice-input type="number" label="Age"></snice-input>

<!-- With icons -->
<snice-input prefix-icon="🔍" placeholder="Search"></snice-input>
<snice-input suffix-icon="✉️" type="email"></snice-input>

<!-- With prefix/suffix text -->
<snice-input prefix="$" type="number"></snice-input>
<snice-input suffix=".com" type="url"></snice-input>

<!-- Clearable -->
<snice-input value="Text" clearable></snice-input>

<!-- Helper text -->
<snice-input label="Username" helper-text="Must be unique"></snice-input>

<!-- Error state -->
<snice-input label="Email" invalid error-text="Invalid email"></snice-input>

<!-- Validation -->
<snice-input type="email" required minlength="5" maxlength="50"></snice-input>

<!-- Sizes -->
<snice-input size="small"></snice-input>
<snice-input size="medium"></snice-input>
<snice-input size="large"></snice-input>

<!-- Form integration -->
<snice-input name="username" required></snice-input>

<!-- Events -->
<snice-input id="inp"></snice-input>
<script>
const inp = document.querySelector('#inp');
inp.addEventListener('input', (e) => console.log('Input:', e.detail.value));
inp.addEventListener('change', (e) => console.log('Change:', e.detail.value));
</script>
```

## Features

- Form-associated custom element
- 10 input types
- 3 visual variants
- Prefix/suffix icons or text
- Clearable with X button
- Helper and error text
- Validation (min/max/pattern/length)
- 3 sizes
- Keyboard accessible
