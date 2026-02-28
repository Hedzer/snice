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
from: InvoiceParty = { name: '' }      // Sender info (JS only)
to: InvoiceParty = { name: '' }        // Recipient info (JS only)
items: InvoiceItem[] = []               // Line items (JS only)
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

## Events

- `invoice-item-change` → `{ items, subtotal, tax, total }`
- `invoice-status-change` → `{ oldStatus, newStatus }`

## Methods

- `print()` - Triggers window.print() with @media print styles
- `toJSON()` - Returns full invoice data with computed totals + variant/QR fields

## Slots

- `(default)` - Extra content at bottom of invoice
- `qr` - Custom QR code content (shown when show-qr is set)

## CSS Parts

```css
::part(base)           /* Main container */
::part(header)         /* Header section */
::part(title)          /* "Invoice" heading */
::part(status)         /* Status badge */
::part(logo)           /* Company logo */
::part(meta)           /* Invoice number, dates */
::part(parties)        /* From/To section */
::part(party)          /* Individual party block */
::part(party-label)    /* "From" / "Bill To" label */
::part(party-name)     /* Party company name */
::part(party-detail)   /* Party address/email/phone */
::part(table)          /* Line items table */
::part(table-header)   /* Table thead */
::part(table-row)      /* Table tbody tr */
::part(table-cell)     /* Table td */
::part(summary)        /* Totals section */
::part(summary-row)    /* Individual summary row */
::part(summary-label)  /* Summary row label */
::part(summary-value)  /* Summary row value */
::part(subtotal)       /* Subtotal row (alias for first summary-row) */
::part(discount-row)   /* Discount row */
::part(tax-row)        /* Tax row */
::part(total)          /* Grand total row */
::part(notes)          /* Notes container */
::part(notes-label)    /* "Notes" label */
::part(notes-content)  /* Notes text */
::part(qr)             /* QR code element */
::part(qr-container)   /* QR wrapper with positioning */
::part(footer)         /* Footer slot wrapper */
```

## CSS Custom Properties

```css
/* Layout */
--invoice-max-width: 50rem
--invoice-padding: var(--snice-spacing-xl, 2rem)
--invoice-section-gap: var(--snice-spacing-xl, 2rem)

/* Colors */
--invoice-bg, --invoice-text, --invoice-text-secondary, --invoice-text-tertiary
--invoice-accent, --invoice-border, --invoice-bg-element
--invoice-success, --invoice-danger

/* Header */
--invoice-header-bg, --invoice-header-text, --invoice-header-padding, --invoice-header-border

/* Table */
--invoice-table-header-bg, --invoice-table-header-text
--invoice-table-stripe-bg, --invoice-table-border, --invoice-table-cell-padding

/* Summary */
--invoice-summary-width, --invoice-total-border, --invoice-total-font-size, --invoice-total-font-weight

/* Status badges */
--invoice-status-{draft|sent|paid|overdue|cancelled}-{bg|text}

/* Typography */
--invoice-font-family, --invoice-title-font-size, --invoice-title-font-weight
--invoice-label-font-size, --invoice-body-font-size

/* Notes */
--invoice-notes-bg, --invoice-notes-border, --invoice-notes-padding

/* QR */
--invoice-qr-size: 6rem, --invoice-qr-border

/* Shadow/border */
--invoice-shadow, --invoice-border-width, --invoice-border-color, --invoice-border-radius
```

## Usage

```html
<snice-invoice
  invoice-number="INV-001"
  date="2026-01-15"
  due-date="2026-02-15"
  status="sent"
  variant="modern"
  currency="USD"
  tax-rate="10"
  discount="5"
  show-qr
  qr-data="https://pay.example.com/inv-001"
  qr-position="footer"
  notes="Payment due within 30 days">
  <snice-qr-code slot="qr" value="https://pay.example.com/inv-001"></snice-qr-code>
</snice-invoice>

<script>
  const inv = document.querySelector('snice-invoice');
  inv.from = { name: 'Acme Corp', address: '123 Main St', email: 'billing@acme.com', logo: 'logo.png' };
  inv.to = { name: 'Client Inc', address: '456 Oak Ave' };
  inv.items = [
    { description: 'Web Development', quantity: 40, unitPrice: 150 },
    { description: 'Design Services', quantity: 10, unitPrice: 120 }
  ];
</script>
```

## Notes

- `amount` on item overrides `quantity * unitPrice` calculation
- Discount applied before tax
- Currency formatting via `Intl.NumberFormat`
- `detailed` variant shows line numbers and per-item tax
- `modern` variant: accent-colored header, card sections, shadow
- `classic` variant: serif font, double-ruled lines, formal
- `minimal` variant: no borders, lightweight typography, whitespace-driven
- Print styles: high contrast, no shadows/backgrounds, page break management
- QR `<slot name="qr">` renders placeholder box when no content slotted
