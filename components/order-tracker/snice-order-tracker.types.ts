export type OrderStepStatus = 'pending' | 'active' | 'completed';
export type OrderTrackerVariant = 'horizontal' | 'vertical';

export interface OrderStep {
  label: string;
  status: OrderStepStatus;
  timestamp?: string;
  description?: string;
  icon?: string;
}

export interface SniceOrderTrackerElement extends HTMLElement {
  steps: OrderStep[];
  trackingNumber: string;
  carrier: string;
  variant: OrderTrackerVariant;
}

export interface StepClickDetail {
  step: OrderStep;
  index: number;
}

export interface SniceOrderTrackerEventMap {
  'step-click': CustomEvent<StepClickDetail>;
}
