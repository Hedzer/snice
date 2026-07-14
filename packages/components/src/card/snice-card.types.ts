export type CardVariant = 'elevated' | 'bordered' | 'flat';
export type CardSize = 'small' | 'medium' | 'large';

export interface SniceCardElement extends HTMLElement {
  variant: CardVariant;
  size: CardSize;
  clickable: boolean;
  selected: boolean;
  disabled: boolean;
}