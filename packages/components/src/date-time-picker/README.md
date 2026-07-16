# Date Time Picker

`snice-date-time-picker` is a form-associated local date-time control with editable text, a calendar, time columns, native reset/restore/fieldset behavior, and constraint validation.

```html
<snice-date-time-picker
  name="appointment"
  value="2026-03-10T14:05"
  min="2026-03-10T09:30"
  max="2026-03-20T17:45"
  required
></snice-date-time-picker>
```

Canonical form submission is `YYYY-MM-DDTHH:mm`, or `YYYY-MM-DDTHH:mm:ss` with `show-seconds`. Values are local wall times; no UTC conversion occurs.

`value` is live state. `defaultValue` is the `value` content attribute and reset default. Malformed/partial input stays visible, sets `badInput`, and is not submitted as a valid datetime.

See [`docs/components/date-time-picker.md`](../../../../docs/components/date-time-picker.md) for the complete API, validation, form lifecycle, formats, events, and accessibility contract. AI-oriented reference: [`docs/ai/components/date-time-picker.md`](../../../../docs/ai/components/date-time-picker.md).
