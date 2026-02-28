[//]: # (AI: For a low-token version of this doc, use docs/ai/components/invoice.md instead)

# Invoice

`<snice-invoice>`

A full-featured invoice display component with line items, tax/discount calculations, party information, and status tracking.

## Features

- **Line Items Table**: Description, quantity, unit price, and amount columns
- **Tax & Discount**: Automatic calculations with configurable rates
- **Party Information**: Bill-from and bill-to address blocks
- **Status Badges**: Draft, sent, paid, overdue, and cancelled states
- **Currency Formatting**: Locale-aware currency display via `Intl.NumberFormat`
- **Print Support**: Built-in `print()` method for print-friendly output
- **JSON Export**: `toJSON()` returns complete invoice data with computed totals
- **Three Variants**: Standard, compact, and detailed layouts

## Basic Usage

```typescript
import 'snice/components/invoice/snice-invoice';
```

```html
<snice-invoice
  invoice-number="INV-001"
  date="2026-01-15"
  due-date="2026-02-15"
  status="sent">
</snice-invoice>

<script>
  const invoice = document.querySelector('snice-invoice');
  invoice.from = { name: 'Acme Corp', address: '123 Main St\nNew York, NY 10001' };
  invoice.to = { name: 'Client Inc', address: '456 Oak Ave\nSan Francisco, CA 94102' };
  invoice.items = [
    { description: 'Web Development', quantity: 40, unitPrice: 150 },
    { description: 'Design Services', quantity: 10, unitPrice: 120 }
  ];
</script>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/invoice/snice-invoice';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-invoice.min.js"></script>
```

## Examples

### Status Badges

Use the `status` attribute to display the invoice state.

```html
<snice-invoice status="draft" invoice-number="INV-001"></snice-invoice>
<snice-invoice status="sent" invoice-number="INV-002"></snice-invoice>
<snice-invoice status="paid" invoice-number="INV-003"></snice-invoice>
<snice-invoice status="overdue" invoice-number="INV-004"></snice-invoice>
<snice-invoice status="cancelled" invoice-number="INV-005"></snice-invoice>
```

### Tax and Discount

Set `tax-rate` and `discount` as percentages.

```html
<snice-invoice
  invoice-number="INV-010"
  tax-rate="8.5"
  discount="10">
</snice-invoice>

<script>
  const inv = document.querySelector('snice-invoice');
  inv.items = [
    { description: 'Consulting', quantity: 20, unitPrice: 200 }
  ];
  // Subtotal: $4,000 → Discount: $400 → After: $3,600 → Tax: $306 → Total: $3,906
</script>
```

### With Company Logo

Pass a `logo` URL in the `from` party object.

```html
<script>
  invoice.from = {
    name: 'Acme Corp',
    address: '123 Main St\nNew York, NY 10001',
    email: 'billing@acme.com',
    phone: '+1 (555) 123-4567',
    logo: 'https://example.com/logo.png'
  };
</script>
```

### Compact Variant

Use `variant="compact"` for a more condensed layout.

```html
<snice-invoice variant="compact" invoice-number="INV-020"></snice-invoice>
```

### Detailed Variant

Use `variant="detailed"` to show per-item tax rates.

```html
<script>
  invoice.variant = 'detailed';
  invoice.items = [
    { description: 'Software License', quantity: 1, unitPrice: 999, tax: 10 },
    { description: 'Support Plan', quantity: 1, unitPrice: 299, tax: 0 }
  ];
</script>
```

### Notes / Payment Terms

Use the `notes` attribute for footer text.

```html
<snice-invoice
  notes="Payment due within 30 days. Late payments subject to 1.5% monthly interest.">
</snice-invoice>
```

### Export to JSON

```javascript
const data = invoice.toJSON();
console.log(data);
// { invoiceNumber, date, dueDate, status, currency, taxRate, discount,
//   from, to, items, notes, subtotal, tax, discount_amount, total }
```

### Print

```javascript
invoice.print();
```

## Slots

| Name | Description |
|------|-------------|
| (default) | Additional content at the bottom of the invoice |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `invoiceNumber` (attr: `invoice-number`) | `string` | `''` | Invoice identifier |
| `date` | `string` | `''` | Invoice date |
| `dueDate` (attr: `due-date`) | `string` | `''` | Payment due date |
| `status` | `'draft' \| 'sent' \| 'paid' \| 'overdue' \| 'cancelled'` | `'draft'` | Invoice status |
| `currency` | `string` | `'USD'` | ISO 4217 currency code |
| `taxRate` (attr: `tax-rate`) | `number` | `0` | Tax rate percentage |
| `discount` | `number` | `0` | Discount percentage |
| `from` | `InvoiceParty` | `{ name: '' }` | Sender information (JS property only) |
| `to` | `InvoiceParty` | `{ name: '' }` | Recipient information (JS property only) |
| `items` | `InvoiceItem[]` | `[]` | Line items (JS property only) |
| `notes` | `string` | `''` | Footer notes or payment terms |
| `variant` | `'standard' \| 'compact' \| 'detailed'` | `'standard'` | Layout variant |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `invoice-item-change` | `{ items, subtotal, tax, total }` | Fired when items array changes |
| `invoice-status-change` | `{ oldStatus, newStatus }` | Fired when status changes |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `print()` | — | Opens a print dialog for the invoice |
| `toJSON()` | — | Returns complete invoice data including computed totals |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Main invoice container |
| `header` | Header section (title, logo, meta) |
| `title` | "Invoice" heading |
| `status` | Status badge |
| `logo` | Company logo image |
| `meta` | Invoice number and dates |
| `parties` | From/To address section |
| `party` | Individual party block |
| `table` | Line items table |
| `summary` | Totals section |
| `total` | Grand total row |
| `notes` | Notes section |

## TypeScript Interfaces

```typescript
interface InvoiceParty {
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  logo?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount?: number;  // overrides quantity * unitPrice
  tax?: number;     // per-item tax % (shown in detailed variant)
}
```

## Theming

The component uses these CSS custom properties:

```css
--snice-color-background
--snice-color-background-element
--snice-color-text
--snice-color-text-secondary
--snice-color-text-tertiary
--snice-color-border
--snice-color-primary
--snice-color-success
--snice-color-danger
--snice-spacing-*
--snice-font-size-*
--snice-font-weight-*
--snice-border-radius-*
```

## Best Practices

1. **Set items via JS**: The `items`, `from`, and `to` properties are objects and must be set programmatically
2. **Discount before tax**: Discount is applied to the subtotal, then tax is calculated on the discounted amount
3. **Use `amount` override**: For fixed-price line items, set `amount` directly instead of relying on quantity * unitPrice
4. **Currency codes**: Use ISO 4217 codes (USD, EUR, GBP, JPY, etc.)
