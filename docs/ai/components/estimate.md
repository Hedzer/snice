# snice-estimate

Professional estimate/quote document with from/to parties, line items, optional items toggle, and QR code.

## Properties

```typescript
estimateNumber: string = ''              // attribute: estimate-number
date: string = ''                        // Estimate date
expiryDate: string = ''                  // attribute: expiry-date
status: EstimateStatus = 'draft'         // 'draft' | 'sent' | 'accepted' | 'declined' | 'expired'
currency: string = '$'                   // Currency symbol
taxRate: number = 0                      // attribute: tax-rate — percentage
discount: number = 0                     // Discount percentage
notes: string = ''                       // Footer notes
terms: string = ''                       // Terms & conditions
variant: EstimateVariant = 'standard'    // 'standard' | 'comparison' | 'professional' | 'creative' | 'minimal'
showQr: boolean = false                  // attribute: show-qr
qrData: string = ''                      // attribute: qr-data
qrPosition: QrPosition = 'top-right'     // attribute: qr-position — 'top-right' | 'bottom-right' | 'footer'
from: EstimateParty | null = null        // Sender party data (JS only)
to: EstimateParty | null = null          // Recipient party data (JS only)
items: EstimateItem[] = []               // Line items (JS only)
```

## Types

```typescript
interface EstimateParty {
  name: string;
  address?: string;
  email?: string;
  phone?: string;
}

interface EstimateItem {
  description: string;
  quantity: number;
  unitPrice: number;
  optional?: boolean;     // Item can be toggled on/off
  included?: boolean;     // Whether optional item is included
}
```

## Slots

- `logo` - Custom logo content
- `qr` - Custom QR code content
- `footer` - Footer content

## Events

- `estimate-accept` → `{ estimateNumber: string; items: EstimateItem[]; total: number }`
- `estimate-decline` → `{ estimateNumber: string }`
- `item-toggle` → `{ index: number; item: EstimateItem; included: boolean }`

## Methods

- `print()` - Trigger browser print
- `toJSON()` - Returns full estimate data with computed totals

## Variants

- `standard` - Clean professional layout
- `comparison` - Card-based option selector (one card per item)
- `professional` - Dark header gradient, shadow, accent labels
- `creative` - Gradient header, rounded pill buttons, vibrant colors
- `minimal` - No borders/shadows, flat typography, reduced spacing

## Usage

```html
<snice-estimate estimate-number="EST-001" date="2026-01-15" status="sent" tax-rate="10">
  <img slot="logo" src="logo.png" alt="Logo" />
</snice-estimate>

<script>
const est = document.querySelector('snice-estimate');
est.from = { name: 'Studio', address: '100 Design Blvd', email: 'hi@studio.com' };
est.to = { name: 'Client Inc', address: '200 Innovation Way' };
est.items = [
  { description: 'Brand Identity', quantity: 1, unitPrice: 5000 },
  { description: 'SEO Audit', quantity: 1, unitPrice: 1500, optional: true, included: false }
];
est.terms = 'Payment due within 30 days';

est.addEventListener('estimate-accept', e => console.log('Accepted:', e.detail));
est.addEventListener('item-toggle', e => console.log('Item toggled:', e.detail));
</script>

<!-- Comparison variant -->
<snice-estimate variant="comparison"></snice-estimate>
```

## CSS Parts

`base`, `header`, `logo`, `title`, `status`, `expiry`, `expiry-date`, `meta`, `parties`, `party`, `party-label`, `party-name`, `party-detail`, `table`, `table-header`, `table-row`, `table-cell`, `item-toggle`, `summary`, `subtotal`, `discount-row`, `tax-row`, `total`, `notes`, `notes-label`, `notes-content`, `terms`, `actions`, `accept-button`, `decline-button`, `footer`, `qr-container`, `qr`, `comparison`, `option`, `option-button`
