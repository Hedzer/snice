export type StepStatus = 'pending' | 'active' | 'completed' | 'error';
export type StepperOrientation = 'horizontal' | 'vertical';

export interface Step {
  label: string;
  description?: string;
  status?: StepStatus;
}

export interface SniceStepperElement extends HTMLElement {
  steps: Step[];
  currentStep: number;
  orientation: StepperOrientation;
  clickable: boolean;
}
