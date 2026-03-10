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
| `items` | The items list |
| `item` | Individual line item |
| `coupon` | Coupon input area |
| `summary` | Order summary section |
| `checkout` | Checkout button area |
| `empty` | Empty cart message |

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
