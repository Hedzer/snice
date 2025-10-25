export type EmptyStateSize = 'small' | 'medium' | 'large';

export interface SniceEmptyStateElement extends HTMLElement {
  size: EmptyStateSize;
  icon: string;
  title: string;
  description: string;
  actionText: string;
  actionHref: string;
}
