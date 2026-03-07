# Key Value
`<snice-key-value>`

A key-value pair editor for building UIs like HTTP header editors, environment variable configurators, and settings panels. Supports both declarative child elements and imperative JavaScript APIs.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/key-value/snice-key-value';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-key-value.min.js"></script>
```

## Properties

### snice-key-value

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Label above the editor |
| `autoExpand` (attr: `auto-expand`) | `boolean` | `true` | Append empty row when typing in last row |
| `rows` | `number` | `0` | Fixed row count; 0 = unlimited |
| `showDescription` (attr: `show-description`) | `boolean` | `false` | Show description input below each pair |
| `keyPlaceholder` (attr: `key-placeholder`) | `string` | `'Key'` | Default key input placeholder |
| `valuePlaceholder` (attr: `value-placeholder`) | `string` | `'Value'` | Default value input placeholder |
| `placeholders` | `Array<{key,value}>` | `[]` | Random sample placeholders for empty rows (JS only) |
| `disabled` | `boolean` | `false` | Disables all inputs |
| `readonly` | `boolean` | `false` | Makes all inputs readonly |
| `name` | `string` | `''` | Form name |
| `variant` | `'default' \| 'compact'` | `'default'` | Visual density |
| `mode` | `'edit' \| 'view'` | `'edit'` | View mode renders read-only text display |
| `showCopy` (attr: `show-copy`) | `boolean` | `false` | Show copy-as-JSON button in header |
| `value` | `string` | — | Read-only getter: JSON string of `{key:value,...}` |

### snice-kv-pair

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `key` | `string` | `''` | The key name |
| `value` | `string` | `''` | The value |
| `description` | `string` | `''` | Optional description |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `setItems()` | `items: KeyValueItem[]` | Set items imperatively (ignored when slot children are present) |
| `addItem()` | `key?: string, value?: string, description?: string` | Append a new pair |
| `removeItem()` | `index: number` | Remove pair by index |
| `clear()` | — | Remove all pairs |
| `getItems()` | — | Returns array of non-empty `KeyValueItem` objects |
| `focus()` | — | Focuses the first key input |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `kv-add` | `{ item: KeyValueItem, index: number }` | Fired when an item is added |
| `kv-remove` | `{ item: KeyValueItem, index: number }` | Fired when an item is removed |
| `kv-change` | `{ items: KeyValueItem[] }` | Fired on any change (add, remove, edit) |
| `kv-copy` | `{ items: KeyValueItem[] }` | Fired when copy button is clicked |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The root container |
| `title` | The title element |
| `copy-button` | The copy button |
| `rows` | The rows container |
| `row` | An individual row |
| `key-input` | The key input field |
| `value-input` | The value input field |
| `description-input` | The description input field |
| `delete-button` | The delete button |
| `view-row` | A row in view mode |
| `view-key` | Key text in view mode |
| `view-value` | Value text in view mode |
| `view-desc` | Description text in view mode |
| `empty` | Empty state message |

## Basic Usage

```typescript
import 'snice/components/key-value/snice-key-value';
```

```html
<snice-key-value label="HTTP Headers">
  <snice-kv-pair key="Content-Type" value="application/json"></snice-kv-pair>
  <snice-kv-pair key="Authorization" value="Bearer token123"></snice-kv-pair>
</snice-key-value>
```

## Examples

### Imperative API

Use `setItems()` to populate the editor programmatically.

```html
<snice-key-value id="env-editor" label="Environment Variables"></snice-key-value>

<script>
  const editor = document.getElementById('env-editor');
  editor.setItems([
    { key: 'NODE_ENV', value: 'production' },
    { key: 'PORT', value: '3000' },
    { key: 'DATABASE_URL', value: 'postgres://localhost/mydb' }
  ]);
</script>
```

### Declarative API

Use `<snice-kv-pair>` child elements for a fully declarative setup.

```html
<snice-key-value label="Request Headers">
  <snice-kv-pair key="Accept" value="application/json"></snice-kv-pair>
  <snice-kv-pair key="Cache-Control" value="no-cache"></snice-kv-pair>
</snice-key-value>
```

### Fixed Rows

Set the `rows` attribute to enforce a fixed number of rows. No delete buttons or auto-expand.

```html
<snice-key-value rows="5" label="Configuration"></snice-key-value>
```

### With Descriptions

Enable the `show-description` attribute to add a description field below each key-value pair.

```html
<snice-key-value show-description label="API Parameters">
  <snice-kv-pair key="page" value="1" description="Page number for pagination"></snice-kv-pair>
  <snice-kv-pair key="limit" value="25" description="Results per page"></snice-kv-pair>
</snice-key-value>
```

### Compact Variant

Use `variant="compact"` for denser layouts.

```html
<snice-key-value variant="compact" label="Metadata"></snice-key-value>
```

### View Mode

Use `mode="view"` for a read-only display without input fields.

```html
<snice-key-value mode="view" label="Response Headers">
  <snice-kv-pair key="Content-Type" value="application/json"></snice-kv-pair>
  <snice-kv-pair key="Cache-Control" value="max-age=3600"></snice-kv-pair>
</snice-key-value>
```

### Copy Button

Enable `show-copy` to add a clipboard button that copies all items as JSON.

```html
<snice-key-value show-copy label="Config">
  <snice-kv-pair key="host" value="localhost"></snice-kv-pair>
  <snice-kv-pair key="port" value="3000"></snice-kv-pair>
</snice-key-value>
```

### Form Association

The component is form-associated. Its `value` getter returns a JSON string of `{key: value}` pairs. The form value is automatically updated on every change.

```html
<form id="my-form">
  <snice-key-value name="headers" label="Headers">
    <snice-kv-pair key="Accept" value="application/json"></snice-kv-pair>
  </snice-key-value>
</form>
<script>
  const form = document.getElementById('my-form');
  const data = new FormData(form);
  console.log(data.get('headers'));
  // '{"Accept":"application/json"}'
</script>
```

### Disabled and Readonly

```html
<snice-key-value disabled label="Locked Headers">
  <snice-kv-pair key="X-Api-Key" value="***"></snice-kv-pair>
</snice-key-value>

<snice-key-value readonly label="Read-Only Config">
  <snice-kv-pair key="version" value="2.1.0"></snice-kv-pair>
</snice-key-value>
```
