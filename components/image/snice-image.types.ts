export type ImageVariant = 'rounded' | 'square' | 'circle';
export type ImageSize = 'small' | 'medium' | 'large';
export type ImageFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';

export interface SniceImageElement extends HTMLElement {
  src: string;
  alt: string;
  fallback: string;
  placeholder: string;
  srcset: string;
  sizes: string;
  variant: ImageVariant;
  size: ImageSize;
  lazy: boolean;
  observeVisibility: boolean;
  fit: ImageFit;
  width: string;
  height: string;
}
