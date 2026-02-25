[//]: # (AI: For a low-token version of this doc, use docs/ai/components/file-gallery.md instead)

# File Gallery Component

The `<snice-file-gallery>` component provides a file upload gallery with drag-and-drop support, image previews, pausable/resumable uploads, and progress tracking.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Upload Handler](#upload-handler)
- [Features](#features)
- [Examples](#examples)

## Basic Usage

```html
<snice-file-gallery></snice-file-gallery>
```

```typescript
import 'snice/components/file-gallery/snice-file-gallery';
import { respond } from 'snice';

// Create upload handler
class UploadController {
  @respond('file-gallery-upload')
  async handleUpload(request) {
    const { file, fileId, onProgress, signal } = request;

    // Implement your upload logic here
    return {
      success: true,
      fileId,
      url: 'https://example.com/uploaded-file.jpg'
    };
  }
}

const controller = new UploadController();
controller.attach?.(document.body);
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `accept` | `string` | `''` | Allowed file types (same as input accept) |
| `multiple` | `boolean` | `true` | Allow multiple file selection |
| `disabled` | `boolean` | `false` | Whether gallery is disabled |
| `maxSize` | `number` | `-1` | Maximum file size in bytes (-1 = no limit) |
| `maxFiles` | `number` | `-1` | Maximum number of files (-1 = no limit) |
| `view` | `'grid' \| 'list'` | `'grid'` | Display layout mode |
| `showProgress` | `boolean` | `true` | Show upload progress |
| `allowPause` | `boolean` | `true` | Allow pause/resume of uploads |
| `allowDelete` | `boolean` | `true` | Allow file deletion |
| `autoUpload` | `boolean` | `true` | Start upload immediately on file add |
| `showDropzone` | `boolean` | `true` | Show drop zone for drag & drop uploads |
| `showAddButton` | `boolean` | `false` | Show add button tile in gallery |
| `files` | `GalleryFile[]` | `[]` | Current files (read-only) |

## Methods

### Getters

#### `files: GalleryFile[]`
Get all files in the gallery (read-only).

```typescript
const allFiles = gallery.files;
```

#### `customActions: CustomAction[]`
Get all custom action buttons (read-only).

```typescript
const actions = gallery.customActions;
```

#### `getFile(fileId: string): GalleryFile | undefined`
Get a specific file by ID.

```typescript
const file = gallery.getFile('file-id-123');
```

#### `getCustomAction(actionId: string): CustomAction | undefined`
Get a specific custom action by ID.

```typescript
const action = gallery.getCustomAction('action-id-456');
```

#### `isPending(fileId: string): boolean`
Check if a file upload is pending.

```typescript
if (gallery.isPending('file-id-123')) {
  console.log('File is waiting to upload');
}
```

#### `isUploading(fileId: string): boolean`
Check if a file is currently uploading.

#### `isPaused(fileId: string): boolean`
Check if a file upload is paused.

#### `isCompleted(fileId: string): boolean`
Check if a file upload is completed.

#### `hasError(fileId: string): boolean`
Check if a file upload has an error.

#### `canAddFiles(): boolean`
Check if more files can be added (respects maxFiles limit).

```typescript
if (gallery.canAddFiles()) {
  gallery.openFilePicker();
}
```

### File Management

#### `addFiles(files: FileList | File[]): void`
Add files to the gallery.

```typescript
const fileInput = document.querySelector('input[type="file"]');
gallery.addFiles(fileInput.files);
```

#### `addFileWithPreview(file: File, previewDataUrl: string): void`
Add a file with a custom preview (e.g., from camera/canvas).

```typescript
const canvas = document.createElement('canvas');
// ... draw on canvas
canvas.toBlob((blob) => {
  const file = new File([blob], 'photo.png', { type: 'image/png' });
  const preview = canvas.toDataURL('image/png');
  gallery.addFileWithPreview(file, preview);
});
```

#### `removeFile(fileId: string): void`
Remove a file from the gallery.

```typescript
gallery.removeFile('file-id-123');
```

#### `clear(): void`
Remove all files from the gallery.

```typescript
gallery.clear();
```

#### `clearCompleted(): void`
Remove all completed files from the gallery.

```typescript
gallery.clearCompleted();
```

#### `clearErrors(): void`
Remove all files with errors from the gallery.

```typescript
gallery.clearErrors();
```

### Upload Control

#### `pauseUpload(fileId: string): void`
Pause an ongoing upload.

```typescript
gallery.pauseUpload('file-id-123');
```

#### `resumeUpload(fileId: string): Promise<void>`
Resume a paused upload.

```typescript
await gallery.resumeUpload('file-id-123');
```

#### `retryUpload(fileId: string): Promise<void>`
Retry a failed upload.

```typescript
await gallery.retryUpload('file-id-123');
```

#### `cancelUpload(fileId: string): void`
Cancel an upload and remove the file.

```typescript
gallery.cancelUpload('file-id-123');
```

#### `pauseAll(): void`
Pause all currently uploading files.

```typescript
gallery.pauseAll();
```

#### `resumeAll(): void`
Resume all paused uploads.

```typescript
gallery.resumeAll();
```

#### `retryAll(): void`
Retry all failed uploads.

```typescript
gallery.retryAll();
```

#### `cancelAll(): void`
Cancel all active uploads and remove them.

```typescript
gallery.cancelAll();
```

### Custom Actions

#### `addCustomAction(icon: string, text: string): string`
Add a custom action button to the gallery. Returns the action ID.

```typescript
const cameraIcon = '<svg viewBox="0 0 24 24">...</svg>';
const actionId = gallery.addCustomAction(cameraIcon, 'Camera');
```

#### `removeCustomAction(actionId: string): void`
Remove a custom action button.

```typescript
gallery.removeCustomAction(actionId);
```

#### `clearCustomActions(): void`
Remove all custom action buttons.

```typescript
gallery.clearCustomActions();
```

### Utility

#### `openFilePicker(): void`
Programmatically open the file picker dialog.

```typescript
gallery.openFilePicker();
```

#### `setFileBadge(fileId: string, badge: string, position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'): void`
Add a custom badge overlay to a file's preview thumbnail. Supports HTML content for avatars, icons, or custom elements.

```typescript
// Add user avatar badge
const avatarHTML = `<div style="
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
">JD</div>`;

gallery.setFileBadge('file-id-123', avatarHTML, 'top-right');
```

#### `removeFileBadge(fileId: string): void`
Remove a badge from a file.

```typescript
gallery.removeFileBadge('file-id-123');
```

## Events

### `files-change`
Fired when files are added or removed.

**Detail**: `{ files: GalleryFile[] }`

```typescript
gallery.addEventListener('files-change', (e) => {
  console.log('Files:', e.detail.files);
});
```

### `upload-progress`
Fired during upload progress.

**Detail**: `{ file: GalleryFile, progress: number }`

```typescript
gallery.addEventListener('upload-progress', (e) => {
  console.log(`${e.detail.file.file.name}: ${e.detail.progress}%`);
});
```

### `upload-complete`
Fired when an upload completes successfully.

**Detail**: `{ file: GalleryFile, response: UploadResponse, component: SniceFileGalleryElement }`

```typescript
gallery.addEventListener('upload-complete', (e) => {
  console.log('Upload complete:', e.detail.response);
});
```

### `upload-pause`
Fired when an upload is paused.

**Detail**: `{ file: GalleryFile, component: SniceFileGalleryElement }`

```typescript
gallery.addEventListener('upload-pause', (e) => {
  console.log('Upload paused:', e.detail.file.file.name);
});
```

### `file-remove`
Fired when a file is removed from the gallery.

**Detail**: `{ file: GalleryFile, component: SniceFileGalleryElement }`

```typescript
gallery.addEventListener('file-remove', (e) => {
  console.log('File removed:', e.detail.file.file.name);
});
```

### `upload-error`
Fired when an upload fails.

**Detail**: `{ file: GalleryFile, error: string, component: SniceFileGalleryElement }`

```typescript
gallery.addEventListener('upload-error', (e) => {
  console.error('Upload error:', e.detail.error);
});
```

### `custom-action-click`
Fired when a custom action button is clicked.

**Detail**: `{ actionId: string }`

```typescript
gallery.addEventListener('custom-action-click', (e) => {
  console.log('Custom action clicked:', e.detail.actionId);
});
```

### `gallery-error`
Fired when a validation or general error occurs.

**Detail**: `{ message: string }`

```typescript
gallery.addEventListener('gallery-error', (e) => {
  console.error('Error:', e.detail.message);
});
```

## Upload Handler

The file gallery uses the `@request/@respond` pattern for uploads. You must implement an upload handler:

```typescript
import { respond } from 'snice';

class UploadController {
  @respond('file-gallery-upload')
  async handleUpload(request) {
    const { file, fileId, onProgress, signal } = request;

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    // Upload with progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(e.loaded / e.total);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve({
            success: true,
            fileId,
            url: response.url
          });
        } else {
          reject(new Error('Upload failed'));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });

      // Handle cancellation
      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort();
          reject(new Error('Upload cancelled'));
        });
      }

      // Send request
      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  }
}

// Attach controller to document
const controller = new UploadController();
controller.attach?.(document.body);
```

## Features

- **Drag and Drop**: Native drag-and-drop support with visual feedback
- **Image Preview**: Automatic thumbnail generation for image files
- **Pausable Uploads**: Pause and resume uploads using AbortController
- **Progress Tracking**: Real-time upload progress for each file
- **File Management**: Add, remove, pause, resume, and retry uploads
- **View Modes**: Toggle between grid and list layouts
- **Validation**: File size and type validation with error messaging
- **Auto Upload**: Optional automatic upload on file add
- **Accessibility**: Full keyboard support and ARIA attributes

## Examples

### Basic Gallery

```html
<snice-file-gallery></snice-file-gallery>
```

### Image Gallery

```html
<snice-file-gallery accept="image/*"></snice-file-gallery>
```

### Manual Upload Mode

```html
<snice-file-gallery id="manual-gallery" auto-upload="false"></snice-file-gallery>

<script>
const gallery = document.getElementById('manual-gallery');

// Upload files manually
async function uploadAll() {
  const files = gallery.files;
  for (const file of files) {
    if (file.uploadStatus === 'pending') {
      await gallery.resumeUpload(file.id);
    }
  }
}
</script>
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

### Custom File Types

```html
<snice-file-gallery
  accept=".pdf,.doc,.docx,.txt"
  allow-pause="false"
></snice-file-gallery>
```

### Add Button Mode

```html
<!-- Hide drop zone and show plus tile in gallery instead -->
<snice-file-gallery
  show-dropzone="false"
  show-add-button="true"
  max-files="6"
></snice-file-gallery>
```

### Tracking Upload Events

```html
<snice-file-gallery id="gallery"></snice-file-gallery>

<script>
const gallery = document.getElementById('gallery');

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
</script>
```

### Programmatic File Management

```html
<snice-file-gallery id="gallery"></snice-file-gallery>
<button onclick="pauseAll()">Pause All</button>
<button onclick="resumeAll()">Resume All</button>
<button onclick="retryAll()">Retry All</button>
<button onclick="clearCompleted()">Clear Completed</button>
<button onclick="clearAll()">Clear All</button>

<script>
const gallery = document.getElementById('gallery');

function pauseAll() {
  gallery.pauseAll();
}

function resumeAll() {
  gallery.resumeAll();
}

function retryAll() {
  gallery.retryAll();
}

function clearCompleted() {
  gallery.clearCompleted();
}

function clearAll() {
  if (confirm('Clear all files?')) {
    gallery.clear();
  }
}
</script>
```

### Custom Badges for Collaboration

Use badges to show user avatars on files in collaborative scenarios:

```html
<snice-file-gallery id="collab-gallery" show-dropzone="false" show-add-button="true"></snice-file-gallery>

<script>
const gallery = document.getElementById('collab-gallery');

// Simulate collaborative file uploads with user badges
const users = [
  { name: 'John Doe', initials: 'JD', color: '#3b82f6', position: 'top-right' },
  { name: 'Jane Smith', initials: 'JS', color: '#ef4444', position: 'top-left' },
  { name: 'Bob Wilson', initials: 'BW', color: '#10b981', position: 'bottom-right' },
];

gallery.addEventListener('files-change', (e) => {
  const newFiles = e.detail.files.filter(f => !f.badge);

  newFiles.forEach((file, index) => {
    const user = users[index % users.length];

    const avatarHTML = `<div style="
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: ${user.color};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    ">${user.initials}</div>`;

    gallery.setFileBadge(file.id, avatarHTML, user.position);
  });
});
</script>
```

### Custom Action Buttons

```html
<snice-file-gallery id="gallery" show-dropzone="false" show-add-button="true"></snice-file-gallery>

<script>
const gallery = document.getElementById('gallery');

// Add camera action
const cameraIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke-width="2"/>
  <circle cx="12" cy="13" r="4" stroke-width="2"/>
</svg>`;

const cameraActionId = gallery.addCustomAction(cameraIcon, 'Camera');

// Handle camera action
gallery.addEventListener('custom-action-click', (e) => {
  if (e.detail.actionId === cameraActionId) {
    // Open camera interface
    openCamera().then((imageBlob) => {
      const file = new File([imageBlob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const preview = URL.createObjectURL(imageBlob);
      gallery.addFileWithPreview(file, preview);
    });
  }
});
</script>
```

### Advanced Upload Handler with Retry

```typescript
import { respond } from 'snice';

class UploadController {
  @respond('file-gallery-upload')
  async handleUpload(request) {
    const { file, fileId, onProgress, signal } = request;

    const uploadToServer = async (retries = 3) => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          signal,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
        }

        const data = await response.json();
        return {
          success: true,
          fileId,
          url: data.url
        };
      } catch (error) {
        if (retries > 0 && error.name !== 'AbortError') {
          console.log(`Retrying upload (${retries} attempts left)...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return uploadToServer(retries - 1);
        }
        throw error;
      }
    };

    return uploadToServer();
  }
}

const controller = new UploadController();
controller.attach?.(document.body);
```
