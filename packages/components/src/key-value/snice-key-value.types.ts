export interface KeyValueItem {
  key: string;
  value: string;
  description?: string;
}

export type KeyValueVariant = 'default' | 'compact';
export type KeyValueMode = 'edit' | 'view';

export interface SniceKeyValueElement extends HTMLElement {
  label: string;
  autoExpand: boolean;
  rows: number;
  showDescription: boolean;
  keyPlaceholder: string;
  valuePlaceholder: string;
  placeholders: Array<{ key: string; value: string }>;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  name: string;
  variant: KeyValueVariant;
  mode: KeyValueMode;
  showCopy: boolean;
  value: string;
  defaultValue: string;
  readonly type: 'key-value';
  readonly form: HTMLFormElement | null;
  readonly validity: ValidityState;
  readonly validationMessage: string;
  readonly willValidate: boolean;
  readonly labels: NodeList | null;
  setItems(items: KeyValueItem[]): void;
  addItem(key?: string, value?: string, description?: string): void;
  removeItem(index: number): void;
  clear(): void;
  getItems(): KeyValueItem[];
  focus(): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setCustomValidity(message: string): void;
}

export interface SniceKvPairElement extends HTMLElement {
  key: string;
  value: string;
  description: string;
}

export interface SniceKeyValueEventMap {
  'kv-add': CustomEvent<{ item: KeyValueItem; index: number }>;
  'kv-remove': CustomEvent<{ item: KeyValueItem; index: number }>;
  'kv-change': CustomEvent<{ items: KeyValueItem[] }>;
  'kv-copy': CustomEvent<{ items: KeyValueItem[] }>;
}
