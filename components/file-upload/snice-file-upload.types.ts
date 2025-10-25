export type FileUploadSize = 'small' | 'medium' | 'large';
export type FileUploadVariant = 'outlined' | 'filled';

export interface SniceFileUploadElement extends HTMLElement {
  size: FileUploadSize;
  variant: FileUploadVariant;
  accept: string;
  multiple: boolean;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
  label: string;
  helperText: string;
  errorText: string;
  maxSize: number;
  maxFiles: number;
  name: string;
  dragDrop: boolean;
  showPreview: boolean;

  files: FileList | null;
  clear(): void;
  removeFile(index: number): void;
}
