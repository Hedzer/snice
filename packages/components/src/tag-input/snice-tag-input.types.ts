export interface SniceTagInputElement extends HTMLElement {
  value: string[];
  suggestions: string[];
  maxTags: number;
  allowDuplicates: boolean;
  placeholder: string;
  disabled: boolean;
  readonly: boolean;
  label: string;
  name: string;

  addTag(tag: string): void;
  removeTag(index: number): void;
  clear(): void;
  focus(): void;
}

export interface SniceTagInputEventMap {
  'tag-add': CustomEvent<{ tag: string; value: string[] }>;
  'tag-remove': CustomEvent<{ tag: string; index: number; value: string[] }>;
  'tag-change': CustomEvent<{ value: string[] }>;
}
