# snice-product-card

Product display card with image gallery, pricing, ratings, variant selectors, and add-to-cart CTA.

## Properties

```ts
name: string = '';                                  // Product name
price: number = 0;                                  // Regular price
salePrice: number | null = null;                    // Sale price (attr: sale-price)
currency: string = '$';                             // Currency symbol
images: string[] = [];                              // Image URLs (gallery if multiple)
rating: number = 0;                                 // Star rating (0-5)
reviewCount: number = 0;                            // Review count (attr: review-count)
variants: ProductVariant[] = [];                    // Variant selectors
inStock: boolean = true;                            // In-stock status (attr: in-stock)
variant: 'vertical' | 'horizontal' | 'compact' | 'featured' | 'minimal' | 'grid' = 'vertical';
badge: string = '';                                 // Badge text (e.g. "SALE", "NEW")
badgeVariant: 'sale' | 'new' | 'featured' = 'sale'; // Badge style (attr: badge-variant)
loading: boolean = false;                           // Shows skeleton loading state
favorite: boolean = false;                          // Favorite/heart state
stockCount: number = -1;                            // Stock count (-1=hidden, <5=urgency) (attr: stock-count)
```

### Types

```ts
interface ProductVariant {
  type: string;           // e.g. 'Size', 'Color'
  options: string[];      // e.g. ['S','M','L'] or ['#000','#fff']
}
```

## Events

- `add-to-cart` -> `{ name: string; price: number; salePrice: number | null; selectedVariants: Record<string, string> }`
- `variant-select` -> `{ type: string; value: string }`
- `image-click` -> `{ index: number; src: string }`
- `favorite` -> `{ favorited: boolean }`
- `quick-view` -> `void`

## CSS Parts

`base`, `gallery`, `body`, `title`, `rating`, `stars`, `price`, `price-current`, `price-original`, `discount`, `stock`, `variants`, `variant-group`, `variant-option`, `cta`, `badge`, `favorite-btn`, `image`

## Usage

```html
<snice-product-card
  name="Running Shoes"
  price="129.99"
  sale-price="89.99"
  rating="4.5"
  review-count="342"
  in-stock>
</snice-product-card>
```

```typescript
card.images = ['shoe1.jpg', 'shoe2.jpg', 'shoe3.jpg'];
card.variants = [
  { type: 'Size', options: ['S', 'M', 'L', 'XL'] },
  { type: 'Color', options: ['#1a1a2e', '#e94560', '#0f3460'] }
];

card.addEventListener('add-to-cart', (e) => {
  console.log(e.detail.name, e.detail.selectedVariants);
});
```
