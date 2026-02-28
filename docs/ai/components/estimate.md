# snice-estimate

Quote/estimate document with line items, optional item toggles, accept/decline actions, comparison variant, QR code support, and print styles.

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
terms: string = ''                                 // Terms & conditions
variant: EstimateVariant = 'standard'              // 'standard' | 'comparison' | 'professional' | 'creative' | 'minimal'
showQr: boolean = false                            // attribute: show-qr; show QR code slot
qrData: string = ''                                // attribute: qr-data; data for QR code
qrPosition: QrPosition = 'top-right'              // attribute: qr-position; 'top-right' | 'bottom-right' | 'footer'
```

## Slots

- `(default)` - Default slot content
- `logo` - Company logo in header
- `qr` - QR code content (rendered at qr-position)
- `footer` - Footer content

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
  variant="professional"
  tax-rate="8"
  discount="5"
  show-qr
  qr-position="top-right">
  <img slot="logo" src="logo.svg" alt="Company Logo">
  <snice-qr-code slot="qr" data="https://example.com/quote/42"></snice-qr-code>
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
  est.terms = 'Subject to standard terms and conditions.';

  est.addEventListener('estimate-accept', e => console.log('Accepted:', e.detail));
  est.addEventListener('estimate-decline', e => console.log('Declined'));
  est.addEventListener('item-toggle', e => console.log('Toggled:', e.detail));
</script>

<!-- Comparison variant -->
<snice-estimate variant="comparison" status="sent"></snice-estimate>
```

## Variants

- `standard` - Clean, structured business quote
- `comparison` - Side-by-side option cards (each item = selectable option)
- `professional` - Dark header gradient, elevated shadow, refined typography
- `creative` - Purple-pink gradient header, pill buttons, gradient borders
- `minimal` - No borders/shadows, thin rules, light typography

## CSS Parts

```css
::part(base)             /* Main container */
::part(header)           /* Header section */
::part(title)            /* Estimate title */
::part(logo)             /* Logo slot */
::part(meta)             /* Date display */
::part(status)           /* Status badge */
::part(expiry)           /* Expiry text */
::part(expiry-date)      /* Expiry date value */
::part(parties)          /* From/To container */
::part(party)            /* Individual party block */
::part(party-label)      /* "From"/"To" label */
::part(party-name)       /* Party name */
::part(party-detail)     /* Address/phone/email */
::part(table)            /* Table section wrapper */
::part(table-header)     /* Table header row */
::part(table-row)        /* Table body row */
::part(table-cell)       /* Table cell */
::part(item-toggle)      /* Optional item toggle */
::part(summary)          /* Totals section */
::part(subtotal)         /* Subtotal row */
::part(tax-row)          /* Tax row */
::part(discount-row)     /* Discount row */
::part(total)            /* Grand total row */
::part(actions)          /* Accept/Decline container */
::part(accept-button)    /* Accept button */
::part(decline-button)   /* Decline button */
::part(notes)            /* Notes section */
::part(notes-label)      /* Notes heading */
::part(notes-content)    /* Notes text */
::part(terms)            /* Terms section */
::part(qr-container)     /* QR code container */
::part(qr)               /* QR slot */
::part(comparison)       /* Comparison grid */
::part(option)           /* Comparison option card */
::part(option-button)    /* Select option button */
::part(footer)           /* Footer section */
```

## CSS Custom Properties

```css
--estimate-max-width        /* Max container width (50rem) */
--estimate-bg               /* Background */
--estimate-bg-element       /* Element background (totals) */
--estimate-border           /* Border color */
--estimate-text             /* Primary text */
--estimate-text-secondary   /* Secondary text */
--estimate-text-tertiary    /* Tertiary text */
--estimate-accent           /* Accent / primary color */
--estimate-header-bg        /* Header background */
--estimate-header-text      /* Header text color */
--estimate-header-padding   /* Header padding */
--estimate-title-size       /* Title font size */
--estimate-title-weight     /* Title font weight */
--estimate-body-size        /* Body text size */
--estimate-label-size       /* Label text size */
--estimate-section-padding  /* Section padding */
--estimate-gap              /* Gap between elements */
--estimate-accept-bg        /* Accept button background */
--estimate-accept-text      /* Accept button text */
--estimate-decline-bg       /* Decline button background */
--estimate-decline-text     /* Decline button text */
--estimate-decline-border   /* Decline button border */
--estimate-optional-bg      /* Optional tag background */
--estimate-optional-text    /* Optional tag text */
--estimate-optional-border  /* Optional tag border */
--estimate-status-*-bg      /* Status badge backgrounds */
--estimate-status-*-text    /* Status badge text colors */
--estimate-radius           /* Border radius */
--estimate-shadow           /* Box shadow */
--estimate-total-bg         /* Totals background */
--estimate-total-border     /* Totals border */
--estimate-total-weight     /* Total font weight */
--estimate-qr-size          /* QR code dimensions (5rem) */
```

## Notes

- Optional items have a toggle switch; excluded items don't count toward total
- Accept/decline buttons only show when status is `draft` or `sent`
- Comparison variant renders each item as a selectable option card
- Discount applied before tax
- Print-friendly: hides action buttons and toggles, marks excluded items with strikethrough
- QR slot supports any content (use snice-qr-code or img)
- `terms` property separate from `notes` for structured document output
