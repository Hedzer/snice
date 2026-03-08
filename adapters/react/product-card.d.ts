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
    badge?: any;
    badgeVariant?: any;
    loading?: any;
    favorite?: any;
    stockCount?: any;
    currentImageIndex?: any;
    selectedVariants?: any;
    heartAnimating?: any;
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
export declare const ProductCard: import("react").ForwardRefExoticComponent<Omit<ProductCardProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=product-card.d.ts.map