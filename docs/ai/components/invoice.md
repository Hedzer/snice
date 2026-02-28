# snice-invoice

Professional invoice document with 5 variants, deep theming, QR support, print styles, and dual API (declarative + imperative).

## Child Elements

**`<snice-invoice-party>`** — Data container for from/to addresses (no shadow DOM).
```typescript
name: string = ''        // Party name
address: string = ''     // Address
email: string = ''       // Email
phone: string = ''       // Phone
logo: string = ''        // Logo URL
```

**`<snice-invoice-item>`** — Data container for line items (no shadow DOM).
```typescript
description: string = ''        // Item description
quantity: number = 0             // Quantity
unitPrice: number = 0            // attribute: unit-price — Unit price
amount: number | undefined       // Optional override for quantity * unitPrice
tax: number | undefined          // Optional per-item tax %
```

## Properties

```typescript
invoiceNumber: string = ''              // attribute: invoice-number
date: string = ''                       // Invoice date
dueDate: string = ''                    // attribute: due-date
status: InvoiceStatus = 'draft'         // 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
currency: string = 'USD'               // ISO 4217 currency code
taxRate: number = 0                     // attribute: tax-rate — percentage (e.g., 10 = 10%)
discount: number = 0                    // Discount percentage
from: InvoiceParty = { name: '' }      // Sender info (use setFrom() or <snice-invoice-party slot="from">)
to: InvoiceParty = { name: '' }        // Recipient info (use setTo() or <snice-invoice-party slot="to">)
items: InvoiceItem[] = []               // Line items (use setItems() or <snice-invoice-item>)
notes: string = ''                      // Footer notes/terms
variant: InvoiceVariant = 'standard'   // 'standard' | 'modern' | 'classic' | 'minimal' | 'detailed'
showQr: boolean = false                 // attribute: show-qr — show QR code area
qrData: string = ''                     // attribute: qr-data — data to encode
qrPosition: QrPosition = 'bottom-right' // attribute: qr-position — 'top-right' | 'bottom-right' | 'bottom-left' | 'footer'
```

## Setter Functions

```typescript
setFrom(party: InvoiceParty): void    // Set sender info imperatively
setTo(party: InvoiceParty): void      // Set recipient info imperatively
setItems(items: InvoiceItem[]): void  // Set line items imperatively (copies data)
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

## Dual API

- **Declarative**: Use `<snice-invoice-party>` and `<snice-invoice-item>` child elements
- **Imperative**: Use `setFrom()`, `setTo()`, `setItems()` setter functions
- Slot children take precedence over imperative data
- MutationObserver detects child add/remove/attribute changes

## Variants

- `standard` — Clean corporate grid layout
- `modern` — Bold accent header stripe, card sections, shadow
- `classic` — Serif typography, ruled lines, formal borders
- `minimal` — Ultra-clean whitespace, thin type, no borders
- `detailed` — Dense accounting-style, line numbers, striped rows

## Events

- `invoice-item-change` -> `{ items, subtotal, tax, total }`
- `invoice-status-change` -> `{ oldStatus, newStatus }`

## Methods

- `setFrom(party)` - Set sender party data
- `setTo(party)` - Set recipient party data
- `setItems(items)` - Set line items (creates copies)
- `print()` - Triggers window.print() with @media print styles
- `toJSON()` - Returns full invoice data with computed totals + variant/QR fields

## Slots

- `from` - `<snice-invoice-party>` for sender (hidden, data read by parent)
- `to` - `<snice-invoice-party>` for recipient (hidden, data read by parent)
- `(default)` - `<snice-invoice-item>` elements (hidden, data read by parent)
- `qr` - Custom QR code content (shown when show-qr is set)
- `notes` - Rich HTML notes content (alternative to `notes` attribute)
- `footer` - Footer content

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

### Declarative (recommended)
```html
<snice-invoice invoice-number="INV-001" date="2026-01-15" status="sent" tax-rate="10">
  <snice-invoice-party slot="from" name="Acme Corp" address="123 Main St" email="billing@acme.com"></snice-invoice-party>
  <snice-invoice-party slot="to" name="Client Inc" address="456 Oak Ave"></snice-invoice-party>
  <snice-invoice-item description="Web Development" quantity="40" unit-price="150"></snice-invoice-item>
  <snice-invoice-item description="Design Services" quantity="10" unit-price="120"></snice-invoice-item>
</snice-invoice>
```

### Imperative (setter functions)
```javascript
const inv = document.querySelector('snice-invoice');
inv.setFrom({ name: 'Acme Corp', address: '123 Main St' });
inv.setTo({ name: 'Client Inc', address: '456 Oak Ave' });
inv.setItems([
  { description: 'Web Development', quantity: 40, unitPrice: 150 },
  { description: 'Design Services', quantity: 10, unitPrice: 120 }
]);
```

## Notes

- `amount` on item overrides `quantity * unitPrice` calculation
- Discount applied before tax
- Currency formatting via `Intl.NumberFormat`
- `detailed` variant shows line numbers and per-item tax
- Slot children take precedence over imperative data
- MutationObserver auto-detects child element changes
- Print styles: high contrast, no shadows/backgrounds, page break management
- QR `<slot name="qr">` renders placeholder box when no content slotted
