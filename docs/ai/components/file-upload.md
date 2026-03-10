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
```

## Methods

- `clear()` - Clear all files
- `removeFile(index: number)` - Remove file by index

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
