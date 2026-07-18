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
  readonly type: 'file';
  readonly form: HTMLFormElement | null;
  readonly validity: ValidityState;
  readonly validationMessage: string;
  readonly willValidate: boolean;
  readonly labels: NodeList | null;

  files: FileList | null;
  focus(): void;
  blur(): void;
  clear(): void;
  removeFile(index: number): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setCustomValidity(message: string): void;
}
