export type UserCardVariant = 'card' | 'horizontal' | 'compact';
export type UserCardStatus = 'online' | 'away' | 'offline' | 'busy';

export interface SocialLink {
  platform: string;
  url: string;
}

export interface SniceUserCardElement extends HTMLElement {
  name: string;
  avatar: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  social: SocialLink[];
  status: UserCardStatus;
  variant: UserCardVariant;
}

export interface SniceUserCardEventMap {
  'social-click': CustomEvent<{ platform: string; url: string }>;
  'action-click': CustomEvent<{ action: string }>;
}
