<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/key-value.md -->

# Key Value

`<snice-key-value>` is a form-associated key-value editor for headers, environment variables, metadata, and other ordered string pairs. It preserves duplicate keys, descriptions, Unicode, and row order, and supports declarative child elements and imperative data APIs.

## Table of Contents

- [Components](#components)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Components

| Element | Description |
|---|---|
| `<snice-key-value>` | Editor, display, and form-associated control |
| `<snice-kv-pair>` | Direct declarative data child with no rendered UI of its own |

## Properties

### snice-key-value

| Property | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | `'[]'` | Writable live value. Uses the ordered JSON entry-array contract and does not reflect to an attribute. |
| `defaultValue` (attr: `value`) | `string` | `'[]'` | Authored default restored by `form.reset()` in imperative mode. |
| `label` | `string` | `''` | Visible editor title. |
| `autoExpand` (attr: `auto-expand`) | `boolean` | `true` | Adds an empty display row after the last meaningful row when `rows` is `0`. |
| `rows` | `number` | `0` | Fixed display-row count. `0` enables variable rows; positive values trim or pad to the exact count. |
| `showDescription` (attr: `show-description`) | `boolean` | `false` | Shows a description input or description text for each row. |
| `keyPlaceholder` (attr: `key-placeholder`) | `string` | `'Key'` | Default key-input placeholder. |
| `valuePlaceholder` (attr: `value-placeholder`) | `string` | `'Value'` | Default value-input placeholder. |
| `placeholders` | `Array<{ key: string; value: string }>` | `[]` | JavaScript-only sample placeholders assigned stably to rows. |
| `disabled` | `boolean` | `false` | Disables interaction, validation, and successful form submission. |
| `readonly` | `boolean` | `false` | Blocks editing and validation while retaining form submission and copy access. |
| `required` | `boolean` | `false` | Requires at least one meaningful row. |
| `name` | `string` | `''` | Successful-control name. No form entry is produced without a name. |
| `variant` | `'default' \| 'compact'` | `'default'` | Visual density. |
| `mode` | `'edit' \| 'view'` | `'edit'` | Editable inputs or read-only text presentation. View mode remains a successful form control. |
| `showCopy` (attr: `show-copy`) | `boolean` | `false` | Shows a button that copies the ordered entry array as formatted JSON. |
| `type` | `'key-value'` | `'key-value'` | Read-only control type. |
| `form` | `HTMLFormElement \| null` | — | Read-only owning form, including `form="id"` association. |
| `validity` | `ValidityState` | — | Read-only current constraint-validation flags. |
| `validationMessage` | `string` | — | Read-only current validation message. |
| `willValidate` | `boolean` | — | Read-only validation eligibility. |
| `labels` | `NodeList \| null` | — | Read-only associated `<label>` elements. |

### snice-kv-pair

| Property | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | `''` | Authored key. |
| `value` | `string` | `''` | Authored value. Empty values are valid when the key is present. |
| `description` | `string` | `''` | Optional authored description. |

## Methods

| Method | Arguments | Description |
|---|---|---|
| `setItems(items)` | `KeyValueItem[]` | Replaces live items without a user-change event. Ignored while direct pair children are present. |
| `addItem(key?, value?, description?)` | Optional strings | Fills the first empty row or appends a row. A full fixed-row editor is unchanged. |
| `removeItem(index)` | `number` | Removes the display row at the index and emits remove/change when accepted. |
| `clear()` | — | Clears live items and emits `kv-change`. |
| `getItems()` | — | Returns defensive copies of meaningful rows in order. |
| `focus()` | — | Focuses the first key input in edit mode. |
| `checkValidity()` | — | Synchronizes and returns current constraint validity. |
| `reportValidity()` | — | Reports and returns current constraint validity. |
| `setCustomValidity(message)` | `string` | Sets or clears `customError`. |

## Events

| Event | Detail | Description |
|---|---|---|
| `kv-add` | `{ item: KeyValueItem, index: number }` | Accepted `addItem()` operation. |
| `kv-remove` | `{ item: KeyValueItem, index: number }` | Accepted API or UI removal of a meaningful row. |
| `kv-change` | `{ items: KeyValueItem[] }` | User edits and accepted add, remove, or clear operations. |
| `kv-copy` | `{ items: KeyValueItem[] }` | Successful clipboard copy. |

`setItems()`, live/default property assignment, declarative-child synchronization, form reset, and browser state restoration do not synthesize user-change events.

## Slots

| Name | Description |
|---|---|
| (default) | Direct `<snice-kv-pair>` children. Their current attributes are the declarative data source and reset defaults. |

Direct pair children take precedence over `setItems()`, `addItem()`, `removeItem()`, and `clear()`. Removing all direct pair children returns the editor to imperative mode and reapplies `defaultValue`.

## CSS Parts

| Part | Description |
|---|---|
| `base` | Root bordered group. |
| `title` | Visible title. |
| `copy-button` | Copy button. |
| `rows` | Rows container. |
| `row` | Edit-mode row. |
| `key-input` | Key input. |
| `value-input` | Value input. |
| `description-input` | Optional description input. |
| `delete-button` | Variable-row delete button. |
| `error` | Current native validation message. |
| `view-row` | View-mode row. |
| `view-key` | View-mode key. |
| `view-value` | View-mode value. |
| `view-desc` | View-mode description. |
| `empty` | View-mode empty state. |

## Basic Usage

```ts
import 'snice/components/key-value/snice-key-value';
```

```html
<snice-key-value label="HTTP Headers">
  <snice-kv-pair key="Accept" value="application/json"></snice-kv-pair>
  <snice-kv-pair key="Cache-Control" value="no-cache"></snice-kv-pair>
</snice-key-value>
```

## Examples

### Ordered JSON form value

The successful-control value is always one JSON array. Every emitted entry has exactly `key`, `value`, and `description` string fields.

```json
[
  { "key": "Set-Cookie", "value": "session=one", "description": "First cookie" },
  { "key": "Set-Cookie", "value": "theme=dark", "description": "Second cookie" },
  { "key": "X-City", "value": "東京 ✓", "description": "Unicode is preserved" }
]
```

Duplicate keys and entry order are preserved. Empty display rows are omitted. An empty editor contributes the exact string `[]`, not an empty string or `null`.

```html
<form id="request-form">
  <snice-key-value
    name="headers"
    value='[{"key":"Accept","value":"application/json","description":""}]'
    required
  ></snice-key-value>
  <button type="submit">Send</button>
  <button type="reset">Reset</button>
</form>

<script>
  const form = document.getElementById('request-form');
  console.log(new FormData(form).get('headers'));
  // [{"key":"Accept","value":"application/json","description":""}]
</script>
```

The previous object form, such as `{"Accept":"application/json"}`, is accepted as string-valued input or restoration state for migration. It is immediately normalized to the ordered array. Non-string legacy values and malformed array entries set `badInput` instead of being silently discarded.

### Live value and reset default

`value` is live state. `defaultValue` reflects the `value` content attribute and is the imperative-mode reset default.

```ts
const editor = document.querySelector('snice-key-value')!;

editor.value = '[{"key":"live","value":"2","description":""}]';
editor.setAttribute(
  'value',
  '[{"key":"reset","value":"1","description":""}]'
);

editor.form?.reset(); // live value returns to the "reset" entry
```

While pristine, changing `defaultValue` also updates live `value`. After an edit, API mutation, live assignment, or restoration makes the editor dirty, changing the attribute updates only the next reset default. Reset and restoration emit no user events.

In declarative mode, the current direct `<snice-kv-pair>` attributes are reset defaults. Changing or reordering the children updates the data source; UI edits do not rewrite those attributes.

### Validation

`required` creates `valueMissing` only when there are no meaningful rows. Every non-empty row needs a non-whitespace key; its value may be empty. A value-only or description-only row creates `badInput`. `setCustomValidity()` controls `customError`.

```html
<snice-key-value required></snice-key-value>

<!-- Valid: present key with an intentionally empty value. -->
<snice-key-value
  value='[{"key":"FEATURE_FLAG","value":"","description":"Presence enables it"}]'
></snice-key-value>

<!-- Invalid: meaningful row has no key. -->
<snice-key-value
  value='[{"key":"","value":"orphan","description":""}]'
></snice-key-value>
```

Assigning malformed serialized text preserves that exact text in `value` for correction and sets `badInput`. Like a native invalid text control, it remains the control's raw form value if application code constructs `FormData` directly or bypasses validation; use `checkValidity()`, `reportValidity()`, or normal validated submission.

Disabled, inherited-fieldset-disabled, readonly, and view-mode editors are barred from constraint validation. Disabled editors are omitted from `FormData`; readonly and view-mode editors retain their successful value.

### Imperative data

Use `setItems()` for state-driven data. `getItems()` returns new item objects, so mutating its result does not mutate the editor.

```ts
const editor = document.querySelector('snice-key-value')!;

editor.setItems([
  { key: 'NODE_ENV', value: 'production' },
  { key: 'PORT', value: '3000', description: 'HTTP listener' }
]);
editor.addItem('LOG_LEVEL', 'info');
editor.removeItem(0);
console.log(editor.value);
```

Programmatic data methods remain available while the UI is disabled or readonly. Disabledness blocks user interaction; it does not make the application data API unusable.

### Variable and fixed rows

With the default `rows="0"` and `auto-expand`, entering data in the final row produces another empty display row. The empty row is never serialized.

```html
<snice-key-value auto-expand label="Variable headers"></snice-key-value>
<snice-key-value auto-expand="false" label="One row until added"></snice-key-value>
<snice-key-value rows="5" label="Exactly five rows"></snice-key-value>
```

Fixed rows have no delete buttons or automatic expansion. `addItem()` fills the first empty fixed row and is a no-op when all fixed rows are full. Lowering `rows` intentionally drops live entries beyond the new count.

### Descriptions, view mode, and copy

```html
<snice-key-value show-description show-copy label="API Parameters">
  <snice-kv-pair key="page" value="1" description="Page number"></snice-kv-pair>
  <snice-kv-pair key="limit" value="25" description="Results per page"></snice-kv-pair>
</snice-key-value>

<snice-key-value mode="view" show-description show-copy label="Response Metadata">
  <snice-kv-pair key="request-id" value="a1b2" description="Trace identifier"></snice-kv-pair>
</snice-key-value>
```

The copy button writes the same ordered entries as formatted JSON. Readonly and view-mode data can still be copied; disabled data cannot.

### Disabled fieldsets

The browser controls inherited fieldset state and the normal first-`legend` exception. Inherited disabledness does not alter the authored `disabled` property or attribute.

```html
<fieldset disabled>
  <legend>
    Metadata
    <snice-key-value name="legend-data"></snice-key-value>
  </legend>
  <snice-key-value name="omitted-data"></snice-key-value>
</fieldset>
```

## Keyboard Navigation

- `Tab` and `Shift+Tab` move through editable text inputs in document order.
- Key, value, and description fields use standard text-input editing shortcuts.
- Copy and delete controls use native button activation when focused.
- Disabled controls cannot receive user input; readonly inputs remain focusable for selection and copying.

## Accessibility

- The editor renders as an ARIA `group`, named by `label` or by a default accessible name.
- Every key, value, and description input has a row-specific accessible label.
- The exact invalid key input receives `aria-invalid="true"`, and the visible validation message uses `role="alert"`.
- `required` is exposed through native constraint validation and a visible title marker.
- Form association supports external labels, `form="id"`, disabled fieldsets, `form.elements`, reset, browser state restoration, and `FormData`.
- Light DOM `<snice-kv-pair>` elements are data only; the rendered inputs or view rows provide the interactive and accessible surface.
