# snice-file-gallery

File upload gallery with drag-and-drop, preview, pausable/resumable uploads.

## Properties

```typescript
accept: string = '';
multiple: boolean = true;
disabled: boolean = false;
maxSize: number = -1;          // attribute: max-size, bytes, -1 = no limit
maxFiles: number = -1;         // attribute: max-files, -1 = no limit
view: 'grid'|'list' = 'grid';
showProgress: boolean = true;  // attribute: show-progress
allowPause: boolean = true;    // attribute: allow-pause
allowDelete: boolean = true;   // attribute: allow-delete
autoUpload: boolean = true;    // attribute: auto-upload
showDropzone: boolean = true;  // attribute: show-dropzone
showAddButton: boolean = false; // attribute: show-add-button
showHeader: boolean = true;    // attribute: show-header
files: GalleryFile[]; // read-only
```

## Getters

- `files: GalleryFile[]` - Get all files
- `customActions: CustomAction[]` - Get all custom actions
- `getFile(fileId): GalleryFile | undefined` - Get specific file
- `getCustomAction(actionId): CustomAction | undefined` - Get specific action
- `isPending(fileId): boolean` - Check if pending
- `isUploading(fileId): boolean` - Check if uploading
- `isPaused(fileId): boolean` - Check if paused
- `isCompleted(fileId): boolean` - Check if completed
- `hasError(fileId): boolean` - Check if has error
- `canAddFiles(): boolean` - Check if can add more files

## File Management

- `addFiles(files: FileList | File[])` - Add files to gallery
- `addFileWithPreview(file: File, previewDataUrl: string)` - Add file with preview
- `removeFile(fileId: string)` - Remove file
- `clear()` - Remove all files
- `clearCompleted()` - Remove completed files
- `clearErrors()` - Remove files with errors

## Upload Control

- `pauseUpload(fileId: string)` - Pause upload
- `resumeUpload(fileId: string)` - Resume upload
- `retryUpload(fileId: string)` - Retry failed upload
- `cancelUpload(fileId: string)` - Cancel and remove upload
- `pauseAll()` - Pause all uploading files
- `resumeAll()` - Resume all paused files
- `retryAll()` - Retry all errored files
- `cancelAll()` - Cancel all active uploads

## Custom Actions

- `addCustomAction(icon: string, text: string): string` - Add custom action, returns actionId
- `removeCustomAction(actionId: string)` - Remove action
- `clearCustomActions()` - Remove all actions

## Utility

- `openFilePicker()` - Open file picker dialog
- `setFileBadge(fileId: string, badge: string, position?: 'top-left'|'top-right'|'bottom-left'|'bottom-right')` - Add badge overlay to file preview (supports HTML)
- `removeFileBadge(fileId: string)` - Remove badge from file

## Events

- `files-change` - {files, component}
- `upload-progress` - {file, progress, component}
- `upload-complete` - {file, response: UploadResponse, component}
- `upload-error` - {file, error, component}
- `upload-pause` - {file, component}
- `file-remove` - {file, component}
- `custom-action-click` - {actionId, component}
- `gallery-error` - {message, component}

## Types

```typescript
interface GalleryFile {
  id: string;
  file: File;
  preview?: string;
  uploadProgress: number;
  uploadStatus: 'pending'|'uploading'|'paused'|'completed'|'error';
  error?: string;
  badge?: string; // HTML content for badge overlay
  badgePosition?: 'top-left'|'top-right'|'bottom-left'|'bottom-right';
}

interface UploadRequest {
  file: File;
  fileId: string;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

interface UploadResponse {
  success: boolean;
  fileId: string;
  url?: string;
  error?: string;
}
```

## Upload Handler

Uses `@request/@respond` pattern (`file-gallery-upload`). Handler receives `UploadRequest`, returns `UploadResponse`.

## Usage

```html
<!-- Basic -->
<snice-file-gallery></snice-file-gallery>

<!-- Images only -->
<snice-file-gallery accept="image/*"></snice-file-gallery>

<!-- Manual upload -->
<snice-file-gallery auto-upload="false"></snice-file-gallery>

<!-- Limits -->
<snice-file-gallery max-files="3" max-size="2097152"></snice-file-gallery>

<!-- List view -->
<snice-file-gallery view="list"></snice-file-gallery>

<!-- Add button mode -->
<snice-file-gallery show-dropzone="false" show-add-button="true" max-files="6"></snice-file-gallery>

<!-- Events -->
<script>
gallery.addEventListener('files-change', (e) => console.log(e.detail.files));
gallery.addEventListener('upload-complete', (e) => console.log(e.detail.url));
</script>
```
