export type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen';

export interface SniceModalElement extends HTMLElement {
  open: boolean;
  size: ModalSize;
  noBackdropDismiss: boolean;
  noEscapeDismiss: boolean;
  noFocusTrap: boolean;
  noCloseButton: boolean;
  label: string;
  show(): void;
  close(): void;
}

export interface ModalOpenDetail {
  modal: SniceModalElement;
}

export interface ModalCloseDetail {
  modal: SniceModalElement;
}