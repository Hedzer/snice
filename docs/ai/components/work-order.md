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
variant: 'standard'|'compact'|'field-service'|'maintenance'|'detailed' = 'standard';
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

- `(default)` - Additional content after main sections
- `signature` - Custom signature content (e.g., canvas, image)
- `qr` - Custom QR code content (rendered at qr-position)
- `footer` - Custom footer content

## CSS Parts

- `base` - Root container
- `header` - Header section
- `title` / `wo-number` / `date` / `due-date` - Header fields
- `priority` / `status` - Badge elements
- `customer` / `customer-name` / `customer-address` / `customer-contact`
- `asset` / `asset-id` / `asset-name`
- `description` / `description-label` / `description-content`
- `tasks` / `task` / `task-checkbox` / `task-description` / `task-assignee`
- `parts` / `parts-table` / `parts-row` / `part-name` / `part-number` / `part-qty` / `part-cost` / `parts-total`
- `labor` / `labor-hours` / `labor-rate` / `labor-total`
- `costs` / `grand-total`
- `notes` / `notes-label` / `notes-content`
- `signature` / `signature-line` / `signature-date` / `sign-button`
- `qr-container` / `footer`

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
