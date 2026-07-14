export type SegmentedControlSize = 'small' | 'medium' | 'large';

export interface SegmentedControlOption {
  value: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

export interface SniceSegmentedControlElement extends HTMLElement {
  value: string;
  options: SegmentedControlOption[];
  size: SegmentedControlSize;
  disabled: boolean;
}

export interface SegmentedControlValueChangeDetail {
  value: string;
  previousValue: string;
  option: SegmentedControlOption;
  control: SniceSegmentedControlElement;
}
