import { type SniceReactComponent } from './wrapper';
import type { SniceFormProps, SniceFormRef } from './types';
/**
 * Props for the FileUpload component
 */
export interface FileUploadProps extends SniceFormProps {
    size?: any;
    variant?: any;
    accept?: any;
    multiple?: any;
    disabled?: any;
    required?: any;
    invalid?: any;
    label?: any;
    helperText?: any;
    errorText?: any;
    maxSize?: any;
    maxFiles?: any;
    name?: any;
    dragDrop?: any;
    showPreview?: any;
    onFileUploadChange?: (event: any) => void;
    onFileUploadError?: (event: any) => void;
}
/**
 * FileUpload - React adapter for snice-file-upload
 *
 * This is an auto-generated React wrapper for the Snice file-upload component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/file-upload/snice-file-upload';
 * import { FileUpload } from 'snice/react';
 *
 * function MyComponent() {
 *   return <FileUpload />;
 * }
 * ```
 */
export declare const FileUpload: SniceReactComponent<FileUploadProps, SniceFormRef>;
//# sourceMappingURL=file-upload.d.ts.map