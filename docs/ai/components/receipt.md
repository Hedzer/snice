# snice-receipt

Transaction receipt display with items, totals, payment info, and multiple visual variants.

## Properties

```typescript
receiptNumber: string = ''                  // attribute: receipt-number
date: string = ''                           // Transaction date
currency: string = 'USD'                    // ISO 4217 currency code
locale: string = ''                         // Intl.NumberFormat locale
merchant: ReceiptMerchant = { name: '' }    // Merchant info (JS only)
items: ReceiptItem[] = []                   // Line items (JS only)
tax: number = 0                             // Single tax amount (absolute)
taxes: ReceiptTaxLine[] = []                // Multiple tax lines (JS only)
subtotal: number = 0                        // Auto-computed from items if 0
total: number = 0                           // Auto-computed as subtotal + tax - discount + tip if 0
tip: number = 0                             // Tip/gratuity amount
discount: number = 0                        // Discount amount
discountLabel: string = 'Discount'          // attribute: discount-label
paymentMethod: string = ''                  // attribute: payment-method
paymentDetails: string = ''                 // attribute: payment-details
variant: ReceiptVariant = 'standard'        // 'standard'|'thermal'|'modern'|'minimal'|'detailed'
showQr: boolean = false                     // attribute: show-qr — show QR slot
qrData: string = ''                         // attribute: qr-data
qrPosition: QrPosition = 'bottom'           // attribute: qr-position — 'top'|'bottom'|'footer'
thankYou: string = 'Thank you...'           // attribute: thank-you
cashier: string = ''                        // Cashier name
terminalId: string = ''                     // attribute: terminal-id
```

## Types

```typescript
type ReceiptVariant = 'standard' | 'thermal' | 'modern' | 'minimal' | 'detailed';
type QrPosition = 'top' | 'bottom' | 'footer';

interface ReceiptMerchant {
  name: string; address?: string; logo?: string;
  phone?: string; email?: string; website?: string; taxId?: string;
}
interface ReceiptItem {
  name: string; quantity: number; price: number;
  sku?: string; discount?: number; note?: string;
}
interface ReceiptTaxLine {
  label: string; rate?: number; amount: number;
}
```

## Slots

- `(default)` - Footer content below thank-you message
- `qr` - QR code content (shown when `show-qr` is set)
- `barcode` - Barcode content

## Methods

- `print()` - Opens print dialog

## CSS Parts

```
::part(base)              /* Main container */
::part(header)            /* Merchant section */
::part(logo)              /* Merchant logo */
::part(merchant-name)     /* Merchant name */
::part(merchant-address)  /* Merchant address */
::part(merchant-contact)  /* Phone/email/website line */
::part(meta)              /* Receipt # / date / cashier / terminal */
::part(receipt-number)    /* Receipt number value */
::part(date)              /* Date value */
::part(items-header)      /* Column header row */
::part(items)             /* Items list */
::part(item)              /* Individual item row */
::part(item-name)         /* Item name */
::part(item-qty)          /* Item quantity */
::part(item-price)        /* Item price */
::part(item-sku)          /* Item SKU (detailed variant) */
::part(totals)            /* Totals section */
::part(subtotal-row)      /* Subtotal line */
::part(tax-row)           /* Tax line(s) */
::part(discount-row)      /* Discount line */
::part(tip-row)           /* Tip line */
::part(total-row)         /* Grand total line */
::part(payment)           /* Payment section */
::part(payment-method)    /* Payment method text */
::part(payment-details)   /* Auth code / change etc */
::part(footer)            /* Footer section */
::part(thank-you)         /* Thank-you message */
::part(qr-container)      /* QR code wrapper */
::part(barcode-area)      /* Barcode wrapper */
::part(divider)           /* Section dividers */
```

## CSS Custom Properties

```css
--receipt-max-width          /* 22rem */
--receipt-padding            /* 1.5rem */
--receipt-bg                 /* background */
--receipt-text               /* text color */
--receipt-text-secondary     /* secondary text */
--receipt-text-tertiary      /* tertiary text */
--receipt-border             /* border color */
--receipt-bg-element         /* element background */
--receipt-header-bg          /* header background */
--receipt-accent             /* accent color (modern) */
--receipt-font-family        /* font override */
--receipt-merchant-font-size /* 1.25rem */
--receipt-item-font-size     /* 0.9375rem */
--receipt-meta-font-size     /* 0.8125rem */
--receipt-total-font-size    /* 1.125rem */
--receipt-total-font-weight  /* 700 */
--receipt-footer-font-size   /* 0.8125rem */
--receipt-divider-style      /* dashed */
--receipt-divider-color      /* border color */
--receipt-divider-width      /* 1px */
--receipt-border-radius      /* 8px */
--receipt-border-color       /* border */
--receipt-shadow             /* none */
--receipt-thermal-font       /* Courier New, monospace */
--receipt-thermal-width      /* 18rem */
--receipt-thermal-bg         /* rgb(255 255 248) */
--receipt-modern-radius      /* 12px */
--receipt-modern-shadow      /* 0 4px 24px ... */
--receipt-modern-section-bg  /* element bg */
--receipt-modern-section-radius /* 8px */
--receipt-qr-size            /* 6rem */
```

## Variants

- `standard` — Clean receipt with merchant header, items, totals, dashed dividers
- `thermal` — Monospace, narrow-width, dotted separators, thermal printer aesthetic
- `modern` — Card-based, rounded sections, shadows, accent-colored total
- `minimal` — Stripped to essentials, no logo/address, uppercase merchant, thin dividers
- `detailed` — Wide, grid meta, SKU/notes/per-item discounts, thick borders

## Usage

```html
<snice-receipt
  receipt-number="REC-4521"
  date="2026-02-27 14:30"
  payment-method="Visa **** 4242"
  variant="standard">
</snice-receipt>

<!-- Thermal -->
<snice-receipt variant="thermal"></snice-receipt>

<!-- Modern with QR -->
<snice-receipt variant="modern" show-qr qr-position="bottom">
  <snice-qr-code slot="qr" value="https://receipt.example.com/4521"></snice-qr-code>
</snice-receipt>
```

```typescript
receipt.merchant = { name: 'Coffee House', address: '123 Brew St', phone: '555-0100' };
receipt.items = [
  { name: 'Cappuccino', quantity: 2, price: 4.50 },
  { name: 'Croissant', quantity: 1, price: 3.75 }
];
receipt.tax = 1.15;
receipt.tip = 2.00;

// Detailed with tax breakdown
receipt.variant = 'detailed';
receipt.taxes = [
  { label: 'State Tax', rate: 6, amount: 3.00 },
  { label: 'City Tax', rate: 2, amount: 1.00 }
];
receipt.items = [{ name: 'Widget', quantity: 1, price: 50, sku: 'WDG-001', note: 'Gift wrapped' }];
```

## Notes

- Subtotal auto-computed from items (with per-item discount subtracted) if not explicitly set
- Total auto-computed as subtotal + tax - discount + tip if not explicitly set
- `taxes` array takes precedence over single `tax` property
- Quantity badge hidden when quantity is 1
- SKU, notes, per-item discounts only visible in `detailed` variant
- Thermal variant prints narrow; modern removes shadows for print
- `@media print` styles included for all variants
