# snice-work-order

Service/maintenance work order with tasks, parts, time tracking, and sign-off.

## Properties

```typescript
woNumber: string = ''                              // attribute: wo-number
date: string = ''                                  // Date string
priority: WorkOrderPriority = 'medium'             // 'low' | 'medium' | 'high' | 'urgent'
status: WorkOrderStatus = 'open'                   // 'open' | 'in-progress' | 'completed' | 'cancelled'
customer: WorkOrderCustomer | null = null           // { name, address?, phone?, email? }
description: string = ''                            // Scope of work text
tasks: WorkOrderTask[] = []                         // { description, assignee?, completed?, hours? }
parts: WorkOrderPart[] = []                         // { name, partNumber?, quantity, unitCost }
laborRate: number = 0                               // attribute: labor-rate; $/hr
notes: string = ''                                  // Additional notes
variant: WorkOrderVariant = 'standard'              // 'standard' | 'compact'
```

## Slots

- `signature` - Custom signature content (e.g., canvas, image)

## Events

- `task-toggle` -> `{ index: number, task: WorkOrderTask, completed: boolean }`
- `status-change` -> `{ previousStatus: WorkOrderStatus, status: WorkOrderStatus }`
- `wo-sign` -> `{ woNumber: string, timestamp: string }`

## Methods

- `print()` - Trigger browser print
- `toJSON()` - Returns WorkOrderJSON with all data + computed totals

## Usage

```html
<snice-work-order
  wo-number="WO-2024-001"
  date="2024-03-15"
  priority="high"
  status="in-progress">
</snice-work-order>

<script>
  const wo = document.querySelector('snice-work-order');
  wo.customer = { name: 'Acme Corp', address: '123 Main St', phone: '555-1234' };
  wo.description = 'Replace HVAC system on 3rd floor';
  wo.tasks = [
    { description: 'Remove old unit', assignee: 'John', completed: true, hours: 2 },
    { description: 'Install new unit', assignee: 'Jane', completed: false, hours: 4 },
    { description: 'Test system', completed: false, hours: 1 }
  ];
  wo.parts = [
    { name: 'Air Filter', partNumber: 'AF-100', quantity: 2, unitCost: 25.50 },
    { name: 'Compressor', partNumber: 'CP-200', quantity: 1, unitCost: 450 }
  ];
  wo.laborRate = 75;
  wo.notes = 'Customer prefers morning appointments';

  wo.addEventListener('task-toggle', e => console.log(e.detail));
  wo.addEventListener('wo-sign', e => console.log('Signed:', e.detail));

  // Export data
  console.log(wo.toJSON()); // { woNumber, totalCost, ... }
</script>
```

## CSS Parts

```css
::part(base)              /* Main container */
::part(header)            /* Header section */
::part(wo-number)         /* WO number heading */
::part(date)              /* Date display */
::part(priority)          /* Priority badge */
::part(status)            /* Status badge */
::part(customer-section)  /* Customer block */
::part(customer)          /* Customer grid */
::part(description-section) /* Description block */
::part(description)       /* Description text */
::part(tasks-section)     /* Tasks block */
::part(task)              /* Individual task row */
::part(task-checkbox)     /* Task checkbox button */
::part(parts-section)     /* Parts block */
::part(parts-table)       /* Parts table */
::part(parts-total)       /* Parts subtotal */
::part(time-section)      /* Time tracking block */
::part(time)              /* Time tracking grid */
::part(notes-section)     /* Notes block */
::part(notes)             /* Notes text */
::part(signature-section) /* Signature block */
::part(sign-button)       /* Sign button */
::part(footer)            /* Totals footer */
::part(totals)            /* Totals breakdown */
```

## Notes

- Totals auto-compute from parts costs + (labor hours * labor rate)
- Task checkboxes toggle completed state and emit `task-toggle`
- Signature slot accepts custom content (canvas, image, etc.)
- Compact variant reduces spacing for dense layouts
- Print-friendly: hides sign button, preserves checkbox states
