<!-- AI: For a low-token version of this doc, use docs/ai/components/receipt.md instead -->

# Receipt Component

A transaction receipt component for displaying purchase details with merchant info, line items, totals, and payment method. Supports multiple visual variants including thermal printer style.

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

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `receiptNumber` | `string` | `''` | Receipt identifier |
| `date` | `string` | `''` | Receipt date/time (displayed as-is) |
| `currency` | `string` | `'USD'` | Currency code for formatting |
| `locale` | `string` | `''` | Locale for currency formatting |
| `merchant` | `ReceiptMerchant` | `{ name: '' }` | Merchant/store information |
| `items` | `ReceiptItem[]` | `[]` | Line items |
| `tax` | `number` | `0` | Tax amount (single tax) |
| `taxes` | `ReceiptTaxLine[]` | `[]` | Multiple tax lines |
| `subtotal` | `number` | `0` | Pre-tax subtotal (auto-calculated if 0) |
| `total` | `number` | `0` | Grand total (auto-calculated if 0) |
| `tip` | `number` | `0` | Tip/gratuity amount |
| `discount` | `number` | `0` | Discount amount |
| `discountLabel` | `string` | `'Discount'` | Label for discount line |
| `paymentMethod` | `string` | `''` | Payment method displayed |
| `paymentDetails` | `string` | `''` | Additional payment info |
| `variant` | `'standard' \| 'thermal' \| 'modern' \| 'minimal' \| 'detailed'` | `'standard'` | Visual style variant |
| `showQr` | `boolean` | `false` | Show QR code placeholder |
| `qrData` | `string` | `''` | QR code data |
| `qrPosition` | `'top' \| 'bottom' \| 'footer'` | `'bottom'` | QR code placement |
| `thankYou` | `string` | `'Thank you for your purchase!'` | Footer message |
| `cashier` | `string` | `''` | Cashier name |
| `terminalId` | `string` | `''` | Terminal/register identifier |

### ReceiptMerchant Interface

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
```

### ReceiptItem Interface

```typescript
interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  sku?: string;
  discount?: number;
  note?: string;
}
```

### ReceiptTaxLine Interface

```typescript
interface ReceiptTaxLine {
  label: string;
  rate?: number;
  amount: number;
}
```

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `print()` | `void` | Open print dialog with receipt styles |

## Slots

| Slot Name | Description |
|-----------|-------------|
| `qr` | QR code content |
| `barcode` | Barcode content (displayed near footer) |
| (default) | Additional content in footer |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--receipt-max-width` | `22rem` | Maximum width |
| `--receipt-padding` | `1.5rem` | Internal padding |
| `--receipt-bg` | `white` | Background color |
| `--receipt-text` | `rgb(23 23 23)` | Text color |
| `--receipt-text-secondary` | `rgb(82 82 82)` | Secondary text |
| `--receipt-border` | `rgb(226 226 226)` | Border color |
| `--receipt-border-radius` | `8px` | Border radius |
| `--receipt-divider-style` | `dashed` | Divider line style |
| `--receipt-merchant-font-size` | `1.25rem` | Merchant name size |
| `--receipt-total-font-size` | `1.125rem` | Total amount size |
| `--receipt-total-font-weight` | `700` | Total weight |
| `--receipt-thermal-font` | `'Courier New', monospace` | Thermal variant font |
| `--receipt-thermal-width` | `18rem` | Thermal variant width |
| `--receipt-thermal-bg` | `rgb(255 255 248)` | Thermal variant background |
| `--receipt-modern-radius` | `12px` | Modern variant radius |
| `--receipt-modern-shadow` | `0 4px 24px rgb(0 0 0 / 0.08)` | Modern variant shadow |
| `--receipt-qr-size` | `6rem` | QR code size |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Root container |
| `header` | Merchant header section |
| `logo` | Merchant logo image |
| `merchant-name` | Merchant name |
| `merchant-address` | Merchant address |
| `merchant-contact` | Contact info line |
| `divider` | Horizontal dividers |
| `meta` | Receipt metadata (number, date, etc.) |
| `receipt-number` | Receipt number |
| `date` | Receipt date |
| `items-header` | Items section header |
| `items` | Items container |
| `item` | Individual item row |
| `item-name` | Item name |
| `item-sku` | Item SKU |
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
rcpt.merchant = { name: 'Coffee Shop', address: '789 Main St' };
rcpt.items = [
  { name: 'Latte', quantity: 2, price: 5.50 },
  { name: 'Muffin', quantity: 1, price: 3.95 }
];
```

## Examples

### Standard Receipt

```html
<snice-receipt
  receipt-number="RCT-001"
  date="2026-03-01 2:30 PM"
  payment-method="Credit Card">
</snice-receipt>
```

```typescript
receipt.merchant = {
  name: 'My Store',
  address: '123 Main St',
  phone: '(555) 123-4567'
};
receipt.items = [
  { name: 'Item 1', quantity: 1, price: 19.99 },
  { name: 'Item 2', quantity: 2, price: 9.99 }
];
```

### Thermal Printer Style

```html
<snice-receipt
  variant="thermal"
  receipt-number="00847"
  date="03/01/2026 14:30"
  currency="USD"
  tax="2.10"
  payment-method="Cash">
</snice-receipt>
```

### Modern Variant

```html
<snice-receipt
  variant="modern"
  receipt-number="RCT-002"
  date="March 1, 2026"
  thank-you="Thanks for shopping with us!">
</snice-receipt>
```

### With Multiple Taxes

```html
<snice-receipt
  receipt-number="RCT-003"
  currency="CAD">
</snice-receipt>
```

```typescript
receipt.merchant = { name: 'Canadian Store' };
receipt.items = [{ name: 'Product', quantity: 1, price: 100 }];
receipt.taxes = [
  { label: 'GST', rate: 5, amount: 5.00 },
  { label: 'PST', rate: 7, amount: 7.00 }
];
```

### With Tip

```html
<snice-receipt
  receipt-number="T-128"
  date="2026-03-01"
  payment-method="Visa •••• 4242">
</snice-receipt>
```

```typescript
receipt.merchant = { name: 'Bistro Restaurant' };
receipt.items = [
  { name: 'Steak Dinner', quantity: 2, price: 32.00 },
  { name: 'Wine', quantity: 1, price: 45.00 }
];
receipt.subtotal = 109.00;
receipt.tax = 10.90;
receipt.tip = 22.00;  // 20% tip
receipt.total = 141.90;
```

### With QR Code

```html
<snice-receipt
  receipt-number="RCT-004"
  show-qr
  qr-position="top">
  <img slot="qr" src="/loyalty-qr.svg" alt="Loyalty QR" />
</snice-receipt>
```

### With Barcode

```html
<snice-receipt receipt-number="RCT-005">
  <svg slot="barcode" viewBox="0 0 100 30">
    <!-- Barcode SVG -->
  </svg>
</snice-receipt>
```

### Print Receipt

```html
<snice-receipt></snice-receipt>
<button>Print Receipt</button>
```

```typescript
receipt.print();
```
