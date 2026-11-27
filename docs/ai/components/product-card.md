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

- `base` - The outer card container
- `base-skeleton` - Added to `base` while the card renders its loading skeleton
- `gallery` - Image gallery area
- `gallery-images` - Image stack wrapper inside the gallery
- `gallery-images-empty` - Added to `gallery-images` when no images are supplied
- `image` - Gallery image element
- `image-active` - Added to `image` for the visible image
- `gallery-gradient` - Featured-variant overlay gradient
- `gallery-nav` - Gallery navigation arrow
- `gallery-nav-prev` - Added to `gallery-nav` on the previous arrow
- `gallery-nav-next` - Added to `gallery-nav` on the next arrow
- `gallery-dots` - Gallery pagination dots container
- `gallery-dot` - Individual gallery dot
- `gallery-dot-active` - Added to `gallery-dot` for the visible image
- `badge` - Product badge
- `favorite-btn` - Favorite/heart button
- `favorite-icon` - Heart glyph inside the favorite button
- `favorite-icon-active` - Added to `favorite-icon` while favorited
- `favorite-icon-animate` - Added to `favorite-icon` while the favorite toggle animation plays
- `quick-view` - Quick view button
- `quick-view-label` - Quick view button label wrapper
- `quick-view-icon` - Quick view button glyph
- `body` - Card body content
- `title` - Product name heading
- `rating` - Star rating area
- `stars` - Star rating container
- `star` - Individual rating star
- `star-filled` - Added to `star` for a filled star
- `star-half` - Added to `star` for a half star
- `star-empty` - Added to `star` for an empty star
- `review-count` - Review count text
- `price` - Price display area
- `price-current` - Current price display
- `price-current-sale` - Added to `price-current` while a sale price applies
- `price-original` - Original price (strikethrough on sale)
- `discount` - Discount percentage badge
- `stock` - Stock status indicator
- `stock-in` - Added to `stock` while in stock
- `stock-out` - Added to `stock` while out of stock
- `stock-dot` - Stock status dot
- `stock-urgency` - Low stock urgency text
- `variants` - Variant selectors area
- `variant-group` - Variant selector group
- `variant-label` - Variant group label
- `variant-options` - Variant option buttons container
- `variant-option` - Individual variant option button
- `variant-option-color` - Added to `variant-option` for colour swatches
- `variant-option-selected` - Added to `variant-option` for the selected option
- `cta` - Add-to-cart button
- `cta-loading` - Added to `cta` while the card is loading
- `cta-icon` - Add-to-cart button glyph
- `spinner` - Add-to-cart loading spinner
- `skeleton-image` - Skeleton gallery placeholder
- `skeleton-line` - Skeleton text placeholder line

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

## CSS Custom Properties

- `--snice-product-card-badge-bg` - Product card badge background

## Types

```typescript
interface ProductVariant { type: string; options: string[]; }
```
