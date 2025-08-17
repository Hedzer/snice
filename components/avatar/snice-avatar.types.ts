export type AvatarSize = 'xs' | 'small' | 'medium' | 'large' | 'xl' | 'xxl';
export type AvatarShape = 'circle' | 'square' | 'rounded';

export interface SniceAvatarElement extends HTMLElement {
  src: string;
  alt: string;
  name: string;
  size: AvatarSize;
  shape: AvatarShape;
  fallbackColor: string;
  fallbackBackground: string;
  getInitials(name: string): string;
}