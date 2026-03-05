export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';
export type DrawerSize = 'small' | 'medium' | 'large' | 'xl' | 'xxl' | 'xxxl' | 'full';

export interface SniceDrawerElement extends HTMLElement {
  open: boolean;
  position: DrawerPosition;
  size: DrawerSize;
  contained: boolean;
  inline: boolean;
  breakpoint: number;
  noHeader: boolean;
  noFooter: boolean;
  noBackdrop: boolean;
  noBackdropDismiss: boolean;
  noEscapeDismiss: boolean;
  noFocusTrap: boolean;
  persistent: boolean;
  pushContent: boolean;
  show(): void;
  hide(): void;
  toggle(): void;
}