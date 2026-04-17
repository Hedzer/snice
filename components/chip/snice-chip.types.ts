export type ChipVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type ChipSize = 'small' | 'medium' | 'large';
export type ChipShape = 'pill' | 'rounded' | 'square';

export interface SniceChipElement extends HTMLElement {
  label: string;
  variant: ChipVariant;
  size: ChipSize;
  shape: ChipShape;
  removable: boolean;
  selected: boolean;
  disabled: boolean;
  icon: string;
  avatar: string;
  onClick?: () => void;
  onRemove?: () => void;
}