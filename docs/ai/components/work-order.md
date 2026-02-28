# snice-work-order

Service/maintenance work order with tasks, parts, labor, asset tracking, QR code support, and sign-off.

## Properties

```typescript
woNumber: string = ''                              // attribute: wo-number
date: string = ''                                  // Date string
dueDate: string = ''                               // attribute: due-date
priority: WorkOrderPriority = 'medium'             // 'low' | 'medium' | 'high' | 'urgent'
status: WorkOrderStatus = 'open'                   // 'open' | 'in-progress' | 'completed' | 'cancelled'
customer: WorkOrderCustomer | null = null           // { name, address?, phone?, email? }
description: string = ''                            // Scope of work text
tasks: WorkOrderTask[] = []                         // { description, assignee?, completed?, hours? }
parts: WorkOrderPart[] = []                         // { name, partNumber?, quantity, unitCost }
asset: WorkOrderAsset | null = null                 // { id, name, location?, serial?, lastService? }
laborRate: number = 0                               // attribute: labor-rate; $/hr
notes: string = ''                                  // Additional notes
variant: WorkOrderVariant = 'standard'              // 'standard' | 'compact' | 'field-service' | 'maintenance' | 'detailed'
showQr: boolean = false                             // attribute: show-qr; show QR code slot
qrData: string = ''                                 // attribute: qr-data; data for QR code
qrPosition: QrPosition = 'top-right'               // attribute: qr-position; 'top-right' | 'header' | 'footer'
```

## Slots

- `(default)` - Additional content after main sections
- `signature` - Custom signature content (e.g., canvas, image)
- `qr` - Custom QR code content (rendered at qr-position)
- `footer` - Custom footer content

## Events

- `task-toggle` -> `{ index: number, task: WorkOrderTask, completed: boolean }`
- `status-change` -> `{ previousStatus: WorkOrderStatus, status: WorkOrderStatus }`
- `wo-sign` -> `{ woNumber: string, timestamp: string }`

## Methods

- `getTotalPartsCost()` - Sum of part quantities * unit costs
- `getTotalLaborHours()` - Sum of task hours
- `getTotalLaborCost()` - Hours * labor rate
- `getTotalCost()` - Parts + labor totals
- `print()` - Trigger browser print
- `toJSON()` - Returns WorkOrderJSON with all data + computed totals

## Variants

- `standard` - Clean, structured service work order
- `compact` - Dense layout, reduced spacing, smaller typography
- `field-service` - Big checkboxes (1.75rem), bordered tasks, large signature area
- `maintenance` - Equipment-focused with highlighted asset section
- `detailed` - Full accounting: monospace part numbers, wider cost summary

## Usage

```html
<snice-work-order
  wo-number="WO-2024-001"
  date="2024-03-15"
  due-date="2024-03-20"
  priority="high"
  status="in-progress"
  variant="field-service"
  show-qr
  qr-data="https://app.example.com/wo/2024-001"
  qr-position="top-right">
  <img slot="qr" src="qr.png" alt="QR" />
</snice-work-order>

<script>
  const wo = document.querySelector('snice-work-order');
  wo.customer = { name: 'Acme Corp', address: '123 Main St', phone: '555-1234' };
  wo.description = 'Replace HVAC system on 3rd floor';
  wo.asset = { id: 'HVAC-301', name: 'Rooftop Unit', location: '3rd Floor', serial: 'SN-2019-4521' };
  wo.tasks = [
    { description: 'Remove old unit', assignee: 'John', completed: true, hours: 2 },
    { description: 'Install new unit', assignee: 'Jane', completed: false, hours: 4 }
  ];
  wo.parts = [
    { name: 'Air Filter', partNumber: 'AF-100', quantity: 2, unitCost: 25.50 },
    { name: 'Compressor', partNumber: 'CP-200', quantity: 1, unitCost: 450 }
  ];
  wo.laborRate = 75;
  wo.notes = 'Customer prefers morning appointments';

  wo.addEventListener('task-toggle', e => console.log(e.detail));
  wo.addEventListener('wo-sign', e => console.log('Signed:', e.detail));
</script>
```

## CSS Parts

```css
::part(base)              /* Main container */
::part(header)            /* Header section */
::part(title)             /* "Work Order" label */
::part(wo-number)         /* WO number heading */
::part(date)              /* Date value */
::part(due-date)          /* Due date value */
::part(priority)          /* Priority badge */
::part(status)            /* Status badge */
::part(customer)          /* Customer section */
::part(customer-name)     /* Customer name value */
::part(customer-address)  /* Customer address value */
::part(customer-contact)  /* Customer phone value */
::part(asset)             /* Asset section (maintenance) */
::part(asset-id)          /* Asset ID value */
::part(asset-name)        /* Asset name value */
::part(description)       /* Description section */
::part(description-label) /* Description heading */
::part(description-content) /* Description text */
::part(tasks)             /* Tasks section */
::part(task)              /* Individual task row */
::part(task-checkbox)     /* Task checkbox button */
::part(task-description)  /* Task description text */
::part(task-assignee)     /* Task assignee name */
::part(parts)             /* Parts section */
::part(parts-table)       /* Parts table */
::part(parts-row)         /* Parts table row */
::part(part-name)         /* Part name cell */
::part(part-number)       /* Part number cell */
::part(part-qty)          /* Part quantity cell */
::part(part-cost)         /* Part unit cost cell */
::part(parts-total)       /* Parts subtotal */
::part(labor)             /* Labor section */
::part(labor-hours)       /* Total labor hours */
::part(labor-rate)        /* Labor rate display */
::part(labor-total)       /* Labor cost total */
::part(notes)             /* Notes section */
::part(notes-label)       /* Notes heading */
::part(notes-content)     /* Notes text */
::part(costs)             /* Cost summary section */
::part(grand-total)       /* Grand total amount */
::part(signature)         /* Signature section */
::part(signature-line)    /* Signature line */
::part(signature-date)    /* Signature date line */
::part(sign-button)       /* Sign work order button */
::part(qr-container)      /* QR code container */
::part(footer)            /* Footer */
```

## CSS Custom Properties

```css
--wo-max-width            /* Max container width (default: 50rem) */
--wo-bg                   /* Background color */
--wo-bg-element           /* Element background */
--wo-text                 /* Primary text color */
--wo-text-secondary       /* Secondary text color */
--wo-text-tertiary        /* Tertiary text color */
--wo-border               /* Border color */
--wo-accent               /* Accent/primary color */
--wo-success              /* Success color */
--wo-danger               /* Danger color */
--wo-priority-low-bg      /* Low priority badge bg */
--wo-priority-low-text    /* Low priority badge text */
--wo-priority-medium-bg   /* Medium priority badge bg */
--wo-priority-medium-text /* Medium priority badge text */
--wo-priority-high-bg     /* High priority badge bg */
--wo-priority-high-text   /* High priority badge text */
--wo-priority-urgent-bg   /* Urgent priority badge bg */
--wo-priority-urgent-text /* Urgent priority badge text */
--wo-status-open-bg       /* Open status badge bg */
--wo-status-open-text     /* Open status badge text */
--wo-status-in-progress-bg /* In-progress status bg */
--wo-status-in-progress-text /* In-progress status text */
--wo-status-completed-bg  /* Completed status bg */
--wo-status-completed-text /* Completed status text */
--wo-status-cancelled-bg  /* Cancelled status bg */
--wo-status-cancelled-text /* Cancelled status text */
--wo-task-checkbox-size   /* Checkbox dimensions (default: 1.25rem) */
--wo-task-completed-text  /* Completed task text color */
--wo-signature-line-color /* Signature line color */
--wo-qr-size              /* QR code container size (default: 5rem) */
```

## Notes

- Totals auto-compute from parts costs + (labor hours * labor rate)
- Task checkboxes toggle completed state and emit `task-toggle`
- Status changes emit `status-change` event
- `asset` property is for equipment/maintenance tracking (prominent in `maintenance` variant)
- QR slot renders at configurable position; use with any QR library
- Print-friendly: badges use borders, checkboxes use B&W, signature lines darken, page breaks managed
