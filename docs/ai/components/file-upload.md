# snice-file-upload

File upload with drag-and-drop and preview.

## Properties

```typescript
variant: 'outlined'|'filled' = 'outlined';
size: 'small'|'medium'|'large' = 'medium';
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
files: FileList | null;
```

## Methods

- `clear()` - Clear all files
- `removeFile(index)` - Remove file by index

## CSS Parts

- `upload-area` - Drop zone container
- `input` - Hidden file input
- `file-item` - Individual file entry
- `error-text` - Error text element
- `helper-text` - Helper text element

## Events

- `file-upload-change` → `{ files, fileUpload }`
- `file-upload-error` → `{ message, fileUpload }`

## Usage

```html
<!-- Basic -->
<snice-file-upload label="Upload File"></snice-file-upload>

<!-- Multiple files -->
<snice-file-upload multiple label="Upload Files"></snice-file-upload>

<!-- File type restrictions -->
<snice-file-upload accept="image/*" label="Images only"></snice-file-upload>
<snice-file-upload accept=".pdf,.doc,.docx"></snice-file-upload>

<!-- Size limit (5MB) -->
<snice-file-upload max-size="5242880"></snice-file-upload>

<!-- File count limit -->
<snice-file-upload multiple max-files="5"></snice-file-upload>

<!-- No drag-drop -->
<snice-file-upload drag-drop="false"></snice-file-upload>

<!-- No preview -->
<snice-file-upload show-preview="false"></snice-file-upload>

<!-- Variants -->
<snice-file-upload variant="outlined"></snice-file-upload>
<snice-file-upload variant="filled"></snice-file-upload>

<!-- Sizes -->
<snice-file-upload size="small"></snice-file-upload>
<snice-file-upload size="medium"></snice-file-upload>
<snice-file-upload size="large"></snice-file-upload>

<!-- Events -->
<snice-file-upload></snice-file-upload>
```

```typescript
upload.addEventListener('file-upload-change', (e) => {
  console.log('Files:', e.detail.files);
});
upload.addEventListener('file-upload-error', (e) => {
  console.error('Error:', e.detail.message);
});
```

## Features

- Form-associated custom element
- Drag-and-drop support
- Image preview
- File type filtering
- Size validation
- File count limits
- Multiple file selection
- 2 variants, 3 sizes
- Accessible
