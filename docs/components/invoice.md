[//]: # (AI: For a low-token version of this doc, use docs/ai/components/invoice.md instead)

# Invoice

`<snice-invoice>`

A professional invoice document component with five visual variants, deep CSS theming, optional QR code support, and comprehensive print styles.

## Features

- **Five Variants**: Standard, modern, classic, minimal, and detailed layouts
- **Line Items Table**: Description, quantity, unit price, and amount columns
- **Tax & Discount**: Automatic calculations with configurable rates
- **Party Information**: Bill-from and bill-to address blocks with logo support
- **Status Badges**: Draft, sent, paid, overdue, and cancelled states
- **Currency Formatting**: Locale-aware currency display via `Intl.NumberFormat`
- **QR Code Support**: Optional QR code slot with 4 position options
- **Print Support**: Comprehensive `@media print` styles with page break management
- **Deep Theming**: 40+ CSS custom properties for complete visual control
- **CSS Parts**: Every meaningful element is exposed via `::part()` for external styling
- **JSON Export**: `toJSON()` returns complete invoice data with computed totals

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

### Variants

Use the `variant` attribute to change the invoice's visual style. Each variant has a dramatically different feel.

```html
<!-- Clean corporate grid layout -->
<snice-invoice variant="standard" invoice-number="INV-001"></snice-invoice>

<!-- Bold accent header, card sections, shadow -->
<snice-invoice variant="modern" invoice-number="INV-002"></snice-invoice>

<!-- Serif typography, ruled lines, formal borders -->
<snice-invoice variant="classic" invoice-number="INV-003"></snice-invoice>

<!-- Ultra-clean, whitespace-driven, no borders -->
<snice-invoice variant="minimal" invoice-number="INV-004"></snice-invoice>

<!-- Dense accounting-style with line numbers and striped rows -->
<snice-invoice variant="detailed" invoice-number="INV-005"></snice-invoice>
```

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

Set `tax-rate` and `discount` as percentages. Discount is applied before tax.

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
  // Subtotal: $4,000 -> Discount: $400 -> After: $3,600 -> Tax: $306 -> Total: $3,906
</script>
```

### With Company Logo

Pass a `logo` URL in the `from` party object.

```javascript
invoice.from = {
  name: 'Acme Corp',
  address: '123 Main St\nNew York, NY 10001',
  email: 'billing@acme.com',
  phone: '+1 (555) 123-4567',
  logo: 'https://example.com/logo.png'
};
```

### QR Code

Set `show-qr` to display a QR code area. Use the `qr` slot to provide custom QR content, or leave empty for a placeholder.

```html
<!-- With snice-qr-code component -->
<snice-invoice show-qr qr-position="footer" qr-data="https://pay.example.com/inv-001">
  <snice-qr-code slot="qr" value="https://pay.example.com/inv-001"></snice-qr-code>
</snice-invoice>
```

**QR Positions:**
- `top-right` — Positioned in the header area (absolute)
- `bottom-right` — Bottom-right corner of the invoice (absolute)
- `bottom-left` — Bottom-left corner of the invoice (absolute)
- `footer` — Inline after the notes section (static flow)

### Detailed Variant with Per-Item Tax

The `detailed` variant shows line numbers and supports per-item tax rates.

```javascript
invoice.variant = 'detailed';
invoice.items = [
  { description: 'Software License', quantity: 1, unitPrice: 999, tax: 10 },
  { description: 'Support Plan', quantity: 1, unitPrice: 299, tax: 0 }
];
```

### Notes / Payment Terms

Use the `notes` attribute for footer text.

```html
<snice-invoice
  notes="Payment due within 30 days. Late payments subject to 1.5% monthly interest.">
</snice-invoice>
```

### Custom Theming with CSS Variables

Completely retheme the invoice using CSS custom properties.

```css
snice-invoice {
  --invoice-accent: rgb(168 85 247);
  --invoice-header-bg: rgb(168 85 247);
  --invoice-header-text: white;
  --invoice-table-header-bg: rgb(243 232 255);
  --invoice-border-radius: 1rem;
  --invoice-shadow: 0 20px 40px rgb(168 85 247 / 0.15);
}
```

### Custom Styling with CSS Parts

Target specific elements using `::part()` selectors.

```css
snice-invoice::part(title) {
  font-size: 2rem;
  color: purple;
}

snice-invoice::part(total) {
  background: rgb(243 232 255);
  padding: 0.5rem;
  border-radius: 0.25rem;
}

snice-invoice::part(status) {
  border-radius: 999px;
}
```

### Export to JSON

```javascript
const data = invoice.toJSON();
// { invoiceNumber, date, dueDate, status, currency, taxRate, discount,
//   from, to, items, notes, variant, showQr, qrData, qrPosition,
//   subtotal, tax, discount_amount, total }
```

### Print

The component includes comprehensive `@media print` styles. Simply call `print()`.

```javascript
invoice.print();
```

Print styles automatically:
- Remove shadows, rounded corners, and background colors for crisp output
- Ensure high contrast (pure black on white)
- Convert status badges to bordered outlines
- Manage page breaks (avoid breaking inside sections)
- Repeat table headers on new pages

## Slots

| Name | Description |
|------|-------------|
| (default) | Additional content at the bottom of the invoice |
| `qr` | Custom QR code content (rendered when `show-qr` is set) |

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
| `variant` | `'standard' \| 'modern' \| 'classic' \| 'minimal' \| 'detailed'` | `'standard'` | Layout variant |
| `showQr` (attr: `show-qr`) | `boolean` | `false` | Show QR code area |
| `qrData` (attr: `qr-data`) | `string` | `''` | Data to encode in QR code |
| `qrPosition` (attr: `qr-position`) | `'top-right' \| 'bottom-right' \| 'bottom-left' \| 'footer'` | `'bottom-right'` | QR code position |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `invoice-item-change` | `{ items, subtotal, tax, total }` | Fired when items array changes |
| `invoice-status-change` | `{ oldStatus, newStatus }` | Fired when status changes |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `print()` | — | Triggers window.print() with @media print styles |
| `toJSON()` | — | Returns complete invoice data including computed totals |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Main invoice container |
| `header` | Header section (title, logo, meta, status) |
| `title` | "Invoice" heading |
| `status` | Status badge |
| `logo` | Company logo image |
| `meta` | Invoice number and dates |
| `parties` | From/To address section |
| `party` | Individual party block |
| `party-label` | "From" / "Bill To" label |
| `party-name` | Party company name |
| `party-detail` | Party address, email, phone |
| `table` | Line items table |
| `table-header` | Table thead element |
| `table-row` | Table body row (tr) |
| `table-cell` | Table body cell (td) |
| `summary` | Totals section |
| `summary-row` | Individual summary row |
| `summary-label` | Summary row label text |
| `summary-value` | Summary row amount |
| `discount-row` | Discount summary row |
| `tax-row` | Tax summary row |
| `total` | Grand total row |
| `notes` | Notes container |
| `notes-label` | "Notes" heading |
| `notes-content` | Notes text content |
| `qr` | QR code element |
| `qr-container` | QR wrapper with positioning |
| `footer` | Footer slot wrapper |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--invoice-max-width` | Maximum width of the invoice | `50rem` |
| `--invoice-padding` | Inner padding | `var(--snice-spacing-xl, 2rem)` |
| `--invoice-section-gap` | Gap between major sections | `var(--snice-spacing-xl, 2rem)` |
| `--invoice-bg` | Background color | `var(--snice-color-background, white)` |
| `--invoice-text` | Primary text color | `var(--snice-color-text, rgb(23 23 23))` |
| `--invoice-text-secondary` | Secondary text color | `var(--snice-color-text-secondary, ...)` |
| `--invoice-text-tertiary` | Tertiary text color | `var(--snice-color-text-tertiary, ...)` |
| `--invoice-accent` | Accent/brand color | `var(--snice-color-primary, rgb(37 99 235))` |
| `--invoice-border` | Border color | `var(--snice-color-border, rgb(226 226 226))` |
| `--invoice-bg-element` | Element background | `var(--snice-color-background-element, ...)` |
| `--invoice-success` | Success/discount color | `var(--snice-color-success, ...)` |
| `--invoice-danger` | Danger/overdue color | `var(--snice-color-danger, ...)` |
| `--invoice-header-bg` | Header background | `transparent` |
| `--invoice-header-text` | Header text color | `var(--invoice-text)` |
| `--invoice-header-padding` | Header padding | `0` |
| `--invoice-header-border` | Header bottom border | `none` |
| `--invoice-table-header-bg` | Table header background | `transparent` |
| `--invoice-table-header-text` | Table header text color | `var(--invoice-text-tertiary)` |
| `--invoice-table-stripe-bg` | Striped row background | `var(--invoice-bg-element)` |
| `--invoice-table-border` | Table border color | `var(--invoice-border)` |
| `--invoice-table-cell-padding` | Table cell padding | `0.75rem 0.5rem` |
| `--invoice-summary-width` | Summary section width | `16rem` |
| `--invoice-total-border` | Total row top border | `2px solid var(--invoice-border)` |
| `--invoice-total-font-size` | Total amount font size | `var(--snice-font-size-lg, 1.125rem)` |
| `--invoice-total-font-weight` | Total amount font weight | `var(--snice-font-weight-bold, 700)` |
| `--invoice-status-draft-bg` | Draft badge background | `rgb(229 231 235)` |
| `--invoice-status-draft-text` | Draft badge text | `rgb(55 65 81)` |
| `--invoice-status-sent-bg` | Sent badge background | `rgb(219 234 254)` |
| `--invoice-status-sent-text` | Sent badge text | `rgb(29 78 216)` |
| `--invoice-status-paid-bg` | Paid badge background | `rgb(220 252 231)` |
| `--invoice-status-paid-text` | Paid badge text | `rgb(21 128 61)` |
| `--invoice-status-overdue-bg` | Overdue badge background | `rgb(254 226 226)` |
| `--invoice-status-overdue-text` | Overdue badge text | `rgb(185 28 28)` |
| `--invoice-status-cancelled-bg` | Cancelled badge background | `rgb(243 244 246)` |
| `--invoice-status-cancelled-text` | Cancelled badge text | `rgb(107 114 128)` |
| `--invoice-font-family` | Font family override | `inherit` |
| `--invoice-title-font-size` | Title font size | `var(--snice-font-size-2xl, 1.5rem)` |
| `--invoice-title-font-weight` | Title font weight | `var(--snice-font-weight-bold, 700)` |
| `--invoice-label-font-size` | Label font size | `var(--snice-font-size-sm, 0.875rem)` |
| `--invoice-body-font-size` | Body text font size | `var(--snice-font-size-md, 1rem)` |
| `--invoice-notes-bg` | Notes background | `var(--invoice-bg-element)` |
| `--invoice-notes-border` | Notes border | `none` |
| `--invoice-notes-padding` | Notes padding | `var(--snice-spacing-md, 1rem)` |
| `--invoice-qr-size` | QR code container size | `6rem` |
| `--invoice-qr-border` | QR code border | `1px dashed var(--invoice-border)` |
| `--invoice-shadow` | Box shadow | `none` |
| `--invoice-border-width` | Outer border width | `1px` |
| `--invoice-border-color` | Outer border color | `var(--invoice-border)` |
| `--invoice-border-radius` | Outer border radius | `var(--snice-border-radius-lg, 0.5rem)` |

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

type InvoiceVariant = 'standard' | 'modern' | 'classic' | 'minimal' | 'detailed';
type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
type QrPosition = 'top-right' | 'bottom-right' | 'bottom-left' | 'footer';
```

## Best Practices

1. **Set items via JS**: The `items`, `from`, and `to` properties are objects and must be set programmatically
2. **Discount before tax**: Discount is applied to the subtotal, then tax is calculated on the discounted amount
3. **Use `amount` override**: For fixed-price line items, set `amount` directly instead of relying on quantity * unitPrice
4. **Currency codes**: Use ISO 4217 codes (USD, EUR, GBP, JPY, etc.)
5. **QR slot**: Pair with `<snice-qr-code>` for actual QR rendering; the placeholder is just a visual hint
6. **Print**: The `print()` method triggers `window.print()` which uses `@media print` CSS for optimal output
7. **Theming**: Use CSS custom properties for theme-level changes, `::part()` for structural/one-off styling
