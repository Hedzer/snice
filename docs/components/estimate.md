# Estimate
`<snice-estimate>`

A professional estimate/quote component with optional line items, accept/decline actions, expiry dates, and automatic calculations. Supports comparison mode for presenting multiple options.

## Basic Usage

```html
<snice-estimate
  estimate-number="EST-0042"
  date="Feb 27, 2026"
  expiry-date="Mar 15, 2026"
  status="sent"
  currency="$"
  tax-rate="8"
  notes="This estimate is valid for 15 days.">
</snice-estimate>

<script>
  const est = document.querySelector('snice-estimate');
  est.from = { name: 'Design Studio' };
  est.to = { name: 'Client Corp' };
  est.items = [
    { description: 'Brand Identity', quantity: 1, unitPrice: 5000 },
    { description: 'Social Media Kit', quantity: 1, unitPrice: 2000, optional: true }
  ];
</script>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/estimate/snice-estimate';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-estimate.min.js"></script>
```

## Examples

### Basic Estimate

```html
<snice-estimate
  id="basic-est"
  estimate-number="EST-001"
  date="2026-03-01"
  expiry-date="2026-04-01"
  status="sent">
</snice-estimate>

<script>
  const est = document.getElementById('basic-est');
  est.from = { name: 'Your Business' };
  est.to = { name: 'Prospective Client' };
  est.items = [
    { description: 'Service A', quantity: 1, unitPrice: 1000 },
    { description: 'Service B', quantity: 2, unitPrice: 500 }
  ];
</script>
```

### With Optional Items

```html
<snice-estimate
  id="optional-est"
  estimate-number="EST-002"
  currency="$"
  tax-rate="10">
</snice-estimate>

<script>
  const est = document.getElementById('optional-est');
  est.from = { name: 'Web Agency' };
  est.to = { name: 'Startup Inc' };
  est.items = [
    { description: 'Website Design (required)', quantity: 1, unitPrice: 5000 },
    { description: 'SEO Package (optional)', quantity: 1, unitPrice: 1500, optional: true },
    { description: 'Content Writing (optional)', quantity: 10, unitPrice: 100, optional: true }
  ];
</script>
```

### Different Statuses

```html
<!-- Draft estimate (no action buttons) -->
<snice-estimate estimate-number="EST-D1" status="draft"></snice-estimate>

<!-- Sent estimate (shows accept/decline buttons) -->
<snice-estimate estimate-number="EST-S1" status="sent"></snice-estimate>

<!-- Accepted estimate -->
<snice-estimate estimate-number="EST-A1" status="accepted"></snice-estimate>

<!-- Declined estimate -->
<snice-estimate estimate-number="EST-X1" status="declined"></snice-estimate>

<!-- Expired estimate -->
<snice-estimate estimate-number="EST-E1" status="expired"></snice-estimate>
```

### Comparison Variant

```html
<snice-estimate
  id="comparison-est"
  estimate-number="EST-COMP"
  variant="comparison">
</snice-estimate>

<script>
  const est = document.getElementById('comparison-est');
  est.items = [
    { description: 'Basic Package', quantity: 1, unitPrice: 1999 },
    { description: 'Standard Package', quantity: 1, unitPrice: 3999 },
    { description: 'Premium Package', quantity: 1, unitPrice: 7999 }
  ];
</script>
```

### With Discount and Tax

```html
<snice-estimate
  id="discount-est"
  estimate-number="EST-DISC"
  currency="€"
  tax-rate="19"
  discount="10"
  notes="Spring promotion: 10% off all services">
</snice-estimate>

<script>
  const est = document.getElementById('discount-est');
  est.from = { name: 'European Services GmbH' };
  est.to = { name: 'Client SE' };
  est.items = [
    { description: 'Consulting', quantity: 20, unitPrice: 150 },
    { description: 'Implementation', quantity: 40, unitPrice: 120 }
  ];
</script>
```

### With Terms and Conditions

```html
<snice-estimate
  id="terms-est"
  estimate-number="EST-TERMS"
  status="sent"
  notes="Payment terms: Net 30 days upon acceptance."
  terms="Cancellation policy: 50% refund if cancelled within 5 business days. No refunds after work has commenced.">
</snice-estimate>

<script>
  const est = document.getElementById('terms-est');
  est.from = { name: 'Professional Services' };
  est.to = { name: 'Corporate Client' };
  est.items = [{ description: 'Project Work', quantity: 1, unitPrice: 25000 }];
</script>
```

### Listening for Events

```html
<snice-estimate
  id="event-est"
  estimate-number="EST-EVT"
  status="sent">
</snice-estimate>

<script>
  const est = document.getElementById('event-est');
  est.from = { name: 'Vendor' };
  est.to = { name: 'Customer' };
  est.items = [
    { description: 'Item 1', quantity: 1, unitPrice: 500, optional: true },
    { description: 'Item 2', quantity: 1, unitPrice: 300 }
  ];
  
  est.addEventListener('item-toggle', (e) => {
    console.log('Item', e.detail.index, 'included:', e.detail.included);
  });
  
  est.addEventListener('estimate-accept', (e) => {
    console.log('Estimate accepted!', e.detail.estimateNumber);
    console.log('Total:', e.detail.total);
    console.log('Items:', e.detail.items);
  });
  
  est.addEventListener('estimate-decline', (e) => {
    console.log('Estimate declined:', e.detail.estimateNumber);
  });
</script>
```

### With QR Code

```html
<snice-estimate
  estimate-number="EST-QR"
  show-qr
  qr-position="top-right">
  <img slot="qr" src="/estimate-qr.svg" alt="Scan to view online" />
</snice-estimate>
```

### Different Variants

```html
<!-- Professional variant -->
<snice-estimate variant="professional" estimate-number="EST-P1"></snice-estimate>

<!-- Creative variant -->
<snice-estimate variant="creative" estimate-number="EST-C1"></snice-estimate>

<!-- Minimal variant -->
<snice-estimate variant="minimal" estimate-number="EST-M1"></snice-estimate>
```

### Print Estimate

```html
<snice-estimate id="print-est" estimate-number="EST-PRINT"></snice-estimate>
<button onclick="document.getElementById('print-est').print()">
  Print Estimate
</button>
```

### Export to JSON

```html
<snice-estimate id="json-est" estimate-number="EST-JSON"></snice-estimate>
<button onclick="exportEstimate()">Export JSON</button>

<script>
  function exportEstimate() {
    const est = document.getElementById('json-est');
    const data = est.toJSON();
    console.log(data);
    // Contains: estimateNumber, date, expiryDate, status, items, 
    // subtotal, discountAmount, taxAmount, total, etc.
  }
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `estimateNumber` | `string` | `''` | Estimate identifier |
| `date` | `string` | `''` | Estimate date |
| `expiryDate` | `string` | `''` | Expiration/valid until date |
| `status` | `'draft' \| 'sent' \| 'accepted' \| 'declined' \| 'expired'` | `'draft'` | Estimate status |
| `from` | `EstimateParty \| null` | `null` | Sender/business info |
| `to` | `EstimateParty \| null` | `null` | Recipient/client info |
| `items` | `EstimateItem[]` | `[]` | Line items |
| `currency` | `string` | `'$'` | Currency symbol |
| `taxRate` | `number` | `0` | Tax rate percentage |
| `discount` | `number` | `0` | Discount percentage |
| `notes` | `string` | `''` | Additional notes |
| `terms` | `string` | `''` | Terms and conditions |
| `variant` | `'standard' \| 'comparison' \| 'professional' \| 'creative' \| 'minimal'` | `'standard'` | Visual style variant |
| `showQr` | `boolean` | `false` | Show QR code placeholder |
| `qrData` | `string` | `''` | QR code data |
| `qrPosition` | `'top-right' \| 'bottom-right' \| 'footer'` | `'top-right'` | QR code placement |

### EstimateParty Interface

```typescript
interface EstimateParty {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}
```

### EstimateItem Interface

```typescript
interface EstimateItem {
  description: string;
  quantity: number;
  unitPrice: number;
  optional?: boolean;
  included?: boolean;
}
```

## Slots

| Slot Name | Description |
|-----------|-------------|
| `logo` | Company logo image |
| `qr` | QR code content |
| `footer` | Additional footer content |
| (default) | Default slot for extra content |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `estimate-accept` | `{ estimateNumber, items, total }` | Fired when accept button is clicked |
| `estimate-decline` | `{ estimateNumber }` | Fired when decline button is clicked |
| `item-toggle` | `{ index, item, included }` | Fired when an optional item is toggled |

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `print()` | `void` | Print the estimate |
| `toJSON()` | `EstimateJSON` | Export all data including calculated totals |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Root container |
| `header` | Header section |
| `logo` | Logo slot container |
| `title` | Estimate title |
| `meta` | Date meta |
| `status` | Status badge |
| `expiry` | Expiry date container |
| `expiry-date` | Expiry date value |
| `qr-container` | QR code container |
| `qr` | QR code element |
| `parties` | From/To section |
| `party` | Individual party |
| `party-label` | Party label ("From", "To") |
| `party-name` | Party name |
| `party-detail` | Party details |
| `table` | Items table |
| `table-header` | Table header row |
| `table-row` | Table body rows |
| `table-cell` | Table cells |
| `item-toggle` | Optional item toggle button |
| `summary` | Totals section |
| `subtotal` | Subtotal row |
| `discount-row` | Discount row |
| `tax-row` | Tax row |
| `total` | Grand total row |
| `notes` | Notes section |
| `notes-label` | Notes heading |
| `notes-content` | Notes text |
| `terms` | Terms section |
| `actions` | Action buttons container |
| `accept-button` | Accept estimate button |
| `decline-button` | Decline estimate button |
| `comparison` | Comparison view container |
| `option` | Comparison option card |
| `option-button` | Select option button |
| `footer` | Footer area |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--estimate-max-width` | `50rem` | Maximum width |
| `--estimate-bg` | `white` | Background color |
| `--estimate-bg-element` | `rgb(252 251 249)` | Element background |
| `--estimate-border` | `rgb(226 226 226)` | Border color |
| `--estimate-text` | `rgb(23 23 23)` | Text color |
| `--estimate-text-secondary` | `rgb(82 82 82)` | Secondary text |
| `--estimate-accent` | `rgb(37 99 235)` | Accent color |
| `--estimate-header-padding` | `1.5rem` | Header padding |
| `--estimate-section-padding` | `1rem 1.5rem` | Section padding |
| `--estimate-radius` | `0.5rem` | Border radius |
| `--estimate-title-size` | `1.5rem` | Title font size |
| `--estimate-title-weight` | `700` | Title font weight |
| `--estimate-accept-bg` | `rgb(22 163 74)` | Accept button background |
| `--estimate-accept-text` | `white` | Accept button text |
| `--estimate-decline-bg` | `transparent` | Decline button background |
| `--estimate-decline-text` | `rgb(220 38 38)` | Decline button text |
| `--estimate-decline-border` | `rgb(220 38 38)` | Decline button border |
| `--estimate-total-bg` | `rgb(252 251 249)` | Total row background |
| `--estimate-total-border` | `rgb(226 226 226)` | Total row border |
| `--estimate-total-weight` | `700` | Total font weight |
| `--estimate-qr-size` | `5rem` | QR code size |
