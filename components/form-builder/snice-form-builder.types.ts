export type FormFieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'phone'
  | 'select'
  | 'date'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'signature'
  | 'section'
  | 'paragraph';

export type FormBuilderMode = 'edit' | 'preview';

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: FormFieldOption[];
  defaultValue?: string;
  helpText?: string;
  min?: number;
  max?: number;
  pattern?: string;
  accept?: string;
  content?: string;
  width?: 'full' | 'half';
}

export interface FormSchema {
  title?: string;
  description?: string;
  fields: FormField[];
}

export interface SniceFormBuilderElement extends HTMLElement {
  schema: FormSchema;
  mode: FormBuilderMode;
  fieldTypes: FormFieldType[];

  getSchema(): FormSchema;
  setSchema(schema: FormSchema): void;
  addField(type: FormFieldType): void;
  removeField(id: string): void;
  preview(): void;
}

export interface SniceFormBuilderEventMap {
  'schema-change': CustomEvent<{ schema: FormSchema }>;
  'field-add': CustomEvent<{ field: FormField }>;
  'field-remove': CustomEvent<{ field: FormField }>;
  'field-reorder': CustomEvent<{ oldIndex: number; newIndex: number; field: FormField }>;
}
