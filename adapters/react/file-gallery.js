import { createReactAdapter } from './wrapper';
/**
 * FileGallery - React adapter for snice-file-gallery
 *
 * This is an auto-generated React wrapper for the Snice file-gallery component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/file-gallery';
 * import { FileGallery } from 'snice/react';
 *
 * function MyComponent() {
 *   return <FileGallery />;
 * }
 * ```
 */
export const FileGallery = createReactAdapter({
    tagName: 'snice-file-gallery',
    properties: ["accept", "multiple", "disabled", "maxSize", "maxFiles", "view", "showProgress", "allowPause", "allowDelete", "autoUpload", "showDropzone", "showAddButton", "showHeader"],
    events: { "files-change": "onFilesChange", "file-remove": "onFileRemove", "upload-progress": "onUploadProgress", "upload-complete": "onUploadComplete", "upload-error": "onUploadError", "upload-pause": "onUploadPause", "gallery-error": "onGalleryError" },
    formAssociated: false
});
//# sourceMappingURL=file-gallery.js.map