# snice-receipt

Transaction receipt display with items, totals, and payment info.

## Properties

```typescript
receiptNumber: string = ''              // attribute: receipt-number
date: string = ''                       // Transaction date
currency: string = 'USD'               // ISO 4217 currency code
merchant: ReceiptMerchant = { name: '' } // Merchant info (JS only)
items: ReceiptItem[] = []               // Line items (JS only)
tax: number = 0                         // Tax amount (absolute, not percentage)
subtotal: number = 0                    // Auto-computed from items if 0
total: number = 0                       // Auto-computed as subtotal + tax if 0
paymentMethod: string = ''             // attribute: payment-method
variant: ReceiptVariant = 'standard'   // 'standard' | 'thermal'
```

## Types

```typescript
interface ReceiptMerchant {
  name: string; address?: string; logo?: string;
}
interface ReceiptItem {
  name: string; quantity: number; price: number;
}
```

## Methods

- `print()` - Opens print dialog

## Slots

- `(default)` - Footer content (default: "Thank you for your purchase!")

## Usage

```html
<snice-receipt
  receipt-number="REC-4521"
  date="2026-02-27"
  payment-method="Visa **** 4242"
  variant="standard">
</snice-receipt>

<script>
  const r = document.querySelector('snice-receipt');
  r.merchant = { name: 'Coffee House', address: '123 Brew St' };
  r.items = [
    { name: 'Cappuccino', quantity: 2, price: 4.50 },
    { name: 'Croissant', quantity: 1, price: 3.75 }
  ];
  r.tax = 1.15;
  r.total = 13.90;
</script>

<!-- Thermal variant -->
<snice-receipt variant="thermal"></snice-receipt>
```

## CSS Parts

```css
::part(base)          /* Main container */
::part(header)        /* Merchant section */
::part(logo)          /* Merchant logo */
::part(merchant-name) /* Merchant name */
::part(meta)          /* Receipt # and date */
::part(items)         /* Items list */
::part(item)          /* Individual item row */
::part(totals)        /* Totals section */
::part(total)         /* Grand total row */
::part(payment)       /* Payment method section */
::part(footer)        /* Footer/thank you */
```

## Notes

- Subtotal auto-computed from items if not explicitly set
- Total auto-computed as subtotal + tax if not explicitly set
- Quantity badge hidden when quantity is 1
- Thermal variant uses monospace font, narrower width, dotted dividers
