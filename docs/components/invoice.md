# Invoice
`<snice-invoice>`

A professional invoice component with line items, automatic tax and discount calculations, status tracking, and QR code support. Supports multiple visual variants and customizable layouts.

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

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `invoiceNumber` | `string` | `''` | Invoice identifier |
| `date` | `string` | `''` | Invoice date (displayed as-is) |
| `dueDate` | `string` | `''` | Due date (displayed as-is) |
| `status` | `'draft' \| 'sent' \| 'paid' \| 'overdue' \| 'cancelled'` | `'draft'` | Invoice status with visual badge |
| `currency` | `string` | `'USD'` | Currency code for formatting |
| `taxRate` | `number` | `0` | Tax rate percentage applied to subtotal |
| `discount` | `number` | `0` | Discount percentage applied to subtotal |
| `from` | `InvoiceParty` | `{ name: '' }` | Sender/biller information |
| `to` | `InvoiceParty` | `{ name: '' }` | Recipient/customer information |
| `items` | `InvoiceItem[]` | `[]` | Line items for the invoice |
| `notes` | `string` | `''` | Additional notes section |
| `variant` | `'standard' \| 'modern' \| 'classic' \| 'minimal' \| 'detailed'` | `'standard'` | Visual style variant |
| `showQr` | `boolean` | `false` | Display QR code placeholder |
| `qrData` | `string` | `''` | Data for QR code |
| `qrPosition` | `'top-right' \| 'bottom-right' \| 'bottom-left' \| 'footer'` | `'bottom-right'` | QR code placement |

### InvoiceParty Interface

```typescript
interface InvoiceParty {
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  logo?: string;
}
```

### InvoiceItem Interface

```typescript
interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount?: number;  // Optional: calculated if not provided
  tax?: number;     // Optional: item-specific tax rate
}
```

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `print()` | `void` | Print the invoice |
| `toJSON()` | `object` | Export invoice data as JSON object including calculated totals |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `invoice-item-change` | `{ items, subtotal, tax, total }` | Fired when items array changes |
| `invoice-status-change` | `{ oldStatus, newStatus }` | Fired when status property changes |

## Slots

| Slot Name | Description |
|-----------|-------------|
| `qr` | QR code content. Use for payment QR codes or links. |
| (default) | Additional content rendered in the footer area |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--invoice-max-width` | `50rem` | Maximum width of invoice |
| `--invoice-padding` | `2rem` | Internal padding |
| `--invoice-bg` | `white` | Background color |
| `--invoice-text` | `rgb(23 23 23)` | Text color |
| `--invoice-text-secondary` | `rgb(82 82 82)` | Secondary text |
| `--invoice-accent` | `rgb(37 99 235)` | Accent color |
| `--invoice-border` | `rgb(226 226 226)` | Border color |
| `--invoice-border-radius` | `0.5rem` | Border radius |
| `--invoice-shadow` | `none` | Box shadow |
| `--invoice-table-header-bg` | `transparent` | Table header background |
| `--invoice-summary-width` | `16rem` | Summary column width |
| `--invoice-qr-size` | `6rem` | QR code size |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Root container |
| `header` | Invoice header section |
| `title` | Invoice title element |
| `status` | Status badge |
| `logo` | Company logo image |
| `meta` | Metadata container (invoice #, dates) |
| `parties` | From/To parties container |
| `party` | Individual party block |
| `party-label` | Party label ("From", "Bill To") |
| `party-name` | Party name |
| `party-detail` | Party details (address, email, phone) |
| `table` | Items table |
| `table-header` | Table header row |
| `table-row` | Table body rows |
| `table-cell` | Table cells |
| `summary` | Summary/totals section |
| `summary-row` | Summary rows |
| `summary-label` | Summary labels |
| `summary-value` | Summary values |
| `discount-row` | Discount row |
| `tax-row` | Tax row |
| `total` | Total row |
| `notes` | Notes section |
| `notes-label` | Notes heading |
| `notes-content` | Notes content |
| `qr-container` | QR code container |
| `qr` | QR code element |
| `footer` | Footer area |

## Basic Usage

```html
<snice-invoice
  invoice-number="INV-2026-001"
  date="Feb 27, 2026"
  due-date="Mar 27, 2026"
  status="sent"
  currency="USD"
  tax-rate="10"
  discount="5">
</snice-invoice>

<script>
  const inv = document.querySelector('snice-invoice');
  inv.from = { name: 'Acme Corp', address: '123 Business St' };
  inv.to = { name: 'Client Inc', address: '456 Market Ave' };
  inv.items = [
    { description: 'Web Development', quantity: 40, unitPrice: 150 },
    { description: 'UI Design', quantity: 20, unitPrice: 120 }
  ];
</script>
```

## Examples

### Basic Invoice

```html
<snice-invoice
  id="basic-invoice"
  invoice-number="INV-001"
  date="2026-03-01"
  due-date="2026-03-31"
  status="sent">
</snice-invoice>

<script>
  const invoice = document.getElementById('basic-invoice');
  invoice.from = { name: 'Your Company', email: 'billing@example.com' };
  invoice.to = { name: 'Client Name', email: 'client@example.com' };
  invoice.items = [
    { description: 'Consulting Services', quantity: 10, unitPrice: 100 }
  ];
</script>
```

### With Tax and Discount

```html
<snice-invoice
  id="tax-invoice"
  invoice-number="INV-002"
  currency="EUR"
  tax-rate="20"
  discount="10"
  notes="Thank you for your business!">
</snice-invoice>

<script>
  const inv = document.getElementById('tax-invoice');
  inv.from = { name: 'Euro Corp', address: 'Paris, France' };
  inv.to = { name: 'Global Client', address: 'Berlin, Germany' };
  inv.items = [
    { description: 'Product A', quantity: 5, unitPrice: 50 },
    { description: 'Product B', quantity: 2, unitPrice: 150, tax: 15 }
  ];
</script>
```

### Different Variants

```html
<!-- Modern variant -->
<snice-invoice variant="modern" invoice-number="INV-003"></snice-invoice>

<!-- Classic variant -->
<snice-invoice variant="classic" invoice-number="INV-004"></snice-invoice>

<!-- Minimal variant -->
<snice-invoice variant="minimal" invoice-number="INV-005"></snice-invoice>

<!-- Detailed variant with line numbers -->
<snice-invoice variant="detailed" invoice-number="INV-006"></snice-invoice>
```

### With QR Code

```html
<snice-invoice
  id="qr-invoice"
  invoice-number="INV-007"
  show-qr
  qr-position="top-right">
</snice-invoice>

<script>
  const qrInv = document.getElementById('qr-invoice');
  // Provide your own QR code in the slot
  qrInv.innerHTML = `
    <img slot="qr" src="/qr-code.svg" alt="Payment QR" />
  `;
</script>
```

### Programmatic Updates

```html
<snice-invoice id="dynamic-invoice"></snice-invoice>
<button onclick="addItem()">Add Item</button>
<button onclick="markPaid()">Mark Paid</button>

<script>
  const invoice = document.getElementById('dynamic-invoice');
  invoice.from = { name: 'My Company' };
  invoice.to = { name: 'Customer' };
  invoice.items = [];
  
  function addItem() {
    invoice.items = [
      ...invoice.items,
      { description: 'New Service', quantity: 1, unitPrice: 99 }
    ];
  }
  
  function markPaid() {
    invoice.status = 'paid';
  }
  
  invoice.addEventListener('invoice-status-change', (e) => {
    console.log('Status changed:', e.detail.oldStatus, '→', e.detail.newStatus);
  });
</script>
```

### Print Invoice

```html
<snice-invoice id="printable" invoice-number="INV-008"></snice-invoice>
<button onclick="document.getElementById('printable').print()">
  Print Invoice
</button>
```
