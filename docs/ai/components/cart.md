# snice-cart

Shopping cart summary with line items, quantity controls, coupon field, tax, discount, and checkout CTA.

## Properties

```ts
items: CartItem[] = [];                    // Cart items
currency: string = '$';                    // Currency symbol
taxRate: number = 0;                       // Tax percentage (attr: tax-rate)
discount: number = 0;                      // Discount amount
couponCode: string = '';                   // Applied coupon code (attr: coupon-code)
```

### Types

```ts
interface CartItem {
  id: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  variant?: string;        // e.g. 'Size: M, Color: Black'
}
```

## Methods

- `addItem(item: CartItem)` - Add item (increments quantity if exists)
- `removeItem(id: string)` - Remove item by ID
- `updateQuantity(id: string, qty: number)` - Set quantity (removes if 0)
- `applyCoupon(code: string)` - Apply coupon code
- `clear()` - Remove all items

## Events

- `item-add` -> `{ item: CartItem }`
- `item-remove` -> `{ item: CartItem }`
- `quantity-change` -> `{ item: CartItem; previousQuantity: number; newQuantity: number }`
- `coupon-apply` -> `{ code: string }`
- `checkout` -> `{ items: CartItem[]; subtotal: number; discount: number; tax: number; total: number }`

## CSS Parts

`base`, `header`, `items`, `item`, `coupon`, `summary`, `checkout`, `empty`

## Usage

```html
<snice-cart tax-rate="8.5" currency="$"></snice-cart>
```

```typescript
cart.items = [
  { id: '1', name: 'Running Shoes', image: 'shoe.jpg', price: 89.99, quantity: 1, variant: 'Size: M' },
  { id: '2', name: 'Watch', price: 249.00, quantity: 1 }
];

cart.addItem({ id: '3', name: 'Earbuds', price: 59.99, quantity: 2 });
cart.applyCoupon('SAVE10');

cart.addEventListener('checkout', (e) => {
  console.log(`Total: ${e.detail.total}`);
});
```
