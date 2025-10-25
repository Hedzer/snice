export type BannerVariant = 'info' | 'success' | 'warning' | 'error';
export type BannerPosition = 'top' | 'bottom';

export interface SniceBannerElement extends HTMLElement {
  variant: BannerVariant;
  position: BannerPosition;
  message: string;
  dismissible: boolean;
  icon: string;
  actionText: string;
  open: boolean;

  show(): void;
  hide(): void;
  toggle(): void;
}
