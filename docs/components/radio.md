<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/radio.md -->

# Radio

Native-style form radio with automatic group coordination, required validation, authored reset defaults, loading state, and inline or block presentation. It is a form-associated custom element: the selected value participates in `FormData`, groups respect form owners and tree roots, and disabled fieldsets follow the platform model.

## Table of Contents

- [Properties](#properties)
- [Native Form Properties](#native-form-properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Checked State and Reset Defaults](#checked-state-and-reset-defaults)
- [Radio Groups](#radio-groups)
- [Form Integration](#form-integration)
- [Validation](#validation)
- [Event Handling](#event-handling)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `checked` | -- | `boolean` | `false` | Live selected state. Direct assignment is silent and does not change the reset default. |
| `defaultChecked` | `checked` | `boolean` | `false` | Authored selected state restored by form reset. |
| `disabled` | `disabled` | `boolean` | `false` | Authored disabled state. Effective fieldset disabledness does not rewrite it. |
| `loading` | `loading` | `boolean` | `false` | Shows a spinner and blocks interaction. It does not remove a checked radio from form data or validation. |
| `required` | `required` | `boolean` | `false` | Makes selection required for the entire radio group. |
| `invalid` | `invalid` | `boolean` | `false` | Applies invalid presentation and `aria-invalid`; it does not create a validation error. |
| `variant` | `variant` | `'default' \| 'block'` | `'default'` | Inline or card-style presentation. |
| `size` | `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Radio size. |
| `name` | `name` | `string` | `''` | Group and submitted field name. An empty name creates an independent radio and is not submitted. |
| `value` | `value` | `string` | `'on'` | Submitted value when selected. An explicit empty string is preserved. |
| `label` | `label` | `string` | `''` | Visible label text. |
| `description` | `description` | `string` | `''` | Supporting text in the block variant. |

`checked` is intentionally a property-only live channel. The `checked` content attribute represents `defaultChecked`, matching a native `<input type="radio">`.

## Native Form Properties

| Property | Type | Description |
|----------|------|-------------|
| `type` | `'radio'` | Native-compatible control type. |
| `form` | `HTMLFormElement \| null` | Owning form, including association through a `form` attribute. |
| `validity` | `ValidityState` | Current constraint-validation flags. |
| `validationMessage` | `string` | Current validation message. |
| `willValidate` | `boolean` | Whether this radio participates in constraint validation. |
| `labels` | `NodeList \| null` | Associated external labels. |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `focus()` | -- | Focuses the internal native radio. |
| `blur()` | -- | Removes focus. |
| `click()` | -- | Runs native activation unless disabled or loading. |
| `select()` | -- | Runs native activation when the radio is not already selected. |
| `checkValidity()` | -- | Checks this radio's current group validity. |
| `reportValidity()` | -- | Checks and reports this radio's current group validity. |
| `setCustomValidity(message)` | `string` | Sets or clears a validation error on this radio. |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `input` | Native `InputEvent` | First event for a user-observable selection change. Bubbles and is composed. |
| `change` | Native `Event` | Follows `input`. Bubbles and is composed from the host. |
| `radio-change` | `{ checked, value, radio }` | Follows `change` with component-specific detail. |

Only the newly selected radio emits these events. The previously selected group member is silently unchecked. Direct `checked` assignments, default changes, reset, restoration, insertion, and group coordination do not emit them. Activating an already selected radio also emits no state-change events.

## Slots

| Name | Description |
|------|-------------|
| `suffix` | End content for the block variant, such as a badge or price. |

## CSS Parts

| Part | Description |
|------|-------------|
| `input` | Hidden native radio input. |
| `radio` | Radio circle. |
| `dot` | Selected indicator. |
| `spinner` | Loading spinner. |
| `content` | Block-variant content wrapper. |
| `label` | Label text. |
| `description` | Block-variant supporting text. |

## Basic Usage

```typescript
import 'snice/components/radio/snice-radio';
```

```html
<snice-radio name="color" value="red" label="Red"></snice-radio>
<snice-radio name="color" value="green" label="Green" checked></snice-radio>
<snice-radio name="color" value="blue" label="Blue"></snice-radio>
```

## Checked State and Reset Defaults

The state model matches `HTMLInputElement`:

- `radio.checked` is the live state.
- `radio.defaultChecked` and the `checked` content attribute are the reset default.
- Assigning `checked`, even to its existing value, makes live state independent from later default changes.
- Changing `defaultChecked` updates live state only while checkedness remains clean.
- Selecting one radio makes its group peers dirty and unchecked.
- Form reset restores the authored defaults. If multiple group members have `checked`, the last one in tree order wins.

```html
<form id="plan-form">
  <snice-radio id="basic" name="plan" value="basic" label="Basic" checked></snice-radio>
  <snice-radio id="pro" name="plan" value="pro" label="Pro"></snice-radio>
  <button type="reset">Restore default</button>
</form>
```

```typescript
pro.checked = true;          // live state; silent
basic.defaultChecked = true; // reset still returns to Basic
planForm.reset();            // basic.checked === true
```

## Radio Groups

Two radios are in the same group only when all three identities match:

1. Their non-empty `name` values are identical.
2. They have the same form owner, including a form selected through `form="id"`.
3. They are in the same document or shadow root.

Matching names in different forms or different shadow roots are independent. Radios without a name are also independent. Changing `name`, changing form ownership, inserting, removing, moving, or reconnecting a checked radio recomputes both mutual exclusion and group validity.

```html
<form id="billing">
  <snice-radio name="term" value="monthly" label="Monthly" checked></snice-radio>
</form>

<snice-radio form="billing" name="term" value="annual" label="Annual"></snice-radio>

<form id="shipping">
  <!-- Same name, different owner: a separate group. -->
  <snice-radio name="term" value="standard" label="Standard" checked></snice-radio>
</form>
```

## Form Integration

A radio is a successful form control only when it is selected, enabled, and has a non-empty `name`. Exactly one selected member per group contributes its `value`; the default value is `'on'`.

```html
<form id="checkout">
  <fieldset>
    <legend>Delivery</legend>
    <snice-radio name="delivery" value="standard" label="Standard" required></snice-radio>
    <snice-radio name="delivery" value="express" label="Express"></snice-radio>
  </fieldset>
  <button type="submit">Continue</button>
  <button type="reset">Reset</button>
</form>
```

```typescript
checkout.addEventListener('submit', event => {
  event.preventDefault();
  console.log([...new FormData(checkout)]);
});
```

A `disabled` radio and a radio effectively disabled by an ancestor `<fieldset disabled>` are omitted and do not validate. A radio in that fieldset's first `<legend>` remains enabled. Effective fieldset state does not change the authored `radio.disabled` property or attribute.

## Validation

If any radio in a group has `required`, every member reports `validity.valueMissing` until one member is selected. The requirement remains part of the group even when the radio carrying `required` is disabled; disabled members themselves are skipped when the form validates. A selected disabled member satisfies group requiredness but is omitted from `FormData`, matching native radios.

```typescript
const delivery = document.querySelector('snice-radio[name="delivery"]');

delivery.setCustomValidity('Choose a delivery option.');
delivery.reportValidity();
delivery.setCustomValidity('');
```

`setCustomValidity()` is per radio. The `required`/`valueMissing` contract is group-wide. The `invalid` property changes presentation only and does not set `customError` or `valueMissing`.

## Event Handling

For a real selection change, the order is `input` -> `change` -> `radio-change`:

```typescript
for (const radio of document.querySelectorAll('snice-radio[name="plan"]')) {
  radio.addEventListener('change', () => {
    if (radio.checked) console.log('Selected:', radio.value);
  });

  radio.addEventListener('radio-change', event => {
    console.log(event.detail.value);
  });
}
```

Internal label clicks, external `<label for="...">` clicks, Space, arrow navigation, `click()`, and `select()` all use the activation path. Canceling an external-label click with `preventDefault()` preserves selection.

## Keyboard Navigation

- `Space` selects the focused radio.
- `ArrowRight` and `ArrowDown` select and focus the next enabled group member.
- `ArrowLeft` and `ArrowUp` select and focus the previous enabled group member.
- Arrow navigation wraps and skips disabled or loading members.
- The selected enabled member is the group's tab stop. If none is selected, the first enabled member is the tab stop.

## Accessibility

- Uses a native radio input for keyboard and assistive-technology behavior.
- Keeps one roving tab stop per named group.
- Associates visible label text with the native control.
- Supports association, focus, activation, and cancellation through external `<label for="...">` elements.
- Exposes required group validity and native form labels through `ElementInternals`.
- Shows a visible keyboard focus indicator.
- Exposes `aria-invalid` for explicit or calculated group invalid presentation.
