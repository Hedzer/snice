# snice-tag-input

Tag/chip input with autocomplete suggestions, keyboard navigation, and comma-separated entry.

## Properties

```typescript
value: string[] = [];             // live property only
defaultValue: string[] = [];      // attr: value as JSON; authored/reset default
suggestions: string[] = [];
maxTags: number = 0;              // <= 0 = unlimited (attr: max-tags)
allowDuplicates: boolean = false; // attr: allow-duplicates
placeholder: string = 'Add a tag...';
disabled: boolean = false;
readonly: boolean = false;
label: string = '';
name: string = '';
readonly type: 'text';
readonly form: HTMLFormElement | null;
readonly validity: ValidityState;
readonly validationMessage: string;
readonly willValidate: boolean;
readonly labels: NodeList | null;
```

## Value and form lifecycle

- The `value` attribute parses JSON and backs `defaultValue`; live `value` is a separate cloned array.
- Adding/removing/restoring/assigning tags dirties live state. Pristine state follows default changes.
- The successful/restoration value is JSON, preserving commas and Unicode within tags.
- Reset/restoration are silent. Reconnect, form moves, repeated resets, and fieldset disabledness preserve authored state.
- A named host is listed in `form.elements` and contributes one JSON array string to `FormData`; explicit `form="id"`, labels, reset, restore, and disabled fieldsets are supported.
- More than a positive `maxTags` reports `tooLong`. Duplicate values while `allowDuplicates === false` report `customError`. Programmatic arrays remain visible and invalid so customers can correct them; insertion methods still prevent violating additions.
- Dynamic rules recalculate immediately. `setCustomValidity()` supplies an independent custom error; pass `''` to clear it.
- Calculated errors mark the container/input, report through the form, and block validated submission. At capacity, reporting/focus targets the first remove action because the draft input is hidden.
- Disabled controls are omitted/barred. Readonly controls remain successful but are barred.

## Methods

- `addTag(tag: string)` - Add a tag programmatically
- `removeTag(index: number)` - Remove tag at index
- `clear()` - Remove all tags
- `focus()` - Focus draft input or first remove action at capacity
- `blur()` - Blur the current validation target
- `checkValidity()` / `reportValidity()` - Check/report current validity
- `setCustomValidity(message)` - Set or clear `customError`

## Events

- `tag-add` -> `{ tag: string; value: string[] }`
- `tag-remove` -> `{ tag: string; index: number; value: string[] }`
- `tag-change` -> `{ value: string[] }`

## CSS Parts

- `base` - Outer wrapper div
- `label` - Label element
- `container` - Tags + input container
- `tag` - Individual tag span
- `tag-text` - Tag text content
- `input` - Text input field
- `suggestions` - Suggestions dropdown

## Keyboard Navigation

- Enter: Add current input as tag (or select highlighted suggestion)
- Comma: Split input and add each part as a tag
- Backspace on empty input: Remove last tag
- ArrowUp/ArrowDown: Navigate suggestions
- Escape: Close suggestions dropdown

## Basic Usage

```html
<snice-tag-input
  label="Skills"
  placeholder="Add a skill..."
  max-tags="5"
></snice-tag-input>
```

```typescript
tagInput.suggestions = ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go'];
tagInput.value = ['JavaScript'];

tagInput.addEventListener('tag-change', (e) => {
  console.log('Tags:', e.detail.value);
});
```

## Accessibility

- `label` supplies the input's accessible name
- Adding, removing, and selecting tags are all reachable by keyboard (see Keyboard Navigation)
- Focus returns to the input after a tag is added or removed
