export type ChipVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type ChipSize = 'small' | 'medium' | 'large';

export interface SniceChipElement extends HTMLElement {
  label: string;
  variant: ChipVariant;
  size: ChipSize;
  removable: boolean;
  selected: boolean;
  disabled: boolean;
  icon: string;
  avatar: string;
  onClick?: () => void;
  onRemove?: () => void;
}