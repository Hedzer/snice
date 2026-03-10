<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/work-order.md -->

# Work Order
`<snice-work-order>`

A service work order component with task checklists, parts/materials tracking, time/labor calculations, customer sign-off, and QR code support. Designed for field service, maintenance, and repair workflows.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `woNumber` (attr: `wo-number`) | `string` | `''` | Work order identifier |
| `date` | `string` | `''` | Work order date |
| `dueDate` (attr: `due-date`) | `string` | `''` | Due/completion date |
| `priority` | `'low' \| 'medium' \| 'high' \| 'urgent'` | `'medium'` | Priority level with visual badge |
| `status` | `'open' \| 'in-progress' \| 'completed' \| 'cancelled'` | `'open'` | Status with visual badge |
| `customer` | `WorkOrderCustomer \| null` | `null` | Customer information |
| `description` | `string` | `''` | Scope of work description |
| `tasks` | `WorkOrderTask[]` | `[]` | Task checklist |
| `parts` | `WorkOrderPart[]` | `[]` | Parts/materials list |
| `asset` | `WorkOrderAsset \| null` | `null` | Equipment/asset information |
| `laborRate` (attr: `labor-rate`) | `number` | `0` | Hourly labor rate for calculations |
| `notes` | `string` | `''` | Additional notes |
| `variant` | `'standard' \| 'compact' \| 'field-service' \| 'maintenance' \| 'detailed'` | `'standard'` | Visual style variant |
| `showQr` (attr: `show-qr`) | `boolean` | `false` | Show QR code placeholder |
| `qrData` (attr: `qr-data`) | `string` | `''` | QR code data |
| `qrPosition` (attr: `qr-position`) | `'top-right' \| 'header' \| 'footer'` | `'top-right'` | QR code placement |

### Data Interfaces

```typescript
interface WorkOrderCustomer {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface WorkOrderTask {
  description: string;
  assignee?: string;
  completed?: boolean;
  hours?: number;
}

interface WorkOrderPart {
  name: string;
  partNumber?: string;
  quantity: number;
  unitCost: number;
}

interface WorkOrderAsset {
  id: string;
  name: string;
  location?: string;
  serial?: string;
  lastService?: string;
}
```

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getTotalPartsCost()` | `number` | Calculate total cost of all parts |
| `getTotalLaborHours()` | `number` | Sum of all task hours |
| `getTotalLaborCost()` | `number` | Labor hours x labor rate |
| `getTotalCost()` | `number` | Parts cost + labor cost |
| `print()` | `void` | Print the work order |
| `toJSON()` | `WorkOrderJSON` | Export all data including calculated totals |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `task-toggle` | `{ index, task, completed }` | Fired when a task checkbox is toggled |
| `status-change` | `{ previousStatus, status }` | Fired when status property changes |
| `wo-sign` | `{ woNumber, timestamp }` | Fired when sign-off button is clicked |

## Slots

| Name | Description |
|------|-------------|
| (default) | Additional content after main sections |
| `qr` | QR code content |
| `signature` | Signature capture area |
| `footer` | Additional footer content |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--wo-max-width` | Maximum width | `50rem` |
| `--wo-bg` | Background color | `white` |
| `--wo-bg-element` | Element background | `rgb(252 251 249)` |
| `--wo-text` | Text color | `rgb(23 23 23)` |
| `--wo-text-secondary` | Secondary text | `rgb(82 82 82)` |
| `--wo-border` | Border color | `rgb(226 226 226)` |
| `--wo-accent` | Accent color | `rgb(37 99 235)` |
| `--wo-priority-low-bg` / `--wo-priority-low-text` | Low priority badge colors | various |
| `--wo-priority-medium-bg` / `--wo-priority-medium-text` | Medium priority badge colors | various |
| `--wo-priority-high-bg` / `--wo-priority-high-text` | High priority badge colors | various |
| `--wo-priority-urgent-bg` / `--wo-priority-urgent-text` | Urgent priority badge colors | various |
| `--wo-task-checkbox-size` | Checkbox size | `1.25rem` |
| `--wo-signature-line-color` | Signature line color | border color |
| `--wo-qr-size` | QR code size | `5rem` |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Root container |
| `header` | Work order header |
| `title` | "Work Order" title |
| `wo-number` | Work order number |
| `date` | Date field |
| `due-date` | Due date field |
| `priority` | Priority badge |
| `status` | Status badge |
| `qr-container` | QR code container |
| `customer` | Customer section |
| `customer-name` | Customer name |
| `customer-address` | Customer address |
| `customer-contact` | Customer phone/email |
| `asset` | Asset section |
| `asset-id` | Asset ID |
| `asset-name` | Asset name |
| `description` | Scope of work section |
| `description-label` | "Scope of Work" label |
| `description-content` | Description text |
| `tasks` | Tasks section |
| `task` | Individual task row |
| `task-checkbox` | Task completion checkbox |
| `task-description` | Task description |
| `task-assignee` | Task assignee |
| `parts` | Parts section |
| `parts-table` | Parts table |
| `parts-row` | Parts table row |
| `part-name` | Part name |
| `part-number` | Part number |
| `part-qty` | Part quantity |
| `part-cost` | Part unit cost |
| `parts-total` | Parts total |
| `labor` | Labor section |
| `labor-hours` | Total hours |
| `labor-rate` | Hourly rate |
| `labor-total` | Labor cost total |
| `costs` | Cost summary section |
| `grand-total` | Grand total |
| `notes` | Notes section |
| `notes-label` | "Notes" heading |
| `notes-content` | Notes text |
| `signature` | Sign-off section |
| `signature-line` | Signature line |
| `signature-date` | Signature date line |
| `sign-button` | Sign-off button |
| `footer` | Footer area |

## Basic Usage

```typescript
import 'snice/components/work-order/snice-work-order';
```

```html
<snice-work-order
  wo-number="WO-2026-0184"
  date="Feb 27, 2026"
  priority="high"
  status="in-progress"
  labor-rate="85"
  description="HVAC system inspection and filter replacement.">
</snice-work-order>
```

```typescript
wo.customer = { name: 'Office Park LLC', phone: '(555) 123-4567' };
wo.tasks = [
  { description: 'Inspect units', assignee: 'Mike', hours: 2, completed: true },
  { description: 'Replace filters', assignee: 'Mike', hours: 3 }
];
wo.parts = [
  { name: 'HVAC Filter 20x25', partNumber: 'HF-2025', quantity: 8, unitCost: 24.99 }
];
```

## Examples

### With Asset Information

Use the `asset` property to display equipment details. The `maintenance` variant highlights the asset section.

```typescript
wo.asset = {
  id: 'EQ-12345',
  name: 'CNC Machine Alpha',
  location: 'Building B, Floor 2',
  serial: 'SN789456123',
  lastService: '2025-12-15'
};
```

### Task Checklist with Hours

Set `labor-rate` and provide tasks with hours for automatic labor cost calculation.

```html
<snice-work-order wo-number="WO-003" labor-rate="75"></snice-work-order>
```

```typescript
wo.tasks = [
  { description: 'Clean server racks', assignee: 'John D.', hours: 2, completed: true },
  { description: 'Replace failed drives', assignee: 'John D.', hours: 1.5, completed: true },
  { description: 'Update firmware', assignee: 'Sarah M.', hours: 1, completed: false }
];
```

### Parts and Materials

```typescript
wo.parts = [
  { name: 'Air Filter 16x25x1', partNumber: 'AF-1625', quantity: 12, unitCost: 8.99 },
  { name: 'Thermostat', partNumber: 'TH-WIFI', quantity: 3, unitCost: 149.99 },
  { name: 'Duct Tape', partNumber: 'DT-HEAVY', quantity: 5, unitCost: 12.50 }
];
```

### Priorities and Statuses

```html
<snice-work-order wo-number="WO-L1" priority="low" status="open"></snice-work-order>
<snice-work-order wo-number="WO-M1" priority="medium" status="in-progress"></snice-work-order>
<snice-work-order wo-number="WO-H1" priority="high" status="open"></snice-work-order>
<snice-work-order wo-number="WO-U1" priority="urgent" status="in-progress"></snice-work-order>
<snice-work-order wo-number="WO-C1" priority="medium" status="completed"></snice-work-order>
```

### Field Service Variant

Use the `field-service` variant for larger checkboxes, bordered tasks, and a prominent signature area.

```html
<snice-work-order
  variant="field-service"
  wo-number="WO-FS-001"
  priority="high"
  show-qr
  qr-position="header">
</snice-work-order>
```

### Event Handling

```typescript
wo.addEventListener('task-toggle', (e) => {
  console.log('Task toggled:', e.detail.index, 'Completed:', e.detail.completed);
});

wo.addEventListener('status-change', (e) => {
  console.log('Status changed from', e.detail.previousStatus, 'to', e.detail.status);
});

wo.addEventListener('wo-sign', (e) => {
  console.log('Work order signed at', e.detail.timestamp);
});
```

### Cost Calculation

```typescript
console.log('Parts cost:', wo.getTotalPartsCost());
console.log('Labor hours:', wo.getTotalLaborHours());
console.log('Labor cost:', wo.getTotalLaborCost());
console.log('Total cost:', wo.getTotalCost());
```

### Print and Export

```typescript
wo.print();                    // Opens browser print dialog
const data = wo.toJSON();      // Export all data with computed totals
```
