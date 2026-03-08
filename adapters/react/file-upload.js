import { createReactAdapter } from './wrapper';
/**
 * FileUpload - React adapter for snice-file-upload
 *
 * This is an auto-generated React wrapper for the Snice file-upload component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/file-upload';
 * import { FileUpload } from 'snice/react';
 *
 * function MyComponent() {
 *   return <FileUpload />;
 * }
 * ```
 */
export const FileUpload = createReactAdapter({
    tagName: 'snice-file-upload',
    properties: ["size", "variant", "accept", "multiple", "disabled", "required", "invalid", "label", "helperText", "errorText", "maxSize", "maxFiles", "name", "dragDrop", "showPreview"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=file-upload.js.map