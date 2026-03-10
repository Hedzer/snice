# snice-input

Text input field with validation, icons, and form association.

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
helperText: string = '';       // attr: helper-text
errorText: string = '';        // attr: error-text
prefixIcon: string = '';       // attr: prefix-icon
suffixIcon: string = '';       // attr: suffix-icon
min: string = '';
max: string = '';
step: string = '';
minlength: number = -1;
maxlength: number = -1;
pattern: string = '';
autocomplete: string = '';
name: string = '';
align: 'top'|'center'|'bottom'|'' = '';  // vertical alignment when host has explicit height
labelAlign: 'left'|'center'|'right' = 'left';  // attr: label-align
stretch: boolean = false;                 // input fills full host height
```

## Methods

- `focus()` - Focus input
- `blur()` - Blur input
- `select()` - Select text
- `clear()` - Clear value
- `checkValidity()` - Check validation, returns `boolean`
- `reportValidity()` - Report validation to user, returns `boolean`
- `setCustomValidity(message)` - Set custom validation message

## Events

- `input-input` → `{ value, input }` — each keystroke
- `input-change` → `{ value, input }` — value commit
- `input-focus` → `{ input }` — focus
- `input-blur` → `{ input }` — blur
- `input-clear` → `{ input }` — cleared

## Slots

- `prefix-icon` - Custom prefix icon (overrides `prefixIcon` property)
- `suffix-icon` - Custom suffix icon (overrides `suffixIcon` property)

## CSS Parts

`wrapper`, `label`, `container`, `input`, `prefix-icon`, `suffix-icon`, `clear`, `spinner`, `password-toggle`, `helper-text`, `error-text`

## Basic Usage

```typescript
import 'snice/components/input/snice-input';
```

```html
<!-- Basic -->
<snice-input label="Name" placeholder="Enter name"></snice-input>

<!-- Variants -->
<snice-input variant="outlined"></snice-input>
<snice-input variant="filled"></snice-input>
<snice-input variant="underlined"></snice-input>

<!-- Icon SLOTS — for Material Symbols, Font Awesome, SVGs -->
<snice-input placeholder="Search">
  <span slot="prefix-icon" class="material-symbols-outlined">search</span>
</snice-input>

<!-- Icon ATTRIBUTES — for emoji, URLs, image files only -->
<snice-input prefix-icon="🔍" placeholder="Search"></snice-input>

<!-- Password toggle -->
<snice-input type="password" password label="Password"></snice-input>

<!-- Clearable -->
<snice-input value="Text" clearable></snice-input>

<!-- Error state -->
<snice-input label="Email" invalid error-text="Invalid email"></snice-input>

<!-- Form integration -->
<snice-input name="username" required></snice-input>

<!-- Vertical alignment (when host has explicit height) -->
<snice-input style="height:200px" align="center"></snice-input>

<!-- Stretch input to fill height -->
<snice-input style="height:200px" stretch></snice-input>
```

```typescript
inp.addEventListener('input-input', (e) => console.log('Input:', e.detail.value));
inp.addEventListener('input-change', (e) => console.log('Change:', e.detail.value));
```

## Keyboard Navigation

- Tab to focus/unfocus
- Standard native input keyboard behavior

## Accessibility

- Form-associated custom element (ElementInternals)
- aria-invalid set when invalid
- Required indicator shown
- Clear button and password toggle have aria-label
