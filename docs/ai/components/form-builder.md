# snice-form-builder

Drag-and-drop form designer that outputs JSON schema.

## Properties

```typescript
schema: FormSchema = { fields: [] };      // attribute: false (set via JS)
mode: 'edit'|'preview' = 'edit';
fieldTypes: FormFieldType[] = [...all];    // attribute: false (set via JS)
```

```typescript
type FormFieldType = 'text'|'number'|'email'|'phone'|'select'|'date'|'checkbox'|'radio'|'file'|'signature'|'section'|'paragraph';
interface FormFieldOption { label: string; value: string; }
interface FormField {
  id: string; type: FormFieldType; label: string;
  placeholder?: string; required?: boolean; options?: FormFieldOption[];
  defaultValue?: string; helpText?: string; min?: number; max?: number;
  pattern?: string; accept?: string; content?: string; width?: 'full'|'half';
}
interface FormSchema { title?: string; description?: string; fields: FormField[]; }
```

## Methods

- `getSchema(): FormSchema` - Deep copy of current schema
- `setSchema(schema: FormSchema)` - Set the form schema
- `addField(type: FormFieldType)` - Add a new field
- `removeField(id: string)` - Remove a field
- `preview()` - Switch to preview mode

## Events

- `schema-change` → `{ schema: FormSchema }`
- `field-add` → `{ field: FormField }`
- `field-remove` → `{ field: FormField }`
- `field-reorder` → `{ oldIndex: number, newIndex: number, field: FormField }`

## CSS Parts

- `base` - Outer form builder container (edit mode)
- `mode-toggle` - Edit/preview toggle bar
- `toolbar` - Field type palette sidebar
- `canvas` - Main field list area
- `properties` - Field properties panel
- `preview` - Preview mode container

## Basic Usage

```typescript
import 'snice/components/form-builder/snice-form-builder';
```

```html
<snice-form-builder></snice-form-builder>
```

```typescript
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
fb.addField('text');
fb.removeField('name');
const schema = fb.getSchema();
fb.preview();
fb.addEventListener('schema-change', e => console.log(e.detail.schema));
fb.fieldTypes = ['text', 'email', 'select', 'checkbox'];
```
