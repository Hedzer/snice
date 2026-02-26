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
loading: boolean = false;
password: boolean = false;
label: string = '';
helperText: string = '';       // attribute: helper-text
errorText: string = '';        // attribute: error-text
prefixIcon: string = '';       // attribute: prefix-icon
suffixIcon: string = '';       // attribute: suffix-icon
min: string = '';
max: string = '';
step: string = '';
minlength: number = -1;
maxlength: number = -1;
pattern: string = '';
autocomplete: string = '';
name: string = '';
align: 'top'|'center'|'bottom'|'' = '';  // vertical alignment when host has explicit height
stretch: boolean = false;                 // input fills full host height
```

## Slots

- `prefix-icon` - Custom prefix icon (overrides `prefixIcon` property)
- `suffix-icon` - Custom suffix icon (overrides `suffixIcon` property)

## Methods

- `focus()` - Focus input
- `blur()` - Blur input
- `select()` - Select text
- `clear()` - Clear value

## Events

- `input-input` - {value, input}
- `input-change` - {value, input}
- `input-focus` - {input}
- `input-blur` - {input}
- `input-clear` - {input}

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

<!-- With icons (supports: URL, image files, emoji, text) -->
<snice-input prefix-icon="🔍" placeholder="Search"></snice-input>
<snice-input suffix-icon="✉️" type="email"></snice-input>
<snice-input prefix-icon="/icons/search.svg" placeholder="Search"></snice-input>
<snice-input prefix-icon="search" placeholder="Search"></snice-input> <!-- Material Symbols -->

<!-- Password toggle -->
<snice-input type="password" password label="Password"></snice-input>

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
inp.addEventListener('input-input', (e) => console.log('Input:', e.detail.value));
inp.addEventListener('input-change', (e) => console.log('Change:', e.detail.value));
</script>

<!-- Icon slots (for external CSS icon fonts like Material Symbols) -->
<snice-input placeholder="Search">
  <span slot="prefix-icon" class="material-symbols-outlined">search</span>
</snice-input>

<snice-input placeholder="Email">
  <span slot="suffix-icon" class="material-symbols-outlined">mail</span>
</snice-input>

<!-- Both slots -->
<snice-input placeholder="Search users">
  <span slot="prefix-icon" class="material-symbols-outlined">search</span>
  <span slot="suffix-icon" class="material-symbols-outlined">person</span>
</snice-input>

<!-- Vertical alignment (when host has explicit height) -->
<snice-input style="height:200px" align="top"></snice-input>
<snice-input style="height:200px" align="center"></snice-input>
<snice-input style="height:200px" align="bottom"></snice-input>

<!-- Stretch input to fill height -->
<snice-input style="height:200px" stretch></snice-input>
```

## Features

- Form-associated custom element
- 10 input types
- 3 visual variants
- Prefix/suffix icons (URL, image files, emoji, font ligatures)
- Password visibility toggle
- Clearable with X button
- Helper and error text
- Validation (min/max/pattern/length)
- 3 sizes
- Keyboard accessible
