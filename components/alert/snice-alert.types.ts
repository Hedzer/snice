export type AlertVariant = 'info' | 'success' | 'warning' | 'error';
export type AlertSize = 'small' | 'medium' | 'large';
export type AlertAppearance = 'filled' | 'accent';

export interface SniceAlertElement extends HTMLElement {
  variant: AlertVariant;
  size: AlertSize;
  appearance: AlertAppearance;
  title: string;
  dismissible: boolean;
  icon: string;
  show(): void;
  hide(): void;
}