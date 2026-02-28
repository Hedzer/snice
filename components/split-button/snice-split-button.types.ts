export type SplitButtonVariant = 'default' | 'primary' | 'success' | 'danger';
export type SplitButtonSize = 'small' | 'medium' | 'large';

export interface SplitButtonAction {
  label: string;
  value: string;
  icon?: string;
  disabled?: boolean;
}

export interface SniceSplitButtonElement extends HTMLElement {
  label: string;
  actions: SplitButtonAction[];
  variant: SplitButtonVariant;
  size: SplitButtonSize;
  disabled: boolean;
}

export interface SplitButtonPrimaryClickDetail {
  button: SniceSplitButtonElement;
}

export interface SplitButtonActionClickDetail {
  value: string;
  action: SplitButtonAction;
  button: SniceSplitButtonElement;
}
