# snice-cart

Shopping cart with line items, quantity controls, coupon, tax, discount, and checkout.

## Properties

```typescript
items: CartItem[] = [];            // Cart items (property only)
currency: string = '$';
taxRate: number = 0;               // attribute: tax-rate
discount: number = 0;
couponCode: string = '';           // attribute: coupon-code
```

## Methods

- `addItem(item: CartItem)` - Add item (increments qty if exists)
- `removeItem(id: string)` - Remove by ID
- `updateQuantity(id: string, qty: number)` - Set qty (removes if 0)
- `applyCoupon(code: string)` - Apply coupon code
- `clear()` - Remove all items

## Events

- `item-add` -> `{ item: CartItem }`
- `item-remove` -> `{ item: CartItem }`
- `quantity-change` -> `{ item, previousQuantity, newQuantity }`
- `coupon-apply` -> `{ code: string }`
- `checkout` -> `{ items, subtotal, discount, tax, total }`

## CSS Parts

- `base`, `header`, `items`, `item`, `coupon`, `summary`, `checkout`, `empty`

## Basic Usage

```html
<snice-cart tax-rate="8.5"></snice-cart>
```

```typescript
import 'snice/components/cart/snice-cart';

cart.items = [
  { id: '1', name: 'Shoes', price: 89.99, quantity: 1, variant: 'Size: M' },
  { id: '2', name: 'Watch', price: 249.00, quantity: 1 }
];

cart.addItem({ id: '3', name: 'Earbuds', price: 59.99, quantity: 2 });
cart.applyCoupon('SAVE10');

cart.addEventListener('checkout', (e) => {
  console.log(`Total: ${e.detail.total}`);
});
```

## Accessibility

- Quantity controls have descriptive aria-labels
- Remove buttons include item name
- Keyboard operable
