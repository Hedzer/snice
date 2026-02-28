# snice-estimate

Quote/estimate card with line items, optional item toggles, accept/decline actions, and comparison variant.

## Properties

```typescript
estimateNumber: string = ''                        // attribute: estimate-number
date: string = ''                                  // Date string
expiryDate: string = ''                            // attribute: expiry-date; validity deadline
status: EstimateStatus = 'draft'                   // 'draft' | 'sent' | 'accepted' | 'declined' | 'expired'
from: EstimateParty | null = null                  // { name, address?, phone?, email? }
to: EstimateParty | null = null                    // { name, address?, phone?, email? }
items: EstimateItem[] = []                         // { description, quantity, unitPrice, optional?, included? }
currency: string = '$'                             // Currency symbol
taxRate: number = 0                                // attribute: tax-rate; percentage
discount: number = 0                               // Discount percentage
notes: string = ''                                 // Additional notes
variant: EstimateVariant = 'standard'              // 'standard' | 'comparison'
```

## Events

- `estimate-accept` -> `{ estimateNumber: string, items: EstimateItem[], total: number }`
- `estimate-decline` -> `{ estimateNumber: string }`
- `item-toggle` -> `{ index: number, item: EstimateItem, included: boolean }`

## Methods

- `print()` - Trigger browser print
- `toJSON()` - Returns EstimateJSON with all data + computed totals

## Usage

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
  est.from = { name: 'My Agency', email: 'hello@agency.com' };
  est.to = { name: 'Client Corp', email: 'info@client.com' };
  est.items = [
    { description: 'Web Design', quantity: 1, unitPrice: 2500 },
    { description: 'SEO Audit', quantity: 1, unitPrice: 800, optional: true },
    { description: 'Content Writing', quantity: 5, unitPrice: 150 }
  ];
  est.notes = 'Payment: 50% upfront, 50% on delivery';

  est.addEventListener('estimate-accept', e => console.log('Accepted:', e.detail));
  est.addEventListener('estimate-decline', e => console.log('Declined'));
  est.addEventListener('item-toggle', e => console.log('Toggled:', e.detail));
</script>

<!-- Comparison variant -->
<snice-estimate variant="comparison" status="sent"></snice-estimate>
<script>
  est.items = [
    { description: 'Basic Package', quantity: 1, unitPrice: 1500 },
    { description: 'Standard Package', quantity: 1, unitPrice: 3000 },
    { description: 'Premium Package', quantity: 1, unitPrice: 5000 }
  ];
</script>
```

## CSS Parts

```css
::part(base)             /* Main container */
::part(header)           /* Header section */
::part(title)            /* Estimate title */
::part(date)             /* Date display */
::part(status)           /* Status badge */
::part(expiry)           /* Expiry date */
::part(parties)          /* From/To container */
::part(party)            /* Individual party block */
::part(items-section)    /* Items section */
::part(items-table)      /* Items table */
::part(item-toggle)      /* Optional item toggle */
::part(totals)           /* Totals section */
::part(notes-section)    /* Notes section */
::part(notes)            /* Notes text */
::part(actions)          /* Accept/Decline buttons */
::part(accept-button)    /* Accept button */
::part(decline-button)   /* Decline button */
::part(comparison)       /* Comparison grid */
::part(option)           /* Comparison option card */
::part(option-button)    /* Select option button */
```

## Notes

- Optional items have a toggle switch; excluded items don't count toward total
- Accept/decline buttons only show when status is `draft` or `sent`
- Comparison variant renders each item as a selectable option card
- Discount applied before tax
- Print-friendly: hides action buttons and toggles
