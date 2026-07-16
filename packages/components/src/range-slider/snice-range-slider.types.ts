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
}

export interface RangeChangeDetail {
  valueLow: number;
  valueHigh: number;
  component: SniceRangeSliderElement;
}
