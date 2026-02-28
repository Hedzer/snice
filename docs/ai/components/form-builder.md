# snice-form-builder

Drag-and-drop form designer that outputs JSON schema.

## Properties

```typescript
schema: FormSchema = { fields: [] };
mode: 'edit' | 'preview' = 'edit';
fieldTypes: FormFieldType[] = ['text','number','email','phone','select','date','checkbox','radio','file','signature','section','paragraph']; // attribute: field-types
```

## Interfaces

```typescript
type FormFieldType = 'text'|'number'|'email'|'phone'|'select'|'date'|'checkbox'|'radio'|'file'|'signature'|'section'|'paragraph';

interface FormFieldOption { label: string; value: string; }

interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: FormFieldOption[];
  defaultValue?: string;
  helpText?: string;
  min?: number;
  max?: number;
  pattern?: string;
  accept?: string;
  content?: string; // paragraph
  width?: 'full' | 'half';
}

interface FormSchema {
  title?: string;
  description?: string;
  fields: FormField[];
}
```

## Methods

```typescript
getSchema(): FormSchema               // deep copy
setSchema(schema: FormSchema): void
addField(type: FormFieldType): void
removeField(id: string): void
preview(): void                        // switch to preview mode
```

## Events

- `schema-change` -> `{ schema: FormSchema }`
- `field-add` -> `{ field: FormField }`
- `field-remove` -> `{ field: FormField }`
- `field-reorder` -> `{ oldIndex: number, newIndex: number, field: FormField }`

## Usage

```javascript
const fb = document.querySelector('snice-form-builder');

// Set schema
fb.setSchema({
  title: 'Contact Form',
  fields: [
    { id: 'name', type: 'text', label: 'Name', required: true },
    { id: 'email', type: 'email', label: 'Email', required: true },
    { id: 'subject', type: 'select', label: 'Subject', options: [
      { label: 'General', value: 'general' },
      { label: 'Support', value: 'support' }
    ]}
  ]
});

// Add/remove
fb.addField('text');
fb.removeField('name');

// Get schema
const schema = fb.getSchema();

// Preview
fb.preview();

// Events
fb.addEventListener('schema-change', e => console.log(e.detail.schema));
```

```html
<!-- Limit field types -->
<snice-form-builder></snice-form-builder>
<script>
  fb.fieldTypes = ['text', 'email', 'select', 'checkbox'];
</script>
```

**CSS Parts:**
- `base` - Outer form builder container (edit mode)
- `mode-toggle` - Edit/preview toggle bar
- `toolbar` - Field type palette sidebar
- `canvas` - Main field list area
- `properties` - Field properties panel
- `preview` - Preview mode container

## Features

- Drag from palette to add fields
- Click to edit field properties
- Drag to reorder fields
- Duplicate/delete fields
- Edit/preview mode toggle
- Section headers and paragraphs
- Customizable field types
- JSON schema output
