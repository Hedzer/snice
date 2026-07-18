# snice-radio

Form-associated native-style radio with group coordination, reset defaults, required validation, and default/block presentation.

## State

```typescript
checked: boolean = false;         // live, property-only, direct assignments are silent
defaultChecked: boolean = false;  // reflected by the checked attribute; form-reset default
disabled: boolean = false;        // authored disabled state
loading: boolean = false;         // blocks interaction; submission and validation still participate
required: boolean = false;        // applies to the whole group
invalid: boolean = false;         // visual/ARIA state only; not a validation error
variant: 'default'|'block' = 'default';
size: 'small'|'medium'|'large' = 'medium';
name: string = '';
value: string = 'on';
label: string = '';
description: string = '';
```

`checked` is current checkedness. `defaultChecked` and the `checked` content attribute are the authored reset default. Assigning `checked`, including the same value, makes checkedness dirty. Later default changes do not overwrite dirty state. `form.reset()` restores group defaults silently; the last authored checked member in tree order wins.

## Group Identity

Named radios coordinate only when all are equal:

1. non-empty `name`
2. form owner, including `form="id"`
3. document or shadow root

Empty-name radios are independent. Same-name radios in different forms or roots are independent. Checked insertion/reconnection, removal, dynamic `name`, and dynamic form ownership recompute selection, group validity, and the roving tab stop.

## Native Form Contract

```typescript
readonly type: 'radio';
readonly form: HTMLFormElement|null;
readonly validity: ValidityState;
readonly validationMessage: string;
readonly willValidate: boolean;
readonly labels: NodeList|null;

checkValidity(): boolean;
reportValidity(): boolean;
setCustomValidity(message: string): void;
```

- A selected, enabled, named radio contributes one `FormData` entry.
- Default `value` is `'on'`; explicit `value=""` is preserved.
- Disabled and disabled-fieldset radios are omitted and skipped by validation.
- A radio in the first `<legend>` of a disabled fieldset remains enabled.
- Fieldset ancestry never rewrites `disabled` or its attribute.
- If any member has `required`, every member has `valueMissing` until any member is checked. A disabled `required` member still establishes that group requirement.
- A checked disabled member satisfies requiredness but is omitted from `FormData`.
- `setCustomValidity()` is per member; `required` validity is group-wide.
- `invalid` is presentation only and does not create `customError` or `valueMissing`.

## Activation and Events

```text
input -> change -> radio-change
```

`radio-change` detail:

```typescript
{ checked: true, value: string, radio: SniceRadioElement }
```

Only the newly selected radio emits. The old member is silently unchecked. Direct assignment, default changes, group reconciliation, reset, and restoration emit nothing. An already selected radio emits no state-change events.

`click()` and `select()` run activation. Internal/external label clicks, Space, and arrows use the same path. External-label `preventDefault()` cancels selection. Events bubble and are composed from the host.

## Methods

- `focus()` / `blur()`
- `click()` - activate unless authored-, fieldset-, or loading-disabled
- `select()` - activate only when not selected
- `checkValidity()` / `reportValidity()`
- `setCustomValidity(message)`

## Keyboard

- Space selects focused radio.
- Right/Down selects next enabled member.
- Left/Up selects previous enabled member.
- Navigation wraps and skips disabled/loading radios.
- Checked enabled member is the tab stop; otherwise first enabled member.

## Presentation

```html
<snice-radio name="plan" value="basic" label="Basic" required></snice-radio>
<snice-radio name="plan" value="pro" label="Pro" checked></snice-radio>

<snice-radio variant="block" name="plan" value="team"
  label="Team" description="For growing teams">
  <span slot="suffix">$29/mo</span>
</snice-radio>
```

Slot: `suffix`.

CSS parts: `input`, `radio`, `dot`, `spinner`, `content`, `label`, `description`.
