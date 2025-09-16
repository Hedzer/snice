export type AlertVariant = 'info' | 'success' | 'warning' | 'error';
export type AlertSize = 'small' | 'medium' | 'large';

export interface SniceAlertElement extends HTMLElement {
  variant: AlertVariant;
  size: AlertSize;
  title: string;
  dismissible: boolean;
  icon: string;
  show(): void;
  hide(): void;
}