import { type SniceReactComponent } from './wrapper';
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
export declare const ProductCard: SniceReactComponent<ProductCardProps, SniceComponentRef>;
//# sourceMappingURL=product-card.d.ts.map