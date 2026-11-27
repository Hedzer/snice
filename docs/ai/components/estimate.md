# snice-estimate

Professional estimate/quote document with from/to parties, line items, optional items toggle, and QR code.

## Properties

```typescript
estimateNumber: string = '';              // attribute: estimate-number
date: string = '';
expiryDate: string = '';                  // attribute: expiry-date
status: EstimateStatus = 'draft';         // 'draft'|'sent'|'accepted'|'declined'|'expired'
currency: string = '$';
taxRate: number = 0;                      // attribute: tax-rate
discount: number = 0;
notes: string = '';
terms: string = '';
variant: EstimateVariant = 'standard';    // 'standard'|'comparison'|'professional'|'creative'|'minimal'
showQr: boolean = false;                  // attribute: show-qr
qrData: string = '';                      // attribute: qr-data
qrPosition: QrPosition = 'top-right';    // attribute: qr-position — 'top-right'|'bottom-right'|'footer'
from: EstimateParty | null = null;        // JS only
to: EstimateParty | null = null;          // JS only
items: EstimateItem[] = [];               // JS only
```

## Methods

- `print()` - Trigger browser print
- `toJSON(): EstimateJSON` - Returns full estimate data with computed totals

## Events

- `estimate-accept` → `{ estimateNumber: string; items: EstimateItem[]; total: number }`
- `estimate-decline` → `{ estimateNumber: string }`
- `item-toggle` → `{ index: number; item: EstimateItem; included: boolean }`

## Slots

- `logo` - Custom logo content
- `qr` - Custom QR code content
- `footer` - Footer content

## CSS Parts

- `base` - Root container
- `header` - Header section
- `header-left` - Header column holding the logo, title and date
- `header-right` - Header column holding the status and expiry
- `logo` - Logo slot container
- `title` - Estimate title
- `meta` - Date meta
- `status` - Status badge
- `expiry` - Expiry date container
- `expiry-date` - Expiry date value
- `qr-container` - QR code container
- `qr` - QR code element
- `parties` - From/To section
- `party` - Individual party
- `party-label` - Party label ("From", "To")
- `party-name` - Party name
- `party-detail` - Party details
- `table` - Items table section
- `table-inner` - The `<table>` element inside `table`
- `table-header` - Table header row
- `table-header-cell` - A header cell (also carries `table-cell`)
- `table-row` - Table body rows
- `table-cell` - Table cells
- `badge` - A small inline tag such as the optional-item tag
- `optional-tag` - The "optional" tag on an optional item
- `item-toggle` - Optional item toggle button
- `summary` - Totals section
- `summary-inner` - Inner wrapper of the totals section
- `summary-label` - Label span of a totals row
- `summary-value` - Value span of a totals row
- `subtotal` - Subtotal row
- `discount-row` - Discount row
- `tax-row` - Tax row
- `total` - Grand total row
- `notes` - Notes section
- `notes-label` - Notes heading
- `notes-content` - Notes text
- `terms` - Terms section
- `terms-label` - Terms heading
- `terms-content` - Terms text
- `actions` - Action buttons container
- `accept-button` - Accept estimate button
- `decline-button` - Decline estimate button
- `comparison` - Comparison view container
- `option` - Comparison option card
- `option-title` - Comparison option title
- `option-total` - Comparison option total row
- `option-button` - Select option button
- `footer` - Footer area

State tokens:

- `status-draft` - Added to `status` while `status` is `draft`
- `status-sent` - Added to `status` while `status` is `sent`
- `status-accepted` - Added to `status` while `status` is `accepted`
- `status-declined` - Added to `status` while `status` is `declined`
- `status-expired` - Added to `status` while `status` is `expired`
- `table-row-optional` - Added to `table-row` for an optional line
- `table-row-included` - Added to `table-row` while the line counts toward the totals
- `item-toggle-active` - Added to `item-toggle` while its line is included

## CSS Custom Properties

- `--snice-estimate-border-inverse` - Estimate border inverse
- `--snice-estimate-border-inverse-light` - Estimate border inverse light
- `--snice-estimate-creative-alpha` - Estimate creative tint
- `--snice-estimate-creative-alpha-strong` - Estimate creative tint strong
- `--snice-estimate-creative-end` - Estimate creative end stop
- `--snice-estimate-creative-mid` - Estimate creative midpoint
- `--snice-estimate-creative-shadow` - Estimate creative shadow
- `--snice-estimate-creative-start` - Estimate creative start
- `--snice-estimate-surface-alt` - Estimate surface alt
- `--snice-estimate-surface-inverse-alpha` - Estimate surface inverse tint
- `--snice-estimate-text-inverse-muted` - Estimate text inverse muted
- `--snice-estimate-text-inverse-subtle` - Estimate text inverse subtle
- `--snice-estimate-text-muted` - Estimate text muted
- `--snice-estimate-text-muted-light` - Estimate text muted light
- `--snice-estimate-warning-text` - Estimate warning text
`--estimate-max-width`, `--estimate-bg`, `--estimate-border`, `--estimate-text`, `--estimate-accent`, `--estimate-header-padding`, `--estimate-section-padding`, `--estimate-radius`, `--estimate-title-size`, `--estimate-accept-bg`, `--estimate-decline-text`, `--estimate-total-bg`, `--estimate-qr-size`

## Basic Usage

```typescript
import 'snice/components/estimate/snice-estimate';
```

```html
<snice-estimate estimate-number="EST-001" date="2026-01-15" status="sent" tax-rate="10">
  <img slot="logo" src="logo.png" alt="Logo" />
</snice-estimate>
```

```typescript
est.from = { name: 'Studio', address: '100 Design Blvd', email: 'hi@studio.com' };
est.to = { name: 'Client Inc', address: '200 Innovation Way' };
est.items = [
  { description: 'Brand Identity', quantity: 1, unitPrice: 5000 },
  { description: 'SEO Audit', quantity: 1, unitPrice: 1500, optional: true, included: false }
];
est.addEventListener('estimate-accept', e => console.log('Accepted:', e.detail));
est.addEventListener('item-toggle', e => console.log('Item toggled:', e.detail));
```
