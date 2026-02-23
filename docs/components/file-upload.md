[//]: # (AI: For a low-token version of this doc, use docs/ai/components/file-upload.md instead)

# File Upload Component

The `<snice-file-upload>` component provides a file upload interface with drag-and-drop support, file previews, and validation.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Features](#features)
- [Examples](#examples)

## Basic Usage

```html
<snice-file-upload
  label="Upload Documents"
  accept=".pdf,.doc,.docx"
  max-size="5242880"
></snice-file-upload>
```

```typescript
import 'snice/components/file-upload/snice-file-upload';

const upload = document.querySelector('snice-file-upload');
upload.addEventListener('file-upload-change', (e) => {
  console.log('Files:', e.detail.files);
});
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant |
| `variant` | `'outlined' \| 'filled'` | `'outlined'` | Visual style variant |
| `accept` | `string` | `''` | Allowed file types (same as input accept) |
| `multiple` | `boolean` | `false` | Allow multiple file selection |
| `label` | `string` | `''` | Label text |
| `helperText` | `string` | `''` | Helper text below upload area |
| `errorText` | `string` | `''` | Error message (shown when invalid) |
| `disabled` | `boolean` | `false` | Whether upload is disabled |
| `required` | `boolean` | `false` | Whether upload is required |
| `invalid` | `boolean` | `false` | Whether to show invalid state |
| `maxSize` | `number` | `-1` | Maximum file size in bytes (-1 = no limit) |
| `maxFiles` | `number` | `-1` | Maximum number of files (-1 = no limit) |
| `name` | `string` | `''` | Form field name |
| `dragDrop` | `boolean` | `true` | Enable drag-and-drop |
| `showPreview` | `boolean` | `true` | Show image previews |
| `files` | `FileList \| null` | `null` | Selected files (read-only) |

## Methods

### `clear(): void`
Remove all selected files.

```typescript
upload.clear();
```

### `removeFile(index: number): void`
Remove a specific file by index.

```typescript
upload.removeFile(0); // Remove first file
```

## Events

### `file-upload-change`
Fired when files are added or removed.

**Detail**: `{ files: File[], fileUpload: SniceFileUploadElement }`

```typescript
upload.addEventListener('file-upload-change', (e) => {
  console.log('Selected files:', e.detail.files);
  e.detail.files.forEach(file => {
    console.log(`- ${file.name} (${file.size} bytes)`);
  });
});
```

### `file-upload-error`
Fired when file validation fails.

**Detail**: `{ message: string, fileUpload: SniceFileUploadElement }`

```typescript
upload.addEventListener('file-upload-error', (e) => {
  console.error('Upload error:', e.detail.message);
});
```

## Features

- **Drag and Drop**: Native drag-and-drop support with visual feedback
- **Image Preview**: Automatic thumbnail generation for image files
- **File Validation**: Size and type validation with error messaging
- **Multiple Files**: Support for single or multiple file selection
- **File Management**: Add and remove files before upload
- **Form Integration**: Form-associated custom element
- **Accessibility**: Full keyboard support and ARIA attributes

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

### File Type Restrictions

```html
<!-- Images only -->
<snice-file-upload accept="image/*" label="Images"></snice-file-upload>

<!-- Specific formats -->
<snice-file-upload accept=".pdf,.doc,.docx" label="Documents"></snice-file-upload>

<!-- Multiple types -->
<snice-file-upload accept="image/*,.pdf" label="Images and PDFs"></snice-file-upload>
```

### With Size Validation

```html
<snice-file-upload
  label="Upload Photo"
  accept="image/*"
  max-size="5242880"
  helper-text="Maximum 5MB"
></snice-file-upload>

<script>
const upload = document.querySelector('snice-file-upload');
upload.addEventListener('file-upload-error', (e) => {
  alert(e.detail.message);
});
</script>
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

  // Upload to server
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  console.log('Upload complete!');
});
</script>
```

### Managing Files Programmatically

```html
<snice-file-upload id="file-upload" multiple></snice-file-upload>
<button onclick="clearFiles()">Clear All</button>
<button onclick="removeFirst()">Remove First</button>

<script>
const upload = document.getElementById('file-upload');

function clearFiles() {
  upload.clear();
}

function removeFirst() {
  upload.removeFile(0);
}

upload.addEventListener('file-upload-change', (e) => {
  console.log(`${e.detail.files.length} file(s) selected`);
});
</script>
```
