[//]: # (AI: For a low-token version of this doc, use docs/ai/components/product-card.md instead)

# Product Card Component

The product card component displays a product with image gallery, pricing, star ratings, variant selectors, and an add-to-cart button. Supports vertical, horizontal, and compact layouts.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Basic Usage

```html
<snice-product-card
  name="Running Shoes"
  price="129.99"
  rating="4.5"
  review-count="342">
</snice-product-card>
```

```typescript
import 'snice/components/product-card/snice-product-card';
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/product-card/snice-product-card';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-product-card.min.js"></script>
```

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `name` | `name` | `string` | `''` | Product name |
| `price` | `price` | `number` | `0` | Regular price |
| `salePrice` | `sale-price` | `number \| null` | `null` | Sale price (shows strikethrough on original) |
| `currency` | `currency` | `string` | `'$'` | Currency symbol |
| `images` | — | `string[]` | `[]` | Image URLs (gallery navigation for multiple) |
| `rating` | `rating` | `number` | `0` | Star rating (0-5, supports half stars) |
| `reviewCount` | `review-count` | `number` | `0` | Number of reviews |
| `variants` | — | `ProductVariant[]` | `[]` | Variant selector groups |
| `inStock` | `in-stock` | `boolean` | `true` | Whether product is in stock |
| `variant` | `variant` | `'vertical' \| 'horizontal' \| 'compact'` | `'vertical'` | Card layout variant |

### ProductVariant Interface

```typescript
interface ProductVariant {
  type: string;       // Variant group name, e.g. 'Size', 'Color'
  options: string[];  // Available options, e.g. ['S', 'M', 'L'] or ['#000', '#fff']
}
```

When the `type` is `'Color'` (case-insensitive), options are rendered as color swatches instead of text chips.

## Events

#### `add-to-cart`
Fired when the add-to-cart button is clicked.

**Event Detail:**
```typescript
{
  name: string;                           // Product name
  price: number;                          // Effective price (sale price if available)
  salePrice: number | null;               // Sale price
  selectedVariants: Record<string, string>; // e.g. { Size: 'M', Color: '#000' }
}
```

#### `variant-select`
Fired when a variant option is selected.

**Event Detail:**
```typescript
{
  type: string;   // Variant group name
  value: string;  // Selected option value
}
```

#### `image-click`
Fired when the gallery image is clicked.

**Event Detail:**
```typescript
{
  index: number;  // Current image index
  src: string;    // Image URL
}
```

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The outer card container |
| `gallery` | Image gallery area |
| `body` | Card body content |
| `title` | Product name heading |
| `rating` | Star rating area |
| `price` | Price display area |
| `variants` | Variant selectors area |
| `cta` | Add-to-cart button |

## Examples

### Sale Price

Use the `sale-price` attribute to display a sale with the original price crossed out and a discount badge.

```html
<snice-product-card
  name="Premium Sneakers"
  price="149.99"
  sale-price="99.99"
  rating="4.5"
  review-count="128">
</snice-product-card>
```

### Multiple Images

Set the `images` property to enable gallery navigation with prev/next buttons and dots.

```html
<snice-product-card id="shoe" name="Athletic Shoes" price="89.99"></snice-product-card>

<script type="module">
  const card = document.getElementById('shoe');
  card.images = ['front.jpg', 'side.jpg', 'back.jpg', 'detail.jpg'];
</script>
```

### Variant Selectors

Set the `variants` property to add size chips and color swatches.

```html
<snice-product-card id="tshirt" name="Classic T-Shirt" price="29.99"></snice-product-card>

<script type="module">
  const card = document.getElementById('tshirt');
  card.images = ['tshirt.jpg'];
  card.variants = [
    { type: 'Size', options: ['XS', 'S', 'M', 'L', 'XL'] },
    { type: 'Color', options: ['#1a1a2e', '#e94560', '#0f3460', '#ffffff'] }
  ];

  card.addEventListener('variant-select', (e) => {
    console.log(`Selected ${e.detail.type}: ${e.detail.value}`);
  });
</script>
```

### Horizontal Layout

Use `variant="horizontal"` for a side-by-side layout suited to wider containers.

```html
<snice-product-card
  variant="horizontal"
  name="MacBook Pro"
  price="2499.00"
  sale-price="2199.00"
  rating="4.9"
  review-count="1024">
</snice-product-card>
```

### Compact Layout

Use `variant="compact"` for a minimal row layout suited to lists and sidebars.

```html
<snice-product-card
  variant="compact"
  name="Wireless Earbuds"
  price="59.99"
  sale-price="39.99"
  rating="4.2"
  review-count="89">
</snice-product-card>
```

### Out of Stock

Set `in-stock="false"` to disable the add-to-cart button and show an out-of-stock indicator.

```html
<snice-product-card
  name="Limited Edition Watch"
  price="599.00"
  in-stock="false"
  rating="4.8"
  review-count="56">
</snice-product-card>
```

### Handling Add to Cart

```html
<snice-product-card id="product" name="Headphones" price="199.99"></snice-product-card>

<script type="module">
  const card = document.getElementById('product');
  card.images = ['headphones.jpg'];
  card.variants = [{ type: 'Color', options: ['#000000', '#ffffff', '#c0c0c0'] }];

  card.addEventListener('add-to-cart', (e) => {
    const { name, price, selectedVariants } = e.detail;
    console.log(`Adding ${name} at $${price}`, selectedVariants);
  });
</script>
```

## Accessibility

- **Star rating**: Includes `aria-label` with numeric rating
- **Variant selectors**: Use `role="radiogroup"` and `role="radio"` with `aria-checked`
- **Gallery navigation**: Previous/next buttons have `aria-label` attributes
- **Out of stock**: CTA button is disabled with appropriate state
- **Keyboard navigation**: All interactive elements are focusable and keyboard-accessible

## Best Practices

1. **Always set a product name**: The title is required for meaningful display
2. **Provide alt text via name**: The gallery image alt text uses the product name
3. **Use multiple images**: Gallery navigation enhances the shopping experience
4. **Show ratings**: Star ratings build trust and help users compare products
5. **Use variant selectors**: Let users pick size/color before adding to cart
