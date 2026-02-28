[//]: # (AI: For a low-token version of this doc, use docs/ai/components/estimate.md instead)

# Estimate
`<snice-estimate>`

A quote/estimate card component for presenting pricing proposals to clients. Features line items with optional/included toggles, accept/decline actions, tax and discount calculations, and a comparison variant for presenting multiple options.

## Features

- **Header with Status**: Estimate number, date, expiry date, and status badge
- **From/To Parties**: Sender and recipient contact information
- **Line Items Table**: Description, quantity, unit price, and totals
- **Optional Items**: Toggle switch to include/exclude optional line items
- **Tax & Discount**: Automatic percentage-based calculations
- **Accept/Decline CTAs**: Action buttons for client response
- **Comparison Variant**: Side-by-side option cards for presenting packages
- **Print-Friendly**: Optimized for printing

## Basic Usage

```html
<snice-estimate
  estimate-number="EST-2024-042"
  date="2024-03-15"
  expiry-date="2024-04-15"
  status="sent">
</snice-estimate>
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

### Complete Estimate

Set up a full estimate with parties, items, tax, and discount.

```html
<snice-estimate
  estimate-number="EST-2024-042"
  date="2024-03-15"
  expiry-date="2024-04-15"
  status="sent"
  tax-rate="8"
  discount="5">
</snice-estimate>

<script>
  const est = document.querySelector('snice-estimate');

  est.from = {
    name: 'Creative Agency LLC',
    address: '456 Design Ave, Portland',
    email: 'hello@creative.agency'
  };

  est.to = {
    name: 'TechStart Inc.',
    address: '789 Innovation Blvd',
    email: 'projects@techstart.io'
  };

  est.items = [
    { description: 'Website Design & Development', quantity: 1, unitPrice: 4500 },
    { description: 'Logo & Brand Identity', quantity: 1, unitPrice: 1200 },
    { description: 'SEO Optimization', quantity: 1, unitPrice: 800, optional: true },
    { description: 'Content Writing (per page)', quantity: 8, unitPrice: 150 },
    { description: 'Social Media Kit', quantity: 1, unitPrice: 600, optional: true }
  ];

  est.notes = 'Payment terms: 50% upfront, 50% on delivery.\nTimeline: 6-8 weeks from acceptance.';
</script>
```

### Status States

Use the `status` attribute to indicate the estimate's lifecycle state.

```html
<snice-estimate status="draft"></snice-estimate>
<snice-estimate status="sent"></snice-estimate>
<snice-estimate status="accepted"></snice-estimate>
<snice-estimate status="declined"></snice-estimate>
<snice-estimate status="expired"></snice-estimate>
```

### With Optional Items

Mark items as `optional: true` to give clients a toggle switch for including or excluding them.

```html
<script>
  est.items = [
    { description: 'Core Package', quantity: 1, unitPrice: 2000 },
    { description: 'Premium Add-on', quantity: 1, unitPrice: 500, optional: true },
    { description: 'Rush Delivery', quantity: 1, unitPrice: 300, optional: true }
  ];
</script>
```

### Comparison Variant

Use `variant="comparison"` to present multiple options as selectable cards.

```html
<snice-estimate
  estimate-number="EST-2024-043"
  status="sent"
  variant="comparison">
</snice-estimate>

<script>
  const est = document.querySelector('snice-estimate');
  est.items = [
    { description: 'Basic Package - 5 pages, standard design', quantity: 1, unitPrice: 1500 },
    { description: 'Standard Package - 10 pages, custom design, SEO', quantity: 1, unitPrice: 3000 },
    { description: 'Premium Package - Unlimited pages, custom everything', quantity: 1, unitPrice: 5000 }
  ];
</script>
```

### Handling Events

Listen for accept, decline, and item toggle events.

```html
<script>
  const est = document.querySelector('snice-estimate');

  est.addEventListener('estimate-accept', (e) => {
    console.log('Accepted!', e.detail.total);
    console.log('Items:', e.detail.items);
  });

  est.addEventListener('estimate-decline', (e) => {
    console.log('Declined:', e.detail.estimateNumber);
  });

  est.addEventListener('item-toggle', (e) => {
    console.log(`Item ${e.detail.index}: ${e.detail.included ? 'included' : 'excluded'}`);
  });

  // Export estimate data
  const data = est.toJSON();
  console.log('Total:', data.total);
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `estimateNumber` (attr: `estimate-number`) | `string` | `''` | Estimate identifier |
| `date` | `string` | `''` | Date of the estimate |
| `expiryDate` (attr: `expiry-date`) | `string` | `''` | Validity expiration date |
| `status` | `'draft' \| 'sent' \| 'accepted' \| 'declined' \| 'expired'` | `'draft'` | Current status |
| `from` | `EstimateParty \| null` | `null` | Sender party info |
| `to` | `EstimateParty \| null` | `null` | Recipient party info |
| `items` | `EstimateItem[]` | `[]` | Line items array |
| `currency` | `string` | `'$'` | Currency symbol |
| `taxRate` (attr: `tax-rate`) | `number` | `0` | Tax percentage |
| `discount` | `number` | `0` | Discount percentage |
| `notes` | `string` | `''` | Additional notes/terms |
| `variant` | `'standard' \| 'comparison'` | `'standard'` | Layout variant |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `estimate-accept` | `{ estimateNumber, items, total }` | Fired when the accept button is clicked |
| `estimate-decline` | `{ estimateNumber }` | Fired when the decline button is clicked |
| `item-toggle` | `{ index, item, included }` | Fired when an optional item is toggled |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `print()` | -- | Triggers the browser print dialog |
| `toJSON()` | -- | Returns full JSON representation including computed totals |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Main container |
| `header` | Header section |
| `title` | Estimate title/number |
| `date` | Date display |
| `status` | Status badge |
| `expiry` | Expiry date text |
| `parties` | From/To container |
| `party` | Individual party block |
| `items-section` | Items section |
| `items-table` | Items table |
| `item-toggle` | Optional item toggle switch |
| `totals` | Totals breakdown section |
| `notes-section` | Notes section |
| `notes` | Notes text |
| `actions` | Action buttons container |
| `accept-button` | Accept estimate button |
| `decline-button` | Decline estimate button |
| `comparison` | Comparison grid container |
| `option` | Comparison option card |
| `option-button` | Select option button |

## Type Interfaces

```typescript
interface EstimateParty {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface EstimateItem {
  description: string;
  quantity: number;
  unitPrice: number;
  optional?: boolean;   // Shows toggle switch
  included?: boolean;   // Whether optional item is included
}
```

## Best Practices

1. **Set expiry dates**: Give clients a clear deadline to respond
2. **Use optional items**: Let clients customize the scope
3. **Include notes**: Specify payment terms, timeline, and conditions
4. **Track status**: Update the status as the estimate progresses
5. **Use comparison for packages**: Present tiered options clearly

## Accessibility

- Toggle switches are keyboard-accessible buttons with aria-labels
- Status badges use color + text for identification
- Action buttons have clear labels
- Print styles hide interactive elements
