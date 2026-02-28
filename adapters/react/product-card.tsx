import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the ProductCard component
 */
export interface ProductCardProps extends SniceBaseProps {
  name?: any;
  price?: any;
  salePrice?: any;
  currency?: any;
  images?: any;
  rating?: any;
  reviewCount?: any;
  variants?: any;
  inStock?: any;
  variant?: any;
  currentImageIndex?: any;
  selectedVariants?: any;

}

/**
 * ProductCard - React adapter for snice-product-card
 *
 * This is an auto-generated React wrapper for the Snice product-card component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/product-card';
 * import { ProductCard } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ProductCard />;
 * }
 * ```
 */
export const ProductCard = createReactAdapter<ProductCardProps>({
  tagName: 'snice-product-card',
  properties: ["name","price","salePrice","currency","images","rating","reviewCount","variants","inStock","variant","currentImageIndex","selectedVariants"],
  events: {},
  formAssociated: false
});
