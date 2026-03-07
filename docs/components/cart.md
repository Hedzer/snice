<!-- AI: For a low-token version of this doc, use docs/ai/components/cart.md instead -->

# Cart Component

The cart component displays a shopping cart summary with line items, quantity controls, coupon field, tax and discount calculations, and a checkout button.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Basic Usage

```html
<snice-cart></snice-cart>
```

```typescript
import 'snice/components/cart/snice-cart';
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/cart/snice-cart';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-cart.min.js"></script>
```

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `items` | — | `CartItem[]` | `[]` | Cart line items |
| `currency` | `currency` | `string` | `'$'` | Currency symbol |
| `taxRate` | `tax-rate` | `number` | `0` | Tax rate percentage |
| `discount` | `discount` | `number` | `0` | Discount amount |
| `couponCode` | `coupon-code` | `string` | `''` | Applied coupon code |

### CartItem Interface

```typescript
interface CartItem {
  id: string;          // Unique item identifier
  name: string;        // Item display name
  image?: string;      // Thumbnail URL
  price: number;       // Unit price
  quantity: number;     // Item quantity
  variant?: string;    // Variant description, e.g. 'Size: M, Color: Black'
}
```

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `addItem(item)` | `item: CartItem` | Adds an item to the cart. If an item with the same `id` exists, increments its quantity. |
| `removeItem(id)` | `id: string` | Removes an item by its ID |
| `updateQuantity(id, qty)` | `id: string, qty: number` | Sets the quantity of an item. Removes the item if qty is 0 or less. |
| `applyCoupon(code)` | `code: string` | Applies a coupon code and fires the `coupon-apply` event |
| `clear()` | — | Removes all items from the cart |

## Events

#### `item-add`
Fired when a new item is added to the cart.

**Event Detail:**
```typescript
{
  item: CartItem;  // The added item
}
```

#### `item-remove`
Fired when an item is removed from the cart.

**Event Detail:**
```typescript
{
  item: CartItem;  // The removed item
}
```

#### `quantity-change`
Fired when an item's quantity changes.

**Event Detail:**
```typescript
{
  item: CartItem;         // The item (with new quantity)
  previousQuantity: number;
  newQuantity: number;
}
```

#### `coupon-apply`
Fired when a coupon code is applied.

**Event Detail:**
```typescript
{
  code: string;  // The coupon code
}
```

#### `checkout`
Fired when the checkout button is clicked.

**Event Detail:**
```typescript
{
  items: CartItem[];     // All cart items
  subtotal: number;      // Sum of (price * quantity)
  discount: number;      // Discount amount
  tax: number;           // Calculated tax
  total: number;         // Final total
}
```

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

## Examples

### Cart with Items

Set the `items` property to populate the cart.

```html
<snice-cart id="my-cart" tax-rate="8.5"></snice-cart>

<script type="module">
  import 'snice/components/cart/snice-cart';

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
<snice-cart id="discount-cart" discount="10" coupon-code="SAVE10" tax-rate="5"></snice-cart>

<script type="module">
  const cart = document.getElementById('discount-cart');
  cart.items = [
    { id: '1', name: 'Laptop Stand', price: 45.00, quantity: 1 },
    { id: '2', name: 'USB-C Hub', price: 35.00, quantity: 1 }
  ];
</script>
```

### Programmatic Cart Management

Use the cart methods to add, remove, and update items.

```html
<snice-cart id="cart"></snice-cart>

<script type="module">
  const cart = document.getElementById('cart');

  // Add items
  cart.addItem({ id: 'shoe', name: 'Sneakers', price: 79.99, quantity: 1 });
  cart.addItem({ id: 'sock', name: 'Socks (3-pack)', price: 12.99, quantity: 2 });

  // Update quantity
  cart.updateQuantity('sock', 4);

  // Apply coupon
  cart.applyCoupon('SPRING20');
</script>
```

### Handling Checkout

```html
<snice-cart id="checkout-cart" tax-rate="8.5"></snice-cart>

<script type="module">
  const cart = document.getElementById('checkout-cart');
  cart.items = [
    { id: '1', name: 'Product A', price: 49.99, quantity: 2 },
    { id: '2', name: 'Product B', price: 29.99, quantity: 1 }
  ];

  cart.addEventListener('checkout', (e) => {
    const { items, subtotal, tax, total } = e.detail;
    console.log(`Checkout: ${items.length} items, Total: $${total.toFixed(2)}`);
    // Navigate to checkout page
  });
</script>
```

## Accessibility

- **Quantity controls**: Increment/decrement buttons have descriptive `aria-label` attributes
- **Remove buttons**: Include the item name in the `aria-label` for clarity
- **Keyboard navigation**: All controls are focusable and operable via keyboard
- **Semantic structure**: Items are rendered in an unordered list with proper heading hierarchy

## Best Practices

1. **Set tax rate**: Configure `tax-rate` to show accurate totals
2. **Handle coupon validation server-side**: Listen to the `coupon-apply` event, validate the code, then set the `discount` property
3. **Use `addItem` for external add-to-cart actions**: Pairs well with `snice-product-card`'s `add-to-cart` event
4. **Show item images**: Thumbnails help users identify items quickly
5. **Include variant info**: Display size, color, or other selections in the `variant` string
