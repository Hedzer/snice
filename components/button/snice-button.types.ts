export type ButtonVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'text';
export type ButtonSize = 'small' | 'medium' | 'large';
export type IconPlacement = 'start' | 'end';

export interface SniceButtonElement extends HTMLElement {
  variant: ButtonVariant;
  size: ButtonSize;
  disabled: boolean;
  loading: boolean;
  outline: boolean;
  pill: boolean;
  circle: boolean;
  href: string;
  target: string;
  download: string;
  icon: string;
  iconPlacement: IconPlacement;
  focus(options?: FocusOptions): void;
  blur(): void;
  click(): void;
}

export interface ButtonClickDetail {
  button: SniceButtonElement;
}