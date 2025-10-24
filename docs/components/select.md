# Select Components

The select components provide a customizable dropdown selection interface. The system consists of two components: `<snice-select>` (the select container) and `<snice-option>` (individual options).

## Table of Contents
- [Basic Usage](#basic-usage)
- [Components](#components)
  - [snice-select](#snice-select)
  - [snice-option](#snice-option)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Features](#features)
- [Examples](#examples)

## Basic Usage

```html
<snice-select label="Choose a color" name="color">
  <snice-option value="red">Red</snice-option>
  <snice-option value="blue">Blue</snice-option>
  <snice-option value="green">Green</snice-option>
</snice-select>
```

```typescript
import 'snice/components/select/snice-select';
import 'snice/components/select/snice-option';

const select = document.querySelector('snice-select');
select.addEventListener('@snice/select-change', (e) => {
  console.log('Selected:', e.detail.value);
});
```

## Components

### snice-select

The main select component that manages the dropdown interface and selection state.

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | The selected value (comma-separated for multiple) |
| `disabled` | `boolean` | `false` | Whether the select is disabled |
| `required` | `boolean` | `false` | Whether the select is required in a form |
| `invalid` | `boolean` | `false` | Whether to show invalid state styling |
| `readonly` | `boolean` | `false` | Whether the select is readonly |
| `multiple` | `boolean` | `false` | Whether multiple selection is allowed |
| `searchable` | `boolean` | `false` | Whether to show a search input |
| `clearable` | `boolean` | `false` | Whether to show a clear button |
| `open` | `boolean` | `false` | Whether the dropdown is open |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant |
| `name` | `string` | `''` | Form field name |
| `label` | `string` | `''` | Label text displayed above select |
| `placeholder` | `string` | `'Select an option'` | Placeholder text |
| `maxHeight` | `string` | `'200px'` | Maximum height of dropdown |

#### Methods

##### `selectOption(value: string): void`
Programmatically select an option by value.

```typescript
select.selectOption('red');
```

##### `clear(): void`
Clear the current selection.

```typescript
select.clear();
```

##### `openDropdown(): void`
Open the dropdown.

```typescript
select.openDropdown();
```

##### `closeDropdown(): void`
Close the dropdown.

```typescript
select.closeDropdown();
```

##### `toggleDropdown(): void`
Toggle the dropdown open/closed state.

```typescript
select.toggleDropdown();
```

##### `focus(): void`
Give focus to the select trigger.

```typescript
select.focus();
```

##### `blur(): void`
Remove focus from the select and close dropdown.

```typescript
select.blur();
```

#### Events

##### `@snice/select-change`
Fired when the selection changes.

**Event Detail:**
```typescript
{
  value: string | string[];      // Selected value(s)
  option?: SelectOption;         // The selected option object
  select: SniceSelectElement;    // Reference to the select element
}
```

**Usage:**
```typescript
select.addEventListener('@snice/select-change', (e) => {
  const { value, option } = e.detail;
  console.log(`Selected ${option?.label} with value ${value}`);
});
```

##### `@snice/select-open`
Fired when the dropdown opens.

**Event Detail:**
```typescript
{
  select: SniceSelectElement; // Reference to the select element
}
```

##### `@snice/select-close`
Fired when the dropdown closes.

**Event Detail:**
```typescript
{
  select: SniceSelectElement; // Reference to the select element
}
```

### snice-option

Individual option component. Must be placed inside `<snice-select>`.

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Option value (uses label if not specified) |
| `label` | `string` | `''` | Option label (uses text content if not specified) |
| `disabled` | `boolean` | `false` | Whether the option is disabled |
| `selected` | `boolean` | `false` | Whether the option is initially selected |
| `icon` | `string` | `''` | URL of an icon to display |

#### Getter

##### `optionData`
Returns an object containing the option's data.

```typescript
const data = option.optionData;
// { value, label, disabled, selected, icon }
```

## Features

### Single Selection

```html
<snice-select label="Choose one">
  <snice-option value="1">Option 1</snice-option>
  <snice-option value="2">Option 2</snice-option>
  <snice-option value="3">Option 3</snice-option>
</snice-select>
```

### Multiple Selection

```html
<snice-select label="Choose multiple" multiple>
  <snice-option value="1">Option 1</snice-option>
  <snice-option value="2">Option 2</snice-option>
  <snice-option value="3">Option 3</snice-option>
</snice-select>
```

### Searchable

```html
<snice-select label="Search for option" searchable>
  <snice-option value="apple">Apple</snice-option>
  <snice-option value="banana">Banana</snice-option>
  <snice-option value="cherry">Cherry</snice-option>
  <snice-option value="date">Date</snice-option>
  <snice-option value="elderberry">Elderberry</snice-option>
</snice-select>
```

### Clearable

```html
<snice-select label="Clearable select" clearable>
  <snice-option value="1">Option 1</snice-option>
  <snice-option value="2">Option 2</snice-option>
</snice-select>
```

### Disabled Options

```html
<snice-select label="With disabled options">
  <snice-option value="1">Option 1</snice-option>
  <snice-option value="2" disabled>Option 2 (disabled)</snice-option>
  <snice-option value="3">Option 3</snice-option>
</snice-select>
```

### With Icons

```html
<snice-select label="Select with icons">
  <snice-option value="user" icon="/icons/user.svg">User</snice-option>
  <snice-option value="admin" icon="/icons/admin.svg">Admin</snice-option>
  <snice-option value="guest" icon="/icons/guest.svg">Guest</snice-option>
</snice-select>
```

## Examples

### Basic Select

```html
<snice-select
  label="Favorite fruit"
  name="fruit"
  placeholder="Choose a fruit">
  <snice-option value="apple">Apple</snice-option>
  <snice-option value="banana">Banana</snice-option>
  <snice-option value="orange">Orange</snice-option>
</snice-select>
```

### Size Variants

```html
<!-- Small -->
<snice-select size="small" label="Small select">
  <snice-option value="1">Option 1</snice-option>
  <snice-option value="2">Option 2</snice-option>
</snice-select>

<!-- Medium (default) -->
<snice-select size="medium" label="Medium select">
  <snice-option value="1">Option 1</snice-option>
  <snice-option value="2">Option 2</snice-option>
</snice-select>

<!-- Large -->
<snice-select size="large" label="Large select">
  <snice-option value="1">Option 1</snice-option>
  <snice-option value="2">Option 2</snice-option>
</snice-select>
```

### Form Integration

```html
<form id="userForm">
  <snice-select
    name="role"
    label="User role"
    required>
    <snice-option value="user">User</snice-option>
    <snice-option value="admin">Admin</snice-option>
    <snice-option value="moderator">Moderator</snice-option>
  </snice-select>

  <snice-select
    name="permissions"
    label="Permissions"
    multiple>
    <snice-option value="read">Read</snice-option>
    <snice-option value="write">Write</snice-option>
    <snice-option value="delete">Delete</snice-option>
  </snice-select>

  <button type="submit">Submit</button>
</form>

<script type="module">
  import 'snice/components/select/snice-select';
  import 'snice/components/select/snice-option';

  const form = document.querySelector('#userForm');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    console.log('Form data:', data);
    // { role: 'admin', permissions: 'read,write' }
  });
</script>
```

### Programmatic Control

```typescript
import type { SniceSelectElement } from 'snice/components/select/snice-select.types';

const select = document.querySelector<SniceSelectElement>('snice-select');

// Select an option
select.selectOption('apple');

// Clear selection
select.clear();

// Open/close dropdown
select.openDropdown();
select.closeDropdown();
select.toggleDropdown();

// Get current value
console.log(select.value);

// Set value
select.value = 'banana';
```

### With Event Handling

```typescript
const select = document.querySelector('snice-select');

select.addEventListener('@snice/select-change', (e) => {
  const { value, option } = e.detail;

  if (option) {
    console.log(`Selected: ${option.label} (${value})`);
  }

  // Trigger dependent logic
  updateDependentFields(value);
});

select.addEventListener('@snice/select-open', () => {
  console.log('Dropdown opened');
});

select.addEventListener('@snice/select-close', () => {
  console.log('Dropdown closed');
});
```

### Dynamic Options

```html
<snice-select id="dynamicSelect" label="Dynamic options"></snice-select>

<button id="loadOptions">Load Options</button>

<script type="module">
  import 'snice/components/select/snice-select';
  import 'snice/components/select/snice-option';

  const select = document.querySelector('#dynamicSelect');
  const loadBtn = document.querySelector('#loadOptions');

  loadBtn.addEventListener('click', async () => {
    // Fetch options from API
    const response = await fetch('/api/options');
    const options = await response.json();

    // Clear existing options
    select.innerHTML = '';

    // Add new options
    options.forEach(opt => {
      const option = document.createElement('snice-option');
      option.value = opt.id;
      option.label = opt.name;
      if (opt.icon) option.icon = opt.icon;
      if (opt.disabled) option.disabled = true;
      select.appendChild(option);
    });
  });
</script>
```

### Multiple Selection with Tags

```html
<snice-select
  label="Select tags"
  name="tags"
  multiple
  clearable
  placeholder="Choose tags">
  <snice-option value="javascript">JavaScript</snice-option>
  <snice-option value="typescript">TypeScript</snice-option>
  <snice-option value="python">Python</snice-option>
  <snice-option value="rust">Rust</snice-option>
  <snice-option value="go">Go</snice-option>
</snice-select>
```

Selected options will display as removable tags. Click the × on a tag to remove it.

### Searchable with Many Options

```html
<snice-select
  label="Choose a country"
  name="country"
  searchable
  max-height="300px">
  <snice-option value="us">United States</snice-option>
  <snice-option value="uk">United Kingdom</snice-option>
  <snice-option value="ca">Canada</snice-option>
  <snice-option value="au">Australia</snice-option>
  <snice-option value="de">Germany</snice-option>
  <snice-option value="fr">France</snice-option>
  <!-- Many more options... -->
</snice-select>
```

### Validation Example

```html
<form id="validationForm">
  <snice-select
    id="categorySelect"
    name="category"
    label="Category"
    required
    placeholder="Select a category">
    <snice-option value="tech">Technology</snice-option>
    <snice-option value="health">Health</snice-option>
    <snice-option value="finance">Finance</snice-option>
  </snice-select>

  <button type="submit">Submit</button>
</form>

<script type="module">
  import 'snice/components/select/snice-select';
  import 'snice/components/select/snice-option';

  const form = document.querySelector('#validationForm');
  const select = document.querySelector('#categorySelect');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!select.value) {
      select.invalid = true;
      alert('Please select a category');
      return;
    }

    select.invalid = false;
    // Submit form...
  });
</script>
```

### Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .select-demo {
      max-width: 400px;
      margin: 2rem auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  </style>

  <script type="module">
    import 'snice/components/select/snice-select';
    import 'snice/components/select/snice-option';

    // Handle select changes
    document.addEventListener('@snice/select-change', (e) => {
      console.log('Selection changed:', e.detail);
    });
  </script>
</head>
<body>
  <div class="select-demo">
    <snice-select
      label="Single selection"
      name="single"
      clearable>
      <snice-option value="1">Option 1</snice-option>
      <snice-option value="2">Option 2</snice-option>
      <snice-option value="3">Option 3</snice-option>
    </snice-select>

    <snice-select
      label="Multiple selection"
      name="multiple"
      multiple
      clearable>
      <snice-option value="a">Choice A</snice-option>
      <snice-option value="b">Choice B</snice-option>
      <snice-option value="c">Choice C</snice-option>
      <snice-option value="d">Choice D</snice-option>
    </snice-select>

    <snice-select
      label="Searchable"
      name="searchable"
      searchable>
      <snice-option value="apple">Apple</snice-option>
      <snice-option value="banana">Banana</snice-option>
      <snice-option value="cherry">Cherry</snice-option>
      <snice-option value="date">Date</snice-option>
      <snice-option value="elderberry">Elderberry</snice-option>
      <snice-option value="fig">Fig</snice-option>
      <snice-option value="grape">Grape</snice-option>
    </snice-select>

    <snice-select
      label="With disabled option"
      name="disabled">
      <snice-option value="1">Enabled</snice-option>
      <snice-option value="2" disabled>Disabled</snice-option>
      <snice-option value="3">Enabled</snice-option>
    </snice-select>

    <snice-select
      label="Disabled select"
      name="disabledSelect"
      disabled>
      <snice-option value="1">Option 1</snice-option>
      <snice-option value="2">Option 2</snice-option>
    </snice-select>
  </div>
</body>
</html>
```

## Accessibility

The select components include proper ARIA attributes and keyboard support:

- `role="listbox"` on the dropdown
- `role="option"` on each option
- `aria-haspopup="listbox"` on the trigger
- `aria-expanded` reflects the dropdown state
- `aria-selected` on selected options
- `aria-disabled` on disabled options
- `aria-invalid` when invalid state is set
- Full keyboard navigation support

### Keyboard Support

- **Space/Enter**: Open dropdown (when trigger is focused)
- **Arrow Down/Up**: Navigate options
- **Enter/Space**: Select focused option
- **Escape**: Close dropdown
- **Type to search**: When searchable, type to filter options

## Form Behavior

The select component works seamlessly with HTML forms:

- Acts like a native `<select>` element
- Supports `name` and `value` attributes
- Supports `required` attribute for validation
- Compatible with FormData API
- Hidden native `<select>` for form submission
- Multiple selection values are comma-separated

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support
