# snice-key-value

Key-value pair editor for HTTP headers, env vars, config entries. Dual API: declarative `<snice-kv-pair>` children or imperative `setItems()`.

## Components

- `snice-key-value` — Container/editor
- `snice-kv-pair` — Data container child (no shadow DOM)

## Properties (snice-key-value)

```typescript
label: string = '';
autoExpand: boolean = true;            // attr: auto-expand
rows: number = 0;                       // 0 = unlimited; >0 = fixed count
showDescription: boolean = false;       // attr: show-description
keyPlaceholder: string = 'Key';         // attr: key-placeholder
valuePlaceholder: string = 'Value';     // attr: value-placeholder
placeholders: Array<{key,value}> = [];  // JS only — random sample placeholders
disabled: boolean = false;
readonly: boolean = false;
name: string = '';
variant: 'default'|'compact' = 'default';
mode: 'edit'|'view' = 'edit';              // view = read-only display
showCopy: boolean = false;                  // attr: show-copy
value: string;                              // readonly getter — JSON string of items
```

## Properties (snice-kv-pair)

```typescript
key: string = '';
value: string = '';
description: string = '';
```

## Methods

- `setItems(items)` - Set items imperatively (ignored in slot mode)
- `addItem(key?, value?, description?)` - Append pair
- `removeItem(index)` - Remove by index
- `clear()` - Remove all
- `getItems()` - Returns non-empty items
- `focus()` - Focus first key input

## Events

- `kv-add` → `{ item: KeyValueItem, index: number }`
- `kv-remove` → `{ item: KeyValueItem, index: number }`
- `kv-change` → `{ items: KeyValueItem[] }`
- `kv-copy` → `{ items: KeyValueItem[] }`

## Slots

- `(default)` - `<snice-kv-pair>` child elements

## CSS Parts

`base`, `title`, `copy-button`, `rows`, `row`, `key-input`, `value-input`, `description-input`, `delete-button`, `view-row`, `view-key`, `view-value`, `view-desc`, `empty`

## Basic Usage

```typescript
import 'snice/components/key-value/snice-key-value';
```

```html
<!-- Declarative -->
<snice-key-value label="HTTP Headers">
  <snice-kv-pair key="Content-Type" value="application/json"></snice-kv-pair>
  <snice-kv-pair key="Authorization" value="Bearer token"></snice-kv-pair>
</snice-key-value>

<!-- Imperative -->
<snice-key-value label="Environment Variables"></snice-key-value>
```

```typescript
kv.setItems([
  { key: 'NODE_ENV', value: 'production' },
  { key: 'PORT', value: '3000' }
]);
kv.addEventListener('kv-change', e => console.log(e.detail.items));
```

```html
<!-- Fixed rows -->
<snice-key-value rows="5" label="Config"></snice-key-value>

<!-- Compact with descriptions -->
<snice-key-value variant="compact" show-description></snice-key-value>

<!-- View mode -->
<snice-key-value mode="view" label="Response Headers">
  <snice-kv-pair key="Content-Type" value="application/json"></snice-kv-pair>
</snice-key-value>
```

## Behavior

- **Auto-expand** (default): last row non-empty -> new empty row appended
- **Fixed rows**: `rows="5"` -> exactly 5, no delete buttons, no auto-expand
- **Slot precedence**: `<snice-kv-pair>` children override `setItems()`
- **View mode**: `mode="view"` renders as read-only text, empty items hidden
- **Copy button**: `show-copy` adds clipboard button, copies JSON
- **Form associated**: `value` getter returns JSON string, `setFormValue()` on every change
