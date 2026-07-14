export type PopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

export interface SnicePopoverElement extends HTMLElement {
  open: boolean;
  placement: PopoverPlacement;
  distance: number;
  noOutsideDismiss: boolean;
  noEscapeDismiss: boolean;
  show(): void;
  hide(): void;
  toggle(): void;
}

export interface PopoverOpenDetail {
  popover: SnicePopoverElement;
}

export interface PopoverCloseDetail {
  popover: SnicePopoverElement;
}
