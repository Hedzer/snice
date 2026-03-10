# snice-receipt

Transaction receipt display with items, totals, payment info, and multiple visual variants.

## Properties

```typescript
receiptNumber: string = '';                  // attr: receipt-number
date: string = '';
currency: string = 'USD';
locale: string = '';                         // Intl.NumberFormat locale
merchant: ReceiptMerchant = { name: '' };    // JS only
items: ReceiptItem[] = [];                   // JS only
tax: number = 0;
taxes: ReceiptTaxLine[] = [];                // JS only, overrides tax
subtotal: number = 0;                        // auto-computed from items if 0
total: number = 0;                           // auto-computed if 0
tip: number = 0;
discount: number = 0;
discountLabel: string = 'Discount';          // attr: discount-label
paymentMethod: string = '';                  // attr: payment-method
paymentDetails: string = '';                 // attr: payment-details
variant: 'standard'|'thermal'|'modern'|'minimal'|'detailed' = 'standard';
showQr: boolean = false;                     // attr: show-qr
qrData: string = '';                         // attr: qr-data
qrPosition: 'top'|'bottom'|'footer' = 'bottom'; // attr: qr-position
thankYou: string = 'Thank you for your purchase!'; // attr: thank-you
cashier: string = '';
terminalId: string = '';                     // attr: terminal-id
```

## Types

```typescript
interface ReceiptMerchant {
  name: string; address?: string; logo?: string;
  phone?: string; email?: string; website?: string; taxId?: string;
}
interface ReceiptItem {
  name: string; quantity: number; price: number;
  sku?: string; discount?: number; note?: string;
}
interface ReceiptTaxLine { label: string; rate?: number; amount: number; }
```

## Methods

- `print()` - Opens print dialog

## Slots

- `(default)` - Footer content below thank-you message
- `qr` - QR code content (shown when `show-qr` is set)
- `barcode` - Barcode content

## CSS Parts

- `base` - Root container
- `divider` - Section dividers
- `header`, `logo`, `merchant-name`, `merchant-address`, `merchant-contact` - Merchant section
- `meta`, `receipt-number`, `date` - Metadata section
- `items-header`, `items`, `item`, `item-name`, `item-sku`, `item-qty`, `item-price` - Items section
- `totals`, `subtotal-row`, `discount-row`, `tax-row`, `tip-row`, `total-row` - Totals section
- `payment`, `payment-method`, `payment-details` - Payment section
- `qr-container`, `barcode-area`, `footer`, `thank-you` - Footer section

## Basic Usage

```html
<snice-receipt
  receipt-number="REC-4521"
  date="2026-02-27 14:30"
  payment-method="Visa **** 4242"
  variant="standard">
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

// Multiple taxes
receipt.taxes = [
  { label: 'State Tax', rate: 6, amount: 3.00 },
  { label: 'City Tax', rate: 2, amount: 1.00 }
];
```

## Variants

- `standard` - Clean receipt with dashed dividers
- `thermal` - Monospace, narrow-width, thermal printer aesthetic
- `modern` - Card-based, rounded sections, shadows
- `minimal` - Stripped to essentials
- `detailed` - Wide, grid meta, SKU/notes/per-item discounts

## Notes

- Subtotal auto-computed from items if not set
- Total auto-computed as subtotal + tax - discount + tip if not set
- `taxes` array overrides single `tax` property
- SKU, notes, per-item discounts only in `detailed` variant
- Print styles included for all variants
