// GENERATED FILE — DO NOT EDIT.
// Source: components/product-card/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
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
export const ProductCard = createReactAdapter({
    tagName: 'snice-product-card',
    properties: ["name", "price", "salePrice", "currency", "images", "rating", "reviewCount", "variants", "inStock", "variant", "badge", "badgeVariant", "loading", "favorite", "stockCount"],
    events: { "add-to-cart": "onAddToCart", "variant-select": "onVariantSelect", "image-click": "onImageClick", "favorite": "onFavorite", "quick-view": "onQuickView" },
    formAssociated: false
});
//# sourceMappingURL=product-card.js.map