import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the FileUpload component
 */
export interface FileUploadProps extends SniceBaseProps {
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

}

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
export const FileUpload = createReactAdapter<FileUploadProps>({
  tagName: 'snice-file-upload',
  properties: ["size","variant","accept","multiple","disabled","required","invalid","label","helperText","errorText","maxSize","maxFiles","name","dragDrop","showPreview"],
  events: {},
  formAssociated: false
});
