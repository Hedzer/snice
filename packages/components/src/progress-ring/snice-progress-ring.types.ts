export type ProgressRingSize = 'small' | 'medium' | 'large';

export interface SniceProgressRingElement extends HTMLElement {
  value: number;
  max: number;
  size: ProgressRingSize;
  thickness: number;
  color: string;
  showValue: boolean;
  label: string;
}

export interface ProgressCompleteDetail {
  value: number;
  max: number;
  component: SniceProgressRingElement;
}
