[//]: # (AI: For a low-token version of this doc, use docs/ai/components/receipt.md instead)

# Receipt

`<snice-receipt>`

A transaction receipt component for displaying purchase summaries with items, totals, payment method, and merchant information. Includes a thermal-printer-style variant.

## Features

- **Items List**: Product name, quantity, and line total
- **Automatic Totals**: Subtotal computed from items when not explicitly set
- **Tax Display**: Optional tax line with absolute amount
- **Payment Method**: Shows how the transaction was paid
- **Merchant Info**: Name, address, and logo
- **Thermal Variant**: Narrow, monospace, dotted-border style mimicking thermal printer output
- **Print Support**: Built-in `print()` method
- **Custom Footer**: Slot for thank-you messages or return policies

## Basic Usage

```typescript
import 'snice/components/receipt/snice-receipt';
```

```html
<snice-receipt
  receipt-number="REC-4521"
  date="2026-02-27"
  payment-method="Visa **** 4242">
</snice-receipt>

<script>
  const receipt = document.querySelector('snice-receipt');
  receipt.merchant = { name: 'Coffee House', address: '123 Brew St\nPortland, OR 97201' };
  receipt.items = [
    { name: 'Cappuccino', quantity: 2, price: 4.50 },
    { name: 'Croissant', quantity: 1, price: 3.75 }
  ];
  receipt.tax = 1.15;
  receipt.total = 13.90;
</script>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/receipt/snice-receipt';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-receipt.min.js"></script>
```

## Examples

### Standard Receipt

```html
<snice-receipt
  receipt-number="REC-001"
  date="2026-02-27 14:30"
  payment-method="Apple Pay">
</snice-receipt>

<script>
  const receipt = document.querySelector('snice-receipt');
  receipt.merchant = { name: 'Grocery Mart' };
  receipt.items = [
    { name: 'Organic Milk', quantity: 1, price: 5.99 },
    { name: 'Sourdough Bread', quantity: 1, price: 4.49 },
    { name: 'Avocado', quantity: 3, price: 1.50 }
  ];
  receipt.tax = 1.25;
  receipt.total = 16.23;
</script>
```

### Thermal Variant

Use `variant="thermal"` for a narrow, monospace receipt style.

```html
<snice-receipt variant="thermal"
  receipt-number="T-9832"
  date="2026-02-27 09:15"
  payment-method="Cash">
</snice-receipt>
```

### Auto-Computed Totals

When `subtotal` and `total` are left at 0, they are computed automatically from items.

```html
<script>
  receipt.items = [
    { name: 'Widget', quantity: 5, price: 10 },
    { name: 'Gadget', quantity: 2, price: 25 }
  ];
  receipt.tax = 8.50;
  // subtotal = 5*10 + 2*25 = 100
  // total = 100 + 8.50 = 108.50
</script>
```

### With Merchant Logo

```html
<script>
  receipt.merchant = {
    name: 'Book Store',
    address: '789 Reading Lane',
    logo: 'https://example.com/logo.png'
  };
</script>
```

### Custom Footer

```html
<snice-receipt>
  <div>Returns accepted within 30 days with receipt.</div>
</snice-receipt>
```

### Print

```javascript
receipt.print();
```

## Slots

| Name | Description |
|------|-------------|
| (default) | Footer content (default text: "Thank you for your purchase!") |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `receiptNumber` (attr: `receipt-number`) | `string` | `''` | Receipt identifier |
| `date` | `string` | `''` | Transaction date/time |
| `currency` | `string` | `'USD'` | ISO 4217 currency code |
| `merchant` | `ReceiptMerchant` | `{ name: '' }` | Merchant info (JS property only) |
| `items` | `ReceiptItem[]` | `[]` | Line items (JS property only) |
| `tax` | `number` | `0` | Tax amount (absolute value, not percentage) |
| `subtotal` | `number` | `0` | Subtotal (auto-computed from items if 0) |
| `total` | `number` | `0` | Total (auto-computed as subtotal + tax if 0) |
| `paymentMethod` (attr: `payment-method`) | `string` | `''` | Payment method description |
| `variant` | `'standard' \| 'thermal'` | `'standard'` | Visual variant |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `print()` | — | Opens a print dialog for the receipt |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Main receipt container |
| `header` | Merchant section |
| `logo` | Merchant logo image |
| `merchant-name` | Merchant name text |
| `meta` | Receipt number and date |
| `items` | Items list container |
| `item` | Individual item row |
| `totals` | Totals section |
| `total` | Grand total row |
| `payment` | Payment method section |
| `footer` | Footer/thank-you section |

## TypeScript Interfaces

```typescript
interface ReceiptMerchant {
  name: string;
  address?: string;
  logo?: string;
}

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}
```

## Theming

The component uses these CSS custom properties:

```css
--snice-color-background
--snice-color-background-element
--snice-color-text
--snice-color-text-secondary
--snice-color-text-tertiary
--snice-color-border
--snice-font-family
--snice-spacing-*
--snice-font-size-*
--snice-font-weight-*
--snice-border-radius-*
--snice-line-height-normal
```

## Best Practices

1. **Set items via JS**: The `items` and `merchant` properties are objects and must be set programmatically
2. **Tax is absolute**: Unlike the invoice component, receipt `tax` is an absolute amount, not a percentage
3. **Auto-compute or explicit**: Leave `subtotal`/`total` at 0 to auto-compute, or set them explicitly for precise control
4. **Thermal for POS**: Use the thermal variant for point-of-sale style receipts
