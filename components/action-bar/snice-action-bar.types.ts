export type ActionBarPosition = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type ActionBarSize = 'small' | 'medium';
export type ActionBarVariant = 'default' | 'pill';

export interface SniceActionBarElement extends HTMLElement {
  open: boolean;
  position: ActionBarPosition;
  size: ActionBarSize;
  variant: ActionBarVariant;
  noAnimation: boolean;
  noEscapeDismiss: boolean;

  show(): void;
  hide(): void;
  toggle(): void;
}

export interface ActionBarEventDetail {
  actionBar: SniceActionBarElement;
}
