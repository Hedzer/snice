# snice-invoice

Professional invoice document with 5 variants, deep theming, QR support, and print styles.

## Properties

```typescript
invoiceNumber: string = ''              // attribute: invoice-number
date: string = ''                       // Invoice date
dueDate: string = ''                    // attribute: due-date
status: InvoiceStatus = 'draft'         // 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
currency: string = 'USD'               // ISO 4217 currency code
taxRate: number = 0                     // attribute: tax-rate — percentage (e.g., 10 = 10%)
discount: number = 0                    // Discount percentage
from: InvoiceParty = { name: '' }      // Sender info
to: InvoiceParty = { name: '' }        // Recipient info
items: InvoiceItem[] = []               // Line items
notes: string = ''                      // Footer notes/terms
variant: InvoiceVariant = 'standard'   // 'standard' | 'modern' | 'classic' | 'minimal' | 'detailed'
showQr: boolean = false                 // attribute: show-qr — show QR code area
qrData: string = ''                     // attribute: qr-data — data to encode
qrPosition: QrPosition = 'bottom-right' // attribute: qr-position — 'top-right' | 'bottom-right' | 'bottom-left' | 'footer'
```

## Types

```typescript
interface InvoiceParty {
  name: string; address?: string; email?: string; phone?: string; logo?: string;
}
interface InvoiceItem {
  description: string; quantity: number; unitPrice: number; amount?: number; tax?: number;
}
```

## Variants

- `standard` — Clean corporate grid layout
- `modern` — Bold accent header stripe, card sections, shadow
- `classic` — Serif typography, ruled lines, formal borders
- `minimal` — Ultra-clean whitespace, thin type, no borders
- `detailed` — Dense accounting-style, line numbers, striped rows

## Slots

- `qr` - Custom QR code content (shown when show-qr is set)
- `(default)` - Footer content

## Events

- `invoice-item-change` -> `{ items: InvoiceItem[], subtotal: number, tax: number, total: number }`
- `invoice-status-change` -> `{ oldStatus: InvoiceStatus, newStatus: InvoiceStatus }`

## Methods

- `print()` - Triggers window.print() with @media print styles
- `toJSON()` - Returns full invoice data with computed totals

## CSS Parts

`base`, `header`, `title`, `status`, `logo`, `meta`, `parties`, `party`, `party-label`, `party-name`, `party-detail`, `table`, `table-header`, `table-row`, `table-cell`, `summary`, `summary-row`, `summary-label`, `summary-value`, `discount-row`, `tax-row`, `total`, `notes`, `notes-label`, `notes-content`, `qr`, `qr-container`, `footer`

## Usage

```typescript
inv.from = { name: 'Acme Corp', address: '123 Main St', email: 'billing@acme.com' };
inv.to = { name: 'Client Inc', address: '456 Oak Ave' };
inv.items = [
  { description: 'Web Development', quantity: 40, unitPrice: 150 },
  { description: 'Design Services', quantity: 10, unitPrice: 120 }
];
```

```html
<snice-invoice
  invoice-number="INV-001"
  date="2026-01-15"
  due-date="2026-02-15"
  status="sent"
  tax-rate="10"
  currency="USD">
</snice-invoice>
```

## Notes

- `amount` on item overrides `quantity * unitPrice` calculation
- Discount applied before tax
- Currency formatting via `Intl.NumberFormat`
- `detailed` variant shows line numbers and per-item tax
- Print styles: high contrast, no shadows/backgrounds, page break management
- QR `<slot name="qr">` renders placeholder box when no content slotted
