# snice-select

Customizable dropdown selection with single/multiple selection, search, and icons.

## Components

### snice-select (Container)

```typescript
value: string = '';                 // Selected value (comma-separated for multiple)
disabled: boolean = false;          // Disabled state
required: boolean = false;          // Required for form validation
invalid: boolean = false;           // Invalid state styling
readonly: boolean = false;          // Readonly state
multiple: boolean = false;          // Allow multiple selection
searchable: boolean = false;        // Show search input
clearable: boolean = false;         // Show clear button
open: boolean = false;              // Dropdown open state
loading: boolean = false;           // Loading state (shows spinner)
size: 'small'|'medium'|'large' = 'medium';
name: string = '';                  // Form field name
label: string = '';                 // Label text
placeholder: string = 'Select an option';
maxHeight: string = '200px';        // Max dropdown height
```

**Methods:**
```typescript
selectOption(value: string)  // Select option by value
clear()                      // Clear selection
openDropdown()               // Open dropdown
closeDropdown()              // Close dropdown
toggleDropdown()             // Toggle dropdown
focus()                      // Focus trigger
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
<snice-select label="Choose" name="choice">
  <snice-option value="1">Option 1</snice-option>
  <snice-option value="2">Option 2</snice-option>
</snice-select>
```

```typescript
select.addEventListener('select-change', (e) => {
  console.log(e.detail.value);
});

select.selectOption('1');
```

## Features

- Single and multiple selection
- Search filtering
- Keyboard navigation
- Form integration
- Icons in options
- Clearable selection
- Disabled options

## Notes

- Options can be nested (uses querySelectorAll, not just direct children)
- Multiple selection values are comma-separated
- Hidden native select for form submission
- Dropdown closes outside click
- Search shows in dropdown when open
