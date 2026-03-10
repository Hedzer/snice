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
showHeader: boolean = true;     // attribute: show-header
files: GalleryFile[];           // read-only getter
```

## Methods

Getters:
- `files: GalleryFile[]` - Get all files
- `customActions: CustomAction[]` - Get all custom actions
- `getFile(fileId): GalleryFile | undefined`
- `getCustomAction(actionId): CustomAction | undefined`
- `isPending(fileId): boolean`
- `isUploading(fileId): boolean`
- `isPaused(fileId): boolean`
- `isCompleted(fileId): boolean`
- `hasError(fileId): boolean`
- `canAddFiles(): boolean`

File management:
- `addFiles(files: FileList | File[])`
- `addFileWithPreview(file: File, previewDataUrl: string)`
- `removeFile(fileId: string)`
- `clear()` / `clearCompleted()` / `clearErrors()`

Upload control:
- `pauseUpload(fileId)` / `resumeUpload(fileId)` / `retryUpload(fileId)` / `cancelUpload(fileId)`
- `pauseAll()` / `resumeAll()` / `retryAll()` / `cancelAll()`

Custom actions:
- `addCustomAction(icon: string, text: string): string`
- `removeCustomAction(actionId)` / `clearCustomActions()`

Utility:
- `openFilePicker()`
- `setFileBadge(fileId, badge, position?)` / `removeFileBadge(fileId)`

## Events

- `files-change` → `{ files, component }`
- `upload-progress` → `{ file, progress, component }`
- `upload-complete` → `{ file, response: UploadResponse, component }`
- `upload-error` → `{ file, error, component }`
- `upload-pause` → `{ file, component }`
- `file-remove` → `{ file, component }`
- `custom-action-click` → `{ actionId, component }`
- `gallery-error` → `{ message, component }`

## CSS Parts

- `base` - Outer gallery container
- `dropzone` - Drag-and-drop upload zone
- `gallery` - File thumbnails grid/list area

## Basic Usage

```typescript
import 'snice/components/file-gallery/snice-file-gallery';
```

```html
<snice-file-gallery></snice-file-gallery>
<snice-file-gallery accept="image/*"></snice-file-gallery>
<snice-file-gallery auto-upload="false"></snice-file-gallery>
<snice-file-gallery max-files="3" max-size="2097152"></snice-file-gallery>
<snice-file-gallery view="list"></snice-file-gallery>
<snice-file-gallery show-dropzone="false" show-add-button="true"></snice-file-gallery>
```

```typescript
gallery.addEventListener('files-change', e => console.log(e.detail.files));
gallery.addEventListener('upload-complete', e => console.log(e.detail.response));
```

Uses `@request/@respond` pattern (`file-gallery-upload`). Handler receives `UploadRequest { file, fileId, onProgress?, signal? }`, returns `UploadResponse { success, fileId, url?, error? }`.
