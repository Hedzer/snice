export type SelectSize = 'small' | 'medium' | 'large';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  selected?: boolean;
  icon?: string;
}

export interface SniceOptionElement extends HTMLElement {
  value: string;
  label: string;
  disabled: boolean;
  selected: boolean;
  optionData: SelectOption;
}

export interface SniceSelectElement extends HTMLElement {
  value: string;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
  readonly: boolean;
  loading: boolean;
  multiple: boolean;
  searchable: boolean;
  clearable: boolean;
  allowFreeText: boolean;
  editable: boolean;
  remote: boolean;
  searchDebounce: number;
  open: boolean;
  size: SelectSize;
  name: string;
  label: string;
  placeholder: string;
  maxHeight: string;
  options: SelectOption[];
  focus(): void;
  blur(): void;
  clear(): void;
  openDropdown(): void;
  closeDropdown(): void;
  toggleDropdown(): void;
  selectOption(value: string): void;
}

export interface SelectChangeDetail {
  value: string | string[];
  option?: SelectOption;
  select: SniceSelectElement;
}

export interface SelectOpenDetail {
  select: SniceSelectElement;
}

export interface SelectCloseDetail {
  select: SniceSelectElement;
}