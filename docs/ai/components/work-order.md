# snice-work-order

Service/maintenance work order with tasks, parts, labor, asset tracking, QR code support, and sign-off.

## Properties

```typescript
woNumber: string = '';                    // attr: wo-number
date: string = '';
dueDate: string = '';                     // attr: due-date
priority: 'low'|'medium'|'high'|'urgent' = 'medium';
status: 'open'|'in-progress'|'completed'|'cancelled' = 'open';
customer: WorkOrderCustomer | null = null; // { name, address?, phone?, email? }
description: string = '';
tasks: WorkOrderTask[] = [];              // { description, assignee?, completed?, hours? }
parts: WorkOrderPart[] = [];              // { name, partNumber?, quantity, unitCost }
asset: WorkOrderAsset | null = null;      // { id, name, location?, serial?, lastService? }
laborRate: number = 0;                    // attr: labor-rate; $/hr
notes: string = '';
variant: 'standard'|'compact'|'field-service'|'maintenance'|'detailed'|'paper'|'ink'|'ledger'|'ticket' = 'standard';
showQr: boolean = false;                  // attr: show-qr
qrData: string = '';                      // attr: qr-data
qrPosition: 'top-right'|'header'|'footer' = 'top-right'; // attr: qr-position
```

## Methods

- `getTotalPartsCost()` - Sum of part quantities * unit costs
- `getTotalLaborHours()` - Sum of task hours
- `getTotalLaborCost()` - Hours * labor rate
- `getTotalCost()` - Parts + labor totals
- `print()` - Trigger browser print
- `toJSON()` - Returns WorkOrderJSON with all data + computed totals

## Events

- `task-toggle` -> `{ index, task, completed }`
- `status-change` -> `{ previousStatus, status }`
- `wo-sign` -> `{ woNumber, timestamp }`

## Slots

- `title`, `customer`, `asset`, `description`, `totals` - replace the matching regions
- `before-tasks` / `after-tasks` / `after-parts` - insert around the task and parts tables
- `notes` - appended to the notes area
- `signature` - above the signature lines
- `qr`, `footer` - QR content and footer
- `(default)` - Footer content

## CSS Parts

- `base` - Root container
- `header` - Header section
- `title` / `wo-number` / `date` / `due-date` - Header fields
- `priority` / `status` - Badge elements; `status` also carries `status-open`, `status-in-progress`, `status-completed`, or `status-cancelled` for the current status
- `priority-low` / `priority-medium` / `priority-high` / `priority-urgent` - Added to `priority` for the current priority
- `customer` / `customer-name` / `customer-address` / `customer-contact`
- `asset` / `asset-id` / `asset-name`
- `description` / `description-label` / `description-content`
- `tasks` / `task` / `task-checkbox` / `task-description` / `task-assignee`
- `parts` / `parts-table` / `parts-row` / `part-name` / `part-number` / `part-qty` / `part-cost` / `parts-total`
- `labor` / `labor-hours` / `labor-rate` / `labor-total`
- `costs` / `grand-total`
- `notes` / `notes-label` / `notes-content`
- `signature` / `signature-line` / `signature-date` / `sign-button`
- `qr-container` / `footer` - QR wrapper and document footer; `qr-container` also carries `qr-container-top-right`, `qr-container-header`, or `qr-container-footer` for the active placement
- `section-title` - Heading of a section
- `header-left` - Left column of the header (title, number, dates)
- `header-right` - Right column of the header (badges)
- `dates` - Date row in the header
- `date-item` - A single date field in the header
- `date-label` - Label of a header date field
- `customer-fields` - Customer field grid
- `customer-field` - A single customer field
- `customer-label` - Label of a customer field
- `customer-email` - Email value of the customer section
- `asset-fields` - Asset field grid
- `asset-field` - A single asset field
- `asset-label` - Label of an asset field
- `asset-location` - Location value of the asset section
- `asset-serial` - Serial value of the asset section
- `asset-last-service` - Last-service value of the asset section
- `task-list` - Task list element
- `task-completed` - Added to `task` while the task is completed
- `task-checkbox-checked` - Added to `task-checkbox` while the task is completed
- `task-check-icon` - Check glyph inside the task checkbox
- `task-content` - Description and meta column of a task
- `task-meta` - Assignee and hours row of a task
- `task-hours` - Task hours text
- `parts-head` - Parts table head
- `parts-header-row` - Parts table header row
- `parts-header-cell` - Parts table header cell
- `parts-body` - Parts table body
- `part-total` - Line total cell of a parts row
- `parts-total-label` - "Parts Total:" label
- `parts-total-value` - Parts total amount
- `labor-fields` - Labor field grid
- `labor-field` - A single labor field
- `labor-label` - Label of a labor field
- `signature-lines` - Signature line row
- `signature-field` - A single signature field
- `signature-label` - Label under a signature line
- `costs-table` - Cost summary rows wrapper
- `cost-row` - A cost summary row
- `cost-row-grand` - Added to `cost-row` on the grand-total row
- `cost-label` - Label of a cost summary row

## CSS Custom Properties

- `--wo-max-width` - Max container width (default: `50rem`)
- `--wo-bg` / `--wo-bg-element` - Background colors
- `--wo-text` / `--wo-text-secondary` - Text colors
- `--wo-border` / `--wo-accent` - Border and accent colors
- `--wo-priority-{low,medium,high,urgent}-{bg,text}` - Priority badge colors
- `--wo-task-checkbox-size` - Checkbox size (default: `1.25rem`)
- `--wo-signature-line-color` - Signature line color
- `--wo-qr-size` - QR code size (default: `5rem`)

## Basic Usage

```html
<snice-work-order
  wo-number="WO-2024-001"
  date="2024-03-15"
  due-date="2024-03-20"
  priority="high"
  status="in-progress"
  labor-rate="75"
  variant="field-service"
  show-qr
  qr-position="top-right">
</snice-work-order>
```

```typescript
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

wo.addEventListener('task-toggle', e => console.log(e.detail));
wo.addEventListener('wo-sign', e => console.log('Signed:', e.detail));
console.log('Total:', wo.getTotalCost());
```
