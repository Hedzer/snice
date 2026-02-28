[//]: # (AI: For a low-token version of this doc, use docs/ai/components/estimate.md instead)

# Estimate
`<snice-estimate>`

A professional quote/estimate document component for presenting pricing proposals to clients. Features line items with optional/included toggles, accept/decline actions, tax and discount calculations, five visual variants, optional QR code support, and print-optimized output.

## Features

- **Five Visual Variants**: Standard, comparison, professional, creative, and minimal
- **Header with Status**: Estimate number, date, expiry date, status badge, and logo slot
- **From/To Parties**: Sender and recipient contact information
- **Line Items Table**: Description, quantity, unit price, and totals
- **Optional Items**: Toggle switch to include/exclude optional line items
- **Tax & Discount**: Automatic percentage-based calculations
- **Accept/Decline CTAs**: Action buttons for client response (hidden when accepted/declined/expired)
- **Comparison Variant**: Side-by-side option cards for presenting packages
- **QR Code Support**: Configurable QR code slot with three positions
- **Notes & Terms**: Separate fields for notes and terms & conditions
- **Print-Friendly**: Optimized for clean, professional printing
- **Deep Theming**: 40+ CSS custom properties and 25+ CSS parts

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

Set up a full estimate with parties, items, tax, discount, notes, and terms.

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
  est.terms = 'All work subject to our standard terms and conditions. Revisions limited to 3 rounds per deliverable.';
</script>
```

### Variants

Use the `variant` attribute to change the visual style. Each variant has a dramatically different feel.

```html
<!-- Clean, structured business quote -->
<snice-estimate variant="standard"></snice-estimate>

<!-- Dark header, elevated shadow, refined typography -->
<snice-estimate variant="professional"></snice-estimate>

<!-- Bold purple-pink gradient, pill buttons, modern layout -->
<snice-estimate variant="creative"></snice-estimate>

<!-- Ultra-clean, no borders, lots of whitespace -->
<snice-estimate variant="minimal"></snice-estimate>

<!-- Side-by-side option cards -->
<snice-estimate variant="comparison"></snice-estimate>
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

Use `variant="comparison"` to present multiple options as selectable cards. Each item becomes a card.

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

### With QR Code

Use `show-qr` to display a QR code slot. Position it with `qr-position`.

```html
<snice-estimate
  estimate-number="EST-2024-044"
  status="sent"
  show-qr
  qr-position="top-right">
  <snice-qr-code slot="qr" data="https://example.com/quote/44"></snice-qr-code>
</snice-estimate>
```

### With Logo

Use the `logo` slot to add your company logo to the header.

```html
<snice-estimate estimate-number="EST-2024-045" status="sent">
  <img slot="logo" src="company-logo.svg" alt="Company Logo" style="height: 2rem;">
</snice-estimate>
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

### Theming with CSS Custom Properties

Customize the estimate's appearance using CSS custom properties.

```css
snice-estimate {
  --estimate-accent: #6366f1;
  --estimate-header-bg: #1e1b4b;
  --estimate-header-text: #e0e7ff;
  --estimate-accept-bg: #6366f1;
  --estimate-radius: 12px;
  --estimate-shadow: 0 20px 40px -12px rgb(0 0 0 / 0.15);
}
```

### Styling with CSS Parts

Target specific parts of the estimate for custom styling.

```css
snice-estimate::part(header) {
  background: linear-gradient(135deg, #0f172a, #1e293b);
}

snice-estimate::part(accept-button) {
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

snice-estimate::part(total) {
  font-size: 1.5rem;
  color: #6366f1;
}
```

## Slots

| Name | Description |
|------|-------------|
| (default) | Default slot content |
| `logo` | Company logo in header |
| `qr` | QR code content (rendered at the configured qr-position) |
| `footer` | Footer content |

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
| `notes` | `string` | `''` | Additional notes |
| `terms` | `string` | `''` | Terms and conditions |
| `variant` | `'standard' \| 'comparison' \| 'professional' \| 'creative' \| 'minimal'` | `'standard'` | Visual variant |
| `showQr` (attr: `show-qr`) | `boolean` | `false` | Show QR code slot |
| `qrData` (attr: `qr-data`) | `string` | `''` | Data for QR code |
| `qrPosition` (attr: `qr-position`) | `'top-right' \| 'bottom-right' \| 'footer'` | `'top-right'` | QR code position |

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
| `logo` | Logo slot container |
| `meta` | Date display |
| `status` | Status badge |
| `expiry` | Expiry date text |
| `expiry-date` | Expiry date value |
| `parties` | From/To container |
| `party` | Individual party block |
| `party-label` | "From" / "To" label |
| `party-name` | Party name text |
| `party-detail` | Party address/phone/email |
| `table` | Table section wrapper |
| `table-header` | Table header row |
| `table-row` | Table body row |
| `table-cell` | Table cell |
| `item-toggle` | Optional item toggle switch |
| `summary` | Totals breakdown section |
| `subtotal` | Subtotal row |
| `tax-row` | Tax row |
| `discount-row` | Discount row |
| `total` | Grand total row |
| `actions` | Action buttons container |
| `accept-button` | Accept estimate button |
| `decline-button` | Decline estimate button |
| `notes` | Notes section |
| `notes-label` | Notes heading |
| `notes-content` | Notes text content |
| `terms` | Terms section |
| `qr-container` | QR code container |
| `qr` | QR slot |
| `comparison` | Comparison grid container |
| `option` | Comparison option card |
| `option-button` | Select option button |
| `footer` | Footer section |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--estimate-max-width` | Maximum container width | `50rem` |
| `--estimate-bg` | Background color | theme background |
| `--estimate-bg-element` | Element background (totals area) | theme element bg |
| `--estimate-border` | Border color | theme border |
| `--estimate-text` | Primary text color | theme text |
| `--estimate-text-secondary` | Secondary text color | theme text-secondary |
| `--estimate-text-tertiary` | Tertiary text color | theme text-tertiary |
| `--estimate-accent` | Accent / primary color | theme primary |
| `--estimate-header-bg` | Header background | theme background |
| `--estimate-header-text` | Header text color | theme text |
| `--estimate-header-padding` | Header padding | `1.5rem` |
| `--estimate-title-size` | Title font size | `1.5rem` |
| `--estimate-title-weight` | Title font weight | `700` |
| `--estimate-body-size` | Body text size | `0.875rem` |
| `--estimate-label-size` | Label text size | `0.75rem` |
| `--estimate-section-padding` | Section padding | `1rem 1.5rem` |
| `--estimate-gap` | Gap between elements | `1rem` |
| `--estimate-accept-bg` | Accept button background | theme success |
| `--estimate-accept-text` | Accept button text color | white |
| `--estimate-decline-bg` | Decline button background | transparent |
| `--estimate-decline-text` | Decline button text color | theme danger |
| `--estimate-decline-border` | Decline button border color | theme danger |
| `--estimate-optional-bg` | Optional tag background | amber/10% |
| `--estimate-optional-text` | Optional tag text color | amber |
| `--estimate-optional-border` | Optional tag border color | amber/30% |
| `--estimate-radius` | Border radius | theme radius-lg |
| `--estimate-shadow` | Box shadow | none |
| `--estimate-total-bg` | Totals background | theme element bg |
| `--estimate-total-border` | Totals border color | theme border |
| `--estimate-total-weight` | Total font weight | bold |
| `--estimate-qr-size` | QR code dimensions | `5rem` |

## Type Interfaces

```typescript
type EstimateStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';
type EstimateVariant = 'standard' | 'comparison' | 'professional' | 'creative' | 'minimal';
type QrPosition = 'top-right' | 'bottom-right' | 'footer';

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
  included?: boolean;   // Whether optional item is included (default: true)
}

interface EstimateJSON {
  estimateNumber: string;
  date: string;
  expiryDate: string;
  status: EstimateStatus;
  from: EstimateParty | null;
  to: EstimateParty | null;
  items: EstimateItem[];
  currency: string;
  taxRate: number;
  discount: number;
  notes: string;
  terms: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}
```

## Accessibility

- Toggle switches are keyboard-accessible buttons with aria-labels
- Status badges use color + text for identification
- Action buttons have clear labels
- Print styles hide interactive elements
- Focus states on all interactive elements

## Print Behavior

- Accept/decline buttons are hidden
- Toggle switches are hidden
- Excluded optional items shown with strikethrough
- Status badges display as outlined (no background fill)
- Expiry date shown prominently
- Notes and terms sections avoid page breaks
- Gradient headers preserved with print-color-adjust
