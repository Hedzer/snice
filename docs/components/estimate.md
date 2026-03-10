<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/estimate.md -->

# Estimate

A professional estimate/quote component with optional line items, accept/decline actions, expiry dates, and automatic calculations. Supports comparison mode for presenting multiple options.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [CSS Custom Properties](#css-custom-properties)
- [Basic Usage](#basic-usage)
- [Examples](#examples)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `estimateNumber` | `string` | `''` | Estimate identifier |
| `date` | `string` | `''` | Estimate date |
| `expiryDate` | `string` | `''` | Expiration/valid until date |
| `status` | `'draft' \| 'sent' \| 'accepted' \| 'declined' \| 'expired'` | `'draft'` | Estimate status |
| `from` | `EstimateParty \| null` | `null` | Sender/business info (JS only) |
| `to` | `EstimateParty \| null` | `null` | Recipient/client info (JS only) |
| `items` | `EstimateItem[]` | `[]` | Line items (JS only) |
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

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `print()` | `void` | Print the estimate |
| `toJSON()` | `EstimateJSON` | Export all data including calculated totals |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `estimate-accept` | `{ estimateNumber, items, total }` | Fired when accept button is clicked |
| `estimate-decline` | `{ estimateNumber }` | Fired when decline button is clicked |
| `item-toggle` | `{ index, item, included }` | Fired when an optional item is toggled |

## Slots

| Slot Name | Description |
|-----------|-------------|
| `logo` | Company logo image |
| `qr` | QR code content |
| `footer` | Additional footer content |

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

## Basic Usage

```typescript
import 'snice/components/estimate/snice-estimate';
```

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
```

```typescript
est.from = { name: 'Design Studio' };
est.to = { name: 'Client Corp' };
est.items = [
  { description: 'Brand Identity', quantity: 1, unitPrice: 5000 },
  { description: 'Social Media Kit', quantity: 1, unitPrice: 2000, optional: true }
];
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
```

```typescript
est.from = { name: 'Your Business' };
est.to = { name: 'Prospective Client' };
est.items = [
  { description: 'Service A', quantity: 1, unitPrice: 1000 },
  { description: 'Service B', quantity: 2, unitPrice: 500 }
];
```

### With Optional Items

```html
<snice-estimate
  id="optional-est"
  estimate-number="EST-002"
  currency="$"
  tax-rate="10">
</snice-estimate>
```

```typescript
est.from = { name: 'Web Agency' };
est.to = { name: 'Startup Inc' };
est.items = [
  { description: 'Website Design (required)', quantity: 1, unitPrice: 5000 },
  { description: 'SEO Package (optional)', quantity: 1, unitPrice: 1500, optional: true },
  { description: 'Content Writing (optional)', quantity: 10, unitPrice: 100, optional: true }
];
```

### Different Statuses

```html
<snice-estimate estimate-number="EST-D1" status="draft"></snice-estimate>
<snice-estimate estimate-number="EST-S1" status="sent"></snice-estimate>
<snice-estimate estimate-number="EST-A1" status="accepted"></snice-estimate>
<snice-estimate estimate-number="EST-X1" status="declined"></snice-estimate>
<snice-estimate estimate-number="EST-E1" status="expired"></snice-estimate>
```

### Comparison Variant

```html
<snice-estimate
  id="comparison-est"
  estimate-number="EST-COMP"
  variant="comparison">
</snice-estimate>
```

```typescript
est.items = [
  { description: 'Basic Package', quantity: 1, unitPrice: 1999 },
  { description: 'Standard Package', quantity: 1, unitPrice: 3999 },
  { description: 'Premium Package', quantity: 1, unitPrice: 7999 }
];
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
```

```typescript
est.from = { name: 'European Services GmbH' };
est.to = { name: 'Client SE' };
est.items = [
  { description: 'Consulting', quantity: 20, unitPrice: 150 },
  { description: 'Implementation', quantity: 40, unitPrice: 120 }
];
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
<snice-estimate variant="professional" estimate-number="EST-P1"></snice-estimate>
<snice-estimate variant="creative" estimate-number="EST-C1"></snice-estimate>
<snice-estimate variant="minimal" estimate-number="EST-M1"></snice-estimate>
```

### Listening for Events

```typescript
est.addEventListener('item-toggle', (e) => {
  console.log('Item', e.detail.index, 'included:', e.detail.included);
});

est.addEventListener('estimate-accept', (e) => {
  console.log('Estimate accepted!', e.detail.estimateNumber);
  console.log('Total:', e.detail.total);
});

est.addEventListener('estimate-decline', (e) => {
  console.log('Estimate declined:', e.detail.estimateNumber);
});
```

### Print and Export

```typescript
est.print();

const data = est.toJSON();
// Contains: estimateNumber, date, expiryDate, status, items,
// subtotal, discountAmount, taxAmount, total, etc.
```
