# snice-select

Customizable dropdown selection with single/multiple selection, search, editable input, and icons.

## Components

### snice-select (Container)

```typescript
value: string = '';                 // Selected value (comma-separated for multiple)
disabled: boolean = false;          // Disabled state
required: boolean = false;          // Required for form validation
invalid: boolean = false;           // Invalid state styling
readonly: boolean = false;          // Readonly state
multiple: boolean = false;          // Allow multiple selection
searchable: boolean = false;        // Show search input in dropdown
clearable: boolean = false;         // Show clear button
editable: boolean = false;          // Editable text input trigger (replaces button)
allowFreeText: boolean = false;     // attr: allow-free-text — allow values not in options
remote: boolean = false;            // Remote search via @request('select/search')
searchDebounce: number = 300;       // attr: search-debounce — debounce ms for remote search
open: boolean = false;              // Dropdown open state
loading: boolean = false;           // Loading state (shows spinner)
size: 'small'|'medium'|'large' = 'medium';
name: string = '';                  // Form field name
label: string = '';                 // Label text
placeholder: string = 'Select an option';
maxHeight: string = '200px';        // Max dropdown height
options: SelectOption[] = [];       // Programmatic options (works alongside <snice-option> children)
```

**Methods:**
```typescript
selectOption(value: string)  // Select option by value
clear()                      // Clear selection
openDropdown()               // Open dropdown
closeDropdown()              // Close dropdown
toggleDropdown()             // Toggle dropdown
focus()                      // Focus trigger (or input in editable mode)
blur()                       // Blur and close
```

**Events:**
```typescript
'select-change'  // { value, option, select }
'select-open'    // { select }
'select-close'   // { select }
```

### snice-option (Option Item)

```typescript
value: string = '';           // Option value (defaults to label)
label: string = '';           // Option label (defaults to textContent)
disabled: boolean = false;    // Disabled state
selected: boolean = false;    // Initially selected
icon: string = '';            // Icon URL
```

**Getter:**
```typescript
optionData  // { value, label, disabled, selected, icon }
```

## Usage

```html
<!-- Standard button-trigger select -->
<snice-select label="Choose" name="choice">
  <snice-option value="1">Option 1</snice-option>
  <snice-option value="2">Option 2</snice-option>
</snice-select>

<!-- Editable input-trigger select -->
<snice-select editable label="Fruit" placeholder="Type or select..."></snice-select>
```

```typescript
// Programmatic options (required for editable mode or in addition to children)
select.options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana', icon: '/icons/banana.svg' },
  { value: 'cherry', label: 'Cherry', disabled: true },
];

select.addEventListener('select-change', (e) => {
  console.log(e.detail.value);
});

select.selectOption('1');
```

## Editable Mode

When `editable` is set:
- Renders a text `<input>` instead of a `<button>` trigger
- Typing filters options in the dropdown
- Focus opens the dropdown
- Blur commits the value and closes
- If no match and `allow-free-text` is set, accepts custom value
- If no match and no `allow-free-text`, reverts to last valid value
- Options set via JS `options` property (array), child `<snice-option>` elements, or both (merged)

## Remote Search (@request/@respond)

When `remote` is set with `searchable` or `editable`:
- Typing fires `@request('select/search')` with `{ query, select }` after debounce
- Controller `@respond('select/search')` returns `SelectOption[]`
- Dropdown shows spinner while waiting, then refreshes with results
- Opening dropdown triggers initial search with current query
- `loading` property no longer closes dropdown when `remote` is true

```typescript
// Controller
@respond('select/search')
async handleSearch(req, respond) {
  const results = await fetch(`/api/users?q=${req.query}`).then(r => r.json());
  respond(results.map(u => ({ value: u.id, label: u.name })));
}
```

## Features

- Single and multiple selection
- Search filtering (in-dropdown or editable input)
- Remote async search via @request/@respond
- Editable text input mode (replaces combobox)
- Keyboard navigation
- Form integration
- Icons in options
- Clearable selection
- Disabled options
- Programmatic options array (works alongside child elements)

## Notes

- Options can be nested (uses querySelectorAll, not just direct children)
- Multiple selection values are comma-separated
- Hidden native select for form submission
- Dropdown closes on outside click
- Search shows in dropdown when open (non-editable mode)
- Child `<snice-option>` elements take precedence when both children and programmatic options are provided
