export type StepInputSize = 'small' | 'medium' | 'large';

export interface SniceStepInputElement extends HTMLElement {
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  readonly: boolean;
  size: StepInputSize;
  wrap: boolean;
  name: string;
  readonly type: 'number';
  readonly form: HTMLFormElement | null;
  readonly validity: ValidityState;
  readonly validationMessage: string;
  readonly willValidate: boolean;
  readonly labels: NodeList | null;
  increment(): void;
  decrement(): void;
  focus(): void;
  blur(): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setCustomValidity(message: string): void;
}

export interface StepInputValueChangeDetail {
  value: number;
  oldValue: number;
  component: SniceStepInputElement;
}
