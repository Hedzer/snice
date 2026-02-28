export type IconSize = 'small' | 'medium' | 'large';

export interface SniceIconElement extends HTMLElement {
  name: string;
  src: string;
  size: IconSize | number;
  color: string;
  label: string;
}

export interface IconRegistry {
  [name: string]: string;
}
