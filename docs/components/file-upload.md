<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/file-upload.md -->

# File Upload

The `<snice-file-upload>` component provides a file upload interface with drag-and-drop support, file previews, and validation. It is a form-associated custom element.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant |
| `variant` | `'outlined' \| 'filled'` | `'outlined'` | Visual style variant |
| `accept` | `string` | `''` | Allowed file types (same as input accept) |
| `multiple` | `boolean` | `false` | Allow multiple file selection |
| `disabled` | `boolean` | `false` | Whether upload is disabled |
| `required` | `boolean` | `false` | Whether upload is required |
| `invalid` | `boolean` | `false` | Whether to show invalid state |
| `label` | `string` | `''` | Label text |
| `helperText` (attr: `helper-text`) | `string` | `''` | Helper text below upload area |
| `errorText` (attr: `error-text`) | `string` | `''` | Error message (shown when invalid) |
| `maxSize` (attr: `max-size`) | `number` | `-1` | Maximum file size in bytes (-1 = no limit) |
| `maxFiles` (attr: `max-files`) | `number` | `-1` | Maximum number of files (-1 = no limit) |
| `name` | `string` | `''` | Form field name |
| `dragDrop` (attr: `drag-drop`) | `boolean` | `true` | Enable drag-and-drop |
| `showPreview` (attr: `show-preview`) | `boolean` | `true` | Show image previews |
| `files` | `FileList \| null` | `null` | Selected files (read-only) |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `clear()` | -- | Remove all selected files |
| `removeFile(index)` | `index: number` | Remove a specific file by index |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `file-upload-change` | `{ files: File[], fileUpload: SniceFileUploadElement }` | Fired when files are added or removed |
| `file-upload-error` | `{ message: string, fileUpload: SniceFileUploadElement }` | Fired when file validation fails |

## CSS Parts

| Part | Description |
|------|-------------|
| `upload-area` | Drop zone container |
| `input` | Hidden file input |
| `file-item` | Individual file entry |
| `error-text` | Error text element |
| `helper-text` | Helper text element |

## Basic Usage

```typescript
import 'snice/components/file-upload/snice-file-upload';
```

```html
<snice-file-upload
  label="Upload Documents"
  accept=".pdf,.doc,.docx"
  max-size="5242880"
></snice-file-upload>
```

```typescript
const upload = document.querySelector('snice-file-upload');
upload.addEventListener('file-upload-change', (e) => {
  console.log('Files:', e.detail.files);
});
```

## Examples

### Basic Upload

```html
<snice-file-upload
  label="Upload File"
  helper-text="Choose a file to upload"
></snice-file-upload>
```

### Image Upload with Preview

```html
<snice-file-upload
  label="Upload Image"
  accept="image/*"
  max-size="2097152"
  helper-text="Maximum 2MB, images only"
></snice-file-upload>
```

### Multiple Files

```html
<snice-file-upload
  label="Upload Documents"
  accept=".pdf,.doc,.docx"
  multiple
  max-files="5"
  helper-text="Select up to 5 documents"
></snice-file-upload>
```

### Without Drag-and-Drop

```html
<snice-file-upload
  label="Upload File"
  drag-drop="false"
></snice-file-upload>
```

### Different Sizes

```html
<snice-file-upload size="small" label="Small"></snice-file-upload>
<snice-file-upload size="medium" label="Medium"></snice-file-upload>
<snice-file-upload size="large" label="Large"></snice-file-upload>
```

### Different Variants

```html
<snice-file-upload variant="outlined" label="Outlined"></snice-file-upload>
<snice-file-upload variant="filled" label="Filled"></snice-file-upload>
```

### Error State

```html
<snice-file-upload
  label="Resume"
  invalid
  error-text="Please upload your resume"
  required
></snice-file-upload>
```

### Form Integration

```html
<form id="upload-form">
  <snice-file-upload
    name="documents"
    label="Upload Documents"
    accept=".pdf,.doc,.docx"
    multiple
    required
  ></snice-file-upload>

  <button type="submit">Submit</button>
</form>

<script>
document.getElementById('upload-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const files = formData.getAll('documents');
  console.log(`Uploading ${files.length} file(s)...`);
});
</script>
```

### Managing Files Programmatically

```typescript
upload.clear();
upload.removeFile(0);

upload.addEventListener('file-upload-change', (e) => {
  console.log(`${e.detail.files.length} file(s) selected`);
});

upload.addEventListener('file-upload-error', (e) => {
  console.error('Upload error:', e.detail.message);
});
```
