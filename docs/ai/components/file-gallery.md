# snice-file-gallery

File upload gallery with drag-and-drop, preview, pausable/resumable uploads.

## Properties

```typescript
accept: string = '';
multiple: boolean = true;
disabled: boolean = false;
maxSize: number = -1; // bytes, -1 = no limit
maxFiles: number = -1; // -1 = no limit
view: 'grid'|'list' = 'grid';
showProgress: boolean = true;
allowPause: boolean = true;
allowDelete: boolean = true;
autoUpload: boolean = true;
showDropzone: boolean = true; // show drop zone for drag & drop
showAddButton: boolean = false; // show add button tile in gallery
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

- `files-change` - {files: GalleryFile[]}
- `upload-progress` - {file: GalleryFile, progress: number}
- `upload-complete` - {file: GalleryFile, url?: string}
- `upload-error` - {file: GalleryFile, error: string}
- `custom-action-click` - {actionId: string}
- `error` - {message: string}

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

Uses `@request/@respond` pattern. Handler required:

```typescript
import { respond } from 'snice';

class UploadController {
  @respond('file-gallery-upload')
  async handleUpload(request: UploadRequest): Promise<UploadResponse> {
    const { file, fileId, onProgress, signal } = request;

    // Implement upload logic
    // Use onProgress(0-1) for progress tracking
    // Check signal.aborted for cancellation

    return {
      success: true,
      fileId,
      url: 'https://example.com/file.jpg'
    };
  }
}

const controller = new UploadController();
controller.attach?.(document.body);
```

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

<!-- Custom options -->
<snice-file-gallery
  accept=".pdf,.doc,.docx"
  allow-pause="false"
></snice-file-gallery>

<!-- Add button mode (hide drop zone, show add tile) -->
<snice-file-gallery
  show-dropzone="false"
  show-add-button="true"
  max-files="6"
></snice-file-gallery>

<!-- Custom actions -->
<snice-file-gallery id="gallery"></snice-file-gallery>
<script>
const gallery = document.querySelector('#gallery');

// Add custom action
const icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">...</svg>';
const actionId = gallery.addCustomAction(icon, 'Camera');

// Handle custom action
gallery.addEventListener('custom-action-click', (e) => {
  if (e.detail.actionId === actionId) {
    // Handle camera action
    const file = capturePhoto(); // your implementation
    gallery.addFileWithPreview(file, previewUrl);
  }
});

// Other events
gallery.addEventListener('files-change', (e) => {
  console.log('Files:', e.detail.files);
});
gallery.addEventListener('upload-complete', (e) => {
  console.log('Complete:', e.detail.url);
});

// Add custom badge (e.g., user avatar)
const avatarHTML = `<div style="width:40px;height:40px;border-radius:50%;background:#3b82f6;color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2)">JD</div>`;
gallery.setFileBadge(fileId, avatarHTML, 'top-right');
</script>
```

## Features

- Drag-and-drop with visual feedback
- Image preview thumbnails
- Pausable/resumable uploads via AbortController
- Real-time progress tracking
- Grid/list view toggle
- File validation (size, type)
- Auto or manual upload modes
- @request/@respond upload pattern
- Accessible
