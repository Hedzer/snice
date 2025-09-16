export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type BadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
export type BadgeSize = 'small' | 'medium' | 'large';

export interface SniceBadgeElement extends HTMLElement {
  content: string;
  count: number;
  max: number;
  dot: boolean;
  variant: BadgeVariant;
  position: BadgePosition;
  inline: boolean;
  size: BadgeSize;
  pulse: boolean;
  offset: number;
}