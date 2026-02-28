export type ProductCardVariant = 'vertical' | 'horizontal' | 'compact';

export interface ProductVariant {
  type: string;
  options: string[];
}

export interface SniceProductCardElement extends HTMLElement {
  name: string;
  price: number;
  salePrice: number | null;
  currency: string;
  images: string[];
  rating: number;
  reviewCount: number;
  variants: ProductVariant[];
  inStock: boolean;
  variant: ProductCardVariant;
}

export interface AddToCartDetail {
  name: string;
  price: number;
  salePrice: number | null;
  selectedVariants: Record<string, string>;
}

export interface VariantSelectDetail {
  type: string;
  value: string;
}

export interface ImageClickDetail {
  index: number;
  src: string;
}

export interface SniceProductCardEventMap {
  'add-to-cart': CustomEvent<AddToCartDetail>;
  'variant-select': CustomEvent<VariantSelectDetail>;
  'image-click': CustomEvent<ImageClickDetail>;
}
