# snice-file-upload

File upload with drag-and-drop, preview, and form association.

## Properties

```typescript
size: 'small'|'medium'|'large' = 'medium';
variant: 'outlined'|'filled' = 'outlined';
accept: string = '';
multiple: boolean = false;
disabled: boolean = false;
required: boolean = false;
invalid: boolean = false;
label: string = '';
helperText: string = '';       // attribute: helper-text
errorText: string = '';        // attribute: error-text
maxSize: number = -1;          // attribute: max-size, bytes
maxFiles: number = -1;         // attribute: max-files
name: string = '';
dragDrop: boolean = true;      // attribute: drag-drop
showPreview: boolean = true;   // attribute: show-preview
files: FileList | null;        // read-only
readonly type: 'file';
readonly form: HTMLFormElement | null;
readonly validity: ValidityState;
readonly validationMessage: string;
readonly willValidate: boolean;
readonly labels: NodeList | null;
```

## Methods

- `clear()` - Clear all files
- `removeFile(index: number)` - Remove file by index
- `focus()` / `blur()` - Focus/blur the native file chooser
- `checkValidity()` / `reportValidity()` - Check/report current validity
- `setCustomValidity(message)` - Set `customError`; pass `''` to clear it

## Events

- `file-upload-change` → `{ files: File[], fileUpload }`
- `file-upload-error` → `{ message: string, fileUpload }`

## CSS Parts

- `upload-area` - Drop zone container
- `input` - Hidden file input
- `file-item` - Individual file entry
- `error-text` - Error text element
- `helper-text` - Helper text element

## Basic Usage

```typescript
import 'snice/components/file-upload/snice-file-upload';
```

```html
<snice-file-upload label="Upload File"></snice-file-upload>
<snice-file-upload multiple label="Upload Files"></snice-file-upload>
<snice-file-upload accept="image/*" label="Images only"></snice-file-upload>
<snice-file-upload max-size="5242880"></snice-file-upload>
<snice-file-upload multiple max-files="5"></snice-file-upload>
<snice-file-upload drag-drop="false"></snice-file-upload>
<snice-file-upload variant="filled" size="small"></snice-file-upload>
```

```typescript
upload.addEventListener('file-upload-change', e => console.log(e.detail.files));
upload.addEventListener('file-upload-error', e => console.error(e.detail.message));
```

Form-associated custom element. Works with native `<form>` and `FormData`.

## Form lifecycle

- Native file controls cannot have an authored non-empty default.
- Reset silently clears files, previews, and form value; restoration accepts one `File` or repeated `File` entries in `FormData` and is silent.
- Multiple files submit as repeated entries under `name`; empty selection submits nothing.
- Reconnect/form moves retain current files. Disabled fieldsets make choose/drop/remove paths inert without rewriting authored `disabled`.

## Validation contract

- Empty `required` selection reports `valueMissing`.
- A customer selection rejected by `maxSize` or `maxFiles` remains an actionable `customError` with a useful filename/count message instead of silently disappearing as valid.
- Tightening `maxSize` or `maxFiles` revalidates an existing programmatic/restored selection; relaxing the rule clears the generated error immediately.
- `setCustomValidity()` supplies an independent application error. `invalid`/`errorText` are presentation only.
- Calculated errors update the upload surface and input `aria-invalid`, block validated submission, and clear after a valid replacement or explicit clear.
- Disabled controls are omitted and barred. The host supports `form.elements`, explicit `form="id"`, live labels, `FormData`/`formdata`, reset, restore, and disabled fieldsets.
