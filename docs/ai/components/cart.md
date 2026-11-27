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

- `base` - Outer cart container
- `header` - Cart header with title and count
- `title` - Cart heading text
- `count` - Item-count text in the header
- `items` - The items list
- `item` - Individual line item
- `item-image` - Line item thumbnail `<img>`
- `item-image-placeholder` - Placeholder shown when the item has no image
- `item-image-icon` - `<svg>` glyph inside the image placeholder
- `item-body` - Line item content column
- `item-header` - Line item top row (details + remove button)
- `item-details` - Name/variant/price block
- `item-name` - Line item name
- `item-variant` - Line item variant text
- `item-price` - Per-unit price text
- `item-actions` - Quantity + item-total row
- `item-total` - Line total text
- `remove-button` - The `<snice-button>` that removes a line item
- `quantity` - The `<snice-step-input>` quantity control
- `coupon` - Coupon input area
- `coupon-input` - The coupon `<snice-input>`
- `apply-button` - The coupon Apply `<snice-button>`
- `summary` - Order summary section
- `summary-row` - A summary line
- `summary-row-total` - Added to `summary-row` on the total line
- `summary-label` - Summary line label
- `summary-value` - Summary line value
- `summary-value-discount` - Added to `summary-value` on the discount line
- `divider` - The `<snice-divider>` above the total
- `checkout` - Checkout button area
- `checkout-button` - The checkout `<snice-button>`
- `empty` - Empty cart message

Forwarded from the coupon `<snice-input>` via `exportparts`:

- `coupon-input-base` - Exported `base` of the coupon input
- `coupon-input-wrapper` - Exported `wrapper` of the coupon input
- `coupon-input-label` - Exported `label` of the coupon input
- `coupon-input-container` - Exported `container` of the coupon input
- `coupon-input-input` - Exported `input` of the coupon input
- `coupon-input-prefix-icon` - Exported `prefix-icon` of the coupon input
- `coupon-input-suffix-icon` - Exported `suffix-icon` of the coupon input
- `coupon-input-clear` - Exported `clear` of the coupon input
- `coupon-input-clear-icon` - Exported `clear-icon` of the coupon input
- `coupon-input-spinner` - Exported `spinner` of the coupon input
- `coupon-input-password-toggle` - Exported `password-toggle` of the coupon input
- `coupon-input-password-icon` - Exported `password-icon` of the coupon input
- `coupon-input-helper-text` - Exported `helper-text` of the coupon input
- `coupon-input-error-text` - Exported `error-text` of the coupon input
- `coupon-input-label-required` - Exported `label-required` of the coupon input
- `coupon-input-input-invalid` - Exported `input-invalid` of the coupon input
- `coupon-input-input-loading` - Exported `input-loading` of the coupon input
- `coupon-input-input-clearable` - Exported `input-clearable` of the coupon input
- `coupon-input-clear-with-suffix` - Exported `clear-with-suffix` of the coupon input
- `coupon-input-password-icon-hidden` - Exported `password-icon-hidden` of the coupon input
- `coupon-input-password-icon-visible` - Exported `password-icon-visible` of the coupon input

Forwarded from the quantity `<snice-step-input>` via `exportparts`:

- `quantity-base` - Exported `base` of the quantity control
- `quantity-base-invalid` - Exported `base-invalid` of the quantity control
- `quantity-decrement-button` - Exported `decrement-button` of the quantity control
- `quantity-increment-button` - Exported `increment-button` of the quantity control
- `quantity-button` - Exported `button` of the quantity control
- `quantity-icon` - Exported `icon` of the quantity control
- `quantity-decrement-icon` - Exported `decrement-icon` of the quantity control
- `quantity-increment-icon` - Exported `increment-icon` of the quantity control
- `quantity-input` - Exported `input` of the quantity control

Forwarded from the `<snice-divider>` via `exportparts`:

- `divider-base` - Exported `base` of the divider
- `divider-line` - Exported `line` of the divider
- `divider-line-before` - Exported `line-before` of the divider
- `divider-line-after` - Exported `line-after` of the divider
- `divider-text` - Exported `text` of the divider

Forwarded from each internal `<snice-button>` via `exportparts` (prefix `remove-button-`, `apply-button-`, `checkout-button-`):

- `remove-button-base` - Exported `base` of the remove button
- `remove-button-spinner` - Exported `spinner` of the remove button
- `remove-button-label` - Exported `label` of the remove button
- `remove-button-icon` - Exported `icon` of the remove button
- `remove-button-icon-start` - Exported `icon-start` of the remove button
- `remove-button-icon-end` - Exported `icon-end` of the remove button
- `remove-button-base-loading` - Exported `base-loading` of the remove button
- `remove-button-base-disabled` - Exported `base-disabled` of the remove button
- `apply-button-base` - Exported `base` of the apply button
- `apply-button-spinner` - Exported `spinner` of the apply button
- `apply-button-label` - Exported `label` of the apply button
- `apply-button-icon` - Exported `icon` of the apply button
- `apply-button-icon-start` - Exported `icon-start` of the apply button
- `apply-button-icon-end` - Exported `icon-end` of the apply button
- `apply-button-base-loading` - Exported `base-loading` of the apply button
- `apply-button-base-disabled` - Exported `base-disabled` of the apply button
- `checkout-button-base` - Exported `base` of the checkout button
- `checkout-button-spinner` - Exported `spinner` of the checkout button
- `checkout-button-label` - Exported `label` of the checkout button
- `checkout-button-icon` - Exported `icon` of the checkout button
- `checkout-button-icon-start` - Exported `icon-start` of the checkout button
- `checkout-button-icon-end` - Exported `icon-end` of the checkout button
- `checkout-button-base-loading` - Exported `base-loading` of the checkout button
- `checkout-button-base-disabled` - Exported `base-disabled` of the checkout button

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
