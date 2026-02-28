[//]: # (AI: For a low-token version of this doc, use docs/ai/components/receipt.md instead)

# Receipt

`<snice-receipt>`

A professional transaction receipt component with five visual variants, deep theming, optional QR code support, tip/discount/tax breakdown, and print-optimized output.

## Features

- **5 Variants**: Standard, thermal, modern, minimal, detailed — each with a dramatically different visual feel
- **Items List**: Product name, quantity, line total, optional SKU, notes, per-item discounts
- **Automatic Totals**: Subtotal, tax, discount, tip, and grand total — auto-computed or explicit
- **Multi-Tax Support**: Single tax amount or itemized tax lines with rates
- **Tip / Gratuity**: Optional tip row for restaurant-style receipts
- **Discount Support**: Global discount with customizable label
- **Merchant Info**: Name, address, logo, phone, email, website, tax ID
- **Payment Details**: Method and additional details (auth codes, change, etc.)
- **QR Code Slot**: Configurable position (top, bottom, footer) for payment/lookup QR codes
- **Barcode Slot**: Dedicated slot for barcode content
- **Print Styles**: `@media print` optimized per variant — thermal prints narrow, modern removes shadows
- **Deep Theming**: 30+ CSS custom properties and 25+ CSS parts for full customization

## Basic Usage

```typescript
import 'snice/components/receipt/snice-receipt';
```

```html
<snice-receipt
  receipt-number="REC-4521"
  date="2026-02-27 14:30"
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

The default variant — clean layout with dashed dividers, centered merchant header.

```html
<snice-receipt
  receipt-number="REC-001"
  date="2026-02-27 14:30"
  payment-method="Apple Pay">
</snice-receipt>

<script>
  const receipt = document.querySelector('snice-receipt');
  receipt.merchant = { name: 'Grocery Mart', phone: '555-0100' };
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

Use `variant="thermal"` for a narrow, monospace receipt mimicking thermal printer output with dotted dividers.

```html
<snice-receipt variant="thermal"
  receipt-number="T-9832"
  date="2026-02-27 09:15"
  cashier="Jane D."
  terminal-id="POS-04"
  payment-method="Cash">
</snice-receipt>
```

### Modern Variant

Use `variant="modern"` for a card-based design with rounded sections, subtle shadows, and accent-colored totals.

```html
<snice-receipt variant="modern"
  receipt-number="M-2024"
  date="2026-02-27"
  payment-method="Google Pay">
</snice-receipt>
```

### Minimal Variant

Use `variant="minimal"` for a stripped-down, elegant layout with just the essentials.

```html
<snice-receipt variant="minimal"
  receipt-number="MIN-001"
  date="2026-02-27"
  payment-method="Visa **** 4242">
</snice-receipt>
```

### Detailed Variant

Use `variant="detailed"` for itemized receipts with SKUs, per-item discounts, notes, and tax breakdowns.

```html
<snice-receipt variant="detailed"
  receipt-number="DTL-5001"
  date="2026-02-27 16:45"
  payment-method="Mastercard **** 8888">
</snice-receipt>

<script>
  const receipt = document.querySelector('snice-receipt');
  receipt.merchant = {
    name: 'Electronics Plus',
    address: '456 Tech Blvd\nSan Francisco, CA',
    phone: '555-0200',
    email: 'support@eplus.com',
    taxId: 'US-12345678'
  };
  receipt.items = [
    { name: 'USB-C Cable', quantity: 2, price: 12.99, sku: 'USB-C-3FT', discount: 2.00 },
    { name: 'Screen Protector', quantity: 1, price: 9.99, sku: 'SP-IPHONE15', note: 'Matte finish' }
  ];
  receipt.taxes = [
    { label: 'State Tax', rate: 7.25, amount: 2.46 },
    { label: 'City Tax', rate: 1.5, amount: 0.51 }
  ];
  receipt.discount = 5.00;
  receipt.discountLabel = 'Member Discount';
  receipt.total = 31.94;
</script>
```

### Restaurant Receipt with Tip

```html
<script>
  receipt.items = [
    { name: 'Grilled Salmon', quantity: 1, price: 24.00 },
    { name: 'Caesar Salad', quantity: 1, price: 12.00 },
    { name: 'Sparkling Water', quantity: 2, price: 4.50 }
  ];
  receipt.tax = 3.83;
  receipt.tip = 9.00;
  receipt.total = 57.83;
</script>
```

### With QR Code

Use `show-qr` and provide a QR component in the `qr` slot. Control position with `qr-position`.

```html
<snice-receipt show-qr qr-position="bottom"
  receipt-number="QR-001">
  <snice-qr-code slot="qr" value="https://receipt.example.com/QR-001"></snice-qr-code>
</snice-receipt>
```

### Auto-Computed Totals

When `subtotal` and `total` are left at 0, they are computed automatically from items, tax, discount, and tip.

```html
<script>
  receipt.items = [
    { name: 'Widget', quantity: 5, price: 10 },
    { name: 'Gadget', quantity: 2, price: 25 }
  ];
  receipt.tax = 8.50;
  receipt.tip = 5.00;
  receipt.discount = 10.00;
  // subtotal = 5*10 + 2*25 = 100
  // total = 100 + 8.50 - 10.00 + 5.00 = 103.50
</script>
```

### Custom Footer

```html
<snice-receipt thank-you="Thanks for dining with us!">
  <div>Returns accepted within 30 days with receipt.</div>
  <div>Visit us at www.example.com</div>
</snice-receipt>
```

### Print

```javascript
receipt.print();
```

## Slots

| Name | Description |
|------|-------------|
| (default) | Footer content below the thank-you message |
| `qr` | QR code content (rendered when `show-qr` is set) |
| `barcode` | Barcode content (always rendered area, visible when slotted) |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `receiptNumber` (attr: `receipt-number`) | `string` | `''` | Receipt identifier |
| `date` | `string` | `''` | Transaction date/time |
| `currency` | `string` | `'USD'` | ISO 4217 currency code |
| `locale` | `string` | `''` | Locale for currency formatting (e.g. `'en-US'`) |
| `merchant` | `ReceiptMerchant` | `{ name: '' }` | Merchant info (JS property only) |
| `items` | `ReceiptItem[]` | `[]` | Line items (JS property only) |
| `tax` | `number` | `0` | Single tax amount (absolute value) |
| `taxes` | `ReceiptTaxLine[]` | `[]` | Itemized tax lines (JS only, overrides `tax`) |
| `subtotal` | `number` | `0` | Subtotal (auto-computed from items if 0) |
| `total` | `number` | `0` | Total (auto-computed if 0) |
| `tip` | `number` | `0` | Tip/gratuity amount |
| `discount` | `number` | `0` | Discount amount |
| `discountLabel` (attr: `discount-label`) | `string` | `'Discount'` | Label for discount row |
| `paymentMethod` (attr: `payment-method`) | `string` | `''` | Payment method description |
| `paymentDetails` (attr: `payment-details`) | `string` | `''` | Additional payment info (auth code, change, etc.) |
| `variant` | `'standard' \| 'thermal' \| 'modern' \| 'minimal' \| 'detailed'` | `'standard'` | Visual variant |
| `showQr` (attr: `show-qr`) | `boolean` | `false` | Show the QR code slot |
| `qrData` (attr: `qr-data`) | `string` | `''` | QR code data string |
| `qrPosition` (attr: `qr-position`) | `'top' \| 'bottom' \| 'footer'` | `'bottom'` | Where to render QR slot |
| `thankYou` (attr: `thank-you`) | `string` | `'Thank you for your purchase!'` | Thank-you message |
| `cashier` | `string` | `''` | Cashier name |
| `terminalId` (attr: `terminal-id`) | `string` | `''` | Terminal/POS identifier |

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
| `merchant-address` | Merchant address text |
| `merchant-contact` | Phone/email/website line |
| `meta` | Receipt number, date, cashier, terminal section |
| `receipt-number` | Receipt number value |
| `date` | Date value |
| `items-header` | Column header row (Item / Amount) |
| `items` | Items list container |
| `item` | Individual item row |
| `item-name` | Item name text |
| `item-qty` | Quantity badge |
| `item-price` | Line total |
| `item-sku` | SKU text (detailed variant) |
| `totals` | Totals section |
| `subtotal-row` | Subtotal line |
| `tax-row` | Tax line(s) |
| `discount-row` | Discount line |
| `tip-row` | Tip/gratuity line |
| `total-row` | Grand total line |
| `payment` | Payment method section |
| `payment-method` | Payment method text |
| `payment-details` | Additional payment details |
| `footer` | Footer section |
| `thank-you` | Thank-you message |
| `qr-container` | QR code wrapper |
| `barcode-area` | Barcode wrapper |
| `divider` | Section dividers (dashed lines) |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--receipt-max-width` | Maximum receipt width | `22rem` |
| `--receipt-padding` | Inner padding | `1.5rem` |
| `--receipt-bg` | Background color | theme background |
| `--receipt-text` | Primary text color | theme text |
| `--receipt-text-secondary` | Secondary text color | theme secondary |
| `--receipt-text-tertiary` | Tertiary text color | theme tertiary |
| `--receipt-border` | Border color | theme border |
| `--receipt-bg-element` | Element background | theme bg-element |
| `--receipt-header-bg` | Header background | `transparent` |
| `--receipt-accent` | Accent color (modern variant) | theme primary |
| `--receipt-font-family` | Font override | `inherit` |
| `--receipt-merchant-font-size` | Merchant name size | `1.25rem` |
| `--receipt-item-font-size` | Item text size | `0.9375rem` |
| `--receipt-meta-font-size` | Meta text size | `0.8125rem` |
| `--receipt-total-font-size` | Grand total size | `1.125rem` |
| `--receipt-total-font-weight` | Grand total weight | `700` |
| `--receipt-footer-font-size` | Footer text size | `0.8125rem` |
| `--receipt-divider-style` | Divider line style | `dashed` |
| `--receipt-divider-color` | Divider color | border color |
| `--receipt-divider-width` | Divider thickness | `1px` |
| `--receipt-border-radius` | Container border radius | `8px` |
| `--receipt-border-color` | Container border color | border |
| `--receipt-shadow` | Box shadow | `none` |
| `--receipt-thermal-font` | Thermal font family | `Courier New, monospace` |
| `--receipt-thermal-width` | Thermal max width | `18rem` |
| `--receipt-thermal-bg` | Thermal background | `rgb(255 255 248)` |
| `--receipt-modern-radius` | Modern border radius | `12px` |
| `--receipt-modern-shadow` | Modern box shadow | subtle shadow |
| `--receipt-modern-section-bg` | Modern section background | element bg |
| `--receipt-modern-section-radius` | Modern section radius | `8px` |
| `--receipt-qr-size` | QR code dimensions | `6rem` |

## TypeScript Interfaces

```typescript
type ReceiptVariant = 'standard' | 'thermal' | 'modern' | 'minimal' | 'detailed';
type QrPosition = 'top' | 'bottom' | 'footer';

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

## Variant Comparison

| Feature | Standard | Thermal | Modern | Minimal | Detailed |
|---------|----------|---------|--------|---------|----------|
| Max width | 22rem | 18rem | 22rem | 20rem | 26rem |
| Font | System | Monospace | System | System | System |
| Dividers | Dashed | Dotted | None | Solid thin | Thick |
| Border | 1px solid | None | None | None | 1px solid |
| Shadow | None | Subtle | Card shadow | None | None |
| Logo | Yes | Yes | Yes | Hidden | Yes |
| Address | Yes | Yes | Yes | Hidden | Yes |
| SKU/Notes | Hidden | Hidden | Hidden | Hidden | Visible |
| Sections | Flat | Flat | Rounded cards | Flat | Flat |

## Best Practices

1. **Set complex data via JS**: `items`, `merchant`, and `taxes` are objects and must be set programmatically
2. **Tax is absolute**: Tax values are absolute amounts, not percentages
3. **Auto-compute or explicit**: Leave `subtotal`/`total` at 0 to auto-compute, or set them for precise control
4. **Thermal for POS**: Use the thermal variant for point-of-sale style receipts
5. **Detailed for e-commerce**: Use the detailed variant for online order confirmations with SKUs
6. **Modern for digital**: Use the modern variant for digital-first receipt displays
7. **QR for lookup**: Add a QR code linking to a digital receipt page for paper receipts
