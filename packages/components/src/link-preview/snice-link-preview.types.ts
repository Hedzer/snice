export type LinkPreviewVariant = 'horizontal' | 'vertical';
export type LinkPreviewSize = 'small' | 'medium' | 'large';

export interface SniceLinkPreviewElement extends HTMLElement {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  favicon: string;
  variant: LinkPreviewVariant;
  size: LinkPreviewSize;
}

export interface SniceLinkPreviewEventMap {
  'link-click': CustomEvent<{ url: string }>;
}
