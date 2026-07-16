# Time Picker

`snice-time-picker` is a form-associated local-time control with editable 12-hour/24-hour text, dropdown or inline selectors, optional seconds, native reset/restore/fieldset behavior, and constraint validation.

```html
<snice-time-picker
  name="appointment"
  value="14:05:10"
  step="5"
  min-time="09:00:00"
  max-time="17:00:00"
  show-seconds
  required
></snice-time-picker>
```

Canonical form submission is `HH:mm`, or `HH:mm:ss` with `show-seconds`. Values are local wall times; no date, time zone, or UTC conversion is involved.

`value` is live state. `defaultValue` is the `value` content attribute and reset default. Malformed/partial input remains visible, sets `badInput`, and is not submitted as a valid time. Native validity also covers `valueMissing`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, and `customError`.

See [`docs/components/time-picker.md`](../../../../docs/components/time-picker.md) for the complete API, form lifecycle, validation, formats, events, and selector contract. AI-oriented reference: [`docs/ai/components/time-picker.md`](../../../../docs/ai/components/time-picker.md).
