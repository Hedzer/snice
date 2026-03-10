<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/product-card.md -->

# Product Card
`<snice-product-card>`

A product display card with image gallery, pricing, star ratings, variant selectors, and an add-to-cart button. Supports multiple layout variants.

## Table of Contents
- [Properties](#properties)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)
- [Data Types](#data-types)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | `string` | `''` | Product name |
| `price` | `number` | `0` | Regular price |
| `salePrice` (attr: `sale-price`) | `number \| null` | `null` | Sale price (shows strikethrough on original) |
| `currency` | `string` | `'$'` | Currency symbol |
| `images` | `string[]` | `[]` | Image URLs (gallery navigation for multiple). Set via JS. |
| `rating` | `number` | `0` | Star rating (0-5, supports half stars) |
| `reviewCount` (attr: `review-count`) | `number` | `0` | Number of reviews |
| `variants` | `ProductVariant[]` | `[]` | Variant selector groups. Set via JS. |
| `inStock` (attr: `in-stock`) | `boolean` | `true` | Whether product is in stock |
| `variant` | `'vertical' \| 'horizontal' \| 'compact' \| 'featured' \| 'minimal' \| 'grid'` | `'vertical'` | Card layout variant |
| `badge` | `string` | `''` | Badge text (e.g. "SALE", "NEW") |
| `badgeVariant` (attr: `badge-variant`) | `'sale' \| 'new' \| 'featured'` | `'sale'` | Badge visual style |
| `loading` | `boolean` | `false` | Shows skeleton loading state |
| `favorite` | `boolean` | `false` | Favorite/heart toggle state |
| `stockCount` (attr: `stock-count`) | `number` | `-1` | Stock count (-1 hides, <5 shows urgency) |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `add-to-cart` | `{ name, price, salePrice, selectedVariants }` | Fired when the add-to-cart button is clicked |
| `variant-select` | `{ type: string, value: string }` | Fired when a variant option is selected |
| `image-click` | `{ index: number, src: string }` | Fired when the gallery image is clicked |
| `favorite` | `{ favorited: boolean }` | Fired when the favorite button is toggled |
| `quick-view` | `void` | Fired when the quick view overlay is clicked |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The outer card container |
| `gallery` | `<div>` | Image gallery area |
| `body` | `<div>` | Card body content |
| `title` | `<h3>` | Product name heading |
| `rating` | `<div>` | Star rating area |
| `stars` | `<div>` | Star rating container |
| `price` | `<div>` | Price display area |
| `price-current` | `<span>` | Current price display |
| `price-original` | `<span>` | Original price (strikethrough on sale) |
| `discount` | `<span>` | Discount percentage badge |
| `stock` | `<div>` | Stock status indicator |
| `variants` | `<div>` | Variant selectors area |
| `variant-group` | `<div>` | Variant selector group |
| `variant-option` | `<button>` | Individual variant option button |
| `cta` | `<button>` | Add-to-cart button |
| `badge` | `<span>` | Product badge |
| `favorite-btn` | `<button>` | Favorite/heart button |
| `image` | `<img>` | Gallery image element |

## Basic Usage

```typescript
import 'snice/components/product-card/snice-product-card';
```

```html
<snice-product-card
  name="Running Shoes"
  price="129.99"
  rating="4.5"
  review-count="342"
  in-stock>
</snice-product-card>
```

## Examples

### Sale Price

Use the `sale-price` attribute to display a sale with the original price crossed out and a discount badge.

```html
<snice-product-card name="Premium Sneakers" price="149.99" sale-price="99.99" rating="4.5" review-count="128"></snice-product-card>
```

### Multiple Images

Set the `images` property to enable gallery navigation with prev/next buttons and dots.

```typescript
card.images = ['front.jpg', 'side.jpg', 'back.jpg', 'detail.jpg'];
```

### Variant Selectors

Set the `variants` property to add size chips and color swatches. Color variants (type "Color") render as swatches.

```typescript
card.variants = [
  { type: 'Size', options: ['XS', 'S', 'M', 'L', 'XL'] },
  { type: 'Color', options: ['#1a1a2e', '#e94560', '#0f3460', '#ffffff'] }
];

card.addEventListener('variant-select', (e) => {
  console.log(`Selected ${e.detail.type}: ${e.detail.value}`);
});
```

### Layout Variants

Use the `variant` attribute to change the card layout.

```html
<snice-product-card variant="vertical" name="Product" price="29.99"></snice-product-card>
<snice-product-card variant="horizontal" name="Product" price="29.99"></snice-product-card>
<snice-product-card variant="compact" name="Product" price="29.99"></snice-product-card>
```

### Out of Stock

Set `in-stock="false"` to disable the add-to-cart button and show an out-of-stock indicator.

```html
<snice-product-card name="Limited Edition Watch" price="599.00" in-stock="false"></snice-product-card>
```

### Handling Add to Cart

```typescript
card.addEventListener('add-to-cart', (e) => {
  const { name, price, selectedVariants } = e.detail;
  console.log(`Adding ${name} at $${price}`, selectedVariants);
});
```

## Accessibility

- Star rating includes `aria-label` with numeric rating value
- Variant selectors use `role="radiogroup"` and `role="radio"` with `aria-checked`
- Gallery navigation buttons have `aria-label` attributes
- Favorite button has a descriptive `aria-label`
- Out-of-stock state disables the CTA button
- All interactive elements are keyboard-focusable

## Data Types

```typescript
interface ProductVariant {
  type: string;                    // Variant group name, e.g. 'Size', 'Color'
  options: string[];               // Available options, e.g. ['S', 'M', 'L']
}
```
