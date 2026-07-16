# Key Value

`snice-key-value` is a form-associated ordered string-pair editor with edit/view modes, descriptions, duplicate-key preservation, declarative `<snice-kv-pair>` children, and imperative data APIs.

```html
<snice-key-value
  name="headers"
  value='[{"key":"Accept","value":"application/json","description":""}]'
  show-description
  required
></snice-key-value>
```

The successful value is an ordered JSON array of `{ key, value, description }` string entries. Empty display rows are omitted and an empty editor is `[]`. `value` is live state; `defaultValue` is the `value` content attribute and reset default. Non-empty rows require a non-whitespace key, while empty values are valid; malformed serialized input or rows set `badInput`.

Direct `<snice-kv-pair>` children take precedence over imperative mutation methods and become declarative reset defaults. Disabled fieldsets, browser restoration, native validity, `form="id"`, duplicate keys, Unicode, fixed rows, copying, and reconnects are supported.

See [`docs/components/key-value.md`](../../../../docs/components/key-value.md) for the complete public contract. AI-oriented reference: [`docs/ai/components/key-value.md`](../../../../docs/ai/components/key-value.md).
