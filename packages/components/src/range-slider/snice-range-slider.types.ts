export type RangeSliderOrientation = 'horizontal' | 'vertical';

export interface SniceRangeSliderElement extends HTMLElement {
  min: number;
  max: number;
  step: number;
  valueLow: number;
  valueHigh: number;
  defaultValueLow: number;
  defaultValueHigh: number;
  disabled: boolean;
  showTooltip: boolean;
  showLabels: boolean;
  orientation: RangeSliderOrientation;
  name: string;
  readonly type: 'range';
  readonly form: HTMLFormElement | null;
  readonly validity: ValidityState;
  readonly validationMessage: string;
  readonly willValidate: boolean;
  readonly labels: NodeList | null;
  focus(): void;
  blur(): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setCustomValidity(message: string): void;
}

export interface RangeChangeDetail {
  valueLow: number;
  valueHigh: number;
  component: SniceRangeSliderElement;
}
