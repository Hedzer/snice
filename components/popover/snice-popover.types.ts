export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end';
export type PopoverTrigger = 'click' | 'hover' | 'focus' | 'manual';

export interface SnicePopoverElement extends HTMLElement {
  open: boolean;
  placement: PopoverPlacement;
  trigger: PopoverTrigger;
  distance: number;
  showArrow: boolean;
  closeOnClickOutside: boolean;
  closeOnEscape: boolean;
  hoverDelay: number;
  targetSelector: string;

  show(): void;
  hide(): void;
  toggle(): void;
  updatePosition(): void;
}
