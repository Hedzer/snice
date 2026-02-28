# snice-estimate

Professional estimate/quote document with from/to parties, line items, tax, discount, and QR code.

## Properties (Attributes)

```ts
estimateNumber: string                  // attribute: estimate-number
date: string                            // Estimate date
expiryDate: string                      // attribute: expiry-date
status: EstimateStatus                  // 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' (default: 'draft')
currency: string                        // ISO 4217 code (default: 'USD')
taxRate: number                         // attribute: tax-rate (default: 0)
discount: number                        // Percentage discount (default: 0)
notes: string                           // Footer notes
variant: EstimateVariant                // 'default' | 'compact' | 'detailed' (default: 'default')
showQr: boolean                         // attribute: show-qr (default: false)
qrData: string                          // attribute: qr-data
```

## Setter Functions

```ts
setFrom(party: EstimateParty): void     // Set the "from" party
setTo(party: EstimateParty): void       // Set the "to" party
setItems(items: EstimateItem[]): void   // Set line items
```

## Types

```ts
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
  optional?: boolean;                    // Marked as optional line item
  included?: boolean;                    // Whether optional item is included in total
}
```

## Child Elements

Supports declarative usage. Slot children win over setter data.

**`<snice-estimate-party>`** — slot: `from` or `to`
Attributes: `name`, `address`, `email`, `phone`

**`<snice-estimate-item>`** — default slot
Attributes: `description`, `quantity` (Number), `unit-price` (Number), `optional` (Boolean), `included` (Boolean)

## Named Slots

- `slot="from"` — From party (`<snice-estimate-party>`)
- `slot="to"` — To party (`<snice-estimate-party>`)
- Default slot — Line items (`<snice-estimate-item>`)
- `slot="qr"` — Custom QR code content
- `slot="footer"` — Footer content

## Events

- `estimate-status-change` -> `{ status: EstimateStatus; previousStatus: EstimateStatus }`
- `estimate-accept` -> `void`
- `estimate-decline` -> `void`
- `estimate-print` -> `void`

## CSS Parts

`base`, `header`, `parties`, `party`, `items`, `totals`, `notes`, `footer`

## Usage

```html
<!-- Declarative -->
<snice-estimate estimate-number="EST-001" date="2026-01-15" status="sent" tax-rate="10">
  <snice-estimate-party slot="from" name="Studio" address="100 Design Blvd" email="hi@studio.com"></snice-estimate-party>
  <snice-estimate-party slot="to" name="Client Inc" address="200 Innovation Way"></snice-estimate-party>
  <snice-estimate-item description="Brand Identity" quantity="1" unit-price="5000"></snice-estimate-item>
  <snice-estimate-item description="Website Design" quantity="1" unit-price="8000"></snice-estimate-item>
  <snice-estimate-item description="SEO Audit" quantity="1" unit-price="1500" optional></snice-estimate-item>
</snice-estimate>
```

```js
// Imperative
const est = document.querySelector('snice-estimate');
est.setFrom({ name: 'Studio', address: '100 Design Blvd' });
est.setTo({ name: 'Client', address: '200 Innovation Way' });
est.setItems([
  { description: 'Brand Identity', quantity: 1, unitPrice: 5000 },
  { description: 'SEO Audit', quantity: 1, unitPrice: 1500, optional: true, included: false }
]);
```
