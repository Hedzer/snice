export type ComboboxSize = 'small' | 'medium' | 'large';
export type ComboboxVariant = 'default' | 'outlined';

export interface ComboboxOption {
  value: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

export interface SniceComboboxElement extends HTMLElement {
  value: string;
  options: ComboboxOption[];
  placeholder: string;
  allowCustom: boolean;
  filterable: boolean;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  variant: ComboboxVariant;
  size: ComboboxSize;
  name: string;
  label: string;
  open(): void;
  close(): void;
  focus(): void;
  blur(): void;
}

export interface ComboboxValueChangeDetail {
  value: string;
  option?: ComboboxOption;
  combobox: SniceComboboxElement;
}

export interface ComboboxInputChangeDetail {
  inputValue: string;
  combobox: SniceComboboxElement;
}

export interface ComboboxOptionSelectDetail {
  value: string;
  option: ComboboxOption;
  combobox: SniceComboboxElement;
}
