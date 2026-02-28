export type StepInputSize = 'small' | 'medium' | 'large';

export interface SniceStepInputElement extends HTMLElement {
  value: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  readonly: boolean;
  size: StepInputSize;
  wrap: boolean;
  increment(): void;
  decrement(): void;
  focus(): void;
  blur(): void;
}

export interface StepInputValueChangeDetail {
  value: number;
  oldValue: number;
  component: SniceStepInputElement;
}
