<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/receipt.md -->

# Receipt

A transaction receipt component for displaying purchase details with merchant info, line items, totals, and payment method. Supports multiple visual variants including thermal printer style.

## Table of Contents

- [Properties](#properties)
- [Methods](#methods)
- [Slots](#slots)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `receiptNumber` (attr: `receipt-number`) | `string` | `''` | Receipt identifier |
| `date` | `string` | `''` | Receipt date/time (displayed as-is) |
| `currency` | `string` | `'USD'` | ISO 4217 currency code for formatting |
| `locale` | `string` | `''` | Locale for `Intl.NumberFormat` currency formatting |
| `merchant` | `ReceiptMerchant` | `{ name: '' }` | Merchant/store information (JS only) |
| `items` | `ReceiptItem[]` | `[]` | Line items (JS only) |
| `tax` | `number` | `0` | Single tax amount |
| `taxes` | `ReceiptTaxLine[]` | `[]` | Multiple tax lines (overrides `tax`, JS only) |
| `subtotal` | `number` | `0` | Pre-tax subtotal (auto-calculated from items if 0) |
| `total` | `number` | `0` | Grand total (auto-calculated if 0) |
| `tip` | `number` | `0` | Tip/gratuity amount |
| `discount` | `number` | `0` | Discount amount |
| `discountLabel` (attr: `discount-label`) | `string` | `'Discount'` | Label for discount line |
| `paymentMethod` (attr: `payment-method`) | `string` | `''` | Payment method text |
| `paymentDetails` (attr: `payment-details`) | `string` | `''` | Additional payment info |
| `variant` | `'standard' \| 'thermal' \| 'modern' \| 'minimal' \| 'detailed'` | `'standard'` | Visual style variant |
| `showQr` (attr: `show-qr`) | `boolean` | `false` | Show QR code slot |
| `qrData` (attr: `qr-data`) | `string` | `''` | QR code data |
| `qrPosition` (attr: `qr-position`) | `'top' \| 'bottom' \| 'footer'` | `'bottom'` | QR code placement |
| `thankYou` (attr: `thank-you`) | `string` | `'Thank you for your purchase!'` | Footer message |
| `cashier` | `string` | `''` | Cashier name |
| `terminalId` (attr: `terminal-id`) | `string` | `''` | Terminal/register identifier |

### Type Interfaces

```typescript
interface ReceiptMerchant {
  name: string;
  address?: string;
  logo?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
}

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  sku?: string;
  discount?: number;
  note?: string;
}

interface ReceiptTaxLine {
  label: string;
  rate?: number;
  amount: number;
}
```

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `print()` | — | Open print dialog with receipt styles |

## Slots

| Name | Description |
|------|-------------|
| (default) | Additional footer content below thank-you message |
| `qr` | QR code content (shown when `show-qr` is set) |
| `barcode` | Barcode content displayed near the footer |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--receipt-max-width` | Maximum width | `22rem` |
| `--receipt-padding` | Internal padding | `1.5rem` |
| `--receipt-bg` | Background color | `white` |
| `--receipt-text` | Text color | `rgb(23 23 23)` |
| `--receipt-text-secondary` | Secondary text | `rgb(82 82 82)` |
| `--receipt-border` | Border color | `rgb(226 226 226)` |
| `--receipt-border-radius` | Border radius | `8px` |
| `--receipt-divider-style` | Divider line style | `dashed` |
| `--receipt-merchant-font-size` | Merchant name size | `1.25rem` |
| `--receipt-total-font-size` | Total amount size | `1.125rem` |
| `--receipt-total-font-weight` | Total weight | `700` |
| `--receipt-thermal-font` | Thermal variant font | `'Courier New', monospace` |
| `--receipt-thermal-width` | Thermal variant width | `18rem` |
| `--receipt-thermal-bg` | Thermal variant background | `rgb(255 255 248)` |
| `--receipt-modern-radius` | Modern variant radius | `12px` |
| `--receipt-modern-shadow` | Modern variant shadow | `0 4px 24px rgb(0 0 0 / 0.08)` |
| `--receipt-qr-size` | QR code size | `6rem` |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Root container |
| `divider` | Section dividers |
| `header` | Merchant header section |
| `logo` | Merchant logo image |
| `merchant-name` | Merchant name |
| `merchant-address` | Merchant address |
| `merchant-contact` | Contact info line |
| `meta` | Receipt metadata section |
| `receipt-number` | Receipt number value |
| `date` | Date value |
| `items-header` | Items column header row |
| `items` | Items container |
| `item` | Individual item row |
| `item-name` | Item name |
| `item-sku` | Item SKU (detailed variant) |
| `item-qty` | Item quantity |
| `item-price` | Item price |
| `totals` | Totals section |
| `subtotal-row` | Subtotal row |
| `discount-row` | Discount row |
| `tax-row` | Tax row(s) |
| `tip-row` | Tip row |
| `total-row` | Grand total row |
| `payment` | Payment method section |
| `payment-method` | Payment method text |
| `payment-details` | Payment details |
| `qr-container` | QR code container |
| `barcode-area` | Barcode slot container |
| `footer` | Footer area |
| `thank-you` | Thank you message |

## Basic Usage

```typescript
import 'snice/components/receipt/snice-receipt';
```

```html
<snice-receipt
  receipt-number="RCT-48291"
  date="Feb 27, 2026 3:42 PM"
  currency="USD"
  tax="4.76"
  payment-method="Visa ending in 4242">
</snice-receipt>
```

```typescript
const receipt = document.querySelector('snice-receipt');
receipt.merchant = { name: 'Coffee Shop', address: '789 Main St' };
receipt.items = [
  { name: 'Latte', quantity: 2, price: 5.50 },
  { name: 'Muffin', quantity: 1, price: 3.95 }
];
```

## Examples

### Thermal Printer Style

Use `variant="thermal"` for a monospace, narrow-width thermal printer aesthetic.

```html
<snice-receipt
  variant="thermal"
  receipt-number="00847"
  date="03/01/2026 14:30"
  payment-method="Cash">
</snice-receipt>
```

### Modern Variant

Use `variant="modern"` for a card-based style with rounded sections and shadows.

```html
<snice-receipt
  variant="modern"
  receipt-number="RCT-002"
  date="March 1, 2026"
  thank-you="Thanks for shopping with us!">
</snice-receipt>
```

### Multiple Tax Lines

Set `taxes` for multi-line tax breakdowns (overrides single `tax` property).

```typescript
receipt.taxes = [
  { label: 'GST', rate: 5, amount: 5.00 },
  { label: 'PST', rate: 7, amount: 7.00 }
];
```

### With Tip

Set `tip` for restaurant-style receipts with gratuity.

```typescript
receipt.items = [
  { name: 'Steak Dinner', quantity: 2, price: 32.00 },
  { name: 'Wine', quantity: 1, price: 45.00 }
];
receipt.tax = 10.90;
receipt.tip = 22.00;
```

### With QR Code

Set `show-qr` and use the `qr` slot for QR code content.

```html
<snice-receipt show-qr qr-position="bottom">
  <img slot="qr" src="/loyalty-qr.svg" alt="Loyalty QR" />
</snice-receipt>
```

### With Barcode

Use the `barcode` slot for barcode content.

```html
<snice-receipt receipt-number="RCT-005">
  <svg slot="barcode" viewBox="0 0 100 30"><!-- barcode SVG --></svg>
</snice-receipt>
```

### Print

Use `print()` to open a print dialog with receipt styles.

```typescript
receipt.print();
```

## Accessibility

- Semantic HTML structure with logical content order
- Print styles included for all variants
- Currency formatted using `Intl.NumberFormat` for locale-appropriate display
- Subtotal auto-calculated from items if not set; total auto-calculated as subtotal + tax - discount + tip
