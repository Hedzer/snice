export interface SniceTagInputElement extends HTMLElement {
  value: string[];
  defaultValue: string[];
  suggestions: string[];
  maxTags: number;
  allowDuplicates: boolean;
  placeholder: string;
  disabled: boolean;
  readonly: boolean;
  label: string;
  name: string;
  readonly type: 'text';
  readonly form: HTMLFormElement | null;
  readonly validity: ValidityState;
  readonly validationMessage: string;
  readonly willValidate: boolean;
  readonly labels: NodeList | null;

  addTag(tag: string): void;
  removeTag(index: number): void;
  clear(): void;
  focus(): void;
  blur(): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setCustomValidity(message: string): void;
}

export interface SniceTagInputEventMap {
  'tag-add': CustomEvent<{ tag: string; value: string[] }>;
  'tag-remove': CustomEvent<{ tag: string; index: number; value: string[] }>;
  'tag-change': CustomEvent<{ value: string[] }>;
}
