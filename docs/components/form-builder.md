<!-- AI: For a low-token version of this doc, use docs/ai/components/form-builder.md instead -->

# Form Builder
`<snice-form-builder>`

Drag-and-drop form designer that outputs a JSON schema describing the form structure.

## Basic Usage

```typescript
import 'snice/components/form-builder/snice-form-builder';
```

```html
<snice-form-builder></snice-form-builder>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/form-builder/snice-form-builder';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-form-builder.min.js"></script>
```

## Examples

### Setting a Schema

Use the `setSchema()` method to load an existing form definition.

```javascript
const fb = document.querySelector('snice-form-builder');

fb.setSchema({
  title: 'Contact Us',
  description: 'We\'d love to hear from you.',
  fields: [
    { id: 'name', type: 'text', label: 'Full Name', required: true, placeholder: 'John Doe' },
    { id: 'email', type: 'email', label: 'Email Address', required: true },
    { id: 'subject', type: 'select', label: 'Subject', options: [
      { label: 'General Inquiry', value: 'general' },
      { label: 'Support', value: 'support' },
      { label: 'Sales', value: 'sales' }
    ]},
    { id: 'message', type: 'text', label: 'Message', placeholder: 'Your message...' }
  ]
});
```

### Adding Fields Programmatically

Use `addField()` to append a new field to the form.

```javascript
fb.addField('text');
fb.addField('email');
fb.addField('select');
```

### Preview Mode

Set the `mode` attribute to `"preview"` or call `preview()` to test the form.

```html
<snice-form-builder mode="preview"></snice-form-builder>
```

```javascript
fb.preview(); // Switch to preview mode
fb.mode = 'edit'; // Switch back to edit mode
```

### Custom Field Types

Use the `field-types` property to limit available field types.

```javascript
fb.fieldTypes = ['text', 'email', 'select', 'checkbox'];
```

### Listening to Changes

React to schema changes as the user designs the form.

```javascript
fb.addEventListener('schema-change', (e) => {
  const schema = e.detail.schema;
  // Save to backend or localStorage
  localStorage.setItem('form-draft', JSON.stringify(schema));
});

fb.addEventListener('field-add', (e) => {
  console.log('Added field:', e.detail.field.type);
});

fb.addEventListener('field-remove', (e) => {
  console.log('Removed field:', e.detail.field.label);
});

fb.addEventListener('field-reorder', (e) => {
  console.log(`Moved from ${e.detail.oldIndex} to ${e.detail.newIndex}`);
});
```

### Section Headers and Paragraphs

Add non-input layout elements to organize the form.

```javascript
fb.setSchema({
  title: 'Application Form',
  fields: [
    { id: 's1', type: 'section', label: 'Personal Information' },
    { id: 'name', type: 'text', label: 'Full Name', required: true },
    { id: 'email', type: 'email', label: 'Email', required: true },
    { id: 'phone', type: 'phone', label: 'Phone Number' },
    { id: 'p1', type: 'paragraph', content: 'Please provide your work experience below.' },
    { id: 's2', type: 'section', label: 'Experience' },
    { id: 'years', type: 'number', label: 'Years of Experience', min: 0, max: 50 },
    { id: 'resume', type: 'file', label: 'Upload Resume', accept: '.pdf,.doc,.docx' },
    { id: 'sig', type: 'signature', label: 'Signature', required: true }
  ]
});
```

### Getting the Schema

Retrieve the current schema as a plain object.

```javascript
const schema = fb.getSchema();
console.log(JSON.stringify(schema, null, 2));

// Send to backend
fetch('/api/forms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(schema)
});
```

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `schema` | `schema` | `FormSchema` | `{ fields: [] }` | JSON schema (input/output) |
| `mode` | `mode` | `'edit' \| 'preview'` | `'edit'` | Current mode |
| `fieldTypes` | `field-types` | `FormFieldType[]` | all types | Available field types in the palette |

## FormSchema Interface

```typescript
interface FormSchema {
  title?: string;
  description?: string;
  fields: FormField[];
}
```

## FormField Interface

```typescript
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
  content?: string;       // For paragraph fields
  width?: 'full' | 'half';
}
```

## FormFieldType

```typescript
type FormFieldType =
  | 'text' | 'number' | 'email' | 'phone'
  | 'select' | 'date' | 'checkbox' | 'radio'
  | 'file' | 'signature' | 'section' | 'paragraph';
```

## FormFieldOption Interface

```typescript
interface FormFieldOption {
  label: string;
  value: string;
}
```

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `getSchema()` | -- | Returns a deep copy of the current schema |
| `setSchema(schema)` | `schema: FormSchema` | Sets the form schema |
| `addField(type)` | `type: FormFieldType` | Adds a new field of the given type |
| `removeField(id)` | `id: string` | Removes the field with the given ID |
| `preview()` | -- | Switches to preview mode |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `schema-change` | `{ schema: FormSchema }` | Fired when the schema changes |
| `field-add` | `{ field: FormField }` | Fired when a field is added |
| `field-remove` | `{ field: FormField }` | Fired when a field is removed |
| `field-reorder` | `{ oldIndex: number, newIndex: number, field: FormField }` | Fired when a field is reordered |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The outer form builder container (edit mode) |
| `mode-toggle` | The edit/preview mode toggle bar |
| `toolbar` | The field type palette sidebar |
| `canvas` | The main field list area |
| `properties` | The field properties panel |
| `preview` | The preview mode container |

## Features

- Drag fields from the palette into the canvas to add them
- Click fields to select and edit properties in the side panel
- Drag to reorder fields within the canvas
- Duplicate or delete fields with action buttons
- Toggle between edit and preview modes
- Section headers and paragraphs for form organization
- Customizable available field types
- JSON schema output for form persistence and rendering
