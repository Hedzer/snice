export type SpinnerSize = 'small' | 'medium' | 'large' | 'xl';
export type SpinnerColor = 'primary' | 'success' | 'warning' | 'error' | 'info';

export interface SniceSpinnerElement extends HTMLElement {
  size: SpinnerSize;
  color: SpinnerColor;
  label: string;
  thickness: number;
}
