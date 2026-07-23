// GENERATED FILE — DO NOT EDIT.
// Source: components/product-card/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


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
  badge?: any;
  badgeVariant?: any;
  loading?: any;
  favorite?: any;
  stockCount?: any;
  onAddToCart?: (event: any) => void;
  onVariantSelect?: (event: any) => void;
  onImageClick?: (event: any) => void;
  onFavorite?: (event: any) => void;
  onQuickView?: (event: any) => void;
}

/**
 * ProductCard - React adapter for snice-product-card
 *
 * This is an auto-generated React wrapper for the Snice product-card component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/product-card/snice-product-card';
 * import { ProductCard } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ProductCard />;
 * }
 * ```
 */
export const ProductCard: SniceReactComponent<ProductCardProps, SniceComponentRef> = createReactAdapter<ProductCardProps, false>({
  tagName: 'snice-product-card',
  properties: ["name","price","salePrice","currency","images","rating","reviewCount","variants","inStock","variant","badge","badgeVariant","loading","favorite","stockCount"],
  events: {"add-to-cart":"onAddToCart","variant-select":"onVariantSelect","image-click":"onImageClick","favorite":"onFavorite","quick-view":"onQuickView"},
  formAssociated: false
});
