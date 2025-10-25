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
helperText: string = '';
errorText: string = '';
maxSize: number = -1; // bytes
maxFiles: number = -1;
name: string = '';
dragDrop: boolean = true;
showPreview: boolean = true;
files: FileList | null;
```

## Methods

- `clear()` - Clear all files
- `removeFile(index)` - Remove file by index

## Events

- `change` - {files, fileUpload}
- `error` - {message, fileUpload}

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
<snice-file-upload id="upload"></snice-file-upload>
<script>
const upload = document.querySelector('#upload');
upload.addEventListener('@snice/file-upload-change', (e) => {
  console.log('Files:', e.detail.files);
});
upload.addEventListener('@snice/file-upload-error', (e) => {
  console.error('Error:', e.detail.message);
});
</script>
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
