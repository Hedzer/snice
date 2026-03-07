<!-- AI: For a low-token version of this doc, use docs/ai/components/data-card.md instead -->

# Data Card
`<snice-data-card>`

A key-value detail panel for displaying structured data with grouped sections, multiple value types, and edit-in-place support.

## Basic Usage

```typescript
import 'snice/components/data-card/snice-data-card';
```

```html
<snice-data-card id="details"></snice-data-card>

<script>
  document.getElementById('details').fields = [
    { label: 'Name', value: 'John Doe' },
    { label: 'Email', value: 'john@example.com' },
    { label: 'Role', value: 'Administrator' }
  ];
</script>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/data-card/snice-data-card';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-data-card.min.js"></script>
```

## Examples

### Value Types

Use the `type` property on fields to render different value presentations.

```html
<snice-data-card id="typed"></snice-data-card>

<script>
  document.getElementById('typed').fields = [
    { label: 'Name', value: 'Jane Doe', type: 'text' },
    { label: 'Website', value: 'example.com', type: 'link', href: 'https://example.com' },
    { label: 'Status', value: 'Active', type: 'badge', badgeVariant: 'success' },
    { label: 'Created', value: '2024-01-15', type: 'date' },
    { label: 'Balance', value: '$1,250.00', type: 'currency' }
  ];
</script>
```

### Grouped Fields

Use the `group` property to organize fields into labeled sections.

```html
<snice-data-card id="grouped"></snice-data-card>

<script>
  document.getElementById('grouped').fields = [
    { label: 'First Name', value: 'John', group: 'Personal Info' },
    { label: 'Last Name', value: 'Doe', group: 'Personal Info' },
    { label: 'Email', value: 'john@acme.com', group: 'Contact' },
    { label: 'Phone', value: '555-0123', icon: '📞', group: 'Contact' }
  ];
</script>
```

### Edit Mode

Set the `editable` attribute to enable inline editing of field values.

```html
<snice-data-card id="editable" editable></snice-data-card>

<script>
  const card = document.getElementById('editable');
  card.fields = [
    { label: 'Name', value: 'John Doe' },
    { label: 'Status', value: 'Active', type: 'badge', badgeVariant: 'success', editable: false },
    { label: 'Notes', value: 'Click to edit this field' }
  ];

  card.addEventListener('field-change', (e) => {
    console.log('Changed:', e.detail.field.label, '→', e.detail.value);
  });
</script>
```

### Compact Variant

Use the `variant` attribute for a denser layout.

```html
<snice-data-card id="compact" variant="compact"></snice-data-card>

<script>
  document.getElementById('compact').fields = [
    { label: 'ID', value: '#12345' },
    { label: 'Type', value: 'Invoice' },
    { label: 'Amount', value: '$500.00', type: 'currency' },
    { label: 'Due', value: '2024-02-01', type: 'date' }
  ];
</script>
```

### Programmatic Access

Use `getValues()` and `setValues()` for programmatic data access.

```html
<snice-data-card id="programmatic"></snice-data-card>

<script>
  const card = document.getElementById('programmatic');
  card.fields = [
    { label: 'Name', value: 'John' },
    { label: 'Age', value: 30 }
  ];

  // Read all values
  const values = card.getValues(); // { Name: 'John', Age: 30 }

  // Update values
  card.setValues({ Name: 'Jane', Age: 25 });
</script>
```

## Slots

| Name | Description |
|------|-------------|
| `header` | Custom header content (replaces default header) |
| `title` | Title text within the default header |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `fields` | `DataCardField[]` | `[]` | Array of field objects |
| `editable` | `boolean` | `false` | Enable global edit mode |
| `variant` | `'default' \| 'horizontal' \| 'compact'` | `'default'` | Layout variant |

### DataCardField Object

```typescript
interface DataCardField {
  label: string;
  value: string | number;
  type?: 'text' | 'link' | 'badge' | 'date' | 'currency';
  editable?: boolean;
  group?: string;
  icon?: string;
  href?: string;
  badgeVariant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `field-change` | `{ field: DataCardField, value: string \| number, previousValue: string \| number }` | A field value was changed |
| `field-save` | `{ field: DataCardField, value: string \| number }` | A field value was saved |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `getValues()` | -- | Returns all field values as a `{ label: value }` map |
| `setValues(data)` | `Record<string, string \| number>` | Updates field values by label |

## CSS Parts

| Part | Description |
|------|-------------|
| `container` | Main card container |
| `header` | Header section |
| `title` | Title text |
| `edit-toggle` | Edit mode toggle button |
| `group` | Field group container |
| `group-title` | Group heading text |
| `field` | Individual field row |
| `field-icon` | Field icon |
| `field-label` | Field label text |
| `field-value` | Field value display |
| `field-input` | Edit mode input field |
| `field-save` | Save button in edit mode |
| `field-edit` | Edit button per field |
