# snice-key-value

Form-associated ordered string-pair editor. Preserves duplicates, descriptions, Unicode, and row order. Direct `<snice-kv-pair>` children or imperative data API.

## Components

- `snice-key-value` - Editor/display/FACE control.
- `snice-kv-pair` - Direct declarative data child; attributes: `key`, `value`, `description`.

## Properties

```ts
value: string = '[]';                  // live ordered JSON entry array; no attribute
defaultValue: string = '[]';           // attr: value; reset default
label: string = '';
autoExpand: boolean = true;            // attr: auto-expand
rows: number = 0;                      // 0 variable; >0 exact fixed count
showDescription: boolean = false;      // attr: show-description
keyPlaceholder: string = 'Key';        // attr: key-placeholder
valuePlaceholder: string = 'Value';    // attr: value-placeholder
placeholders: Array<{key:string;value:string}> = []; // JS only
disabled | readonly | required: boolean = false;
name: string = '';
variant: 'default'|'compact' = 'default';
mode: 'edit'|'view' = 'edit';
showCopy: boolean = false;              // attr: show-copy
readonly type: 'key-value'; form: HTMLFormElement|null; validity: ValidityState;
readonly validationMessage: string; willValidate: boolean; labels: NodeList|null;
```

```ts
// snice-kv-pair
key: string = '';
value: string = '';
description: string = '';
```

## Methods

- `setItems(items: KeyValueItem[])` - Replace live data; silent; ignored in slot mode.
- `addItem(key?, value?, description?)` - Fill first empty/add row; emits add then change.
- `removeItem(index)` - Remove display index; emits remove then change.
- `clear()` - Clear and emit change.
- `getItems(): KeyValueItem[]` - Ordered meaningful-row copies.
- `focus()` - First key input.
- `checkValidity(): boolean`
- `reportValidity(): boolean`
- `setCustomValidity(message: string): void`

## Events

- `kv-add` -> `{ item: KeyValueItem, index: number }`
- `kv-remove` -> `{ item: KeyValueItem, index: number }`
- `kv-change` -> `{ items: KeyValueItem[] }`
- `kv-copy` -> `{ items: KeyValueItem[] }`
- No user events: `setItems`, property assignment, slot sync, reset, restore.

## Slots

- `(default)` - Direct `<snice-kv-pair>` children.
- Direct children override all imperative mutation methods.
- Child attributes are declarative reset defaults; removing all children reapplies `defaultValue`.

## CSS Parts

- `base`, `title`, `copy-button`, `rows`, `row`
- `key-input`, `value-input`, `description-input`, `delete-button`, `error`
- `view-row`, `view-key`, `view-value`, `view-desc`, `empty`

## Basic Usage

```html
<snice-key-value name="headers" label="HTTP Headers" required>
  <snice-kv-pair key="Accept" value="application/json"></snice-kv-pair>
  <snice-kv-pair key="Cache-Control" value="no-cache"></snice-kv-pair>
</snice-key-value>
```

```ts
import 'snice/components/key-value/snice-key-value';
```

## Examples

### Serialization

```ts
type KeyValueItem = { key: string; value: string; description?: string };
// Canonical emitted/submitted shape:
'[{"key":"A","value":"1","description":""},{"key":"A","value":"2","description":"duplicate"}]'
// Empty editor: '[]'
```

- Every output entry: exact string fields `key`, `value`, `description`.
- Duplicate keys are preserved with their order, descriptions, and Unicode.
- Omits wholly empty display rows.
- Accepts old string-valued object JSON input; immediately normalizes to array.
- Malformed JSON/schema is retained in live `value`, sets `badInput`, and remains raw `FormData` if validation is bypassed.

### Lifecycle

```ts
editor.value = '[{"key":"live","value":"2","description":""}]';
editor.defaultValue = '[{"key":"reset","value":"1","description":""}]';
editor.form?.reset();
```

- Pristine default/`value`-attribute mutation updates live value.
- Dirty default mutation changes next reset only.
- Reset -> `defaultValue`; slot mode reset -> current pair attributes.
- Browser restore accepts strings only; non-string state ignored atomically.
- Disabled/fieldset-disabled: blocked, omitted, validation-barred; authored `disabled` unchanged.
- Readonly/view: editing and validation barred; value still submitted; copy allowed.

### Validation

- `valueMissing`: `required` and no meaningful rows.
- `badInput`: malformed serialized state or meaningful row with blank/whitespace key.
- Empty value is valid when key exists. Value-only/description-only row is invalid.
- `customError`: non-empty `setCustomValidity()`.
- Invalid key gets `aria-invalid`; message uses `part="error"` and `role="alert"`.

### Rows/data

```ts
editor.setItems([{ key: 'NODE_ENV', value: 'production' }]);
editor.addItem('PORT', '3000', 'HTTP listener');
editor.removeItem(0);
editor.clear();
```

- Variable + auto-expand: trailing empty display row, never serialized.
- Fixed `rows`: exact count, no delete/auto-expand; add fills empty row; full add is no-op.
- Lowering fixed `rows` drops entries beyond new count.
- Public data methods remain usable while UI is disabled/readonly.
- Copy: formatted canonical ordered array; preserves duplicates.

## Keyboard Navigation

- `Tab`/`Shift+Tab` through text inputs.
- Standard text editing; buttons use native activation when focused.

## Accessibility

- ARIA group named by `label` or default name.
- Row-specific input labels; exact invalid key marked.
- FACE: `FormData`, `form.elements`, `form="id"`, labels, reset/restore, fieldsets/first legend.
