# snice-product-card

Product display card with image gallery, pricing, ratings, variant selectors, and add-to-cart CTA.

## Properties

```typescript
name: string = '';
price: number = 0;
salePrice: number | null = null;                     // attr: sale-price
currency: string = '$';
images: string[] = [];                               // attr: none (JS only)
rating: number = 0;                                  // 0-5, supports half stars
reviewCount: number = 0;                             // attr: review-count
variants: ProductVariant[] = [];                     // attr: none (JS only)
inStock: boolean = true;                             // attr: in-stock
variant: 'vertical'|'horizontal'|'compact'|'featured'|'minimal'|'grid' = 'vertical';
badge: string = '';                                  // Badge text (e.g. "SALE", "NEW")
badgeVariant: 'sale'|'new'|'featured' = 'sale';     // attr: badge-variant
loading: boolean = false;                            // Skeleton loading state
favorite: boolean = false;                           // Heart toggle state
stockCount: number = -1;                             // attr: stock-count, -1=hidden, <5=urgency
```

## Events

- `add-to-cart` → `{ name, price, salePrice, selectedVariants: Record<string, string> }`
- `variant-select` → `{ type: string, value: string }`
- `image-click` → `{ index: number, src: string }`
- `favorite` → `{ favorited: boolean }`
- `quick-view` → `void`

## CSS Parts

- `base` - Outer card container
- `gallery` - Image gallery area
- `body` - Card body content
- `title` - Product name heading
- `rating` - Star rating area
- `stars` - Star rating container
- `price` - Price display area
- `price-current` - Current price
- `price-original` - Original price (strikethrough on sale)
- `discount` - Discount percentage badge
- `stock` - Stock status indicator
- `variants` - Variant selectors area
- `variant-group` - Variant selector group
- `variant-option` - Individual variant option button
- `cta` - Add-to-cart button
- `badge` - Product badge
- `favorite-btn` - Favorite/heart button
- `image` - Gallery image element

## Basic Usage

```html
<snice-product-card name="Running Shoes" price="129.99" rating="4.5" review-count="342" in-stock></snice-product-card>
```

```typescript
import 'snice/components/product-card/snice-product-card';

card.images = ['shoe1.jpg', 'shoe2.jpg'];
card.variants = [
  { type: 'Size', options: ['S', 'M', 'L', 'XL'] },
  { type: 'Color', options: ['#1a1a2e', '#e94560', '#0f3460'] }
];

card.addEventListener('add-to-cart', (e) => {
  console.log(e.detail.name, e.detail.selectedVariants);
});
```

## Accessibility

- Star rating has `aria-label` with numeric rating
- Variant selectors use `role="radiogroup"` / `role="radio"` with `aria-checked`
- Gallery navigation buttons have `aria-label`
- Favorite button has descriptive `aria-label`
- Out-of-stock disables CTA button

## Types

```typescript
interface ProductVariant { type: string; options: string[]; }
```
