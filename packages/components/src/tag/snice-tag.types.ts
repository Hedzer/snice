export type TagVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type TagSize = 'small' | 'medium' | 'large';

export interface SniceTagElement extends HTMLElement {
  variant: TagVariant;
  size: TagSize;
  removable: boolean;
  outline: boolean;
  pill: boolean;
}

export interface SniceTagEventMap {
  'tag-remove': CustomEvent<{ tag: SniceTagElement }>;
}
