export type AvatarGroupSize = 'small' | 'medium' | 'large';

export interface AvatarGroupItem {
  src?: string;
  initials?: string;
  name?: string;
  color?: string;
}

export interface SniceAvatarGroupElement extends HTMLElement {
  avatars: AvatarGroupItem[];
  max: number;
  size: AvatarGroupSize;
  overlap: number;
}

export interface SniceAvatarGroupEventMap {
  'avatar-click': CustomEvent<{ avatar: AvatarGroupItem; index: number }>;
  'overflow-click': CustomEvent<{ remaining: number; avatars: AvatarGroupItem[] }>;
}
