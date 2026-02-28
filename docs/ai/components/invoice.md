# snice-invoice

Invoice display/generator with line items, tax, discount, and party info.

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
variant: InvoiceVariant = 'standard'   // 'standard' | 'compact' | 'detailed'
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

## Events

- `invoice-item-change` → `{ items, subtotal, tax, total }`
- `invoice-status-change` → `{ oldStatus, newStatus }`

## Methods

- `print()` - Opens print dialog for the invoice
- `toJSON()` - Returns full invoice data with computed totals

## Slots

- `(default)` - Extra content at bottom of invoice

## Usage

```html
<snice-invoice
  invoice-number="INV-001"
  date="2026-01-15"
  due-date="2026-02-15"
  status="sent"
  currency="USD"
  tax-rate="10"
  discount="5"
  notes="Payment due within 30 days">
</snice-invoice>

<script>
  const inv = document.querySelector('snice-invoice');
  inv.from = { name: 'Acme Corp', address: '123 Main St', email: 'billing@acme.com' };
  inv.to = { name: 'Client Inc', address: '456 Oak Ave' };
  inv.items = [
    { description: 'Web Development', quantity: 40, unitPrice: 150 },
    { description: 'Design Services', quantity: 10, unitPrice: 120 }
  ];
</script>
```

## CSS Parts

```css
::part(base)      /* Main container */
::part(header)    /* Header with title + meta */
::part(title)     /* "Invoice" heading */
::part(status)    /* Status badge */
::part(logo)      /* Company logo */
::part(meta)      /* Invoice number, dates */
::part(parties)   /* From/To section */
::part(party)     /* Individual party block */
::part(table)     /* Line items table */
::part(summary)   /* Totals section */
::part(total)     /* Grand total row */
::part(notes)     /* Notes section */
```

## Notes

- `amount` on item overrides `quantity * unitPrice` calculation
- Discount applied before tax
- Currency formatting via `Intl.NumberFormat`
- Compact variant reduces spacing; detailed variant shows per-item tax
