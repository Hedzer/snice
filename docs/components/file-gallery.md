<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/file-gallery.md -->

# File Gallery

The `<snice-file-gallery>` component provides a file upload gallery with drag-and-drop support, image previews, pausable/resumable uploads, and progress tracking.

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
| `accept` | `string` | `''` | Allowed file types (same as input accept) |
| `multiple` | `boolean` | `true` | Allow multiple file selection |
| `disabled` | `boolean` | `false` | Whether gallery is disabled |
| `maxSize` (attr: `max-size`) | `number` | `-1` | Maximum file size in bytes (-1 = no limit) |
| `maxFiles` (attr: `max-files`) | `number` | `-1` | Maximum number of files (-1 = no limit) |
| `view` | `'grid' \| 'list'` | `'grid'` | Display layout mode |
| `showProgress` (attr: `show-progress`) | `boolean` | `true` | Show upload progress |
| `allowPause` (attr: `allow-pause`) | `boolean` | `true` | Allow pause/resume of uploads |
| `allowDelete` (attr: `allow-delete`) | `boolean` | `true` | Allow file deletion |
| `autoUpload` (attr: `auto-upload`) | `boolean` | `true` | Start upload immediately on file add |
| `showDropzone` (attr: `show-dropzone`) | `boolean` | `true` | Show drop zone for drag & drop uploads |
| `showAddButton` (attr: `show-add-button`) | `boolean` | `false` | Show add button tile in gallery |
| `showHeader` (attr: `show-header`) | `boolean` | `true` | Show gallery header section |
| `files` | `GalleryFile[]` | `[]` | Current files (read-only getter) |

## Methods

### Getters

| Method | Returns | Description |
|--------|---------|-------------|
| `files` | `GalleryFile[]` | Get all files (read-only) |
| `customActions` | `CustomAction[]` | Get all custom action buttons (read-only) |
| `getFile(fileId)` | `GalleryFile \| undefined` | Get a specific file by ID |
| `getCustomAction(actionId)` | `CustomAction \| undefined` | Get a specific custom action by ID |
| `isPending(fileId)` | `boolean` | Check if a file upload is pending |
| `isUploading(fileId)` | `boolean` | Check if a file is currently uploading |
| `isPaused(fileId)` | `boolean` | Check if a file upload is paused |
| `isCompleted(fileId)` | `boolean` | Check if a file upload is completed |
| `hasError(fileId)` | `boolean` | Check if a file upload has an error |
| `canAddFiles()` | `boolean` | Check if more files can be added (respects maxFiles) |

### File Management

| Method | Description |
|--------|-------------|
| `addFiles(files: FileList \| File[])` | Add files to the gallery |
| `addFileWithPreview(file: File, previewDataUrl: string)` | Add a file with a custom preview |
| `removeFile(fileId: string)` | Remove a file from the gallery |
| `clear()` | Remove all files |
| `clearCompleted()` | Remove all completed files |
| `clearErrors()` | Remove all files with errors |

### Upload Control

| Method | Description |
|--------|-------------|
| `pauseUpload(fileId: string)` | Pause an ongoing upload |
| `resumeUpload(fileId: string)` | Resume a paused upload |
| `retryUpload(fileId: string)` | Retry a failed upload |
| `cancelUpload(fileId: string)` | Cancel an upload and remove the file |
| `pauseAll()` | Pause all currently uploading files |
| `resumeAll()` | Resume all paused uploads |
| `retryAll()` | Retry all failed uploads |
| `cancelAll()` | Cancel all active uploads and remove them |

### Custom Actions

| Method | Returns | Description |
|--------|---------|-------------|
| `addCustomAction(icon: string, text: string)` | `string` | Add a custom action button; returns the action ID |
| `removeCustomAction(actionId: string)` | `void` | Remove a custom action button |
| `clearCustomActions()` | `void` | Remove all custom action buttons |

### Utility

| Method | Description |
|--------|-------------|
| `openFilePicker()` | Programmatically open the file picker dialog |
| `setFileBadge(fileId, badge, position?)` | Add a custom badge overlay to a file's preview |
| `removeFileBadge(fileId)` | Remove a badge from a file |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `files-change` | `{ files, component }` | Files added or removed |
| `upload-progress` | `{ file, progress, component }` | Upload progress update |
| `upload-complete` | `{ file, response, component }` | Upload completed successfully |
| `upload-error` | `{ file, error, component }` | Upload failed |
| `upload-pause` | `{ file, component }` | Upload paused |
| `file-remove` | `{ file, component }` | File removed from gallery |
| `custom-action-click` | `{ actionId, component }` | Custom action button clicked |
| `gallery-error` | `{ message, component }` | Validation or general error |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Outer gallery container |
| `dropzone` | Drag-and-drop upload zone |
| `gallery` | File thumbnails grid/list area |

## Basic Usage

```typescript
import 'snice/components/file-gallery/snice-file-gallery';
```

```html
<snice-file-gallery controller="upload-handler"></snice-file-gallery>
```

```typescript
import { controller, respond, IController } from 'snice';

@controller('upload-handler')
class UploadHandler implements IController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {
    this.element = element;
  }

  async detach() {}

  @respond('file-gallery-upload')
  async handleUpload(request) {
    const { file, fileId, onProgress, signal } = request;

    return {
      success: true,
      fileId,
      url: 'https://example.com/uploaded-file.jpg'
    };
  }
}
```

## Examples

### Image Gallery

```html
<snice-file-gallery accept="image/*"></snice-file-gallery>
```

### Manual Upload Mode

```html
<snice-file-gallery auto-upload="false" controller="upload-handler"></snice-file-gallery>
```

### File Limits

```html
<snice-file-gallery
  max-files="3"
  max-size="2097152"
></snice-file-gallery>
```

### List View

```html
<snice-file-gallery view="list"></snice-file-gallery>
```

### Add Button Mode

```html
<snice-file-gallery
  show-dropzone="false"
  show-add-button="true"
  max-files="6"
></snice-file-gallery>
```

### Custom Action Buttons

```typescript
const cameraIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke-width="2"/>
  <circle cx="12" cy="13" r="4" stroke-width="2"/>
</svg>`;

const cameraActionId = gallery.addCustomAction(cameraIcon, 'Camera');

gallery.addEventListener('custom-action-click', (e) => {
  if (e.detail.actionId === cameraActionId) {
    // Open camera, capture image, etc.
  }
});
```

### Custom Badges

```typescript
const avatarHTML = `<div style="
  width: 40px; height: 40px; border-radius: 50%;
  background: #3b82f6; color: white;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold; border: 2px solid white;
">JD</div>`;

gallery.setFileBadge('file-id-123', avatarHTML, 'top-right');
```

### Tracking Upload Events

```typescript
gallery.addEventListener('files-change', (e) => {
  console.log('Files changed:', e.detail.files);
});

gallery.addEventListener('upload-progress', (e) => {
  console.log(`${e.detail.file.file.name}: ${e.detail.progress}%`);
});

gallery.addEventListener('upload-complete', (e) => {
  console.log('Upload complete:', e.detail.file.file.name);
});

gallery.addEventListener('upload-error', (e) => {
  console.error('Upload failed:', e.detail.error);
});
```

### Upload Handler with XHR Progress

```typescript
import { controller, respond, IController } from 'snice';

@controller('upload-handler')
class UploadHandler implements IController {
  element: HTMLElement | null = null;
  async attach(element: HTMLElement) { this.element = element; }
  async detach() {}

  @respond('file-gallery-upload')
  async handleUpload(request) {
    const { file, fileId, onProgress, signal } = request;

    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(e.loaded / e.total);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve({ success: true, fileId, url: response.url });
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error')));

      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort();
          reject(new Error('Upload cancelled'));
        });
      }

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  }
}
```
