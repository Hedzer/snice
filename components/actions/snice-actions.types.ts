export type ActionButtonSize = 'small' | 'medium' | 'large';
export type ActionButtonVariant = 'text' | 'outlined' | 'filled';

export interface ActionButton {
  id: string;
  label?: string;
  icon?: string;
  iconImage?: string;
  variant?: ActionButtonVariant;
  disabled?: boolean;
  danger?: boolean;
  tooltip?: string;
  action?: () => void | Promise<void>;
  href?: string;
  target?: string;
  data?: any;
}

export interface SniceActionsElement extends HTMLElement {
  actions: ActionButton[];
  size: ActionButtonSize;
  variant: ActionButtonVariant;
  showLabels: boolean;
  maxVisible: number;
  moreLabel: string;
  moreIcon: string;

  triggerAction(id: string): void;
  getAction(id: string): ActionButton | undefined;
}
