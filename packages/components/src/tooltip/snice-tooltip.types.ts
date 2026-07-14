export type TooltipPosition = 
  | 'top' 
  | 'bottom' 
  | 'left' 
  | 'right'
  | 'top-start'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-end'
  | 'left-start'
  | 'left-end'
  | 'right-start'
  | 'right-end';

export type TooltipTrigger = 'hover' | 'click' | 'focus' | 'manual';

export interface SniceTooltipElement extends HTMLElement {
  content: string;
  position: TooltipPosition;
  trigger: TooltipTrigger;
  delay: number;
  hideDelay: number;
  offset: number;
  arrow: boolean;
  open: boolean;
  maxWidth: number;
  zIndex: number;
  show(): void;
  hide(): void;
  toggle(): void;
  updatePosition(): void;
}