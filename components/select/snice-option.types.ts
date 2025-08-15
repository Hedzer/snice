export interface SniceOptionElement extends HTMLElement {
  value: string;
  label: string;
  disabled: boolean;
  selected: boolean;
  readonly optionData: {
    value: string;
    label: string;
    disabled: boolean;
    selected: boolean;
  };
}