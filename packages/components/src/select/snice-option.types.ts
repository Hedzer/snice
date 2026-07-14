export interface SniceOptionElement extends HTMLElement {
  value: string;
  label: string;
  disabled: boolean;
  selected: boolean;
  icon: string;
  readonly optionData: {
    value: string;
    label: string;
    disabled: boolean;
    selected: boolean;
    icon: string;
  };
}