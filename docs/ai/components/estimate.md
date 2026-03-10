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

`base`, `header`, `logo`, `title`, `status`, `expiry`, `expiry-date`, `meta`, `parties`, `party`, `party-label`, `party-name`, `party-detail`, `table`, `table-header`, `table-row`, `table-cell`, `item-toggle`, `summary`, `subtotal`, `discount-row`, `tax-row`, `total`, `notes`, `notes-label`, `notes-content`, `terms`, `actions`, `accept-button`, `decline-button`, `footer`, `qr-container`, `qr`, `comparison`, `option`, `option-button`

## CSS Custom Properties

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
