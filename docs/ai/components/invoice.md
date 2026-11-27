# snice-invoice

Professional invoice document with 5 variants, deep theming, QR support, and print styles.

## Properties

```typescript
invoiceNumber: string = ''              // attr: invoice-number
date: string = ''
dueDate: string = ''                    // attr: due-date
status: InvoiceStatus = 'draft'         // 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
currency: string = 'USD'               // ISO 4217 currency code
taxRate: number = 0                     // attr: tax-rate — percentage
discount: number = 0                    // percentage
from: InvoiceParty = { name: '' }      // attribute: false
to: InvoiceParty = { name: '' }        // attribute: false
items: InvoiceItem[] = []               // attribute: false
notes: string = ''
variant: InvoiceVariant = 'standard'   // 'standard' | 'modern' | 'classic' | 'minimal' | 'detailed' | 'paper' | 'ink' | 'ledger' | 'ticket'
showQr: boolean = false                 // attr: show-qr
qrData: string = ''
qrPosition: QrPosition = 'bottom-right' // 'top-right' | 'bottom-right' | 'bottom-left' | 'footer'
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

## Methods

- `print()` - Triggers window.print() with @media print styles
- `toJSON()` - Returns full invoice data with computed totals

## Events

- `invoice-item-change` → `{ items: InvoiceItem[], subtotal: number, tax: number, total: number }`
- `invoice-status-change` → `{ oldStatus: InvoiceStatus, newStatus: InvoiceStatus }`

## Slots

- `logo`, `title`, `status`, `parties` - replace the matching header regions
- `before-items` / `after-items` - insert around the line-item table
- `notes` - appended to the notes area
- `qr` - Custom QR code content (shown when show-qr is set)
- `(default)` - Footer content

## CSS Parts

- `base` - Root container
- `header` - Invoice header section
- `header-left` - Logo/title/status column of the header
- `title` - Invoice title element
- `status` - Status badge
- `logo` - Company logo image
- `meta` - Metadata container (invoice #, dates)
- `meta-row` - One metadata line
- `meta-label` - Metadata label text
- `meta-value` - Metadata value text
- `parties` - From/To parties container
- `party` - Individual party block
- `party-label` - Party label ("From", "Bill To")
- `party-name` - Party name
- `party-detail` - Party details (address, email, phone)
- `table` - Items table
- `table-header` - Table head
- `table-header-row` - Table head row
- `table-header-cell` - Table head cell
- `table-body` - Table body
- `table-row` - Table body rows
- `table-cell` - Table cells
- `line-number` - Line number inside the first detailed cell
- `item-tax` - Per-item tax note
- `summary` - Summary/totals section
- `summary-table` - Summary rows container
- `summary-row` - Summary rows
- `summary-label` - Summary labels
- `summary-value` - Summary values
- `discount-row` - Discount row
- `tax-row` - Tax row
- `total` - Total row
- `notes` - Notes section
- `notes-label` - Notes heading
- `notes-content` - Notes content
- `qr-container` - QR code container
- `qr` - QR code element
- `qr-placeholder` - Default QR placeholder box
- `footer` - Footer area

State tokens:

- `status-draft` / `status-sent` / `status-paid` / `status-overdue` / `status-cancelled` - Added to `status` for the current status
- `table-cell-line` - Added to the line-number `table-cell`
- `table-cell-description` - Added to the description `table-cell`
- `table-cell-qty` - Added to the quantity `table-cell`
- `table-cell-price` - Added to the unit-price `table-cell`
- `table-cell-amount` - Added to the line-amount `table-cell`
- `qr-top-right` / `qr-bottom-right` / `qr-bottom-left` / `qr-footer` - Added to `qr-container` for the current `qr-position`

## CSS Custom Properties

`--invoice-max-width`, `--invoice-padding`, `--invoice-bg`, `--invoice-text`, `--invoice-text-secondary`, `--invoice-accent`, `--invoice-border`, `--invoice-border-radius`, `--invoice-shadow`, `--invoice-table-header-bg`, `--invoice-summary-width`, `--invoice-qr-size`

## Basic Usage

```typescript
import 'snice/components/invoice/snice-invoice';
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

```typescript
inv.from = { name: 'Acme Corp', address: '123 Main St', email: 'billing@acme.com' };
inv.to = { name: 'Client Inc', address: '456 Oak Ave' };
inv.items = [
  { description: 'Web Development', quantity: 40, unitPrice: 150 },
  { description: 'Design Services', quantity: 10, unitPrice: 120 }
];
```

## Notes

- `amount` on item overrides `quantity * unitPrice` calculation
- Discount applied before tax
- Currency formatting via `Intl.NumberFormat`
- `detailed` variant shows line numbers and per-item tax
- Print styles: high contrast, no shadows/backgrounds, page break management
