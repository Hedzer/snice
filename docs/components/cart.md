<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/cart.md -->

# Cart Component

Shopping cart summary with line items, quantity controls, coupon field, tax and discount calculations, and a checkout button.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | `CartItem[]` | `[]` | Cart line items (property only) |
| `currency` | `string` | `'$'` | Currency symbol |
| `taxRate` (attr: `tax-rate`) | `number` | `0` | Tax rate percentage |
| `discount` | `number` | `0` | Discount amount |
| `couponCode` (attr: `coupon-code`) | `string` | `''` | Applied coupon code |

### CartItem Interface

```typescript
interface CartItem {
  id: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  variant?: string;    // e.g. 'Size: M, Color: Black'
}
```

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `addItem()` | `item: CartItem` | Add item (increments quantity if item with same `id` exists) |
| `removeItem()` | `id: string` | Remove item by ID |
| `updateQuantity()` | `id: string, qty: number` | Set quantity (removes item if qty <= 0) |
| `applyCoupon()` | `code: string` | Apply coupon code and fire `coupon-apply` event |
| `clear()` | -- | Remove all items |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `item-add` | `{ item: CartItem }` | Item added to cart |
| `item-remove` | `{ item: CartItem }` | Item removed from cart |
| `quantity-change` | `{ item: CartItem, previousQuantity: number, newQuantity: number }` | Item quantity changed |
| `coupon-apply` | `{ code: string }` | Coupon code applied |
| `checkout` | `{ items: CartItem[], subtotal: number, discount: number, tax: number, total: number }` | Checkout button clicked |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The outer cart container |
| `header` | Cart header with title and count |
| `title` | Cart heading text |
| `count` | Item-count text in the header |
| `items` | The items list |
| `item` | Individual line item |
| `item-image` | Line item thumbnail image |
| `item-image-placeholder` | Placeholder shown when the item has no image |
| `item-image-icon` | The `<svg>` glyph inside the image placeholder |
| `item-body` | Line item content column |
| `item-header` | Line item top row (details + remove button) |
| `item-details` | Name/variant/price block |
| `item-name` | Line item name |
| `item-variant` | Line item variant text |
| `item-price` | Per-unit price text |
| `item-actions` | Quantity + item-total row |
| `item-total` | Line total text |
| `remove-button` | The `<snice-button>` that removes a line item |
| `quantity` | The `<snice-step-input>` quantity control |
| `coupon` | Coupon input area |
| `coupon-input` | The coupon `<snice-input>` |
| `apply-button` | The coupon Apply `<snice-button>` |
| `summary` | Order summary section |
| `summary-row` | A summary line |
| `summary-row-total` | Added to `summary-row` on the total line |
| `summary-label` | Summary line label |
| `summary-value` | Summary line value |
| `summary-value-discount` | Added to `summary-value` on the discount line |
| `divider` | The `<snice-divider>` above the total |
| `checkout` | Checkout button area |
| `checkout-button` | The checkout `<snice-button>` |
| `empty` | Empty cart message |

### Forwarded from the coupon `<snice-input>`

| Part | Description |
|------|-------------|
| `coupon-input-base` | Exported `base` — Outer wrapper |
| `coupon-input-wrapper` | Exported `wrapper` — Outer wrapper element |
| `coupon-input-label` | Exported `label` — Label element |
| `coupon-input-container` | Exported `container` — Input container |
| `coupon-input-input` | Exported `input` — Native input element |
| `coupon-input-prefix-icon` | Exported `prefix-icon` — Prefix icon container |
| `coupon-input-suffix-icon` | Exported `suffix-icon` — Suffix icon container |
| `coupon-input-clear` | Exported `clear` — Clear button |
| `coupon-input-clear-icon` | Exported `clear-icon` — Glyph inside the clear button |
| `coupon-input-spinner` | Exported `spinner` — Loading spinner |
| `coupon-input-password-toggle` | Exported `password-toggle` — Password visibility toggle |
| `coupon-input-password-icon` | Exported `password-icon` — Glyph inside the password toggle |
| `coupon-input-helper-text` | Exported `helper-text` — Helper text element |
| `coupon-input-error-text` | Exported `error-text` — Error text element |
| `coupon-input-label-required` | Exported `label-required` — `label` while required |
| `coupon-input-input-invalid` | Exported `input-invalid` — `input` while invalid |
| `coupon-input-input-loading` | Exported `input-loading` — `input` while loading |
| `coupon-input-input-clearable` | Exported `input-clearable` — `input` while clearable |
| `coupon-input-clear-with-suffix` | Exported `clear-with-suffix` — `clear` when a suffix adornment shares the row |
| `coupon-input-password-icon-hidden` | Exported `password-icon-hidden` — `password-icon` while the password is masked |
| `coupon-input-password-icon-visible` | Exported `password-icon-visible` — `password-icon` while the password is revealed |

### Forwarded from the quantity `<snice-step-input>`

| Part | Description |
|------|-------------|
| `quantity-base` | Exported `base` — Outer container |
| `quantity-base-invalid` | Exported `base-invalid` — `base` while the value fails validation |
| `quantity-decrement-button` | Exported `decrement-button` — Minus button |
| `quantity-increment-button` | Exported `increment-button` — Plus button |
| `quantity-button` | Exported `button` — Either stepper button |
| `quantity-icon` | Exported `icon` — Either stepper button glyph |
| `quantity-decrement-icon` | Exported `decrement-icon` — `icon` for the minus glyph |
| `quantity-increment-icon` | Exported `increment-icon` — `icon` for the plus glyph |
| `quantity-input` | Exported `input` — Number input field |

### Forwarded from the `<snice-divider>`

| Part | Description |
|------|-------------|
| `divider-base` | Exported `base` — Outer divider container |
| `divider-line` | Exported `line` — The divider line(s) |
| `divider-line-before` | Exported `line-before` — `line` rendered before the text label |
| `divider-line-after` | Exported `line-after` — `line` rendered after the text label |
| `divider-text` | Exported `text` — Optional text label |

### Forwarded from the remove `<snice-button>`

| Part | Description |
|------|-------------|
| `remove-button-base` | Exported `base` — The button element |
| `remove-button-spinner` | Exported `spinner` — Loading spinner |
| `remove-button-label` | Exported `label` — Button label text |
| `remove-button-icon` | Exported `icon` — Icon container |
| `remove-button-icon-start` | Exported `icon-start` — `icon` before the label |
| `remove-button-icon-end` | Exported `icon-end` — `icon` after the label |
| `remove-button-base-loading` | Exported `base-loading` — `base` while loading |
| `remove-button-base-disabled` | Exported `base-disabled` — `base` while disabled |

### Forwarded from the apply `<snice-button>`

| Part | Description |
|------|-------------|
| `apply-button-base` | Exported `base` — The button element |
| `apply-button-spinner` | Exported `spinner` — Loading spinner |
| `apply-button-label` | Exported `label` — Button label text |
| `apply-button-icon` | Exported `icon` — Icon container |
| `apply-button-icon-start` | Exported `icon-start` — `icon` before the label |
| `apply-button-icon-end` | Exported `icon-end` — `icon` after the label |
| `apply-button-base-loading` | Exported `base-loading` — `base` while loading |
| `apply-button-base-disabled` | Exported `base-disabled` — `base` while disabled |

### Forwarded from the checkout `<snice-button>`

| Part | Description |
|------|-------------|
| `checkout-button-base` | Exported `base` — The button element |
| `checkout-button-spinner` | Exported `spinner` — Loading spinner |
| `checkout-button-label` | Exported `label` — Button label text |
| `checkout-button-icon` | Exported `icon` — Icon container |
| `checkout-button-icon-start` | Exported `icon-start` — `icon` before the label |
| `checkout-button-icon-end` | Exported `icon-end` — `icon` after the label |
| `checkout-button-base-loading` | Exported `base-loading` — `base` while loading |
| `checkout-button-base-disabled` | Exported `base-disabled` — `base` while disabled |

## Basic Usage

```html
<snice-cart></snice-cart>
```

```typescript
import 'snice/components/cart/snice-cart';
```

## Examples

### Cart with Items

Set the `items` property to populate the cart.

```html
<snice-cart id="my-cart" tax-rate="8.5"></snice-cart>

<script type="module">
  const cart = document.getElementById('my-cart');
  cart.items = [
    { id: '1', name: 'Running Shoes', image: 'shoes.jpg', price: 89.99, quantity: 1, variant: 'Size: 10' },
    { id: '2', name: 'Classic Watch', image: 'watch.jpg', price: 249.00, quantity: 1 },
    { id: '3', name: 'Wireless Earbuds', price: 59.99, quantity: 2 }
  ];
</script>
```

### Cart with Discount

Set `discount` and `coupon-code` to show a discount row.

```html
<snice-cart discount="10" coupon-code="SAVE10" tax-rate="5"></snice-cart>
```

### Programmatic Cart Management

Use methods to add, remove, and update items.

```javascript
cart.addItem({ id: 'shoe', name: 'Sneakers', price: 79.99, quantity: 1 });
cart.addItem({ id: 'sock', name: 'Socks (3-pack)', price: 12.99, quantity: 2 });
cart.updateQuantity('sock', 4);
cart.applyCoupon('SPRING20');
```

### Handling Checkout

Listen for the `checkout` event to process orders.

```javascript
cart.addEventListener('checkout', (e) => {
  const { items, subtotal, tax, total } = e.detail;
  console.log(`Checkout: ${items.length} items, Total: $${total.toFixed(2)}`);
});
```

## Accessibility

- Quantity controls have descriptive `aria-label` attributes
- Remove buttons include the item name in the `aria-label`
- All controls are focusable and keyboard operable
- Semantic list structure with proper heading hierarchy
