[//]: # (AI: For a low-token version of this doc, use docs/ai/components/estimate.md instead)

# Estimate Component

The estimate component renders a professional estimate or quote document, complete with from/to party information, itemized line items, tax and discount calculations, notes, and optional QR code. It supports both declarative child elements and imperative setter functions.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Setter Functions](#setter-functions)
- [Child Elements](#child-elements)
- [Named Slots](#named-slots)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Basic Usage

```html
<snice-estimate estimate-number="EST-001" date="2026-01-15" status="sent" tax-rate="10">
  <snice-estimate-party slot="from" name="Design Studio" address="100 Creative Blvd"></snice-estimate-party>
  <snice-estimate-party slot="to" name="Startup Inc" address="200 Innovation Way"></snice-estimate-party>
  <snice-estimate-item description="Brand Identity" quantity="1" unit-price="5000"></snice-estimate-item>
  <snice-estimate-item description="Website Design" quantity="1" unit-price="8000"></snice-estimate-item>
</snice-estimate>
```

```typescript
import 'snice/components/estimate/snice-estimate';
```

## Properties

All scalar properties are set via HTML attributes or JavaScript properties.

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `estimateNumber` | `estimate-number` | `string` | `''` | Estimate reference number |
| `date` | `date` | `string` | `''` | Estimate date |
| `expiryDate` | `expiry-date` | `string` | `''` | Expiration date |
| `status` | `status` | `EstimateStatus` | `'draft'` | Status badge: `'draft'`, `'sent'`, `'accepted'`, `'declined'`, `'expired'` |
| `currency` | `currency` | `string` | `'USD'` | ISO 4217 currency code for formatting |
| `taxRate` | `tax-rate` | `number` | `0` | Tax percentage applied to subtotal |
| `discount` | `discount` | `number` | `0` | Discount percentage applied to subtotal |
| `notes` | `notes` | `string` | `''` | Footer notes (e.g. payment terms) |
| `variant` | `variant` | `EstimateVariant` | `'default'` | Layout variant: `'default'`, `'compact'`, `'detailed'` |
| `showQr` | `show-qr` | `boolean` | `false` | Whether to show the QR code area |
| `qrData` | `qr-data` | `string` | `''` | Data to encode in the auto-generated QR code |

## Setter Functions

Complex data (parties and line items) is set via setter functions rather than bare properties. This ensures proper re-rendering.

### `setFrom(party: EstimateParty)`

Set the "from" (sender) party.

### `setTo(party: EstimateParty)`

Set the "to" (recipient) party.

### `setItems(items: EstimateItem[])`

Set the line items.

### Type Interfaces

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
  optional?: boolean;    // Mark as optional line item
  included?: boolean;    // Whether optional item is included in total
}
```

## Child Elements

The estimate component supports a fully declarative API via child elements. When both child elements and setter data are provided, **child elements take priority**.

### `<snice-estimate-party>`

Used with `slot="from"` or `slot="to"` to define the parties.

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | `string` | Party name |
| `address` | `string` | Address |
| `email` | `string` | Email address |
| `phone` | `string` | Phone number |

### `<snice-estimate-item>`

Used in the default slot to define line items.

| Attribute | Type | Description |
|-----------|------|-------------|
| `description` | `string` | Item description |
| `quantity` | `number` | Quantity (default: 1) |
| `unit-price` | `number` | Unit price |
| `optional` | `boolean` | Mark as optional |
| `included` | `boolean` | Whether optional item is included in total |

Both child elements are data containers that don't render visible content (`display: none`).

## Named Slots

| Slot | Description |
|------|-------------|
| `from` | From party (`<snice-estimate-party>`) |
| `to` | To party (`<snice-estimate-party>`) |
| *(default)* | Line items (`<snice-estimate-item>`) |
| `qr` | Custom QR code content |
| `footer` | Footer content |

## Events

#### `estimate-status-change`
Fired when the status changes.

**Event Detail:**
```typescript
{
  status: EstimateStatus;
  previousStatus: EstimateStatus;
}
```

#### `estimate-accept`
Fired when the estimate is accepted.

#### `estimate-decline`
Fired when the estimate is declined.

#### `estimate-print`
Fired when a print action is triggered.

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The outer container |
| `header` | Header section with title and meta |
| `parties` | From/to parties grid |
| `party` | Individual party block |
| `items` | Line items table |
| `totals` | Totals section |
| `notes` | Notes section |
| `footer` | Footer area |

## Examples

### Declarative with All Features

```html
<snice-estimate
  estimate-number="EST-2026-001"
  date="2026-02-28"
  expiry-date="2026-03-30"
  status="sent"
  currency="USD"
  tax-rate="10"
  discount="5"
  notes="Payment due within 30 days. 50% deposit required.">
  <snice-estimate-party slot="from"
    name="Creative Studio LLC"
    address="100 Design Blvd, Suite 300, SF, CA 94102"
    email="hello@creativestudio.com"
    phone="+1 (555) 010-0100">
  </snice-estimate-party>
  <snice-estimate-party slot="to"
    name="TechStart Inc"
    address="200 Innovation Way, Austin, TX 73301"
    email="projects@techstart.io">
  </snice-estimate-party>
  <snice-estimate-item description="Brand Identity Design" quantity="1" unit-price="5000"></snice-estimate-item>
  <snice-estimate-item description="Website Design" quantity="1" unit-price="8000"></snice-estimate-item>
  <snice-estimate-item description="Social Media Kit" quantity="1" unit-price="2000" optional included></snice-estimate-item>
  <snice-estimate-item description="SEO Audit" quantity="1" unit-price="1500" optional></snice-estimate-item>
</snice-estimate>
```

### Imperative Usage

```html
<snice-estimate id="my-estimate" estimate-number="EST-002" date="2026-02-28" currency="EUR" tax-rate="20"></snice-estimate>

<script type="module">
  import 'snice/components/estimate/snice-estimate';

  const est = document.getElementById('my-estimate');
  est.setFrom({
    name: 'Agence Design',
    address: '42 Rue de Rivoli, Paris',
    email: 'bonjour@agencedesign.fr'
  });
  est.setTo({
    name: 'Berlin Startup GmbH',
    address: 'Friedrichstr. 123, Berlin'
  });
  est.setItems([
    { description: 'UX Research', quantity: 1, unitPrice: 4500 },
    { description: 'UI Redesign', quantity: 1, unitPrice: 12000 },
    { description: 'Usability Testing', quantity: 2, unitPrice: 1500, optional: true, included: true }
  ]);
</script>
```

### Compact Variant

```html
<snice-estimate variant="compact" estimate-number="Q-100" date="2026-01-01">
  <snice-estimate-party slot="from" name="Freelancer" email="me@freelancer.com"></snice-estimate-party>
  <snice-estimate-party slot="to" name="Client" email="client@co.com"></snice-estimate-party>
  <snice-estimate-item description="Consulting" quantity="10" unit-price="150"></snice-estimate-item>
</snice-estimate>
```

### Dual API Behavior

When both declarative children and imperative setter data are provided, **declarative children always win**. This matches the pattern used by other snice components like `<snice-pricing-table>`.

```javascript
const est = document.querySelector('snice-estimate');

// If the estimate has <snice-estimate-party slot="from"> in HTML,
// calling setFrom() will NOT override it.
est.setFrom({ name: 'This will be ignored' });

// If you want imperative data to take effect,
// remove the child elements first.
```

## Accessibility

- **Semantic table**: Line items are rendered in a proper `<table>` element
- **Status badges**: Color-coded with distinct patterns, not relying on color alone
- **Print-friendly**: Box shadows and borders are suppressed in print media
- **Keyboard navigation**: All interactive elements are keyboard accessible

## Best Practices

1. **Use declarative child elements** for static estimates that don't change
2. **Use setter functions** for dynamic estimates populated from API data
3. **Set a currency code** appropriate for your locale -- formatting is handled by `Intl.NumberFormat`
4. **Mark optional items clearly** with the `optional` attribute so clients can see what's extra
5. **Include notes** with payment terms and conditions
