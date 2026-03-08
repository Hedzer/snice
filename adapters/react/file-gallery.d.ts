import type { SniceBaseProps } from './types';
/**
 * Props for the FileGallery component
 */
export interface FileGalleryProps extends SniceBaseProps {
    accept?: any;
    multiple?: any;
    disabled?: any;
    maxSize?: any;
    maxFiles?: any;
    view?: any;
    showProgress?: any;
    allowPause?: any;
    allowDelete?: any;
    autoUpload?: any;
    showDropzone?: any;
    showAddButton?: any;
    showHeader?: any;
    onFilesChange?: (event: any) => void;
    onFileRemove?: (event: any) => void;
    onUploadProgress?: (event: any) => void;
    onUploadComplete?: (event: any) => void;
    onUploadError?: (event: any) => void;
    onUploadPause?: (event: any) => void;
    onGalleryError?: (event: any) => void;
}
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
export declare const FileGallery: import("react").ForwardRefExoticComponent<Omit<FileGalleryProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=file-gallery.d.ts.map