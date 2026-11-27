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

Content type:

```typescript
type FileGalleryContent = string | UnsafeHTML;
```

Strings are escaped text. Rich badge/SVG composition requires the explicit `unsafeHTML()` wrapper and must contain only static or application-sanitized markup. Never wrap filenames, MIME values, upload errors, server responses, or other untrusted data.

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
- `addCustomAction(icon: FileGalleryContent, text: string): string`
- `removeCustomAction(actionId)` / `clearCustomActions()`

Utility:
- `openFilePicker()`
- `setFileBadge(fileId, badge: FileGalleryContent, position?)` / `removeFileBadge(fileId)`

Safe/trusted composition:

```typescript
import { unsafeHTML } from 'snice';

gallery.setFileBadge(fileId, 'New');
gallery.addCustomAction('📷', 'Camera');

gallery.setFileBadge(fileId, unsafeHTML(trustedBadgeMarkup));
gallery.addCustomAction(unsafeHTML(trustedSvgMarkup), 'Camera');
```

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
- `input` - Hidden native file input
- `dropzone` - Drag-and-drop upload zone
- `dropzone-content` - Content wrapper inside the dropzone
- `dropzone-icon` - Upload icon in the dropzone
- `dropzone-text` - Text block in the dropzone
- `dropzone-primary` - Primary dropzone line ("Click to upload")
- `dropzone-secondary` - Secondary dropzone line ("or drag and drop")
- `dropzone-hint` - Accepted-types / max-size hint line
- `header` - Gallery header bar
- `title` - File count title in the header
- `actions` - Header action button group
- `button` - Any button in the gallery
- `action-button` - A header action button
- `view-button` - The grid/list toggle `action-button`
- `clear-button` - The clear-all `action-button`
- `gallery` - File thumbnails grid/list area
- `item` - A gallery tile (file, add button or custom action)
- `item-preview` - Preview area of a tile
- `image` - Image preview element
- `placeholder` - Placeholder shown when there is no image preview
- `icon` - An SVG icon
- `badge` - Badge overlay on a file tile
- `badge-text` - Text inside a string badge
- `progress` - Upload progress track
- `progress-bar` - Upload progress fill
- `status` - Upload status overlay
- `item-info` - Info area of a tile
- `item-name` - File name (or tile label)
- `item-meta` - Meta row under the file name
- `item-size` - Formatted file size
- `progress-text` - Upload percentage text
- `error-text` - Upload error text
- `item-actions` - Per-file action button group
- `item-action` - A per-file action button
- `item-action-pause` - The pause `item-action`
- `item-action-resume` - The resume `item-action`
- `item-action-retry` - The retry `item-action`
- `item-action-delete` - The delete `item-action`
- `add-button` - The add-files tile
- `add-icon` - Placeholder icon wrapper of the add/custom-action tile
- `custom-action` - A custom-action tile
- `action-icon` - Text icon of a custom-action tile

State tokens:

- `dropzone-disabled` - Added to `dropzone` while `disabled` is set
- `dropzone-drag-over` - Added to `dropzone` while a drag is over it
- `dropzone-has-files` - Added to `dropzone` once files are present
- `item-pending` - Added to `item` while the file is pending
- `item-uploading` - Added to `item` while the file is uploading
- `item-paused` - Added to `item` while the upload is paused
- `item-completed` - Added to `item` once the upload completed
- `item-error` - Added to `item` when the upload failed
- `status-success` - Added to `status` for a completed upload
- `status-error` - Added to `status` for a failed upload
- `add-button-disabled` - Added to `add-button` when the file limit is reached
- `badge-top-left` - Added to `badge` when the badge sits top-left
- `badge-top-right` - Added to `badge` when the badge sits top-right
- `badge-bottom-left` - Added to `badge` when the badge sits bottom-left
- `badge-bottom-right` - Added to `badge` when the badge sits bottom-right

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
